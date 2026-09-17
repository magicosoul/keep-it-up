import { SURNAMES, GIVEN_NAMES, FOREIGN_NAMES, SCHOOLS, OVERSEAS_CLUBS, CLUB_PREFIX, CLUB_SUFFIX } from './names.js';
import { pick, range, intRange, weighted } from './rng.js';

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

const WEIGHTS = {
  GK: { sav: 0.55, phy: 0.2, tec: 0.15, def: 0.1, att: 0 },
  DF: { def: 0.48, phy: 0.22, tec: 0.18, att: 0.12, sav: 0 },
  MF: { tec: 0.38, def: 0.22, att: 0.22, phy: 0.18, sav: 0 },
  FW: { att: 0.52, tec: 0.24, phy: 0.16, def: 0.08, sav: 0 },
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function spread(rng, base, bias) {
  return Math.round(clamp(base + bias + range(rng, -7, 7), 30, 99));
}

function buildStats(rng, position, base) {
  if (position === 'GK') {
    return {
      sav: spread(rng, base, 6),
      def: spread(rng, base, -2),
      tec: spread(rng, base, -6),
      phy: spread(rng, base, 2),
      att: spread(rng, base, -26),
    };
  }

  if (position === 'DF') {
    return {
      sav: 0,
      def: spread(rng, base, 7),
      tec: spread(rng, base, -4),
      phy: spread(rng, base, 5),
      att: spread(rng, base, -9),
    };
  }

  if (position === 'MF') {
    return {
      sav: 0,
      def: spread(rng, base, 0),
      tec: spread(rng, base, 7),
      phy: spread(rng, base, -1),
      att: spread(rng, base, 1),
    };
  }

  return {
    sav: 0,
    def: spread(rng, base, -10),
    tec: spread(rng, base, 3),
    phy: spread(rng, base, 2),
    att: spread(rng, base, 8),
  };
}

export function overallFor(position, stats) {
  const w = WEIGHTS[position];
  const raw = stats.att * w.att + stats.def * w.def + stats.tec * w.tec + stats.phy * w.phy + stats.sav * w.sav;
  return Math.round(raw);
}

function buildName(rng, origin) {
  if (origin === 'import') {
    return pick(rng, FOREIGN_NAMES);
  }

  return `${pick(rng, SURNAMES)} ${pick(rng, GIVEN_NAMES)}`;
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
  if (origin === 'youth') {
    return intRange(rng, 17, 19);
  }

  return intRange(rng, 20, 35);
}

export function createPlayer(rng, position, id) {
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
    name: buildName(rng, origin),
    position,
    origin,
    originLabel: ORIGIN_LABEL[origin],
    team: buildTeamLabel(rng, origin),
    age,
    stats,
    ovr,
    potential: clamp(ovr + Math.max(youngBonus, 3), ovr, 99),
    tierLabel: tier.label,
  };
}

export function buildPool(rng, fieldCount, keeperCount) {
  const field = [];
  const keepers = [];

  for (let i = 0; i < fieldCount; i += 1) {
    field.push(createPlayer(rng, weighted(rng, FIELD_POSITIONS), `f${i}`));
  }

  for (let i = 0; i < keeperCount; i += 1) {
    keepers.push(createPlayer(rng, 'GK', `g${i}`));
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
