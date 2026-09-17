import { TEAM_CONFIG, FORMATIONS, POSITION_ORDER } from './config.js';

export function mismatchPenalty(naturalPosition, slotPosition) {
  if (naturalPosition === slotPosition) {
    return 0;
  }

  if (naturalPosition === 'GK' || slotPosition === 'GK') {
    return TEAM_CONFIG.penalty.keeperOutfield;
  }

  const gap = Math.abs(POSITION_ORDER.indexOf(naturalPosition) - POSITION_ORDER.indexOf(slotPosition));
  return gap === 1 ? TEAM_CONFIG.penalty.adjacent : TEAM_CONFIG.penalty.distant;
}

export function effectiveStats(player, slotPosition) {
  const penalty = mismatchPenalty(player.position, slotPosition);
  const growth = player.growth ?? 0;
  const adjust = (value) => Math.max(20, value + growth - penalty);

  return {
    att: adjust(player.stats.att),
    def: adjust(player.stats.def),
    tec: adjust(player.stats.tec),
    phy: adjust(player.stats.phy),
    sav: adjust(player.stats.sav),
  };
}

export function effectiveOvr(player, slotPosition) {
  const penalty = mismatchPenalty(player.position, slotPosition);
  return Math.max(20, player.ovr + (player.growth ?? 0) - penalty);
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

      const score = effectiveOvr(player, slotPosition);

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

      const score = effectiveOvr(player, slotPosition) * conditionMultiplier(player);

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
    const condition = conditionMultiplier(player);

    const attWeight = slotPosition === 'FW' ? 1 : slotPosition === 'MF' ? 0.55 : slotPosition === 'DF' ? 0.2 : 0;
    const tecWeight = slotPosition === 'MF' ? 1 : slotPosition === 'GK' ? 0.1 : 0.35;
    const defWeight = slotPosition === 'DF' ? 1 : slotPosition === 'MF' ? 0.55 : slotPosition === 'FW' ? 0.15 : 0;

    attack += stats.att * condition * attWeight;
    attackWeight += attWeight;
    control += stats.tec * condition * tecWeight;
    controlWeight += tecWeight;
    defense += stats.def * condition * defWeight;
    defenseWeight += defWeight;

    if (slotPosition === 'GK') {
      defense += stats.sav * condition * 1.3;
      defenseWeight += 1.3;
    }
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
