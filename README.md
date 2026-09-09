# 株式会社Brifu コーポレートサイト

静的サイト（HTML / CSS / JS）です。ビルド工程はありません。`burif/` フォルダごとサーバーに置けば公開できます。

## ファイル構成

```
burif/
├─ index.html        トップ（HERO → PURPOSE → 01 WHY … 11 DIAGNOSIS）
├─ diagnosis.html    変化の入口診断（8問 → TYPE A〜E）
├─ company.html      理念・代表プロフィール・会社概要
├─ css/style.css     全ページ共通スタイル（青系トーン）
├─ js/main.js        モーション（Lenis / GSAP ScrollTrigger / Three.js）
├─ js/diagnosis.js   診断の設問・重み付け・結果文
├─ images/           写真・バナー・アイコン
└─ video/eq-bg.mp4   EQ定義ブロックの背景動画
```

### 外部サイトへのリンク

| リンク先 | URL | 置き場所 |
| --- | --- | --- |
| EQ Platform | `https://brifu-eq-platform-ixrklwz.gamma.site/` | メニュー、フッター、STAGE末尾、診断結果 |
| EQ Gate（EQコアカード体験） | `https://abiertoworks-boop.github.io/EQ2/eqgate-transparent-v2#cards8` | メニュー、07 EQコアカード、STAGE 01 |
| EIA | `https://eia-gate-qbwot3x.gamma.site` | STAGE 03 |

### 背景動画について

`video/eq-bg.mp4` は **5.0MB（640×360 / 40秒）** です。
セクションが近づいてから読み込む遅延方式なので、初回表示は妨げません。
離れると一時停止し、タブに戻ると再開します。
差し替えるときは同じファイル名で上書きしてください。

3ページは互いにリンクし合っています。`index.html` から `../index.html` へのリンクだけは
親フォルダの EQ Platform サイトを指しているので、`burif/` だけを単体で公開する場合は
このリンク先も一緒にアップロードしてください。

外部ライブラリは CDN から読み込みます（GSAP 3.12.5, Lenis 1.1.18, Three.js r128）。
オフラインや CDN 読込失敗時もコンテンツは表示され、モーションだけが無効になります。

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
動画を扱うため HTTP Range に対応させてあります。

## 主なモーション

| セクション | 実装 |
| --- | --- |
| 見出し全般 | 1文字ずつ下から立ち上がる（`main.js` の `splitTitles`）。`.split-group` を付けた見出しが対象 |
| HERO | Three.js のパーティクルとワイヤーフレームによる奥行き。マウスとスクロールでカメラが動く |
| 02 QUESTION | 4つの課題それぞれに写真。スクロールで青いワイプが引いて写真が現れる |
| 03 CORE | 感情→認識→…→認識の更新 の7枚を3Dリングに配置し、スクロールで回転（ピン留め）。カードは全て同じ寸法で、アイコン・番号・太字・説明を段で分けている。手前に来たカードは枠が発光する |
| 04 EQ | 「EQとは、自分と人の可能性を活かす力。」の枠に動画を背景として敷いている。セクションが近づいてから読み込み、離れると一時停止する |
| 05 GAIN | 9枚の正方形バナーを横スライドで表示。中央のカードだけが大きくなり、両隣から順に小さく薄くなる。読み込み時は「感情を知る」が中央 |
| 05 DOMAINS | 5領域のカードが重なりながら奥へ沈む。枠の高さは写真の高さ（3:2）に合わせてあり、写真は切り抜かず全体を表示する |
| 06 GROWTH | 横成長・縦成長の枠の右側に、それぞれのシンボルを約2/3だけ見えるように配置。透明度を上げて文字の視認性を確保している |
| 08 PLATFORM | 6ステージの横スクロール（ピン留め）＋カードの微妙な回転 |
| 09 RIPPLE | 自分→人→チーム→組織→社会 の同心円が奥から手前に広がる。円が届いた瞬間に発光し、その後やわらかい光に落ち着く |
| 10 VISION | 4つの理念カードにホバーすると枠が発光して浮き上がる |

`prefers-reduced-motion` が有効な環境ではピン留めと大きな動きを止めます。
900px 以下ではピン留めを解除し、縦に積む表示になります。

### ピン留めの安定性について

3つのピン留めセクションは `gsap.matchMedia()` で管理し、アニメーションは全て `fromTo` で
開始値を明示しています。ScrollTrigger が再計測（refresh）しても開始値が変わらないため、
リング同士がずれることがありません。RIPPLE の円は transform を使わず負のマージンだけで
中央に置いているので、GSAP の scale と中央寄せが競合しません。

## 診断ロジック（js/diagnosis.js）

- 各設問の選択肢に TYPE A〜E への加点を持たせています（`w` プロパティ）。
- TYPE D（人との関わりから深める）は「できると答えている（know）のに、関係の中では
  うまくいっていない（struggle）」というギャップが大きいときに加点されます。
- どのタイプも 3 点未満なら TYPE D を返します。
- 結果には点数を出しません。「変化の入口」と、横成長・縦成長それぞれの学びの案内を出します。
- 設問文・結果文は `QUESTIONS` と `TYPES` を編集するだけで差し替えられます。

## 画像の差し替え

`images/` のファイル名を変えずに上書きすれば、HTML/CSS の変更は不要です。

| ファイル名 | 使いどころ |
| --- | --- |
| `q-personal / q-relation / q-team / q-organization` | 02 QUESTION の4枚 |
| `gain-1-emotion` 〜 `gain-9-reflect` | 05 GAIN のスライダー9枚（正方形・文字は画像に焼き込み済み） |
| `icon-yoko` / `icon-tate` | 06 GROWTH の横成長・縦成長シンボル（白の線画＋透過PNG） |
| `woman-green / hands / team-casual / two-men / society` | 05 DOMAINS の5枚 |
| `corecard-circle` | 07 EQコアカード |
| `mountain-path / notebook / leaves / yoga-sunset / team-office / business-pair` | 08 PLATFORM の6ステージ |
| `dia-philosophy` | company.html の理念ピラミッド |

DOMAINS の写真を差し替えるときは、`index.html` の `domain__blur` の
`style="background-image:url(...)"` も同じファイルに合わせてください。

## 表示確認用パラメータ（開発用）

`index.html?capture=1&isolate=1&sec=.platform&off=400&p=0.5` のように付けると、
ローダーとスムーススクロールを止め、指定セクションだけを先頭に表示します。
`p` はピン留めアニメーションの進捗（0〜1）です。
ヘッドレスブラウザでのスクリーンショット確認に使うもので、通常の閲覧では使いません。
