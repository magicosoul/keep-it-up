import { TEAM_CONFIG, POSITION_LABEL } from '../config.js';
import { render, on, escapeHtml, ovrClass } from '../ui.js';
import { squadSummary } from '../squad.js';

const EVENT_LABEL = {
  breakout: 'ブレイク',
  slump: '不調',
  injury: '離脱',
};

function tableRows(season) {
  return season.sortedTable().map((row) => `
    <tr class="${row.mine ? 'is-mine' : ''}">
      <td>${row.rank}</td>
      <td class="club">${escapeHtml(row.name)}</td>
      <td>${row.played}</td>
      <td>${row.won}</td>
      <td>${row.drawn}</td>
      <td>${row.lost}</td>
      <td>${row.gf}</td>
      <td>${row.ga}</td>
      <td>${row.gf - row.ga > 0 ? '+' : ''}${row.gf - row.ga}</td>
      <td class="points">${row.points}</td>
    </tr>
  `).join('');
}

function squadRows(state) {
  return state.squad
    .slice()
    .sort((a, b) => b.goals - a.goals || b.apps - a.apps)
    .map((player) => {
      const current = player.ovr + (player.growth ?? 0);
      const condition = player.injuredFor > 0
        ? `<span class="tag tag-injury">離脱 ${player.injuredFor}</span>`
        : player.form >= 1.12
          ? '<span class="tag tag-hot">好調</span>'
          : player.form <= 0.88
            ? '<span class="tag tag-cold">不調</span>'
            : '<span class="tag">普通</span>';

      return `
        <tr>
          <td><span class="pos pos-${player.position}">${POSITION_LABEL[player.position]}</span></td>
          <td class="club">${escapeHtml(player.name)}${player.id === state.captainId ? ' <span class="tag tag-cap">C</span>' : ''}</td>
          <td><span class="ovr ${ovrClass(current)}">${current}</span>${player.growth ? `<small class="${player.growth > 0 ? 'up' : 'down'}">${player.growth > 0 ? '+' : ''}${player.growth}</small>` : ''}</td>
          <td>${player.apps}</td>
          <td>${player.goals}</td>
          <td>${player.assists}</td>
          <td>${player.cleanSheets}</td>
          <td>${condition}</td>
        </tr>
      `;
    }).join('');
}

export function showSeason(ctx) {
  const state = ctx.state;
  const season = state.season;
  const summary = squadSummary(state.squad, state.formationKey, state.lineup, state.captainId);
  const recent = season.log.slice(-6).reverse();
  const events = season.events.slice(-8).reverse();
  const mine = season.myRow();

  render(`
    <section class="screen screen-season">
      <header class="draft-head">
        <div>
          <p class="eyebrow">${escapeHtml(state.clubName)} ／ ${state.formationKey}</p>
          <h2>第 ${Math.min(season.matchday + 1, TEAM_CONFIG.season.matches)} 節 / ${TEAM_CONFIG.season.matches}</h2>
        </div>
        <div class="draft-counters">
          <div class="counter"><span>順位</span><strong>${mine ? mine.rank : '-'}</strong></div>
          <div class="counter"><span>勝点</span><strong>${mine ? mine.points : 0}</strong></div>
          <div class="counter"><span>戦力</span><strong>${summary.power}</strong></div>
          <div class="counter"><span>出場可能</span><strong>${season.availableCount()} / ${state.squad.length}</strong></div>
        </div>
      </header>

      <div class="button-row season-actions">
        <button id="play-one" class="btn btn-primary" ${season.finished ? 'disabled' : ''}>1試合進める</button>
        <button id="play-five" class="btn" ${season.finished ? 'disabled' : ''}>5試合</button>
        <button id="play-all" class="btn" ${season.finished ? 'disabled' : ''}>最後まで</button>
        ${season.finished ? '<button id="see-result" class="btn btn-primary">結果を見る</button>' : ''}
      </div>

      <div class="season-body">
        <div class="panel">
          <h3>直近の試合</h3>
          <ul class="match-log">
            ${recent.map((entry) => `
              <li class="result-${entry.result}">
                <span class="round">第${entry.round}節</span>
                <span class="opp">${entry.home ? 'H' : 'A'} vs ${escapeHtml(entry.opponent)}</span>
                <span class="score">${entry.scored} - ${entry.conceded}</span>
                <span class="scorers">${entry.scorers.map((name) => escapeHtml(name)).join(', ')}</span>
              </li>
            `).join('') || '<li class="note">まだ試合をしていません</li>'}
          </ul>

          <h3 class="side-sub">できごと</h3>
          <ul class="event-log">
            ${events.map((entry) => `
              <li class="event-${entry.type}">第${entry.round}節 ${escapeHtml(entry.name)} ${EVENT_LABEL[entry.type]}${entry.type === 'injury' ? ` ${entry.value}節` : ` ${entry.type === 'slump' ? '-' : '+'}${entry.value}`}</li>
            `).join('') || '<li class="note">まだありません</li>'}
          </ul>
        </div>

        <div class="panel">
          <h3>順位表</h3>
          <div class="table-scroll is-tall">
            <table class="data-table">
              <thead><tr><th>順</th><th>クラブ</th><th>試</th><th>勝</th><th>分</th><th>敗</th><th>得</th><th>失</th><th>差</th><th>点</th></tr></thead>
              <tbody>${tableRows(season)}</tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="panel">
        <h3>選手成績</h3>
        <div class="table-scroll">
          <table class="data-table">
            <thead><tr><th>POS</th><th>選手</th><th>総合</th><th>出</th><th>点</th><th>A</th><th>CS</th><th>状態</th></tr></thead>
            <tbody>${squadRows(state)}</tbody>
          </table>
        </div>
      </div>
    </section>
  `);

  on('#play-one', 'click', () => ctx.actions.playMatches(1));
  on('#play-five', 'click', () => ctx.actions.playMatches(5));
  on('#play-all', 'click', () => ctx.actions.playMatches(TEAM_CONFIG.season.matches));
  on('#see-result', 'click', () => ctx.actions.showResult());
}
