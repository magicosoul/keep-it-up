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

/** ピッチ上の狭い場所用。金特/青特/赤特を持っているかだけを点で示す。 */
export function skillDots(player) {
  const keys = player.skills ?? [];
  const tones = new Set(keys.map((key) => SKILLS[key]?.tone).filter(Boolean));

  if (!tones.size) {
    return '';
  }

  const names = keys.map((key) => SKILLS[key]?.name).filter(Boolean).join('、');

  return `<span class="dots" title="${escapeHtml(names)}">${['gold', 'blue', 'red']
    .filter((tone) => tones.has(tone))
    .map((tone) => `<span class="dot dot-${tone}"></span>`)
    .join('')}</span>`;
}

/** ピッチ上は姓だけ出す。日本語名は「姓 名」、外国籍名は「名・姓」。 */
export function shortName(name) {
  if (name.includes(' ')) {
    return name.split(' ')[0];
  }

  if (name.includes('・')) {
    return name.split('・').pop();
  }

  return name;
}

/** 同姓が並んだときだけ、区別がつくところまで名前を足す。 */
function disambiguated(name) {
  if (name.includes(' ')) {
    const [surname, given] = name.split(' ');
    return `${surname} ${given.slice(0, 1)}`;
  }

  return name;
}

/**
 * ピッチに出す表示名をまとめて決める。
 * 姓が被っていない選手はそのまま姓だけ、被った選手だけ名前を足す。
 */
export function pitchNames(players) {
  const counts = new Map();

  players.forEach((player) => {
    const short = shortName(player.name);
    counts.set(short, (counts.get(short) ?? 0) + 1);
  });

  const names = new Map();

  players.forEach((player) => {
    const short = shortName(player.name);
    names.set(player.id, counts.get(short) > 1 ? disambiguated(player.name) : short);
  });

  return names;
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
