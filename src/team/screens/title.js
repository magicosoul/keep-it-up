import { TEAM_CONFIG, FORMATIONS } from '../config.js';
import { render, on, escapeHtml } from '../ui.js';

export function showTitle(ctx) {
  const draft = TEAM_CONFIG.draft;
  const total = draft.fieldTarget + draft.keeperTarget;

  render(`
    <section class="screen screen-title">
      <div class="title-block">
        <p class="eyebrow">KEEP IT UP! presents</p>
        <h1>サッカーチームメーカー</h1>
        <p class="lead">
          ランダムに流れてくる選手を「取る」か「見送る」だけで${total}人集めるゲーム。
          集めたメンバーでフォーメーションを組み、${TEAM_CONFIG.season.matches}試合のシーズンを戦います。
        </p>
      </div>

      <div class="panel rules">
        <h2>ルール</h2>
        <ol>
          <li>フィールドプレーヤーがポジション関係なく完全ランダムで1人ずつ登場します。</li>
          <li>できるのは<strong>取る</strong>か<strong>見送る</strong>だけ。見送りは${draft.fieldPassLimit}回まで。</li>
          <li>まずフィールドプレーヤーを${draft.fieldTarget}人選びます。</li>
          <li>次にGKを${draft.keeperTarget}人選びます（見送りは${draft.keeperPassLimit}回まで）。</li>
          <li>フォーメーションを決めてスタメンを並べ、${TEAM_CONFIG.season.matches}試合を戦います。</li>
          <li>シーズン中は選手が急に伸びたり、不調に落ちたり、ケガもします。</li>
        </ol>
        <p class="note">
          本職外のポジションで使うと能力が下がります。
          フォーメーションは ${Object.keys(FORMATIONS).map((key) => escapeHtml(key)).join(' / ')} から選べます。
        </p>
      </div>

      <div class="panel start-panel">
        <label class="field">
          <span>クラブ名</span>
          <input id="club-name" type="text" maxlength="14" value="${escapeHtml(ctx.state.clubName)}" />
        </label>
        <label class="field">
          <span>シード（同じシードなら同じ選手が流れます）</span>
          <input id="seed-text" type="text" maxlength="12" value="${escapeHtml(ctx.state.seedText)}" />
        </label>
        <div class="button-row">
          <button id="start-draft" class="btn btn-primary">ドラフト開始</button>
          <button id="reroll-seed" class="btn">シードを引き直す</button>
        </div>
      </div>
    </section>
  `);

  on('#start-draft', 'click', () => {
    const clubName = document.getElementById('club-name').value.trim() || 'マイクラブ';
    const seedText = document.getElementById('seed-text').value.trim() || ctx.state.seedText;
    ctx.actions.startDraft(clubName, seedText);
  });

  on('#reroll-seed', 'click', () => {
    ctx.actions.rerollSeed();
  });
}
