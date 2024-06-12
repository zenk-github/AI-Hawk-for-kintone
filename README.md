# AI-Hawk-for-kintone
AI-Hawk用kintoneプラグイン

# Usage
## 事前準備
### アプリテンプレートファイルをダウンロード
アプリテンプレートファイルを(kintone-app/kintone-app-ai-hawk.zip)をダウンロードしてください。

### kintoneアプリ作成
テンプレートファイルからアプリを作成してください。
※詳細の手順は以下のURLをご参照ください。
https://jp.cybozu.help/k/ja/user/create_app/app_csv/add_app_template_file.html

以下3つのアプリがテンプレートに含まれています。
- 実績データ
- 受注予測対象得意先
- 受注予測

### プラグインダウンロード
プラグイン(kintone-plugin/plugin.zip)をダウンロードしてください。

### プラグインインストール
ダウンロードしたプラグインファイルを使用して、インストールを行ってください。
※詳細の手順は以下のURLをご参照ください。
https://jp.cybozu.help/k/ja/admin/add_plugin/plugin.html

### プラグイン設定
プラグインの設定画面を開き、内容に沿って各フィールドを指定して下さい。

## アプリの使い方
- 実績データ

- 受注予測対象得意先
　0-1 受注予測をしたい得意先を登録  
　→実績データと同じ得意先名を登録(半角全角等も合わせる必要あり)  
　→IDは任意（重複禁止）  
　※20社まで登録可

- 受注予測
  3-1 受注予測ボタンを押下  
　※受注予測する得意先が多いと、時間がかかる場合があります。  

# Author
- Author Naoya Ichikawa
- Organizationr [株式会社ゼンク](https://zenk.co.jp/).

# License
[MIT license](https://opensource.org/license/MIT).
