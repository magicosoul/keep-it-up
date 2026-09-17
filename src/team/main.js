import '../../styles/team.css';
import { TEAM_CONFIG } from './config.js';
import { createRng, seedFromText, randomSeedText } from './rng.js';
import { Draft } from './draft.js';
import { Season } from './season.js';
import { autoAssign } from './squad.js';
import { showTitle } from './screens/title.js';
import { showDraft } from './screens/draft.js';
import { showSquad } from './screens/squad.js';
import { showSeason } from './screens/season.js';
import { showResult } from './screens/result.js';

const state = {
  screen: 'title',
  clubName: 'マイクラブ',
  seedText: randomSeedText(),
  rng: null,
  draft: null,
  squad: [],
  formationKey: '4-4-2',
  lineup: [],
  captainId: null,
  season: null,
};

const ctx = { state, actions: {} };

const SCREENS = {
  title: showTitle,
  draft: showDraft,
  squad: showSquad,
  season: showSeason,
  result: showResult,
};

function draw() {
  SCREENS[state.screen](ctx);
}

function goto(screen) {
  state.screen = screen;
  draw();
}

function finishDraft() {
  state.squad = state.draft.taken;
  state.lineup = autoAssign(state.squad, state.formationKey);
  state.captainId = state.squad.slice().sort((a, b) => b.ovr - a.ovr)[0]?.id ?? null;
  goto('squad');
}

ctx.actions = {
  rerollSeed() {
    state.seedText = randomSeedText();
    draw();
  },

  startDraft(clubName, seedText) {
    state.clubName = clubName;
    state.seedText = seedText;
    state.rng = createRng(seedFromText(seedText));
    state.draft = new Draft(state.rng);
    goto('draft');
  },

  draftTake() {
    state.draft.take();
    if (state.draft.done) {
      finishDraft();
      return;
    }
    draw();
  },

  draftSkip() {
    if (state.draft.mustTake) {
      return;
    }
    state.draft.skip();
    if (state.draft.done) {
      finishDraft();
      return;
    }
    draw();
  },

  setFormation(key) {
    state.formationKey = key;
    state.lineup = autoAssign(state.squad, key);
    draw();
  },

  setSlot(slotIndex, playerId) {
    const target = state.lineup.find((entry) => entry.slotIndex === slotIndex);

    if (!target) {
      return;
    }

    const other = state.lineup.find((entry) => entry.playerId === playerId && entry.slotIndex !== slotIndex);

    if (other) {
      other.playerId = target.playerId;
    }

    target.playerId = playerId;
    draw();
  },

  setCaptain(playerId) {
    state.captainId = playerId;
    draw();
  },

  autoAssign() {
    state.lineup = autoAssign(state.squad, state.formationKey);
    draw();
  },

  startSeason() {
    state.season = new Season(
      state.rng,
      state.squad,
      state.formationKey,
      state.lineup,
      state.captainId,
      state.clubName,
    );
    goto('season');
  },

  playMatches(count) {
    for (let i = 0; i < count && !state.season.finished; i += 1) {
      state.season.playMatchday();
    }

    if (state.season.finished && count >= TEAM_CONFIG.season.matches) {
      goto('result');
      return;
    }

    draw();
  },

  showResult() {
    goto('result');
  },

  backToSeason() {
    goto('season');
  },

  restart() {
    state.screen = 'title';
    state.draft = null;
    state.squad = [];
    state.lineup = [];
    state.season = null;
    state.captainId = null;
    state.seedText = randomSeedText();
    draw();
  },
};

window.addEventListener('keydown', (event) => {
  if (state.screen !== 'draft') {
    return;
  }

  if (event.code === 'Enter') {
    event.preventDefault();
    ctx.actions.draftTake();
  }

  if (event.code === 'Space') {
    event.preventDefault();
    ctx.actions.draftSkip();
  }
});

draw();
