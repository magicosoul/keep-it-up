import { POSITION_LABEL } from './config.js';
import { effectiveOvr } from './squad.js';
import { STAT_ORDER, STAT_LABELS, rankOf } from './players.js';
import { SKILLS } from './skills.js';

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

export function rankBadge(value) {
  const letter = rankOf(value);
  return `<span class="rank rank-${letter}">${letter}</span>`;
}

export function statBar(label, value) {
  const width = Math.max(4, Math.min(100, value));
  return `
    <div class="stat">
      <span class="stat-label">${escapeHtml(label)}</span>
      ${rankBadge(value)}
      <span class="stat-track"><span class="stat-fill rank-fill-${rankOf(value)}" style="width:${width}%"></span></span>
      <span class="stat-value">${value}</span>
    </div>
  `;
}

export function skillChips(player, { limit = 0 } = {}) {
  const keys = player.skills ?? [];

  if (!keys.length) {
    return '<span class="skill-none">特殊能力なし</span>';
  }

  const shown = limit ? keys.slice(0, limit) : keys;

  return shown.map((key) => {
    const skill = SKILLS[key];

    if (!skill) {
      return '';
    }

    return `<span class="skill skill-${skill.tone}" title="${escapeHtml(skill.desc)}">${escapeHtml(skill.name)}</span>`;
  }).join('') + (limit && keys.length > limit ? `<span class="skill skill-more">+${keys.length - limit}</span>` : '');
}

export function playerCard(player, { big = false } = {}) {
  const order = STAT_ORDER[player.position];
  const labels = STAT_LABELS[player.position];

  return `
    <article class="player-card ${big ? 'is-big' : ''}">
      <header>
        <span class="pos pos-${player.position}">${POSITION_LABEL[player.position]}</span>
        <h3>${escapeHtml(player.name)}</h3>
        ${rankBadge(player.ovr)}
        <span class="ovr ${ovrClass(player.ovr)}">${player.ovr}</span>
      </header>
      <p class="meta">${player.age}歳 ／ ${escapeHtml(player.originLabel)} ／ ${escapeHtml(player.team)}</p>
      <p class="meta meta-sub">評価: ${escapeHtml(player.tierLabel)} ／ ポテンシャル ${player.potential}</p>
      <div class="stats">${order.map((key) => statBar(labels[key], player.stats[key])).join('')}</div>
      <div class="skill-row">${skillChips(player)}</div>
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
      <span class="roster-skills">${skillChips(player, { limit: 2 })}</span>
      <span class="ovr ${ovrClass(eff)} ${mismatch ? 'is-mismatch' : ''}">${eff}</span>
    </li>
  `;
}

export function positionCounts(counts) {
  return ['GK', 'DF', 'MF', 'FW']
    .map((key) => `<span class="count-chip pos-${key}">${key} ${counts[key]}</span>`)
    .join('');
}
