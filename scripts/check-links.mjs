/**
 * ビルド結果にサイト内の絶対パスが残っていないかの検査。
 *
 * GitHub Pages はプロジェクトサイトを /<リポジトリ名>/ の下で配信するので、
 * href="/team/" のような絶対パスはドメイン直下を指してしまい 404 になる。
 * Vite が書き換えてくれるのはアセットだけで、ページ間リンクは書き換わらない。
 *
 *   npm run check
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? htmlFiles(path) : path.endsWith('.html') ? [path] : [];
  });
}

let pages;

try {
  pages = htmlFiles(DIST);
} catch {
  console.error(`${DIST}/ がありません。先に npm run build を実行してください`);
  process.exit(1);
}

const problems = [];

for (const page of pages) {
  const html = readFileSync(page, 'utf8');

  for (const match of html.matchAll(/(?:href|src)="(\/[^/][^"]*|\/)"/g)) {
    problems.push(`${page}: ${match[0]} — 相対パスにしてください`);
  }
}

if (problems.length) {
  console.error(`リンクの検査に失敗しました (${problems.length}件)`);
  problems.forEach((problem) => console.error(`  - ${problem}`));
  process.exit(1);
}

console.log(`リンクの検査OK: ${pages.length}ページ、サイト内の絶対パスなし`);
