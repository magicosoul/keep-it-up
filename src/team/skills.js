import { weighted } from './rng.js';

/**
 * 特殊能力。すべて試合エンジンに実際に効く。
 *
 * tone  gold=金特(強力) / blue=青特 / red=赤特(マイナス)
 * pos   つく可能性のあるポジション
 * rate  出やすさ
 *
 * effect で使える項目:
 *   ratings        スタメンのときチーム力に直接加算 { attack, control, defense }
 *   goalWeight     得点者に選ばれる重みの倍率
 *   assistWeight   アシスト者に選ばれる重みの倍率
 *   fatigueMul     疲労の溜まりやすさ
 *   injuryMul      ケガのしやすさ
 *   formSwingMul   好不調の振れ幅
 *   growthMul      ブレイクの起こりやすさ
 *   setPiece       1試合あたり追加点が入る確率
 *   setPieceGuard  相手の追加点を消す確率
 *   pkStop         1試合あたり失点を1点防ぐ確率
 *   bigMatch       格上が相手のときの攻守の倍率への加算
 *   lateSeason     後半戦での攻守の倍率への加算
 *   earlySeason    前半戦での攻守の倍率への加算
 *   convertRelief  本職外で使ったときの減点を減らす割合
 */
export const SKILLS = {
  finisher: {
    name: '決定力', tone: 'gold', pos: ['FW', 'MF'], rate: 5,
    desc: '決めきる。得点者になりやすい',
    effect: { goalWeight: 1.9 },
  },
  header: {
    name: 'ヘディング', tone: 'blue', pos: ['FW', 'DF', 'MF'], rate: 10,
    desc: 'セットプレーから点が生まれる',
    effect: { setPiece: 0.05, goalWeight: 1.15 },
  },
  longShot: {
    name: 'ミドルシュート', tone: 'blue', pos: ['FW', 'MF'], rate: 10,
    desc: '引かれた相手をこじ開ける',
    effect: { ratings: { attack: 2.2 }, goalWeight: 1.2 },
  },
  spark: {
    name: '一発', tone: 'blue', pos: ['FW', 'MF'], rate: 9,
    desc: 'ムラはあるが試合を決める',
    effect: { goalWeight: 1.45, formSwingMul: 1.35 },
  },
  breakthrough: {
    name: '突破', tone: 'blue', pos: ['FW', 'MF'], rate: 11,
    desc: '一人で運べる',
    effect: { ratings: { attack: 2.6 } },
  },
  speedster: {
    name: '快速', tone: 'gold', pos: ['FW', 'MF', 'DF'], rate: 4,
    desc: '誰にも追いつかれない',
    effect: { ratings: { attack: 3, defense: 1.5 } },
  },
  playmaker: {
    name: '司令塔', tone: 'gold', pos: ['MF'], rate: 5,
    desc: '中盤の主導権をひとりで動かす',
    effect: { ratings: { control: 4.5 }, assistWeight: 1.5 },
  },
  killerPass: {
    name: 'キラーパス', tone: 'blue', pos: ['MF', 'FW'], rate: 10,
    desc: '最後の一本が通る',
    effect: { assistWeight: 2.3 },
  },
  setPlay: {
    name: 'セットプレー', tone: 'blue', pos: ['MF', 'DF', 'FW'], rate: 9,
    desc: 'FKとCKが武器になる',
    effect: { setPiece: 0.07, assistWeight: 1.3 },
  },
  cross: {
    name: 'クロス', tone: 'blue', pos: ['MF', 'DF'], rate: 10,
    desc: '外から質の高いボールが入る',
    effect: { assistWeight: 1.7, ratings: { attack: 1.2 } },
  },
  marker: {
    name: '対人守備', tone: 'blue', pos: ['DF', 'MF'], rate: 12,
    desc: '一対一で剥がされない',
    effect: { ratings: { defense: 3.2 } },
  },
  intercept: {
    name: 'インターセプト', tone: 'blue', pos: ['DF', 'MF'], rate: 10,
    desc: '読んで引っ掛ける',
    effect: { ratings: { defense: 1.6, control: 2.6 } },
  },
  aerial: {
    name: '空中戦', tone: 'blue', pos: ['DF', 'GK'], rate: 10,
    desc: 'セットプレーで跳ね返す',
    effect: { ratings: { defense: 1.8 }, setPieceGuard: 0.06 },
  },
  covering: {
    name: 'カバーリング', tone: 'blue', pos: ['DF', 'MF'], rate: 9,
    desc: '穴を埋める。慣れないポジションでも崩れにくい',
    effect: { ratings: { defense: 1.5 }, convertRelief: 0.45 },
  },
  lastManStanding: {
    name: '守護神', tone: 'gold', pos: ['GK'], rate: 5,
    desc: '止まらないはずのシュートを止める',
    effect: { ratings: { defense: 5.5 } },
  },
  pkStopper: {
    name: 'PKストッパー', tone: 'blue', pos: ['GK'], rate: 9,
    desc: 'PKを読む',
    effect: { pkStop: 0.08 },
  },
  sweeperKeeper: {
    name: '飛び出し', tone: 'blue', pos: ['GK'], rate: 9,
    desc: '高いラインの背後を潰す',
    effect: { ratings: { defense: 2.6 } },
  },
  ironMan: {
    name: '鉄人', tone: 'gold', pos: ['GK', 'DF', 'MF', 'FW'], rate: 5,
    desc: '走り続けても落ちない',
    effect: { fatigueMul: 0.55, injuryMul: 0.6 },
  },
  durable: {
    name: 'ケガしにくい', tone: 'blue', pos: ['GK', 'DF', 'MF', 'FW'], rate: 11,
    desc: '離脱しにくい',
    effect: { injuryMul: 0.35 },
  },
  clutch: {
    name: '勝負強い', tone: 'gold', pos: ['GK', 'DF', 'MF', 'FW'], rate: 5,
    desc: '格上ほど力を出す',
    effect: { bigMatch: 0.055 },
  },
  lateBloomer: {
    name: '尻上がり', tone: 'blue', pos: ['GK', 'DF', 'MF', 'FW'], rate: 9,
    desc: '後半戦に強い',
    effect: { lateSeason: 0.045 },
  },
  lateGrowth: {
    name: '大器晩成', tone: 'blue', pos: ['GK', 'DF', 'MF', 'FW'], rate: 8,
    desc: 'シーズン中に伸びやすい',
    effect: { growthMul: 2.4 },
  },
  captaincy: {
    name: 'キャプテンシー', tone: 'gold', pos: ['GK', 'DF', 'MF'], rate: 5,
    desc: 'チーム全体を引き締める',
    effect: { ratings: { control: 2, defense: 1.5 } },
  },
  fragile: {
    name: 'ケガしやすい', tone: 'red', pos: ['GK', 'DF', 'MF', 'FW'], rate: 12,
    desc: 'すぐ離脱する',
    effect: { injuryMul: 3.4 },
  },
  moody: {
    name: 'ムラっ気', tone: 'red', pos: ['GK', 'DF', 'MF', 'FW'], rate: 12,
    desc: '好不調の波が激しい。悪い日のほうが深い',
    effect: { formSwingMul: 2.2 },
  },
  gassed: {
    name: '疲れやすい', tone: 'red', pos: ['GK', 'DF', 'MF', 'FW'], rate: 11,
    desc: '連戦が効く',
    effect: { fatigueMul: 1.75 },
  },
  wasteful: {
    name: '淡泊', tone: 'red', pos: ['FW', 'MF'], rate: 10,
    desc: '決めきれない。チームの得点力ごと落とす',
    effect: { goalWeight: 0.5, ratings: { attack: -2.8 } },
  },
  careless: {
    name: '軽率', tone: 'red', pos: ['DF', 'MF', 'GK'], rate: 10,
    desc: 'やらかす',
    effect: { ratings: { defense: -3.2 } },
  },
  slowStarter: {
    name: '出遅れ', tone: 'red', pos: ['GK', 'DF', 'MF', 'FW'], rate: 9,
    desc: '前半戦が上がらない',
    effect: { earlySeason: -0.06 },
  },
};

