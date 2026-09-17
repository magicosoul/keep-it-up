/**
 * SNSでリンクを貼ったときに出る画像 (public/ogp.png, 1200x630) を作る。
 *
 * 生成しなおすときだけ使う。playwright が要るので devDependencies には入れていない。
 *   npx playwright@latest install chromium   # 必要なら
 *   node scripts/make-ogp.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px; display: flex; flex-direction: column;
    justify-content: center; gap: 34px; padding: 0 76px;
    background:
      radial-gradient(circle at 10% -20%, #2b4568, transparent 55%),
      radial-gradient(circle at 92% 6%, #3a2a55, transparent 46%),
      #0b1220;
    color: #f2ead6;
    font-family: system-ui, 'Noto Sans JP', sans-serif;
  }
  .eyebrow { color: #9fb0c6; font-size: 22px; letter-spacing: 6px; font-weight: 700; }
  h1 {
    color: #ffc35c; font-size: 118px; line-height: 0.92; letter-spacing: 3px;
    text-shadow: 6px 6px 0 #050812, 12px 12px 0 #e45757;
  }
  .row { display: flex; gap: 20px; }
  .card {
    background: rgba(10,17,31,0.86); border: 1px solid #2b3a52; border-radius: 20px;
    padding: 22px 26px; flex: 1;
  }
  .card b { display: block; font-size: 34px; margin-bottom: 10px; }
  .card span { color: #cbd5e1; font-size: 20px; line-height: 1.5; }
  .tag {
    display: inline-block; font-size: 16px; font-weight: 900; letter-spacing: 1px;
    padding: 3px 12px; border-radius: 999px; border: 1px solid currentColor; margin-bottom: 12px;
  }
  .done { color: #4ade80; } .wip { color: #9fb0c6; }
</style>
<p class="eyebrow">BROWSER SOCCER GAMES</p>
<h1>KEEP IT UP!</h1>
<div class="row">
  <div class="card">
    <span class="tag done">遊べます</span>
    <b>サッカーチームメーカー</b>
    <span>取るか見送るかだけで18人集めて、38試合のシーズンを戦う</span>
  </div>
  <div class="card">
    <span class="tag wip">プロトタイプ</span>
    <b>リフティング</b>
    <span>ボールを落とさないよう蹴り続けるアクション</span>
  </div>
</div>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
writeFileSync('public/ogp.png', await page.screenshot({ type: 'png' }));
await browser.close();
console.log('public/ogp.png を書き出しました');
