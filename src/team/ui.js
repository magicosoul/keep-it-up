import { POSITION_LABEL } from './config.js';
import { effectiveOvr } from './squad.js';

const root = () => document.getElementById('team-app');

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

export function render(html) {
  root().innerHTML = html;
}

export function on(selector, event, handler) {
  root().querySelectorAll(selector).forEach((node) => {
    node.addEventListener(event, handler);
  });
}

export function ovrClass(value) {
  if (value >= 88) return 'ovr-gold';
  if (value >= 80) return 'ovr-silver';
  if (value >= 70) return 'ovr-bronze';
  return 'ovr-plain';
}

export function statBar(label, value) {
  const width = Math.max(4, Math.min(100, value));
  return `
    <div class="stat">
      <span class="stat-label">${escapeHtml(label)}</span>
      <span class="stat-track"><span class="stat-fill" style="width:${width}%"></span></span>
      <span class="stat-value">${value}</span>
    </div>
  `;
}

export function playerCard(player, { big = false } = {}) {
  const stats = player.position === 'GK'
    ? [['セーブ', player.stats.sav], ['守備', player.stats.def], ['技術', player.stats.tec], ['体力', player.stats.phy]]
    : [['攻撃', player.stats.att], ['守備', player.stats.def], ['技術', player.stats.tec], ['体力', player.stats.phy]];

  return `
    <article class="player-card ${big ? 'is-big' : ''}">
      <header>
        <span class="pos pos-${player.position}">${POSITION_LABEL[player.position]}</span>
        <h3>${escapeHtml(player.name)}</h3>
        <span class="ovr ${ovrClass(player.ovr)}">${player.ovr}</span>
      </header>
      <p class="meta">${player.age}歳 ／ ${escapeHtml(player.originLabel)} ／ ${escapeHtml(player.team)}</p>
      <p class="meta meta-sub">評価: ${escapeHtml(player.tierLabel)} ／ ポテンシャル ${player.potential}</p>
      <div class="stats">${stats.map(([label, value]) => statBar(label, value)).join('')}</div>
    </article>
  `;
}

export function rosterRow(player, slotPosition) {
  const eff = slotPosition ? effectiveOvr(player, slotPosition) : player.ovr + (player.growth ?? 0);
  const mismatch = slotPosition && slotPosition !== player.position;

  return `
    <li class="roster-row">
      <span class="pos pos-${player.position}">${POSITION_LABEL[player.position]}</span>
      <span class="roster-name">${escapeHtml(player.name)}</span>
      <span class="roster-meta">${player.age}歳</span>
      <span class="ovr ${ovrClass(eff)} ${mismatch ? 'is-mismatch' : ''}">${eff}</span>
    </li>
  `;
}

export function positionCounts(counts) {
  return ['GK', 'DF', 'MF', 'FW']
    .map((key) => `<span class="count-chip pos-${key}">${key} ${counts[key]}</span>`)
    .join('');
}
