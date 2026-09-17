import { render, on, escapeHtml, ovrClass, skillChips, rankBadge } from '../ui.js';

const GRADES = [
  { max: 1, grade: 'S+', title: '優勝' },
  { max: 3, grade: 'S', title: '優勝争い' },
  { max: 6, grade: 'A', title: '上位' },
  { max: 10, grade: 'B', title: '中位' },
  { max: 15, grade: 'C', title: '下位' },
  { max: 20, grade: 'D', title: '残留争い' },
];

function gradeFor(rank) {
  return GRADES.find((entry) => rank <= entry.max) ?? GRADES[GRADES.length - 1];
}

export function showResult(ctx) {
  const state = ctx.state;
  const season = state.season;
  const mine = season.myRow();
  const grade = gradeFor(mine.rank);
  const scorers = season.topScorers(10);
  const topScorer = scorers[0];
  const myBest = state.squad.slice().sort((a, b) => b.goals - a.goals)[0];
  const myAssist = state.squad.slice().sort((a, b) => b.assists - a.assists)[0];
  const keeper = state.squad.slice().sort((a, b) => b.cleanSheets - a.cleanSheets)[0];
  const breakout = state.squad.slice().sort((a, b) => (b.growth ?? 0) - (a.growth ?? 0))[0];

  render(`
    <section class="screen screen-result">
      <div class="title-block">
        <p class="eyebrow">${escapeHtml(state.clubName)} ／ SEED ${escapeHtml(state.seedText)}</p>
        <h1 class="grade grade-${grade.grade.replace('+', 'plus')}">${grade.grade}</h1>
        <p class="lead">最終 ${mine.rank}位（${escapeHtml(grade.title)}） ／ 勝点 ${mine.points} ／ ${mine.won}勝${mine.drawn}分${mine.lost}敗 ／ ${mine.gf}得点 ${mine.ga}失点</p>
      </div>

      <div class="season-body">
        <div class="panel">
          <h3>個人タイトル</h3>
          <ul class="award-list">
            <li><span>得点王</span><strong>${escapeHtml(topScorer?.name ?? '-')}</strong><em>${topScorer?.goals ?? 0}点 / ${escapeHtml(topScorer?.club ?? '-')}${topScorer?.mine ? ' ★自チーム' : ''}</em></li>
            <li><span>チーム得点王</span><strong>${escapeHtml(myBest?.name ?? '-')}</strong><em>${myBest?.goals ?? 0}点</em></li>
            <li><span>アシスト王</span><strong>${escapeHtml(myAssist?.name ?? '-')}</strong><em>${myAssist?.assists ?? 0}アシスト</em></li>
            <li><span>最多クリーンシート</span><strong>${escapeHtml(keeper?.name ?? '-')}</strong><em>${keeper?.cleanSheets ?? 0}試合</em></li>
            <li><span>最も伸びた選手</span><strong>${escapeHtml(breakout?.name ?? '-')}</strong><em>${(breakout?.growth ?? 0) > 0 ? '+' : ''}${breakout?.growth ?? 0}</em></li>
          </ul>
        </div>

        <div class="panel">
          <h3>得点ランキング</h3>
          <ol class="scorer-list">
            ${scorers.map((entry) => `
              <li class="${entry.mine ? 'is-mine' : ''}">
                <span>${escapeHtml(entry.name)}</span>
                <em>${escapeHtml(entry.club)}</em>
                <strong>${entry.goals}</strong>
              </li>
            `).join('') || '<li class="note">得点者なし</li>'}
          </ol>
        </div>
      </div>

      <div class="panel">
        <h3>最終ロスター</h3>
        <div class="table-scroll">
          <table class="data-table">
            <thead><tr><th>POS</th><th>選手</th><th>開幕</th><th>最終</th><th>特殊能力</th><th>出</th><th>点</th><th>A</th></tr></thead>
            <tbody>
              ${state.squad.slice().sort((a, b) => (b.ovr + b.growth) - (a.ovr + a.growth)).map((player) => `
                <tr>
                  <td><span class="pos pos-${player.position}">${player.position}</span></td>
                  <td class="club">${escapeHtml(player.name)}</td>
                  <td>${player.ovr}</td>
                  <td>${rankBadge(player.ovr + player.growth)} <span class="ovr ${ovrClass(player.ovr + player.growth)}">${player.ovr + player.growth}</span></td>
                  <td class="cell-skills">${skillChips(player, { limit: 3 })}</td>
                  <td>${player.apps}</td>
                  <td>${player.goals}</td>
                  <td>${player.assists}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="button-row">
        <button id="replay" class="btn btn-primary">もう一度遊ぶ</button>
        <button id="back-season" class="btn">シーズン画面に戻る</button>
      </div>
    </section>
  `);

  on('#replay', 'click', () => ctx.actions.restart());
  on('#back-season', 'click', () => ctx.actions.backToSeason());
}
