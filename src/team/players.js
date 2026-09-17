import { CONFIRMED_NAMES, FOREIGN_NAMES, SCHOOLS, OVERSEAS_CLUBS, CLUB_PREFIX, CLUB_SUFFIX } from './names.js';
import { pick, range, intRange, weighted } from './rng.js';
import { rollSkills } from './skills.js';

const TIERS = [
  { value: { min: 88, max: 95, label: 'ワールドクラス' }, weight: 2 },
  { value: { min: 80, max: 87, label: '主力級' }, weight: 10 },
  { value: { min: 72, max: 79, label: '中堅' }, weight: 26 },
  { value: { min: 64, max: 71, label: 'ローテ級' }, weight: 36 },
  { value: { min: 55, max: 63, label: '育成級' }, weight: 26 },
];

const FIELD_POSITIONS = [
  { value: 'DF', weight: 40 },
  { value: 'MF', weight: 38 },
  { value: 'FW', weight: 22 },
];

export const STAT_KEYS = ['shoot', 'pass', 'dribble', 'tackle', 'speed', 'physical'];

/** 同じ6項目を、ポジションによって呼び方だけ変える。 */
export const STAT_LABELS = {
  GK: { shoot: 'セービング', pass: 'フィード', dribble: 'ハンドリング', tackle: '守備範囲', speed: '反応', physical: 'フィジカル' },
  DF: { shoot: 'シュート', pass: 'パス', dribble: 'ドリブル', tackle: 'タックル', speed: 'スピード', physical: 'フィジカル' },
  MF: { shoot: 'シュート', pass: 'パス', dribble: 'ドリブル', tackle: 'タックル', speed: 'スピード', physical: 'フィジカル' },
  FW: { shoot: 'シュート', pass: 'パス', dribble: 'ドリブル', tackle: 'タックル', speed: 'スピード', physical: 'フィジカル' },
};

/** 表示順。そのポジションで大事なものから並べる。 */
export const STAT_ORDER = {
  GK: ['shoot', 'tackle', 'dribble', 'speed', 'physical', 'pass'],
  DF: ['tackle', 'physical', 'speed', 'pass', 'dribble', 'shoot'],
  MF: ['pass', 'dribble', 'tackle', 'speed', 'physical', 'shoot'],
  FW: ['shoot', 'dribble', 'speed', 'physical', 'pass', 'tackle'],
};

const WEIGHTS = {
  GK: { shoot: 0.4, tackle: 0.2, dribble: 0.15, speed: 0.12, physical: 0.08, pass: 0.05 },
  DF: { tackle: 0.38, physical: 0.22, speed: 0.16, pass: 0.12, dribble: 0.07, shoot: 0.05 },
  MF: { pass: 0.32, dribble: 0.22, tackle: 0.18, speed: 0.14, physical: 0.09, shoot: 0.05 },
  FW: { shoot: 0.38, dribble: 0.22, speed: 0.2, physical: 0.12, pass: 0.06, tackle: 0.02 },
};

const SHAPE = {
  GK: { shoot: 9, tackle: 3, dribble: -1, speed: -3, physical: 2, pass: -11 },
  DF: { tackle: 9, physical: 7, speed: 0, pass: -3, dribble: -9, shoot: -15 },
  MF: { pass: 8, dribble: 5, tackle: 0, speed: 0, physical: -2, shoot: -4 },
  FW: { shoot: 10, dribble: 6, speed: 5, physical: 0, pass: -6, tackle: -16 },
};

const ORIGINS = [
  { value: 'domestic', weight: 62 },
  { value: 'youth', weight: 13 },
  { value: 'overseas', weight: 9 },
  { value: 'import', weight: 16 },
];

export const ORIGIN_LABEL = {
  domestic: '国内',
  youth: 'ユース候補',
  overseas: '海外組',
  import: '外国籍',
};

const RANKS = [
  { min: 90, letter: 'S' },
  { min: 80, letter: 'A' },
  { min: 70, letter: 'B' },
  { min: 60, letter: 'C' },
  { min: 50, letter: 'D' },
  { min: 40, letter: 'E' },
  { min: 30, letter: 'F' },
  { min: -Infinity, letter: 'G' },
];

