# 株式会社Brifu コーポレートサイト

静的サイト（HTML / CSS / JS）です。ビルド工程はありません。

2026年11月にコーポレートサイトとしてシンプルな構成へ作り直し、その後、全ページをトップと同じデザイン（旧サイトのデザイン）に統一しました。
EQ Platform の内容は「EQ_Platform_Guide_20261113」（4領域：EQ Academy／EQ Humanity／EQTM／EQ Business Nexus、EQ Gate は外部のフロントサイト）に合わせています。

## 制作ルール

見た目や動きを作る・直すときは、必ず **`DESIGN_RULES.md`**（禁止事項16項目と、動きの名前24）に従います。
AI（Claude）で作業するときは `CLAUDE.md` から自動で読み込まれます。

## メニューとファイル

| メニュー | ファイル | 内容 |
| --- | --- | --- |
| トップ | `index.html` | **入口が先、理念はあと**：ファーストビュー → 4つの事業（3Dマップ） → 目的から選ぶ4つの入口 → はじめの一歩（EQ Gate） → なぜEQか → EQとは → EQ認識理論 → 変化の広がり → EQコアカード® → EQ Business Nexus → 目指す社会 → PMVV → お問い合わせ |
| BrifuのEQ | `eq.html` | EQの定義、なぜ「人の心」か、EQ認識理論（7ステップ）、横成長と縦成長、5つの変化 |
| 4つの事業 | `service.html` | EQ Platform の全体像（EQ Gate／4領域／基盤）、目的から選ぶ、各領域の詳細、つながる学び |
| 会社概要 | `company.html` | 理念（目的・使命・目指す理想の姿・価値観）、代表プロフィール、会社情報 |
| 法人向け支援 | 外部サイト | EQ Business Nexus の正式ページ https://abiertoworks-boop.github.io/eq-business-nexus/ （サイト内の旧ページ `business.html`・`nexus.html` はリンクしていない） |
| 物販・書籍 | `shop.html` | EQコアカード®、著書2冊、ご購入について |
| お問い合わせ | `contact.html` | 申込み・相談をすべて集約するフォーム（FormSubmit 経由で info@brifu.co.jp へ送信、自動返信あり） |

「自分に何が向いているか」を調べる場所は **EQ Gate**（https://abiertoworks-boop.github.io/EQ2/）だけです。「かんたんEQ診断」は2026年11月に EQ Gate（https://abiertoworks-boop.github.io/EQ2/diagnosis.html）へ移しました。Brifu側の `diagnosis.html` は、移設先へ自動で移動するだけのページです。

そのほか `privacy.html`（プライバシーポリシー）と `tokushoho.html`（特定商取引法に基づく表記）、
`corecard.html`（EQコアカードの詳細LP）、`diagnosis.html`（EQ Gate の診断への転送）、`nexus.html`（EQ Business Nexus）があります。

```
css/style.css    全ページ共通のデザイン（色・文字・ヘッダー・メニュー・フッター・ボタン・トップの各セクション・08 CONTACT）
css/sub.css      下層ページ（BrifuのEQ／サービス内容／会社概要／法人向け支援／物販・書籍／お問い合わせ／
                 プライバシーポリシー／特商法表記）の中身の部品。style.css の上に重ねて読み込む
js/main.js       読み込み画面、カーソル、なめらかなスクロール、文字の動き、フェードイン、メニュー、背景の粒子
js/holomap.js    トップの3Dマップ（EQ Platform と4領域）
js/effects.js    動きの部品（カウントアップ・ラインドロー・テキストスクランブル・マグネットボタン・3Dチルト・テキストリビール）
css/eq.css       BrifuのEQ（eq.html）専用。DESIGN_RULES.md に沿って作った見本ページ
js/eq.js         BrifuのEQ専用の動き（背景色の切り替え・タイプライター・スクロールテリング・カードスタック）
js/contact.js    お問い合わせフォームの送信
images/          写真・アイコン
```

下層ページはどれも、トップと同じヘッダー・メニュー・お問い合わせ（08 CONTACT）・フッターを持っています。
ページ上部の見出し帯（`.subhero`）の背景は、ページごとに写真または動画（`video/`）を指定しています。

`css/site.css` と `js/site.js` は以前のコーポレートデザインのもので、いまは `design-draft.html`（非公開の見本）だけが使っています。

### お問い合わせフォームへのリンク

`contact.html` は URL パラメータで種別とタイトルを入力済みにできます。

| パラメータ | 例 | 入力される内容 |
| --- | --- | --- |
| `type` | `contact.html?type=nexus` | 種別：`academy` / `humanity` / `eqtm` / `nexus` / `corecard` / `other`（旧リンクの `business`→nexus、`shop`→corecard、`media`→other も使える） |
| `topic` | `contact.html?topic=no2` | 種別とタイトル（`no2` / `nexus` / `corecard` / `bulk` / `academy` / `humanity` / `eqtm`） |
| `subject` | `contact.html?subject=...` | タイトルを直接入力（旧リンク互換） |

### 書籍の表紙

`shop.html` の書籍は CSS で描いた仮の表紙です。表紙画像を `images/` に置き、
`.book-cover` の中に `<img src="images/ファイル名.jpg" alt="">` を入れると画像に置き換わります。

## 公開（GitHub Pages）

このリポジトリはルートに `index.html` を置いた静的サイトです。
GitHub の **Settings → Pages** で
**Source: Deploy from a branch / Branch: main / フォルダ: `/ (root)`** を選ぶと、
1〜2分で `https://<ユーザー名>.github.io/<リポジトリ名>/` に公開されます。

`.nojekyll` を置いてあるので Jekyll の変換は走らず、ファイルがそのまま配信されます。
更新するときは変更をコミットして `git push` するだけで、Pages が自動で追従します。

## ローカルで確認する

Node や Python がなくても、`tools/serve.ps1` で確認できます。

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File tools/serve.ps1 -Port 8791
```

ブラウザで `http://localhost:8791/` を開きます。
