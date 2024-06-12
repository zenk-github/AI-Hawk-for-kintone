/*
 * get all records function by cursor id sample program
 * Copyright (c) 2019 Cybozu
 *
 * Licensed under the MIT License
 */

// カーソルを作成する
const postCursor = (_params) => {
    const MAX_READ_LIMIT = 500;
  
    const params = _params || {};
    const app = params.app || kintone.app.getId();
    const filterCond = params.filterCond;
    const sortConds = params.sortConds;
    const fields = params.fields;
  
    const conditions = [];
    if (filterCond) {
      conditions.push(filterCond);
    }
  
    const sortCondsAndLimit =
      (sortConds && sortConds.length > 0 ? ' order by ' + sortConds.join(', ') : '');
    const query = conditions.join(' and ') + sortCondsAndLimit;
    const body = {
      app: app,
      query: query,
      size: MAX_READ_LIMIT
    };
    if (fields && fields.length > 0) {
      body.fields = fields;
    }
  
    return kintone.api(kintone.api.url('/k/v1/records/cursor', true), 'POST', body).then((r) => {
      return r.id;
    });
  };
  
  // 作成したカーソルからレコードを取得する
  const getRecordsByCursorId = (_params) => {
    const params = _params || {};
    const id = params.id;
  
    let data = params.data;
  
    if (!data) {
      data = {
        records: []
      };
    }
  
    const body = {
      id: id
    };
    return kintone.api(kintone.api.url('/k/v1/records/cursor', true), 'GET', body).then((r) => {
      data.records = data.records.concat(r.records);
      if (r.next) {
        return getRecordsByCursorId({id: id, data: data});
      }
      return data;
    });
  };
  
  /*
   * @param {Object} params
   *   - app {String}: アプリID（省略時は表示中アプリ）
   *   - filterCond {String}: 絞り込み条件
   *   - sortConds {Array}: ソート条件の配列
   *   - fields {Array}: 取得対象フィールドの配列
   * @return {Object} response
   *   - records {Array}: 取得レコードの配列
   */
  const getRecords = (_params) => {
    return postCursor(_params).then((id) => {
      return getRecordsByCursorId({id: id});
    });
  };