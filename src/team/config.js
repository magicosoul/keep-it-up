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
    note: 'バランス型。守備が安定しやすい',
    slots: ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
    bias: { attack: 1.0, defense: 1.04, control: 1.0 },
  },
  '4-3-3': {
    label: '4-3-3',
    note: '攻撃型。前線の質がそのまま得点に出る',
    slots: ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'],
    bias: { attack: 1.09, defense: 0.96, control: 0.98 },
  },
  '3-5-2': {
    label: '3-5-2',
    note: '中盤支配型。主導権を握るが背後が薄い',
    slots: ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
    bias: { attack: 1.02, defense: 0.93, control: 1.1 },
  },
  '4-2-3-1': {
    label: '4-2-3-1',
    note: '堅守速攻型。1トップの決定力頼み',
    slots: ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW'],
    bias: { attack: 0.97, defense: 1.07, control: 1.04 },
  },
};

export const POSITION_ORDER = ['GK', 'DF', 'MF', 'FW'];

export const POSITION_LABEL = {
  GK: 'GK',
  DF: 'DF',
  MF: 'MF',
  FW: 'FW',
};