export function rankOf(value) {
  return RANKS.find((rank) => value >= rank.min).letter;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function overallFor(position, stats) {
  const weights = WEIGHTS[position];
  return Math.round(STAT_KEYS.reduce((sum, key) => sum + stats[key] * weights[key], 0));
}

function buildStats(rng, position, base) {
  const shape = SHAPE[position];
  const weights = WEIGHTS[position];
  // ポジションごとの偏りで総合値がずれないよう、重み付き平均のぶんを引いておく
  const offset = STAT_KEYS.reduce((sum, key) => sum + shape[key] * weights[key], 0);
  const stats = {};

  STAT_KEYS.forEach((key) => {
    stats[key] = Math.round(clamp(base + shape[key] - offset + range(rng, -8, 8), 25, 99));
  });

  return stats;
}

function shuffled(rng, list) {
  const out = list.slice();

  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }

  return out;
}

/**
 * 1ゲームのあいだ同じ名前が二度出ないよう、シャッフルした山から配る。
 * 山を使い切ったら引き直す（そのときだけ重複しうる）。
 */
export function createNameAllocator(rng) {
  let japanese = shuffled(rng, CONFIRMED_NAMES);
  let foreign = shuffled(rng, FOREIGN_NAMES);

  return (origin) => {
    if (origin === 'import') {
      if (!foreign.length) {
        foreign = shuffled(rng, FOREIGN_NAMES);
      }

      return foreign.pop();
    }

    if (!japanese.length) {
      japanese = shuffled(rng, CONFIRMED_NAMES);
    }

    return japanese.pop();
  };
}

function buildTeamLabel(rng, origin) {
  if (origin === 'youth') {
    return pick(rng, SCHOOLS);
  }

  if (origin === 'overseas') {
    return pick(rng, OVERSEAS_CLUBS);
  }

  return `${pick(rng, CLUB_PREFIX)}${pick(rng, CLUB_SUFFIX)}`;
}

function buildAge(rng, origin) {
  return origin === 'youth' ? intRange(rng, 17, 19) : intRange(rng, 20, 35);
}

export function createPlayer(rng, position, id, allocateName) {
  const origin = weighted(rng, ORIGINS);
  const tier = weighted(rng, TIERS);
  let base = range(rng, tier.min, tier.max);

  if (origin === 'youth') {
    base -= 9;
  }

  if (origin === 'overseas') {
    base += 3;
  }

  const stats = buildStats(rng, position, base);
  const ovr = overallFor(position, stats);
  const age = buildAge(rng, origin);
  const youngBonus = age <= 21 ? intRange(rng, 6, 16) : age <= 25 ? intRange(rng, 2, 8) : intRange(rng, 0, 3);

  return {
    id,
    name: allocateName ? allocateName(origin) : (origin === 'import' ? pick(rng, FOREIGN_NAMES) : pick(rng, CONFIRMED_NAMES)),
    position,
    origin,
    originLabel: ORIGIN_LABEL[origin],
    team: buildTeamLabel(rng, origin),
    age,
    stats,
    ovr,
    potential: clamp(ovr + Math.max(youngBonus, 3), ovr, 99),
    tierLabel: tier.label,
    skills: rollSkills(rng, position, ovr, age),
  };
}

export function buildPool(rng, fieldCount, keeperCount) {
  const allocateName = createNameAllocator(rng);
  const field = [];
  const keepers = [];

  for (let i = 0; i < fieldCount; i += 1) {
    field.push(createPlayer(rng, weighted(rng, FIELD_POSITIONS), `f${i}`, allocateName));
  }

  for (let i = 0; i < keeperCount; i += 1) {
    keepers.push(createPlayer(rng, 'GK', `g${i}`, allocateName));
  }

  return { field, keepers };
}

export function toSquadMember(player) {
  return {
    ...player,
    form: 1,
    fatigue: 0,
    injuredFor: 0,
    apps: 0,
    goals: 0,
    assists: 0,
    cleanSheets: 0,
    growth: 0,
    seasonRating: 0,
  };
}
