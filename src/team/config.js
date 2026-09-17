export const TEAM_CONFIG = {
  draft: {
    fieldTarget: 16,
    fieldPassLimit: 9,
    keeperTarget: 2,
    keeperPassLimit: 3,
  },
  squad: {
    size: 18,
    starters: 11,
  },
  season: {
    clubs: 20,
    matches: 38,
    winPoints: 3,
    drawPoints: 1,
  },
  form: {
    min: 0.78,
    max: 1.22,
    drift: 0.09,
    breakoutChance: 0.04,
    slumpChance: 0.03,
  },
  fatigue: {
    perMatch: 26,
    recovery: 15,
    benchRecovery: 34,
  },
  injury: {
    chancePerMatch: 0.012,
    minMatches: 2,
    maxMatches: 7,
  },
  penalty: {
    adjacent: 7,
    distant: 16,
    keeperOutfield: 30,
  },
};

export const FORMATIONS = {
  '4-4-2': {
    label: '4-4-2',
    note: 'バランス型。どの相手にも大きくは崩れない',
    slots: ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
    bias: { attack: 1.02, defense: 1.03, control: 0.98 },
    traits: { width: 0.8, line: 0.5, directness: 0.6 },
    style: '相性の振れ幅がいちばん小さい。迷ったらこれ',
  },
  '4-3-3': {
    label: '4-3-3',
    note: '攻撃型。3バックの相手に強い',
    slots: ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'],
    bias: { attack: 1.06, defense: 0.96, control: 0.99 },
    traits: { width: 0.95, line: 0.85, directness: 0.3 },
    style: '高い位置から3トップで押し込む。縦に速い相手に背後を突かれる',
  },
  '3-5-2': {
    label: '3-5-2',
    note: '中盤支配型。低く構える相手に強い',
    slots: ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
    bias: { attack: 1.03, defense: 1.0, control: 1.06 },
    traits: { width: 0.55, line: 0.55, directness: 0.45 },
    style: '中央を5枚で制圧する。3バックなので3トップに剥がされる',
  },
  '4-2-3-1': {
    label: '4-2-3-1',
    note: '堅守速攻型。ラインの高い相手に強い',
    slots: ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW'],
    bias: { attack: 0.96, defense: 1.06, control: 1.02 },
    traits: { width: 0.45, line: 0.25, directness: 0.9 },
    style: '低く構えて縦に速く。押し込まれるので主導権は渡す',
  },
};

// フォーメーション相性の係数。
// それぞれ「自分の形」対「相手の形」の差から求め、
// ミラーマッチ（同じ形どうし）が 1.0 になるように正規化して使う。
export const MATCHUP = {
  midControl: 0.14,   // 中盤の枚数差 → 主導権
  midAttack: 0.065,   // 中盤の枚数差 → 攻撃
  width: 0.51,        // サイドの幅の差 → 攻撃
  backline: 0.13,     // 自分のFW枚数 × (自分のDF枚数 - 相手のDF枚数) → 攻撃
  space: 0.69,        // 自分の縦の速さ × (相手のラインの高さ - 自分のライン) → 背後のスペース
  territory: 0.64,    // ラインの高さの差 → 陣地と主導権（背後のスペースの裏返し）
  controlEdgeAttack: 0.6,   // 主導権の差 → 攻撃
  controlEdgeDefense: 0.45, // 主導権の差 → 守備
  scoreAttack: 0.42,  // 相性スコアの表示に使う攻撃の重み
  scoreDefense: 0.58, // 同じく守備の重み（失点のほうが勝点に効くので少し重い）
  attackClamp: [0.72, 1.32],
  controlClamp: [0.7, 1.38],
};

export const POSITION_ORDER = ['GK', 'DF', 'MF', 'FW'];

export const POSITION_LABEL = {
  GK: 'GK',
  DF: 'DF',
  MF: 'MF',
  FW: 'FW',
};
