import { TEAM_CONFIG } from './config.js';
import { CLUB_PREFIX, CLUB_SUFFIX, SURNAMES, GIVEN_NAMES, FOREIGN_NAMES } from './names.js';
import { pick, range, intRange, poisson } from './rng.js';
import { squadSummary, availableFor } from './squad.js';

export const AI_SCALE = {
  attackBase: 58,
  attackRange: 20,
  defenseBase: 64,
  defenseRange: 18,
};

const SCORER_SHARES = [0.28, 0.18, 0.11];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildFixtures(rng, clubCount, rounds) {
  const wheel = [];
  for (let i = 0; i < clubCount; i += 1) {
    wheel.push(i);
  }

  const half = clubCount / 2;
  const single = [];

  for (let round = 0; round < clubCount - 1; round += 1) {
    const pairs = [];

    for (let i = 0; i < half; i += 1) {
      const home = wheel[i];
      const away = wheel[clubCount - 1 - i];
      pairs.push(round % 2 === 0 ? [home, away] : [away, home]);
    }

    single.push(pairs);
    wheel.splice(1, 0, wheel.pop());
  }

  const schedule = single.slice();

  single.forEach((pairs) => {
    schedule.push(pairs.map(([home, away]) => [away, home]));
  });

  return schedule.slice(0, rounds).map((pairs) => pairs.map((pair) => pair.slice()));
}

function shuffled(rng, list) {
  const out = list.slice();

  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }

  return out;
}

function buildClubs(rng, clubCount, myClubName, takenNames = []) {
  const clubs = [
    { name: myClubName, mine: true, quality: 0, scorers: null },
  ];

  const prefixes = shuffled(rng, CLUB_PREFIX);
  const usedNames = new Set(takenNames);

  for (let i = 1; i < clubCount; i += 1) {
    const name = `${prefixes[(i - 1) % prefixes.length]}${pick(rng, CLUB_SUFFIX)}`;
    const quality = rng();
    const scorerName = () => {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const candidate = rng() < 0.25
          ? pick(rng, FOREIGN_NAMES)
          : `${pick(rng, SURNAMES)} ${pick(rng, GIVEN_NAMES)}`;

        if (!usedNames.has(candidate)) {
          usedNames.add(candidate);
          return candidate;
        }
      }

      return `${pick(rng, SURNAMES)} ${pick(rng, GIVEN_NAMES)}`;
    };

    clubs.push({
      name,
      mine: false,
      quality,
      attack: clamp(AI_SCALE.attackBase + quality * AI_SCALE.attackRange + range(rng, -2.5, 2.5), 40, 99),
      defense: clamp(AI_SCALE.defenseBase + quality * AI_SCALE.defenseRange + range(rng, -2.5, 2.5), 40, 99),
      scorers: SCORER_SHARES.map((share) => ({ name: scorerName(), club: name, goals: 0, share })),
    });
  }

  return clubs;
}

