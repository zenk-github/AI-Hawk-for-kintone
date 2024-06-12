jQuery.noConflict();

(function ($, PLUGIN_ID) {
    'use strict';
    $(function () {

        let terms = {
            'en': {
                'hawk_api_access_token': 'Hawk API AccessToken',
                'app_id_actual_data': 'AppId ActualData',
                'app_id_order_forecast': 'AppId OrderForecast',
                'app_id_order_forecast_customer': 'AppId OrderForecastCustomer',
                'plugin_submit': 'submit',
                'plugin_cancel': 'cancel',
            },
            'ja': {
                'hawk_api_access_token': 'Hawk API アクセストークン',
                'app_id_actual_data': 'アプリID 実績データアプリ',
                'app_id_order_forecast': 'アプリID 受注予測アプリ',
                'app_id_order_forecast_customer': 'アプリID 受注予測得意先アプリ',
                'plugin_submit': '保存',
                'plugin_cancel': 'キャンセル',
            }
        };

        let lang = kintone.getLoginUser().language;
        let i18n = (lang in terms) ? terms[lang] : terms['en'];

        let html = $('#aiHawkPlugin-config-cybozu').html();
        let tmpl = $.templates(html);
        $('div#aiHawkPlugin-config-cybozu').html(tmpl.render({ 'terms': i18n }));

        let pluginConfig = kintone.plugin.app.getConfig(PLUGIN_ID);
        if (typeof (pluginConfig['hawk_api_access_token']) !== 'undefined') {
            document.getElementById('hawk-api-access-token').value = pluginConfig['hawk_api_access_token'];
        }
        if (typeof (pluginConfig['app_id_actual_data']) !== 'undefined') {
            document.getElementById('app-id-actual-data').value = pluginConfig['app_id_actual_data'];
        }
        if (typeof (pluginConfig['app_id_order_forecast']) !== 'undefined') {
            document.getElementById('app-id-order-forecast').value = pluginConfig['app_id_order_forecast'];
        }
        if (typeof (pluginConfig['app_id_order_forecast_customer']) !== 'undefined') {
            document.getElementById('app-id-order-forecast-customer').value = pluginConfig['app_id_order_forecast_customer'];
        }

        $('#plugin-submit').click(function () {
            let hawk_api_access_token = $('#hawk-api-access-token').val();
            let app_id_actual_data = $('#app-id-actual-data').val();
            let app_id_order_forecast = $('#app-id-order-forecast').val();
            let app_id_order_forecast_customer = $('#app-id-order-forecast-customer').val();

            let config = {};
            config['hawk_api_access_token'] = hawk_api_access_token;
            config['app_id_actual_data'] = app_id_actual_data;
            config['app_id_order_forecast'] = app_id_order_forecast;
            config['app_id_order_forecast_customer'] = app_id_order_forecast_customer;

            kintone.plugin.app.setConfig(config);
        });

        $('#plugin-cancel').click(function () {
            history.back();
        });

    });
})(jQuery, kintone.$PLUGIN_ID);
