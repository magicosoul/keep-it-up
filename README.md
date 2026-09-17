# KEEP IT UP!

ブラウザで遊べるサッカーゲーム2本。

**公開先: https://magicosoul.github.io/keep-it-up/**

| ページ | 中身 | 状態 |
| --- | --- | --- |
| `/` | 入口 | — |
| `/team/` | サッカーチームメーカー | 遊べます |
| `/juggling/` | リフティング（KEEP IT UP!） | Phase 1 プロトタイプ |

main に push すると GitHub Actions が build して自動で公開します
（`.github/workflows/deploy-pages.yml`）。

### 初回だけ必要な設定

リポジトリの **Settings → Pages → Build and deployment → Source** を
**GitHub Actions** にしてください。1回だけです。

`GITHUB_TOKEN` には Pages サイトを新規作成する権限がないため、
ワークフロー側から自動で有効化することはできません
（`configure-pages` の `enablement: true` は
`Resource not accessible by integration` で失敗します）。

### 別のドメインに移すとき

`index.html` / `team/index.html` / `juggling/index.html` の
`canonical` / `og:url` / `og:image` と、`public/robots.txt`、`public/sitemap.xml`
に公開URLが入っています。移行時はここを直してください。

---

A simple soccer juggling game prototype.

This repository is set up for Codex-driven development. The goal is not to make a huge game immediately. The goal is to build the core juggling feel first, then add tricks, scoring, assets, and polish step by step.

## Current direction

KEEP IT UP! is a small 2D freestyle soccer juggling game.

Core modes:

- 90 second score attack
- 120 second score attack
- Hardcore mode, continuing until the ball drops

Core controls:

- Move left / right
- Right foot
- Left foot
- Chest
- Head
- Up / down direction modifiers for trick commands

## Development stack

- Vite
- Vanilla JavaScript
- HTML Canvas
- CSS

## How to run locally

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

## Codex workflow

Read `CODEX.md` first.

Do not try to finish the entire game in one task. Work in small steps:

1. Make basic foot juggling feel good.
2. Add chest and head control.
3. Add timer modes and hardcore mode.
4. Add trick commands.
5. Add pixel art assets.
6. Tune scoring and difficulty.

## サッカーチームメーカー (`/team/`)

このリポジトリにはもう一つ、ブラウザで遊べるチーム構築ゲームが入っています。

ランダムに流れてくる選手を「取る」か「見送る」かだけで18人集め、
フォーメーションを組んで38試合のシーズンを戦います。1プレイ5〜15分。

- 選手: パワプロ風の6パラメータ（S〜Gランク）＋特殊能力29種。金特・青特・赤特すべて試合に効く
- 名前: 芸能 / 政治 / スポーツ / 偉人の姓名を交差させて確定した280通りから、1ゲーム内で重複なく配る
- ドラフト: フィールドプレーヤー16人（見送り9回まで）→ GK 2人（見送り3回まで）
- 編成: 4-4-2 / 4-3-3 / 3-5-2 / 4-2-3-1、本職外はコンバート減点
- 相性: 中盤の枚数・サイドの幅・相手最終ライン・陣地・背後のスペースの5項目で噛み合わせを計算。次節の相手の形を見て組み替えられる
- シーズン: 20クラブの38節。疲労・ケガ・ブレイク・不調あり
- 同じシードなら同じ選手が同じ順番で流れます

`npm run dev` のあと `/team/` を開いてください。詳しい仕様は `TEAM_SPEC.md`。

`npm run build` のあと `npm run check` で2つ検査します。

- 名前: 姓と名が同じカテゴリの組み合わせになっていないか（＝実在の人物そのものに
  なっていないか）
- リンク: ビルド結果にサイト内の絶対パスが残っていないか。GitHub Pages は
  `/keep-it-up/` の下で配信するので、`href="/team/"` のような絶対パスは404になる

`npm run build:artifact` は `/team/` を外部読み込みなしの1枚のHTMLに固めます。

## Project structure

```text
keep-it-up/
├─ index.html              入口ページ
├─ vite.config.js
├─ vite.artifact.config.js
├─ TEAM_SPEC.md
├─ GAME_SPEC.md
├─ CODEX.md
├─ .github/workflows/
│  └─ deploy-pages.yml     main への push で GitHub Pages に公開
├─ scripts/
│  ├─ check-names.mjs
│  ├─ check-links.mjs
│  └─ build-artifact.mjs
├─ juggling/
│  └─ index.html           リフティングゲーム
├─ team/
│  └─ index.html           サッカーチームメーカー
├─ src/
│  ├─ main.js              リフティングの起動
│  ├─ game.js
│  ├─ input.js
│  ├─ physics.js
│  ├─ tricks.js
│  ├─ config.js
│  └─ team/
│     ├─ main.js           チームメーカーの画面遷移
│     ├─ config.js
│     ├─ rng.js
│     ├─ names.js
│     ├─ players.js
│     ├─ skills.js
│     ├─ draft.js
│     ├─ squad.js
│     ├─ season.js
│     ├─ tactics.js
│     ├─ ui.js
│     └─ screens/
│        ├─ title.js
│        ├─ draft.js
│        ├─ squad.js
│        ├─ season.js
│        └─ result.js
└─ styles/
   ├─ home.css
   ├─ style.css
   └─ team.css
```
