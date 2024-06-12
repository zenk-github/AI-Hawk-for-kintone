# AI-Hawk-for-kintone
AI-Hawk用kintoneプラグイン

# Usage
## 1. 事前準備
### 1-1. アプリテンプレートファイルをダウンロード
[kintone-app-ai-hawk.zip](https://github.com/zenk-github/AI-Hawk-for-kintone/blob/main/kintone-app/kintone-app-ai-hawk.zip)をダウンロードしてください。  

### 1-2. kintoneアプリ作成
以下のURLの手順を参考にして、テンプレートファイルからアプリを作成してください。  
https://jp.cybozu.help/k/ja/user/create_app/app_csv/add_app_template_file.html

以下3つのアプリがテンプレートに含まれています。  
- 実績データ
- 受注予測対象得意先
- 受注予測

### 1-3. プラグインダウンロード
[plugin.zip](https://github.com/zenk-github/AI-Hawk-for-kintone/blob/main/kintone-plugin/plugin.zip)をダウンロードしてください。  

### 1-4. プラグインインストール
以下のURLの手順を参考にして、プラグインのインストールを行ってください。  
https://jp.cybozu.help/k/ja/admin/add_plugin/plugin.html

### 1-5. プラグイン設定
プラグインの設定画面を開き、内容に沿って各設定項目を指定して下さい。  

## 2. アプリの使い方
### 2-1. 実績データ
レコード追加画面を開き、必要項目を入力し実績データの登録を行ってください。

### 2-2. 受注予測対象得意先  
レコード追加画面を開き、必要項目を入力し受注予測をしたい得意先を登録してください。
※実績データと同じ得意先名を登録(半角全角等も合わせる必要あり)  
※IDは任意（重複禁止）  
※20社まで登録可

### 2-3. 受注予測  
受注予測ボタンを押下し、受注予測の結果を確認してください。
※受注予測する得意先が多いと、時間がかかる場合があります。  

# Author
- Author Naoya Ichikawa
- Organizationr [株式会社ゼンク](https://zenk.co.jp/).

# License
[MIT license](https://opensource.org/license/MIT).