export const SKILL_KEYS = Object.keys(SKILLS);

function candidates(position, tone) {
  return SKILL_KEYS
    .filter((key) => SKILLS[key].tone === tone && SKILLS[key].pos.includes(position))
    .map((key) => ({ value: key, weight: SKILLS[key].rate }));
}

/**
 * 能力値が高いほど金特・青特がつきやすく、低いほど赤特がつきやすい。
 * 若い選手は赤特が出やすい代わりに、伸びしろで取り返せる。
 */
export function rollSkills(rng, position, ovr, age) {
  const chosen = [];
  const take = (tone) => {
    const pool = candidates(position, tone).filter((entry) => !chosen.includes(entry.value));

    if (!pool.length) {
      return;
    }

    chosen.push(weighted(rng, pool));
  };

  const goldChance = Math.max(0, (ovr - 74) / 46);
  const blueCount = ovr >= 84 ? 2 : ovr >= 74 ? 1 : 0;
  const redChance = Math.max(0, (76 - ovr) / 70) + (age <= 20 ? 0.12 : 0);

  if (rng() < goldChance) {
    take('gold');
  }

  for (let i = 0; i < blueCount; i += 1) {
    if (rng() < 0.78) {
      take('blue');
    }
  }

  if (rng() < 0.55) {
    take('blue');
  }

  if (rng() < redChance) {
    take('red');
  }

  if (rng() < redChance * 0.35) {
    take('red');
  }

  return chosen;
}

