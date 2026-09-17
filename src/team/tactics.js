import { FORMATIONS, MATCHUP } from './config.js';

function clamp(value, [min, max]) {
  return Math.max(min, Math.min(max, value));
}

const COUNTS = Object.fromEntries(Object.entries(FORMATIONS).map(([key, formation]) => {
  const count = (position) => formation.slots.filter((slot) => slot === position).length;

  return [key, { mid: count('MF'), defenders: count('DF'), forwards: count('FW') }];
}));

export function shapeOf(key) {
  return { key, ...COUNTS[key], ...FORMATIONS[key].traits };
}

/**
 * 相性はすべて「ミラーマッチとの差」で表す。
 * 同じフォーメーションどうしなら必ず 1.0 になるので、
 * フォーメーション固有の強さ (FORMATIONS[key].bias) と二重計上にならない。
 */
export function matchupTerms(myKey, oppKey) {
  const me = shapeOf(myKey);
  const opp = shapeOf(oppKey);

  return [
    {
      key: 'mid',
      label: '中盤の枚数',
      detail: `${me.mid}枚 対 ${opp.mid}枚`,
      attack: MATCHUP.midAttack * (me.mid - opp.mid),
      control: MATCHUP.midControl * (me.mid - opp.mid),
    },
    {
      key: 'width',
      label: 'サイドの幅',
      detail: me.width > opp.width ? '外を使える' : me.width < opp.width ? '外で後手を踏む' : '互角',
      attack: MATCHUP.width * (me.width - opp.width),
      control: 0,
    },
    {
      key: 'backline',
      label: '相手最終ライン',
      detail: `${me.forwards}トップ 対 ${opp.defenders}バック`,
      attack: MATCHUP.backline * (me.forwards / 2) * (me.defenders - opp.defenders),
      control: 0,
    },
    {
      key: 'territory',
      label: '陣地の押し上げ',
      detail: me.line > opp.line ? '高い位置で押し込める' : me.line < opp.line ? '押し込まれる' : '互角',
      attack: 0,
      control: MATCHUP.territory * (me.line - opp.line),
    },
    {
      key: 'space',
      label: '背後のスペース',
      detail: opp.line > me.line ? '相手のラインが高い' : opp.line < me.line ? '相手が低く構える' : '互角',
      attack: MATCHUP.space * me.directness * (opp.line - me.line),
      control: 0,
    },
  ];
}

export function matchupModifiers(myKey, oppKey) {
  const terms = matchupTerms(myKey, oppKey);
  const attack = terms.reduce((sum, term) => sum + term.attack, 1);
  const control = terms.reduce((sum, term) => sum + term.control, 1);

  return {
    attack: clamp(attack, MATCHUP.attackClamp),
    control: clamp(control, MATCHUP.controlClamp),
    terms,
  };
}

/**
 * 中盤の主導権は絶対値ではなく相手との取り合いで決まる。
 * 0 が互角、正なら主導権を握っている。
 */
export function expectedGoals(attack, opponentDefense, homeAdvantage) {
  const ratio = attack / Math.max(opponentDefense, 20);
  return Math.max(0.12, Math.min(4.8, 1.45 * Math.pow(ratio, 1.9) * homeAdvantage));
}

function poissonPmf(mean, upTo = 9) {
  const out = [];
  let term = Math.exp(-mean);

  for (let k = 0; k <= upTo; k += 1) {
    out.push(term);
    term = (term * mean) / (k + 1);
  }

  return out;
}

/** 2つの期待得点から勝点の期待値を出す。勝ち3・分け1。 */
export function expectedPoints(goalsFor, goalsAgainst) {
  const forPmf = poissonPmf(goalsFor);
  const againstPmf = poissonPmf(goalsAgainst);
  let win = 0;
  let draw = 0;

  for (let i = 0; i < forPmf.length; i += 1) {
    for (let j = 0; j < againstPmf.length; j += 1) {
      const p = forPmf[i] * againstPmf[j];

      if (i > j) {
        win += p;
      } else if (i === j) {
        draw += p;
      }
    }
  }

  return win * 3 + draw;
}

export function controlEdge(myControl, oppControl) {
  const total = myControl + oppControl;

  if (total <= 0) {
    return 0;
  }

  return (myControl / total - 0.5) * 2;
}

export function applyControlEdge(ratings, edge) {
  return {
    attack: ratings.attack * (1 + edge * MATCHUP.controlEdgeAttack),
    defense: ratings.defense * (1 + edge * MATCHUP.controlEdgeDefense),
  };
}

/**
 * 画面表示用。ある相手に対して、その形がどれくらい向いているかを
 * 「4つの形の平均と比べて何ポイント良いか」で表す。
 * 平均との比較なので、列（相手）ごとに一番高い形がそのまま最適解になる。
 */
function rawOutlook(myKey, oppKey) {
  const mods = matchupModifiers(myKey, oppKey);
  const oppMods = matchupModifiers(oppKey, myKey);
  const myBias = FORMATIONS[myKey].bias;
  const oppBias = FORMATIONS[oppKey].bias;
  const edge = controlEdge(
    75 * myBias.control * mods.control,
    75 * oppBias.control * oppMods.control,
  );

  return {
    attack: myBias.attack * mods.attack * (1 + edge * MATCHUP.controlEdgeAttack),
    defense: myBias.defense * (1 + edge * MATCHUP.controlEdgeDefense),
    control: edge,
    terms: mods.terms,
  };
}

/** その形を選んだときの期待勝点。エンジンと同じ期待得点の式を使う。 */
function outlookPoints(myKey, oppKey) {
  const mine = rawOutlook(myKey, oppKey);
  const theirs = rawOutlook(oppKey, myKey);
  const base = 75;

  return expectedPoints(
    expectedGoals(base * mine.attack, base * theirs.defense, 1),
    expectedGoals(base * theirs.attack, base * mine.defense, 1),
  );
}

export function matchupPreview(myKey, oppKey) {
  const mine = rawOutlook(myKey, oppKey);
  const keys = Object.keys(FORMATIONS);
  const mean = keys.reduce((sum, key) => sum + outlookPoints(key, oppKey), 0) / keys.length;

  return {
    attackPercent: Math.round((mine.attack - 1) * 100),
    defensePercent: Math.round((mine.defense - 1) * 100),
    controlPercent: Math.round(mine.control * 100),
    score: Math.round((outlookPoints(myKey, oppKey) - mean) * 100),
    terms: mine.terms,
  };
}

export function matchupLabel(score) {
  if (score >= 8) return { text: '有利', tone: 'good' };
  if (score >= 3) return { text: 'やや有利', tone: 'ok' };
  if (score > -3) return { text: '互角', tone: 'even' };
  if (score > -8) return { text: 'やや不利', tone: 'warn' };
  return { text: '不利', tone: 'bad' };
}

export function bestCounter(oppKey) {
  return Object.keys(FORMATIONS)
    .map((key) => ({ key, score: matchupPreview(key, oppKey).score }))
    .sort((a, b) => b.score - a.score)[0];
}
