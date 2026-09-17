import { TEAM_CONFIG, POSITION_LABEL, FORMATIONS } from '../config.js';
import { render, on, escapeHtml, ovrClass } from '../ui.js';
import { squadSummary } from '../squad.js';
import { matchupPreview, matchupLabel } from '../tactics.js';

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

function signed(value) {
  return `${value > 0 ? '+' : ''}${value}%`;
}

function termRow(term) {
  const attack = Math.round(term.attack * 100);
  const control = Math.round(term.control * 100);
  const total = attack + control;

  return `
    <li class="term ${total > 0 ? 'is-plus' : total < 0 ? 'is-minus' : ''}">
      <span class="term-label">${escapeHtml(term.label)}</span>
      <span class="term-detail">${escapeHtml(term.detail)}</span>
      <span class="term-value">${attack !== 0 ? `攻 ${signed(attack)}` : ''}${attack !== 0 && control !== 0 ? ' / ' : ''}${control !== 0 ? `主 ${signed(control)}` : ''}${total === 0 ? '—' : ''}</span>
    </li>
  `;
}

function matchupMatrix(currentKey, opponentKey) {
  const keys = Object.keys(FORMATIONS);

  return `
    <table class="matrix">
      <thead>
        <tr><th>自分＼相手</th>${keys.map((key) => `<th class="${key === opponentKey ? 'is-col' : ''}">${key}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${keys.map((mine) => `
          <tr class="${mine === currentKey ? 'is-row' : ''}">
            <th>${mine}</th>
            ${keys.map((opp) => {
              const score = matchupPreview(mine, opp).score;
              const tone = matchupLabel(score).tone;
              return `<td class="tone-${tone} ${opp === opponentKey ? 'is-col' : ''}">${score > 0 ? '+' : ''}${score}</td>`;
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function nextMatchPanel(ctx, fixture) {
  if (!fixture) {
    return '';
  }

  const state = ctx.state;
  const oppKey = fixture.opponent.formationKey;
  const preview = matchupPreview(state.formationKey, oppKey);
  const label = matchupLabel(preview.score);

  return `
    <div class="panel next-match">
      <h3>
        次の試合
        <span class="next-line">第${fixture.round}節 ${fixture.home ? 'ホーム' : 'アウェー'} vs ${escapeHtml(fixture.opponent.name)}</span>
      </h3>

      <div class="next-grid">
        <div class="next-opponent">
          <p class="eyebrow">相手のフォーメーション</p>
          <p class="opp-formation">${escapeHtml(oppKey)}</p>
          <p class="note">${escapeHtml(FORMATIONS[oppKey].style)}</p>
        </div>

        <div class="next-verdict">
          <span class="verdict tone-${label.tone}">${label.text}</span>
          <div class="verdict-stats">
            <span>攻撃 <strong>${signed(preview.attackPercent)}</strong></span>
            <span>守備 <strong>${signed(preview.defensePercent)}</strong></span>
            <span>主導権 <strong>${signed(preview.controlPercent)}</strong></span>
          </div>
        </div>
      </div>

      <p class="eyebrow">フォーメーションを変えて噛み合わせを取りにいく</p>
      <div class="formation-row">
        ${Object.keys(FORMATIONS).map((key) => {
          const score = matchupPreview(key, oppKey).score;
          const tone = matchupLabel(score).tone;
          return `
            <button class="btn btn-chip ${key === state.formationKey ? 'is-active' : ''}" data-season-formation="${key}">
              ${key}<small class="tone-${tone}">${score > 0 ? '+' : ''}${score}</small>
            </button>
          `;
        }).join('')}
      </div>

      ${preview.terms.every((term) => term.attack === 0 && term.control === 0)
        ? '<p class="note">同じフォーメーションどうしなので、噛み合わせの差はありません。選手の質の勝負になります。</p>'
        : `<ul class="terms">${preview.terms.map(termRow).join('')}</ul>`}

      <details class="matrix-box">
        <summary>相性表を見る</summary>
        <div class="table-scroll">${matchupMatrix(state.formationKey, oppKey)}</div>
        <p class="note">数字は「形の噛み合わせだけ」で攻守が何%変わるか。選手の質は別。</p>
      </details>
    </div>
  `;
}

export function showSeason(ctx) {
  const state = ctx.state;
  const season = state.season;
  const summary = squadSummary(state.squad, state.formationKey, state.lineup, state.captainId);
  const recent = season.log.slice(-6).reverse();
  const events = season.events.slice(-8).reverse();
  const mine = season.myRow();
  const fixture = season.nextFixture();

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

      ${nextMatchPanel(ctx, fixture)}

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
                <span class="scorers">
                  <span class="formation-pair">${escapeHtml(entry.myFormation)} vs ${escapeHtml(entry.opponentFormation)}</span>
                  ${entry.scorers.map((name) => escapeHtml(name)).join(', ')}
                </span>
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

  on('[data-season-formation]', 'click', (event) => {
    ctx.actions.setSeasonFormation(event.currentTarget.dataset.seasonFormation);
  });

  on('#play-one', 'click', () => ctx.actions.playMatches(1));
  on('#play-five', 'click', () => ctx.actions.playMatches(5));
  on('#play-all', 'click', () => ctx.actions.playMatches(TEAM_CONFIG.season.matches));
  on('#see-result', 'click', () => ctx.actions.showResult());
}
