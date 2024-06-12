(function ($, PLUGIN_ID) {
  'use strict';

  /* kintone制限項目 */
  const kintoneLimits = {
    /// POST/PUT/DELETEリクエスト上限
    'postPutDelete': {
      'value': 100,
    },
    /// buleRequest上限
    'limitBulkRequest': {
      'value': 20,
    },
  };

  /* プラグイン設定値の取得 */
  let pluginConfig = kintone.plugin.app.getConfig(PLUGIN_ID);

  /* JSON形式を文字列に変換しログ出力 */
  const readableHawkResponse = function (response) {
    let parsedJson = JSON.parse(response[0]);
    let logOutput = {
      'parsedJson': parsedJson,
      'httpStatus': response[1],
      'responseHeader': response[2]
    };
    console.log('readableHawkApiResponse:', logOutput);
  };

  /***************************************************
  * 一覧画面表示時
 ***************************************************/
  const eventShowIndex = async function (event) {
    try {
      console.log('eventShowIndex');

      let record = event.record;

      /// 増殖バグを防ぐ
      if (document.getElementById('options-id-start-forecast') !== null) {
        return;
      }

      /// 予測開始ボタン準備
      const buttonStartForecast = new Kuc.Button({
        'text': '予測開始',
        'type': 'normal',
        'className': 'options-class',
        'id': 'options-id-start-forecast',
        'visible': true,
        'disabled': false,
      });

      /// 詳細画面の上部のスペース要素の取得
      const header = kintone.app.getHeaderMenuSpaceElement();

      /// ボタンを設置
      header.appendChild(buttonStartForecast);

      /// 予測開始ボタン押下処理
      buttonStartForecast.addEventListener('click', async function () {
        console.log('start click!!');
        /// 確認ダイアログ表示
        await Swal.fire({
          'title': '受注予測を開始しますか？',
          'html': '※処理には数分かかります。',
          'icon': 'question',
          'showCancelButton': true,
          'allowOutsideClick': false,
          'reverseButtons': true,
        }).then(async function (result) {
          /// キャンセル押下時
          if (!result.value) {
            /// 処理終了
            console.log('キャンセル');
            return;
          }
          await startForecast(event);
          return event;
        });
      });
      return event;
    } catch (e) {
      console.log(e);
      await Swal.fire({
        'title': 'エラーが発生しました。',
        'text': e.stack + JSON.stringify(e),
        'icon': 'error',
      });
    }
  };

  /* 予測開始ボタン押下処理 */
  const startForecast = async function (event) {

    try {
      /// Hawk-Apiリクエストヘッダー
      let requestHeaders = {
        'accept': 'application/json',
        'Authorization': 'Bearer' + ' ' + pluginConfig['hawk_api_access_token'],
        'Content-Type': 'application/json',
      };

      /// 処理中ダイアログ
      Swal.fire({
        'title': '処理中',
        'html': '処理終了まで画面はそのままにしてください。',
        'allowOutsideClick': false,
        'showConfirmButton': false,
        'didOpen': () => {
          Swal.showLoading();
        },
      });

      /* startForecastStep1 - 基幹システムデータ(補正後)レコード取得、受注予測対象得意先アプリレコード取得 */
      async function startForecastStep1() {
        console.log('startForecastStep1');
        /// 受注予測対象得意先アプリ
        let getOrderForecastCustomerParams = {
          'app': pluginConfig['app_id_order_forecast_customer'],
          'filterCond': '$id >= 1',
        };

        let orderForecastCustomerResponse = await getRecords(getOrderForecastCustomerParams);
        console.log(orderForecastCustomerResponse);
        let orderForecastCustomerRecords = orderForecastCustomerResponse['records'];
        // console.log(orderForecastCustomerRecords);

        /// 基幹システムデータ（補正後）
        let getCoreSystemDataParams = {
          'app': pluginConfig['app_id_actual_data'],
          'filterCond': '$id >= 1',
          'sortConds': ['$id asc'],
        };

        let coreSystemDataResponse = await getRecords(getCoreSystemDataParams);
        console.log(coreSystemDataResponse);
        let coreSystemDataRecords = coreSystemDataResponse['records'];

        /// 対象アプリに1件もレコードがない場合
        if (orderForecastCustomerRecords.length === 0) {
          await Swal.fire({
            'title': 'AppId : ' + pluginConfig['app_id_order_forecast_customer'] + ' にレコードがありませんでした。処理を終了します。',
            'icon': 'info',
          });
        } else if (coreSystemDataRecords.length === 0) {
          await Swal.fire({
            'title': 'AppId : ' + pluginConfig['app_id_actual_data'] + ' にレコードがありませんでした。処理を終了します。',
            'icon': 'info',
          });
        } else {
          /// 次のステップへ
          await startForecastStep2(orderForecastCustomerRecords, coreSystemDataRecords);
        }
      };

      /* startForecastStep2 - Hawk-Api予測開始実行*/
      async function startForecastStep2(orderForecastCustomerRecords, coreSystemDataRecords) {
        console.log('startForecastStep2');

        /// Hawk-Api用(pred_id/spot_id)
        let predId = '';

        /// Hawk-Api用(job_id/pred_id)格納用
        let jobIdsArray = [];
        let predIdsArray = [];

        let startForecastBody = [];
        let startForecastResponse = [];
        /// 各予測結果格納用
        let startForecastResponses = []

        /// 受注予測得意先アプリのレコード数、bodyを作成し、Hawk-Apiへ
        console.log(orderForecastCustomerRecords.length);
        for await (let orderForecastCustomerRecord of orderForecastCustomerRecords) {
          let orderForecastCustomer = [
            {
              'spot_id': orderForecastCustomerRecord.customer_id.value,
              'loc_zip_code': 'stax',
              'actual': []
            }
          ];

          /// 比較の条件(同じものがあるかどうか) 
          let currentCustomerName = orderForecastCustomerRecord.customer_official_name.value;
          /// 得意先名
          let matchingRecords = coreSystemDataRecords.filter(
            record => record.customer_official_name.value === currentCustomerName
          );
          /// 全得意先フラグ
          let allCustomerFlags = coreSystemDataRecords.filter(
            record => record.is_all_customers.value === '1'
          );

          /// 一致するデータがある場合、日付と金額をactualに
          if (matchingRecords.length > 0) {
            for (let matchingRecord of matchingRecords) {
              let tempActual = {
                'date': matchingRecord['order_date_yyyymmdd'].value,
                'value': matchingRecord['amount'].value,
              };
              orderForecastCustomer[0].actual.push(tempActual);
            }
          } else if (allCustomerFlags.length > 0) {
            for (let allCustomerFlag of allCustomerFlags) {
              let tempActual = {
                'date': allCustomerFlag['order_date_yyyymmdd'].value,
                'value': allCustomerFlag['amount'].value,
              };
              orderForecastCustomer[0].actual.push(tempActual);
            }
          }
          console.log(orderForecastCustomer);

          predId = orderForecastCustomer[0].spot_id;
          predIdsArray.push(predId);
          startForecastBody = orderForecastCustomer;

          /// Hawk-Api予測開始
          startForecastResponse = await kintone.proxy('https://api-hawk.rox-jp.com/v1.0/pred/stax/' + predId, 'POST', requestHeaders, JSON.stringify(startForecastBody));
          console.log(JSON.parse(startForecastResponse[0]));
          // console.log(startForecastResponses);
          startForecastResponses.push(JSON.parse(startForecastResponse[0]).job_id);
        }
        // console.log(predIdsArray);

        /// 次のステップへ
        await startForecastStep3(startForecastResponses, predIdsArray, orderForecastCustomerRecords);
      };

      /* startForecastStep3 - Hawk-Api ジョブステータスを確認 */
      async function startForecastStep3(startForecastResponses, predIdsArray, orderForecastCustomerRecords) {
        console.log('startForecastStep3');
        // console.log(startForecastResponses);
        // console.log(predIdsArray);
        let jobIds = [];
        let jobStatusesArray = [];
        for await (let jobId of startForecastResponses) {
          /// Hawk-Api ジョブステータス取得
          let jobStatusResponse = await kintone.proxy('https://api-hawk.rox-jp.com/v1.0/pred/jobs/' + jobId, 'GET', requestHeaders, {});
          readableHawkResponse(jobStatusResponse);
          console.log(JSON.parse(jobStatusResponse[0]).job_status);

          jobStatusesArray.push(JSON.parse(jobStatusResponse[0]).job_status);
        }
        // console.log(jobStatusesArray);

        /// SUCCESS以外の要素が含まれるか確認
        if (jobStatusesArray.some(status => status !== 'SUCCESS')) {
          /*残りのRUNNINGの数を表示*/
          let runningStatus = "RUNNING";
          let count = jobStatusesArray.reduce((acc, currentValue) => {
            return currentValue === runningStatus ? acc + 1 : acc;
          }, 0);
          console.log('the rest of RUNNING:', count);
          /**/
          /// SUCCESS以外の要素が含まれる場合
          console.log('Job is running');
          /// 指定の秒数待つ
          setTimeout(async () => {
            console.log("Execution specified second");
            /// 再帰処理
            startForecastStep3(startForecastResponses, predIdsArray, orderForecastCustomerRecords);
          }, 40000);
        } else {
          /// すべての要素がSUCCESSの場合
          console.log('All job was successful');
          /// 次のステップへ
          await startForecastStep4(predIdsArray, orderForecastCustomerRecords);
        }
      };

      /* startForecastStep4 - 受注予測結果取得 */
      async function startForecastStep4(predIdsArray, orderForecastCustomerRecords) {
        console.log('startForecast4');

        let forecastResultResponsesArray = [];

        for await (let predId of predIdsArray) {
          console.log(predId);
          let forecastResultResponse = await kintone.proxy('https://api-hawk.rox-jp.com/v1.0/pred/stax/' + predId, 'GET', requestHeaders, {});
          forecastResultResponsesArray.push(JSON.parse(forecastResultResponse[0]));
          readableHawkResponse(forecastResultResponse);
          console.log(forecastResultResponse);
          console.log(JSON.parse(forecastResultResponse[0]));
        }
        console.log(forecastResultResponsesArray);

        /// 予測結果が返されているか判別用
        let judgeExistForecast = [];

        for (let predictionResult of forecastResultResponsesArray) {
          console.log(predictionResult);
          // console.log(predictionResult[0]);
          // console.log(predictionResult[0].pred);
          // console.log(predictionResult[0].pred.length);
          if (predictionResult[0].pred.length > 0) {
            console.log('There is forecast');
            judgeExistForecast.push('true');
          } else {
            console.log('There is not forecast');
            judgeExistForecast.push('false');
          }
        }

        /// すべての予測結果が返されているか判別
        if (judgeExistForecast.some(exist => exist !== 'true')) {
          console.log('There is job did not return forecast');
          await Swal.fire({
            'title': '予測結果が返されませんでした。処理を終了します。',
            'icon': 'info',
          });
        } else {
          console.log('All job return forecast');
          /// 次のステップへ
          await startForecastStep5(forecastResultResponsesArray, orderForecastCustomerRecords);
        }
      };

      /* startForecastStep5 - kintone 受注予測アプリの全レコードを取得(登録・更新処理の判定をするため) */
      async function startForecastStep5(forecastResultResponsesArray, orderForecastCustomerRecords) {
        console.log('startForecastStep5');
        let getOrderForecastParams = {
          'app': pluginConfig['app_id_order_forecast'],
          'filterCond': '$id >= 1',
        };
        /// 受注予測アプリの全レコード取得
        let getOrderForecastResponse = await getRecords(getOrderForecastParams);
        console.log(getOrderForecastResponse);
        let orderForecastRecords = getOrderForecastResponse['records'];
        console.log(orderForecastRecords); /// 受注予測アプリ
        console.log(orderForecastCustomerRecords); /// 予測結果

        /// 次のステップへ
        await startForecastStep6(forecastResultResponsesArray, orderForecastRecords, orderForecastCustomerRecords);
      };

      /* startForecastStep6 - kintone 受注予測アプリの全レコードと予測結果を比較（判定して登録・更新）*/
      async function startForecastStep6(forecastResultResponsesArray, orderForecastRecords, orderForecastCustomerRecords) {
        console.log('startForecastStep6');

        /// 更新・登録用の各配列を作成
        let postArray = [];
        let putArray = [];
        /// 予測結果 for
        for await (let forecastResults of forecastResultResponsesArray) {
          console.log(forecastResults);
          /// 予測区分
          let forecastCategory = '';

          /// 受注予測得意先 for
          for await (let orderForecastCustomerRecord of orderForecastCustomerRecords) {
            /// idが同じかどうかで比較
            let matchingRecords = forecastResults.filter(
              forecastResult => forecastResult.spot_id === orderForecastCustomerRecord.customer_id.value
            );
            /// 一致したもの
            if (matchingRecords.length > 0) {
              forecastCategory = orderForecastCustomerRecord.customer_official_name.value;
              console.log(forecastCategory);
              await checkTempBody(forecastResults, forecastCategory);
            }
          }
        }

        async function checkTempBody(forecastResults, forecastCategory) {
          /// 値が入っている配列を指定
          let forecastAllData = forecastResults[0].pred;

          /// 受注予測データ 
          for (let forecastData of forecastAllData) {
            let tempBody = {
              'forecast_category': {
                'value': forecastCategory,
              },
              'forecast_date': {
                'value': forecastData['date'],
              },
              'forecast_amount': {
                'value': forecastData['value'],
              },
            };
            // console.log(tempBody, forecastData);

            let foundMatch = false;
            /// 受注予測アプリ for
            for await (let orderForecastRecordData of orderForecastRecords) {
              let orderForecastRecord = orderForecastRecordData;
              let orderForecastDate = orderForecastRecord.forecast_date.value;
              let orderForecastCategory = orderForecastRecord.forecast_category.value;
              /// 予測データと受注予測アプリのレコードを比較（日付、得意先）
              if (forecastData['date'] === orderForecastDate && forecastCategory === orderForecastCategory) {
                /// 一致した場合、putArrayへ（既存更新）
                putArray.push({ tempBody, orderForecastRecord });
                foundMatch = true;
                break;
              }
            }
            if (!foundMatch) {
              /// 一致しなかった場合、postArrayへ（新規登録）
              postArray.push(tempBody);
            }
          }
        }
        console.log(putArray);
        console.log(postArray);

        if (putArray.length > 0) {
          /// 次のステップへ
          await startForecastStep6_1(putArray, postArray);
        } else {
          /// 更新するレコードがないため、スキップして次へ
          await startForecastStep6_2(putArray, postArray);
        }
      };

      /* startForecastStep6_1 - kintone 受注予測アプリにて予測結果を更新　 */
      async function startForecastStep6_1(putArray, postArray) {
        console.log('startForecastStep6_1');
        console.log(putArray);
        console.log(postArray);

        /// レコードを更新(同じ日付＋得意先名がある)
        /// 100件ごとのデータ配列に 
        let arrayPer100Items = await createArrayPer100Items(putArray);
        console.log(arrayPer100Items);

        let bulkRequests = [];

        for (let per100Items of arrayPer100Items) {
          console.log(per100Items);
          let requestData = per100Items.values.map(function (itemData) {
            let tempData = {
              'id': itemData.orderForecastRecord.$id.value,
              'record': itemData.tempBody,
            };
            return tempData;
          });
          // console.log(requestData);

          let putBulkRequest = {
            'method': 'PUT',
            'api': '/k/v1/records.json',
            'payload': {
              'app': pluginConfig['app_id_order_forecast'],
              'records': requestData,
            }
          };
          // console.log(putBulkRequest);
          bulkRequests.push(putBulkRequest);
        }
        console.log(bulkRequests);

        let bulkRequestBody = {
          'requests': bulkRequests
        };
        console.log(bulkRequestBody);

        let bulkRequestResponse = await kintone.api(kintone.api.url('/k/v1/bulkRequest.json', true), 'POST', bulkRequestBody);
        console.log(bulkRequestResponse);

        if (postArray.length > 0) {
          /// 次のステップへ
          await startForecastStep6_2(putArray, postArray);
        } else {
          /// 登録するレコードがないため、スキップして次へ
          await startForecastStep7();
        }
      };

      /* startForecastStep6_2 - kintone 受注予測アプリにて予測結果を登録　 */
      async function startForecastStep6_2(putArray, postArray) {
        console.log('startForecastStep6_2');
        console.log(putArray);
        console.log(postArray);

        /// レコードを新規作成(同じ日付＋得意先名がない)
        /// 100件ごとのデータ配列にして登録 
        let arrayPer100Items = await createArrayPer100Items(postArray);
        console.log(arrayPer100Items);

        let bulkRequests = [];

        for (let per100Items of arrayPer100Items) {
          console.log(per100Items);
          let requestData = per100Items.values.map(function (itemData) {
            let tempData = itemData;
            return tempData;
          });
          // console.log(requestData);

          let postBulkRequest = {
            'method': 'POST',
            'api': '/k/v1/records.json',
            'payload': {
              'app': pluginConfig['app_id_order_forecast'],
              'records': requestData,
            }
          };
          // console.log(postBulkRequest);
          bulkRequests.push(postBulkRequest);
        }
        console.log(bulkRequests);

        let bulkRequestBody = {
          'requests': bulkRequests
        };
        console.log(bulkRequestBody);

        let bulkRequestResponse = await kintone.api(kintone.api.url('/k/v1/bulkRequest.json', true), 'POST', bulkRequestBody);
        console.log(bulkRequestResponse);

        await startForecastStep7();
      };

      /* startForecastStep7 - 完了ダイアログを表示 */
      async function startForecastStep7() {
        console.log('startForecastStep7');
        /// 完了ダイアログ表示
        Swal.fire({
          'title': '処理完了',
          'text': '処理が正常に終了しました。',
          'icon': 'success',
          'allowOutsideClick': false,
          'didClose': () => {
            /// OKボタンが押されたときにページをリロード
            location.reload();
          },
        });
      };

      return new kintone.Promise(
        function (resolve, reject) {
          startForecastStep1();
        }
      );
    } catch (error) {
      console.error(error);
      Swal.fire({
        'title': 'エラーが発生しました。',
        'text': error.stack + JSON.stringify(error),
        'icon': 'error',
      });
    }
  };

  /***************************************************
  * 関数ライブラリ
  ***************************************************/
  /* kintone bulkRequest用100件ごとのデータ配列作成 */
  async function createArrayPer100Items(values) {
    console.log('createArrayPer100Items');

    /// ディープコピー作成
    let cloneValues = [...values];
    // console.log(cloneValues);
    let items = [];
    console.log(kintoneLimits['postPutDelete'].value);
    /// 100件ごとに格納
    while (cloneValues.length > 0) {
      console.log(cloneValues.slice(0, kintoneLimits['postPutDelete'].value));
      items.push({
        'values': cloneValues.slice(0, kintoneLimits['postPutDelete'].value),
      });
      cloneValues.splice(0, kintoneLimits['postPutDelete'].value);
    }
    return items;
  };

  /***************************************************
  * イベントハンドラ             始 *
  ***************************************************/

  kintone.events.on(['app.record.index.show', 'app.record.index.edit.show'], eventShowIndex); /// 一覧画面表示

  /***************************************************
  * イベントハンドラ             終 *
  ***************************************************/

})(jQuery, kintone.$PLUGIN_ID);