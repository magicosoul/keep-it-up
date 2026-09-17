/**
 * サッカーチームメーカーを、外部ファイルなしの1枚のHTMLに固める。
 * 共有リンクで配るとき用。
 *
 *   npm run build:artifact
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const RAW = 'dist-artifact-raw';
const OUT = 'dist-artifact';

const assets = readdirSync(join(RAW, 'assets'));
const jsFile = assets.find((name) => name.endsWith('.js'));
const cssFile = assets.find((name) => name.endsWith('.css'));

if (!jsFile || !cssFile) {
  throw new Error('ビルド結果に js / css が見つかりません');
}

const js = readFileSync(join(RAW, 'assets', jsFile), 'utf8');
let css = readFileSync(join(RAW, 'assets', cssFile), 'utf8');

if (/import\s*["']\.\//.test(js) || /from\s*["']\.\//.test(js)) {
  throw new Error('バンドルが他のチャンクを参照しています。1ファイルに固められません');
}

if (js.includes('</script')) {
  throw new Error('バンドルに </script> が含まれています。インライン化できません');
}

// 公開先ではページ側で body にクラスを付けられないので、body そのものに当てる
css = css.replace(/\.team-body\b/g, 'body');

const html = `<title>サッカーチームメーカー</title>
<style>
:root { color-scheme: dark; }
html, body { min-height: 100%; }
${css}
</style>

<main id="team-app"></main>

<script type="module">
${js}
</script>
`;

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'index.html'), html);

const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
console.log(`${OUT}/index.html を書き出しました (${kb} KB)`);
