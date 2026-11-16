# 株式会社Brifu コーポレートサイト

静的サイト（HTML / CSS / JS）です。ビルド工程はありません。

2026年11月にコーポレートサイトとしてシンプルな構成へ作り直しました。
EQ Platform の内容は「EQ_Platform_Guide_20261113」（4領域：EQ Academy／EQ Humanity／EQTM／EQ Business Nexus、EQ Gate は外部のフロントサイト）に合わせています。

## メニューとファイル

| メニュー | ファイル | 内容 |
| --- | --- | --- |
| トップ | `index.html` | メッセージ、私たちについて、EQの紹介、4領域、法人向け支援・物販への入口、代表 |
| EQ | `eq.html` | EQの定義、なぜ「人の心」か、EQ認識理論（7ステップ）、横成長と縦成長、5つの変化 |
| サービス内容 | `service.html` | EQ Platform の全体像（EQ Gate／4領域／基盤）、目的から選ぶ、各領域の詳細、つながる学び |
| 会社概要 | `company.html` | 理念（目的・使命・目指す理想の姿・価値観）、代表プロフィール、会社情報 |
| 法人向け支援 | `business.html` | EQ Business Nexus：お悩み、特徴、No.2育成、10の支援内容、進め方、対象 |
| 物販・書籍 | `shop.html` | EQコアカード®、著書2冊、ご購入について |
| お問い合わせ | `contact.html` | フォーム（FormSubmit 経由で info@brifu.co.jp へ送信、自動返信あり） |

そのほか `privacy.html`（プライバシーポリシー）と `tokushoho.html`（特定商取引法に基づく表記）も同じレイアウトです。

```
css/site.css     上記9ページの共通スタイル（色・文字・レイアウト・各ページの部品）
js/site.js       ヘッダーの影、スマホメニュー、スクロール時のフェードイン
js/contact.js    お問い合わせフォームの送信
images/          写真・アイコン
```

### 旧デザインのまま残しているページ

`corecard.html`（EQコアカードの詳細LP）、`diagnosis.html`（変化の入口診断）、`nexus.html` は
旧サイトの `css/style.css` と `js/main.js` を使っています。メニューとフッターのリンクだけ新しい構成に合わせました。

### お問い合わせフォームへのリンク

`contact.html` は URL パラメータで種別とタイトルを入力済みにできます。

| パラメータ | 例 | 入力される内容 |
| --- | --- | --- |
| `type` | `contact.html?type=business` | 種別：法人向け支援（`academy` / `business` / `shop` / `media` / `other`） |
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
