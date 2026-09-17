import { TEAM_CONFIG, FORMATIONS, POSITION_ORDER } from './config.js';
import { STAT_KEYS } from './players.js';
import { playerEffects, skillValue } from './skills.js';

/** 6項目から「攻撃 / 主導権 / 守備」に落とすときの配合。 */
const ATTACK_MIX = {
  FW: { shoot: 0.5, dribble: 0.25, speed: 0.2, pass: 0.05 },
  MF: { shoot: 0.3, pass: 0.3, dribble: 0.25, speed: 0.15 },
  DF: { shoot: 0.3, pass: 0.35, dribble: 0.15, speed: 0.2 },
  GK: { pass: 1 },
};

const CONTROL_MIX = {
  FW: { pass: 0.5, dribble: 0.35, tackle: 0.15 },
  MF: { pass: 0.55, dribble: 0.25, tackle: 0.2 },
  DF: { pass: 0.5, dribble: 0.2, tackle: 0.3 },
  GK: { pass: 0.6, dribble: 0.2, tackle: 0.2 },
};

const DEFENSE_MIX = {
  FW: { tackle: 0.5, physical: 0.27, speed: 0.23 },
  MF: { tackle: 0.5, physical: 0.27, speed: 0.23 },
  DF: { tackle: 0.5, physical: 0.27, speed: 0.23 },
  GK: { shoot: 0.55, tackle: 0.2, dribble: 0.15, speed: 0.1 },
};

function blend(stats, mix) {
  return Object.entries(mix).reduce((sum, [key, weight]) => sum + stats[key] * weight, 0);
}

export function mismatchPenalty(naturalPosition, slotPosition, player) {
  if (naturalPosition === slotPosition) {
    return 0;
  }

  const relief = player ? playerEffects(player).convertRelief : 0;
  let raw;

  if (naturalPosition === 'GK' || slotPosition === 'GK') {
    raw = TEAM_CONFIG.penalty.keeperOutfield;
  } else {
    const gap = Math.abs(POSITION_ORDER.indexOf(naturalPosition) - POSITION_ORDER.indexOf(slotPosition));
    raw = gap === 1 ? TEAM_CONFIG.penalty.adjacent : TEAM_CONFIG.penalty.distant;
  }

  return Math.round(raw * (1 - relief));
}

export function effectiveStats(player, slotPosition) {
  const penalty = mismatchPenalty(player.position, slotPosition, player);
  const growth = player.growth ?? 0;
  const out = {};

  STAT_KEYS.forEach((key) => {
    out[key] = Math.max(20, player.stats[key] + growth - penalty);
  });

  return out;
}

export function effectiveOvr(player, slotPosition) {
  const penalty = mismatchPenalty(player.position, slotPosition, player);
  return Math.max(20, player.ovr + (player.growth ?? 0) - penalty);
}

/** 自動配置に使う評価。能力値に特殊能力ぶんを足す。 */
export function assignmentScore(player, slotPosition) {
  return effectiveOvr(player, slotPosition) + skillValue(player) * 0.6;
}

export function conditionMultiplier(player) {
  const fatiguePenalty = Math.max(0, (player.fatigue ?? 0) - 40) / 260;
  return Math.max(0.6, (player.form ?? 1) - fatiguePenalty);
}

export function autoAssign(squad, formationKey) {
  const slots = FORMATIONS[formationKey].slots;
  const used = new Set();
  const lineup = [];

  slots.forEach((slotPosition, slotIndex) => {
    let best = null;
    let bestScore = -Infinity;

    squad.forEach((player) => {
      if (used.has(player.id)) {
        return;
      }

      const score = assignmentScore(player, slotPosition);

      if (score > bestScore) {
        bestScore = score;
        best = player;
      }
    });

    if (best) {
      used.add(best.id);
      lineup.push({ slotIndex, slotPosition, playerId: best.id });
    }
  });

  return lineup;
}

export function availableFor(player) {
  return (player.injuredFor ?? 0) <= 0;
}

export function matchdayLineup(squad, formationKey, lineup) {
  const slots = FORMATIONS[formationKey].slots;
  const byId = new Map(squad.map((player) => [player.id, player]));
  const used = new Set();
  const resolved = [];

  slots.forEach((slotPosition, slotIndex) => {
    const chosen = lineup.find((entry) => entry.slotIndex === slotIndex);
    const preferred = chosen ? byId.get(chosen.playerId) : null;

    if (preferred && availableFor(preferred) && (preferred.fatigue ?? 0) < 78 && !used.has(preferred.id)) {
      used.add(preferred.id);
      resolved.push({ slotPosition, player: preferred });
      return;
    }

    let best = null;
    let bestScore = -Infinity;

    squad.forEach((player) => {
      if (used.has(player.id) || !availableFor(player)) {
        return;
      }

      const score = assignmentScore(player, slotPosition) * conditionMultiplier(player);

      if (score > bestScore) {
        bestScore = score;
        best = player;
      }
    });

    if (best) {
      used.add(best.id);
      resolved.push({ slotPosition, player: best });
    }
  });

  return resolved;
}

export function computeRatings(resolved, formationKey, captainId) {
  const bias = FORMATIONS[formationKey].bias;
  let attack = 0;
  let attackWeight = 0;
  let control = 0;
  let controlWeight = 0;
  let defense = 0;
  let defenseWeight = 0;

  resolved.forEach(({ slotPosition, player }) => {
    const stats = effectiveStats(player, slotPosition);
    const skills = playerEffects(player);
    const condition = conditionMultiplier(player);

    const attWeight = slotPosition === 'FW' ? 1 : slotPosition === 'MF' ? 0.55 : slotPosition === 'DF' ? 0.2 : 0;
    const ctlWeight = slotPosition === 'MF' ? 1 : slotPosition === 'GK' ? 0.1 : 0.35;
    const defWeight = slotPosition === 'DF' ? 1 : slotPosition === 'MF' ? 0.55 : slotPosition === 'FW' ? 0.15 : 1.3;

    attack += (blend(stats, ATTACK_MIX[slotPosition]) + skills.ratings.attack) * condition * attWeight;
    attackWeight += attWeight;
    control += (blend(stats, CONTROL_MIX[slotPosition]) + skills.ratings.control) * condition * ctlWeight;
    controlWeight += ctlWeight;
    defense += (blend(stats, DEFENSE_MIX[slotPosition]) + skills.ratings.defense) * condition * defWeight;
    defenseWeight += defWeight;
  });

  const captainBonus = resolved.some(({ player }) => player.id === captainId) ? 1.02 : 1;

  return {
    attack: (attack / Math.max(attackWeight, 0.001)) * bias.attack * captainBonus,
    control: (control / Math.max(controlWeight, 0.001)) * bias.control * captainBonus,
    defense: (defense / Math.max(defenseWeight, 0.001)) * bias.defense * captainBonus,
  };
}

export function squadSummary(squad, formationKey, lineup, captainId) {
  const resolved = matchdayLineup(squad, formationKey, lineup);
  const ratings = computeRatings(resolved, formationKey, captainId);
  const power = Math.round((ratings.attack * 0.36 + ratings.control * 0.24 + ratings.defense * 0.4));

  return { resolved, ratings, power };
}

export function countByPosition(squad) {
  const counts = { GK: 0, DF: 0, MF: 0, FW: 0 };
  squad.forEach((player) => {
    counts[player.position] += 1;
  });
  return counts;
}