function emptyRow(index) {
  return { club: index, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
}

function expectedGoals(attack, opponentDefense, homeAdvantage) {
  const ratio = attack / Math.max(opponentDefense, 20);
  return clamp(1.45 * Math.pow(ratio, 1.9) * homeAdvantage, 0.12, 4.8);
}

export class Season {
  constructor(rng, squad, formationKey, lineup, captainId, clubName) {
    this.rng = rng;
    this.squad = squad;
    this.formationKey = formationKey;
    this.lineup = lineup;
    this.captainId = captainId;
    this.clubs = buildClubs(rng, TEAM_CONFIG.season.clubs, clubName, squad.map((player) => player.name));
    this.fixtures = buildFixtures(rng, TEAM_CONFIG.season.clubs, TEAM_CONFIG.season.matches);
    this.table = this.clubs.map((_, index) => emptyRow(index));
    this.matchday = 0;
    this.log = [];
    this.events = [];
  }

  get finished() {
    return this.matchday >= this.fixtures.length;
  }

  aiRatings(club) {
    const noise = () => range(this.rng, -4, 4);
    return {
      attack: clamp(club.attack + noise(), 40, 99),
      defense: clamp(club.defense + noise(), 40, 99),
    };
  }

  myRatings() {
    const summary = squadSummary(this.squad, this.formationKey, this.lineup, this.captainId);
    const controlShift = 1 + (summary.ratings.control - 70) / 600;

    return {
      attack: clamp(summary.ratings.attack * controlShift, 30, 99),
      defense: clamp(summary.ratings.defense * controlShift, 30, 99),
      resolved: summary.resolved,
      power: summary.power,
    };
  }

  playMatchday() {
    if (this.finished) {
      return null;
    }

    const pairs = this.fixtures[this.matchday];
    const round = this.matchday + 1;
    let myReport = null;

    pairs.forEach(([homeIndex, awayIndex]) => {
      const homeClub = this.clubs[homeIndex];
      const awayClub = this.clubs[awayIndex];
      const mine = homeClub.mine || awayClub.mine;

      let homeRating;
      let awayRating;
      let myResolved = null;

      if (homeClub.mine) {
        const mineRatings = this.myRatings();
        myResolved = mineRatings.resolved;
        homeRating = mineRatings;
        awayRating = this.aiRatings(awayClub);
      } else if (awayClub.mine) {
        const mineRatings = this.myRatings();
        myResolved = mineRatings.resolved;
        awayRating = mineRatings;
        homeRating = this.aiRatings(homeClub);
      } else {
        homeRating = this.aiRatings(homeClub);
        awayRating = this.aiRatings(awayClub);
      }

      const homeGoals = poisson(this.rng, expectedGoals(homeRating.attack, awayRating.defense, 1.13));
      const awayGoals = poisson(this.rng, expectedGoals(awayRating.attack, homeRating.defense, 0.93));

      this.applyResult(homeIndex, awayIndex, homeGoals, awayGoals);

      if (!mine) {
        this.creditScorers(homeClub, homeGoals);
        this.creditScorers(awayClub, awayGoals);
        return;
      }

      const home = homeClub.mine;
      const scored = home ? homeGoals : awayGoals;
      const conceded = home ? awayGoals : homeGoals;
      const opponent = home ? awayClub : homeClub;
      const scorers = this.applyPlayerOutcome(myResolved, scored, conceded);

      myReport = {
        round,
        opponent: opponent.name,
        home,
        scored,
        conceded,
        result: scored > conceded ? 'W' : scored === conceded ? 'D' : 'L',
        scorers,
      };

      this.log.push(myReport);
    });

    this.matchday += 1;
    return myReport;
  }

  creditScorers(club, goals) {
    if (!club.scorers || goals <= 0) {
      return;
    }

    for (let i = 0; i < goals; i += 1) {
      let roll = this.rng();

      for (const scorer of club.scorers) {
        if (roll < scorer.share) {
          scorer.goals += 1;
          break;
        }

        roll -= scorer.share;
      }
    }
  }

  applyResult(homeIndex, awayIndex, homeGoals, awayGoals) {
    const home = this.table[homeIndex];
    const away = this.table[awayIndex];

    home.played += 1;
    away.played += 1;
    home.gf += homeGoals;
    home.ga += awayGoals;
    away.gf += awayGoals;
    away.ga += homeGoals;

    if (homeGoals > awayGoals) {
      home.won += 1;
      away.lost += 1;
      home.points += TEAM_CONFIG.season.winPoints;
    } else if (homeGoals < awayGoals) {
      away.won += 1;
      home.lost += 1;
      away.points += TEAM_CONFIG.season.winPoints;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += TEAM_CONFIG.season.drawPoints;
      away.points += TEAM_CONFIG.season.drawPoints;
    }
  }

  applyPlayerOutcome(resolved, scored, conceded) {
    const starters = new Set(resolved.map(({ player }) => player.id));
    const scorers = [];

    resolved.forEach(({ slotPosition, player }) => {
      player.apps += 1;
      player.fatigue = Math.min(100, player.fatigue + TEAM_CONFIG.fatigue.perMatch + intRange(this.rng, -5, 6));

      if (conceded === 0 && (slotPosition === 'GK' || slotPosition === 'DF')) {
        player.cleanSheets += 1;
      }
    });

    for (let i = 0; i < scored; i += 1) {
      const scorer = this.weightedPlayer(resolved, 'goal');

      if (scorer) {
        scorer.goals += 1;
        scorers.push(scorer.name);
      }

      if (this.rng() < 0.62) {
        const assister = this.weightedPlayer(resolved, 'assist', scorer?.id);
        if (assister) {
          assister.assists += 1;
        }
      }
    }

    this.squad.forEach((player) => {
      if (!starters.has(player.id)) {
        player.fatigue = Math.max(0, player.fatigue - TEAM_CONFIG.fatigue.benchRecovery);
      } else {
        player.fatigue = Math.max(0, player.fatigue - TEAM_CONFIG.fatigue.recovery);
      }

      if (player.injuredFor > 0) {
        player.injuredFor -= 1;
        return;
      }

      if (starters.has(player.id) && this.rng() < TEAM_CONFIG.injury.chancePerMatch) {
        player.injuredFor = intRange(this.rng, TEAM_CONFIG.injury.minMatches, TEAM_CONFIG.injury.maxMatches);
        this.events.push({ round: this.matchday + 1, type: 'injury', name: player.name, value: player.injuredFor });
        return;
      }

      this.driftForm(player);
    });

    return scorers;
  }

  driftForm(player) {
    const form = TEAM_CONFIG.form;
    const next = (player.form ?? 1) + range(this.rng, -form.drift, form.drift);
    player.form = clamp(next, form.min, form.max);

    if (this.rng() < form.breakoutChance && player.growth < (player.potential - player.ovr)) {
      const gain = intRange(this.rng, 2, 5);
      player.growth += gain;
      this.events.push({ round: this.matchday + 1, type: 'breakout', name: player.name, value: gain });
      return;
    }

    if (this.rng() < form.slumpChance && player.growth > -12) {
      const loss = Math.min(intRange(this.rng, 2, 5), player.growth + 12);
      player.growth -= loss;
      this.events.push({ round: this.matchday + 1, type: 'slump', name: player.name, value: loss });
    }
  }

  weightedPlayer(resolved, kind, excludeId) {
    const entries = [];

    resolved.forEach(({ slotPosition, player }) => {
      if (player.id === excludeId) {
        return;
      }

      const stats = (kind === 'goal' ? player.stats.att : player.stats.tec) + (player.growth ?? 0);
      const positionWeight = kind === 'goal'
        ? { FW: 5, MF: 1.2, DF: 0.35, GK: 0.01 }[slotPosition]
        : { FW: 1.4, MF: 2.4, DF: 0.7, GK: 0.02 }[slotPosition];
      const quality = Math.pow(Math.max(stats, 20) / 60, 2.6);

      entries.push({ player, weight: Math.max(0.01, quality * positionWeight) });
    });

    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = this.rng() * total;

    for (const entry of entries) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry.player;
      }
    }

    return entries.length ? entries[entries.length - 1].player : null;
  }

  sortedTable() {
    return this.table
      .slice()
      .sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
      .map((row, index) => ({ ...row, rank: index + 1, name: this.clubs[row.club].name, mine: this.clubs[row.club].mine }));
  }

  myRow() {
    return this.sortedTable().find((row) => row.mine);
  }

  topScorers(limit = 10) {
    const mine = this.squad
      .filter((player) => player.goals > 0)
      .map((player) => ({ name: player.name, club: this.clubs[0].name, goals: player.goals, mine: true }));

    const others = this.clubs
      .flatMap((club) => club.scorers ?? [])
      .filter((scorer) => scorer.goals > 0)
      .map((scorer) => ({ name: scorer.name, club: scorer.club, goals: scorer.goals, mine: false }));

    return mine.concat(others).sort((a, b) => b.goals - a.goals).slice(0, limit);
  }

  availableCount() {
    return this.squad.filter(availableFor).length;
  }
}
