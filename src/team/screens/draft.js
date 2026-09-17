import { render, on, playerCard, rosterRow, positionCounts, escapeHtml } from '../ui.js';
import { countByPosition } from '../squad.js';

export function showDraft(ctx) {
  const draft = ctx.state.draft;
  const player = draft.current;
  const isField = draft.stage === 'field';
  const stageLabel = isField ? 'ステージ1：フィールドプレーヤー' : 'ステージ2：GK';
  const counts = countByPosition(draft.taken);
  const progress = `${draft.stageTaken} / ${draft.target}`;

  render(`
    <section class="screen screen-draft">
      <header class="draft-head">
        <div>
          <p class="eyebrow">${escapeHtml(ctx.state.clubName)} ／ SEED ${escapeHtml(ctx.state.seedText)}</p>
          <h2>${stageLabel}</h2>
        </div>
        <div class="draft-counters">
          <div class="counter"><span>獲得</span><strong>${progress}</strong></div>
          <div class="counter ${draft.passesLeft <= 2 ? 'is-warn' : ''}"><span>見送り残り</span><strong>${draft.passesLeft}</strong></div>
          <div class="counter"><span>登場予定</span><strong>${draft.remainingInQueue}</strong></div>
        </div>
      </header>

      <div class="draft-body">
        <div class="draft-main">
          ${player ? playerCard(player, { big: true }) : '<p class="note">選手がいません</p>'}
          <div class="button-row draft-actions">
            <button id="take" class="btn btn-primary">取る<small>Enter</small></button>
            <button id="skip" class="btn btn-ghost" ${draft.mustTake ? 'disabled' : ''}>見送る<small>Space</small></button>
          </div>
          ${draft.mustTake ? '<p class="warn">見送り回数を使い切りました。ここからは全員取るしかありません。</p>' : ''}
        </div>

        <aside class="draft-side panel">
          <h3>獲得済み <span class="count-row">${positionCounts(counts)}</span></h3>
          <ul class="roster">
            ${draft.taken.map((taken) => rosterRow(taken)).join('') || '<li class="note">まだ0人</li>'}
          </ul>
          <h3 class="side-sub">見送った選手</h3>
          <ul class="passed">
            ${draft.passed.map((passed) => `<li>${escapeHtml(passed.name)} <span>${passed.position} ${passed.ovr}</span></li>`).join('') || '<li class="note">まだ0人</li>'}
          </ul>
        </aside>
      </div>
    </section>
  `);

  on('#take', 'click', () => ctx.actions.draftTake());
  on('#skip', 'click', () => ctx.actions.draftSkip());
}

