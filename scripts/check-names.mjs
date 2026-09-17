/**
 * 確定名リストの検査。
 *
 * 姓と名は必ず別カテゴリから取ること。
 * 同じカテゴリの姓と名を組むと実在の人物そのものになってしまうため。
 *
 *   npm run check
 */
import { SURNAME_SOURCES, GIVEN_SOURCES, CONFIRMED_NAMES } from '../src/team/names.js';

const surnameCategories = new Map();
const givenCategories = new Map();

for (const [category, list] of Object.entries(SURNAME_SOURCES)) {
  for (const surname of list) {
    surnameCategories.set(surname, [...(surnameCategories.get(surname) ?? []), category]);
  }
}

for (const [category, list] of Object.entries(GIVEN_SOURCES)) {
  for (const given of list) {
    givenCategories.set(given, [...(givenCategories.get(given) ?? []), category]);
  }
}

const problems = [];
const seen = new Set();

for (const full of CONFIRMED_NAMES) {
  if (seen.has(full)) {
    problems.push(`重複: ${full}`);
  }

  seen.add(full);

  const parts = full.split(' ');

  if (parts.length !== 2) {
    problems.push(`「姓 名」の形になっていない: ${full}`);
    continue;
  }

  const [surname, given] = parts;
  const surnameIn = surnameCategories.get(surname);
  const givenIn = givenCategories.get(given);

  if (!surnameIn) {
    problems.push(`SURNAME_SOURCES にない姓: ${full}`);
    continue;
  }

  if (!givenIn) {
    problems.push(`GIVEN_SOURCES にない名: ${full}`);
    continue;
  }

  const shared = surnameIn.filter((category) => givenIn.includes(category));

  if (shared.length) {
    problems.push(`同じカテゴリ(${shared.join(',')})の姓名を組んでいる: ${full}`);
  }
}

if (problems.length) {
  console.error(`名前の検査に失敗しました (${problems.length}件)`);
  problems.forEach((problem) => console.error(`  - ${problem}`));
  process.exit(1);
}

console.log(`名前の検査OK: ${CONFIRMED_NAMES.length}通り、重複なし、同カテゴリの組み合わせなし`);