const EMPTY = {
  ratings: { attack: 0, control: 0, defense: 0 },
  goalWeight: 1,
  assistWeight: 1,
  fatigueMul: 1,
  injuryMul: 1,
  formSwingMul: 1,
  growthMul: 1,
  setPiece: 0,
  setPieceGuard: 0,
  pkStop: 0,
  bigMatch: 0,
  lateSeason: 0,
  earlySeason: 0,
  convertRelief: 0,
};

/** ひとりの選手が持つ特殊能力をまとめる。 */
export function playerEffects(player) {
  const out = {
    ...EMPTY,
    ratings: { ...EMPTY.ratings },
  };

  (player.skills ?? []).forEach((key) => {
    const effect = SKILLS[key]?.effect;

    if (!effect) {
      return;
    }

    if (effect.ratings) {
      out.ratings.attack += effect.ratings.attack ?? 0;
      out.ratings.control += effect.ratings.control ?? 0;
      out.ratings.defense += effect.ratings.defense ?? 0;
    }

    ['goalWeight', 'assistWeight', 'fatigueMul', 'injuryMul', 'formSwingMul', 'growthMul'].forEach((key2) => {
      if (effect[key2] !== undefined) {
        out[key2] *= effect[key2];
      }
    });

    ['setPiece', 'setPieceGuard', 'pkStop', 'bigMatch', 'lateSeason', 'earlySeason'].forEach((key2) => {
      if (effect[key2] !== undefined) {
        out[key2] += effect[key2];
      }
    });

    if (effect.convertRelief !== undefined) {
      out.convertRelief = Math.max(out.convertRelief, effect.convertRelief);
    }
  });

  return out;
}

/** スタメン11人ぶんをまとめて、試合単位で効く値にする。 */
export function lineupEffects(resolved) {
  const out = { setPiece: 0, setPieceGuard: 0, pkStop: 0, bigMatch: 0, lateSeason: 0, earlySeason: 0 };

  resolved.forEach(({ player }) => {
    const effects = playerEffects(player);
    out.setPiece += effects.setPiece;
    out.setPieceGuard += effects.setPieceGuard;
    out.pkStop += effects.pkStop;
    out.bigMatch += effects.bigMatch;
    out.lateSeason += effects.lateSeason;
    out.earlySeason += effects.earlySeason;
  });

  return out;
}

/** 特殊能力を能力値に換算した目安。配置の自動決定に使う。 */
export function skillValue(player) {
  const effects = playerEffects(player);

  return (
    effects.ratings.attack * 0.5
    + effects.ratings.control * 0.45
    + effects.ratings.defense * 0.55
    + (effects.goalWeight - 1) * 3
    + (effects.assistWeight - 1) * 1.5
    + (1 - effects.injuryMul) * 2.2
    + (1 - effects.fatigueMul) * 4
    + (1 - effects.formSwingMul) * 2.5
    + (effects.growthMul - 1) * 1.2
    + effects.setPiece * 40
    + effects.setPieceGuard * 30
    + effects.pkStop * 35
    + effects.bigMatch * 60
    + effects.lateSeason * 45
    + effects.earlySeason * 45
  );
}
