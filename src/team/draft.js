import { TEAM_CONFIG } from './config.js';
import { buildPool, toSquadMember } from './players.js';

function shuffle(rng, list) {
  const out = list.slice();

  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }

  return out;
}

export class Draft {
  constructor(rng) {
    const draft = TEAM_CONFIG.draft;
    const fieldQueueSize = draft.fieldTarget + draft.fieldPassLimit;
    const keeperQueueSize = draft.keeperTarget + draft.keeperPassLimit;
    const pool = buildPool(rng, fieldQueueSize + 10, keeperQueueSize + 4);

    this.fieldQueue = shuffle(rng, pool.field).slice(0, fieldQueueSize);
    this.keeperQueue = shuffle(rng, pool.keepers).slice(0, keeperQueueSize);
    this.index = 0;
    this.stage = 'field';
    this.passesUsed = 0;
    this.taken = [];
    this.passed = [];
  }

  get queue() {
    return this.stage === 'field' ? this.fieldQueue : this.keeperQueue;
  }

  get target() {
    return this.stage === 'field' ? TEAM_CONFIG.draft.fieldTarget : TEAM_CONFIG.draft.keeperTarget;
  }

  get passLimit() {
    return this.stage === 'field' ? TEAM_CONFIG.draft.fieldPassLimit : TEAM_CONFIG.draft.keeperPassLimit;
  }

  get stageTaken() {
    const wanted = this.stage === 'field' ? 'field' : 'keeper';
    return this.taken.filter((player) => (player.position === 'GK' ? 'keeper' : 'field') === wanted).length;
  }

  get passesLeft() {
    return this.passLimit - this.passesUsed;
  }

  get current() {
    return this.queue[this.index] ?? null;
  }

  get remainingInQueue() {
    return this.queue.length - this.index;
  }

  get mustTake() {
    return this.passesLeft <= 0;
  }

  get done() {
    return this.stage === 'done';
  }

  take() {
    const player = this.current;

    if (!player) {
      return null;
    }

    this.taken.push(toSquadMember(player));
    this.index += 1;
    this.advanceStage();
    return player;
  }

  skip() {
    const player = this.current;

    if (!player || this.mustTake) {
      return null;
    }

    this.passed.push(player);
    this.passesUsed += 1;
    this.index += 1;
    this.advanceStage();
    return player;
  }

  advanceStage() {
    if (this.stage === 'field' && this.stageTaken >= TEAM_CONFIG.draft.fieldTarget) {
      this.stage = 'keeper';
      this.index = 0;
      this.passesUsed = 0;
      return;
    }

    if (this.stage === 'keeper' && this.stageTaken >= TEAM_CONFIG.draft.keeperTarget) {
      this.stage = 'done';
    }
  }
}
