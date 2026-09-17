import { FORMATIONS, POSITION_LABEL } from '../config.js';
import { render, on, escapeHtml, ovrClass, rosterRow, positionCounts } from '../ui.js';
import { squadSummary, effectiveOvr, countByPosition, mismatchPenalty } from '../squad.js';

function slotOptions(squad, selectedId, slotPosition) {
  return squad
    .slice()
    .sort((a, b) => effectiveOvr(b, slotPosition) - effectiveOvr(a, slotPosition))
    .map((player) => {
      const eff = effectiveOvr(player, slotPosition);
      const mark = player.position === slotPosition ? '' : '▲';
      return `<option value="${player.id}" ${player.id === selectedId ? 'selected' : ''}>${escapeHtml(player.name)} (${player.position}${mark} ${eff})</option>`;
    })
    .join('');
}

function slotCard(state, entry) {
  const player = state.squad.find((item) => item.id === entry.playerId);

  if (!player) {
    return '';
  }

  const eff = effectiveOvr(player, entry.slotPosition);
  const penalty = mismatchPenalty(player.position, entry.slotPosition);

  return `
    <div class="slot ${penalty > 0 ? 'is-mismatch' : ''}">
      <span class="slot-pos pos-${entry.slotPosition}">${POSITION_LABEL[entry.slotPosition]}</span>
      <select class="slot-select" data-slot="${entry.slotIndex}">
        ${slotOptions(state.squad, entry.playerId, entry.slotPosition)}
      </select>
      <span class="slot-ovr ${ovrClass(eff)}">${eff}</span>
      ${penalty > 0 ? `<span class="slot-warn">コンバート -${penalty}</span>` : ''}
    </div>
  `;
}

export function showSquad(ctx) {
  const state = ctx.state;
  const formation = FORMATIONS[state.formationKey];
  const summary = squadSummary(state.squad, state.formationKey, state.lineup, state.captainId);
  const lineup = state.lineup.slice().sort((a, b) => a.slotIndex - b.slotIndex);
  const startingIds = new Set(lineup.map((entry) => entry.playerId));
  const bench = state.squad.filter((player) => !startingIds.has(player.id));
  const lines = { FW: [], MF: [], DF: [], GK: [] };

  lineup.forEach((entry) => {
    lines[entry.slotPosition].push(entry);
  });

  render(`
    <section class="screen screen-squad">
      <header class="draft-head">
        <div>
          <p class="eyebrow">${escapeHtml(state.clubName)}</p>
          <h2>編成</h2>
        </div>
        <div class="draft-counters">
          <div class="counter"><span>チーム総合力</span><strong>${summary.power}</strong></div>
          <div class="counter"><span>攻撃</span><strong>${Math.round(summary.ratings.attack)}</strong></div>
          <div class="counter"><span>支配</span><strong>${Math.round(summary.ratings.control)}</strong></div>
          <div class="counter"><span>守備</span><strong>${Math.round(summary.ratings.defense)}</strong></div>
        </div>
      </header>

      <div class="formation-row">
        ${Object.keys(FORMATIONS).map((key) => `
          <button class="btn btn-chip ${key === state.formationKey ? 'is-active' : ''}" data-formation="${key}">${key}</button>
        `).join('')}
        <span class="note">${escapeHtml(formation.note)}</span>
      </div>

      <div class="squad-body">
        <div class="pitch">
          ${['FW', 'MF', 'DF', 'GK'].map((line) => `
            <div class="pitch-line">${lines[line].map((entry) => slotCard(state, entry)).join('')}</div>
          `).join('')}
        </div>

        <aside class="panel squad-side">
          <h3>控え <span class="count-row">${positionCounts(countByPosition(state.squad))}</span></h3>
          <ul class="roster">
            ${bench.map((player) => rosterRow(player)).join('') || '<li class="note">控えなし</li>'}
          </ul>
          <label class="field">
            <span>キャプテン</span>
            <select id="captain-select">
              ${state.squad.map((player) => `<option value="${player.id}" ${player.id === state.captainId ? 'selected' : ''}>${escapeHtml(player.name)} (${player.position})</option>`).join('')}
            </select>
          </label>
          <div class="button-row">
            <button id="auto-assign" class="btn">おまかせ配置</button>
            <button id="start-season" class="btn btn-primary">シーズン開始</button>
          </div>
        </aside>
      </div>
    </section>
  `);

  on('[data-formation]', 'click', (event) => {
    ctx.actions.setFormation(event.currentTarget.dataset.formation);
  });

  on('.slot-select', 'change', (event) => {
    ctx.actions.setSlot(Number(event.currentTarget.dataset.slot), event.currentTarget.value);
  });

  on('#captain-select', 'change', (event) => {
    ctx.actions.setCaptain(event.currentTarget.value);
  });

  on('#auto-assign', 'click', () => ctx.actions.autoAssign());
  on('#start-season', 'click', () => ctx.actions.startSeason());
}
