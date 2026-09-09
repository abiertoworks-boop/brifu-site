/* =========================================================
   Brifu — 変化の入口診断
   Knowledge of EQ is never asked. Each question is itself an EQ experience.
   Result is never a score: it is an "entrance to change".
   ========================================================= */
(function () {
  'use strict';

  const FREQ = ['よくある', 'ときどきある', 'あまりない', 'ほとんどない'];
  const CAN = ['できる', 'だいたいできる', 'あまりできない', 'できない'];

  // weights: points per option index (0..3) toward each type
  const QUESTIONS = [
    {
      q: '何かモヤモヤすることがあったとき、自分が<b>なぜそう感じているのか</b>説明できますか？',
      scene: 'たとえば、会議のあと、家に帰ってから、ふと引っかかる出来事があったとき。',
      opts: CAN, kind: 'can',
      w: { A: [0, 1, 2, 3] }, know: [3, 2, 1, 0],
      reflect: { hi: '感情の理由を自分で言葉にできている。次は、その言葉が「事実」なのか「解釈」なのかを見分ける段階です。', lo: 'モヤモヤの理由が言葉になる前に流れてしまいがち。感情に名前をつけることが、最初の入口になります。' }
    },
    {
      q: '相手に悪気はないと分かっていても、<b>「自分を否定された」</b>と感じることがありますか？',
      scene: '軽い指摘や何気ないひと言が、あとまで残ってしまうような場面。',
      opts: FREQ, kind: 'freq',
      w: { B: [3, 2, 1, 0], A: [1, 1, 0, 0] }, struggle: [3, 2, 1, 0],
      reflect: { hi: '「分かっているのに、そう感じてしまう」。ここには、知識と感情のあいだにあるギャップがそのまま現れています。', lo: '相手の言葉と自分の感情を切り分けられている。関係の中での認識のズレに、さらに目を向けられる段階です。' }
    },
    {
      q: 'やりたいことがあっても、<b>「自分には無理」</b>と諦めることがありますか？',
      scene: '始める前に、頭の中で結論が出てしまうような感覚。',
      opts: FREQ, kind: 'freq',
      w: { C: [3, 2, 1, 0], A: [1, 0, 0, 0] },
      reflect: { hi: '「無理」という結論は、感情から生まれた認識かもしれません。小さな一歩に分解すると、選べる余地が見えてきます。', lo: '一歩を選ぶ力は育っている。行動の結果をどう振り返るかが、次の成長を左右します。' }
    },
    {
      q: '相手のためを思って言ったことが、<b>なぜか相手を傷つけてしまった</b>経験がありますか？',
      scene: '善意で伝えたはずなのに、空気が変わった瞬間。',
      opts: FREQ, kind: 'freq',
      w: { B: [2, 2, 1, 0], D: [2, 1, 0, 0] }, struggle: [3, 2, 1, 0],
      reflect: { hi: '自分の「伝えたつもり」と、相手の「受け取り方」は違う。このズレは、一人では見えにくく、人との関わりの中でしか気づけません。', lo: '伝え方と受け取られ方の違いに、すでに意識が向いている。対話の質をさらに高められる段階です。' }
    },
    {
      q: 'チームで意見が出ないとき、<b>「本人の意欲がないから」</b>と思ってしまうことがありますか？',
      scene: '会議で沈黙が続き、結局いつも同じ人が話している場面。',
      opts: FREQ, kind: 'freq',
      w: { E: [3, 2, 1, 0], B: [1, 1, 0, 0] },
      reflect: { hi: '意見が出ない理由を「個人」に置くと、関係性や場の安全性が見えなくなります。「何が起きているか」を見る視点が入口です。', lo: '意見が出ない背景に、関係性や場の要因があると捉えられている。チームの可能性を活かす土台があります。' }
    },
    {
      q: '何か問題が起きたとき、<b>「誰が悪いか」よりも「何が起きているのか」</b>を考えられますか？',
      scene: 'トラブルの報告を受けた、その最初の数秒。',
      opts: CAN, kind: 'can',
      w: { E: [0, 1, 2, 3] }, know: [3, 2, 1, 0],
      reflect: { hi: '出来事を構造として見られている。これは、人と目的をつなぐリーダーシップの核になる視点です。', lo: '「誰が」に意識が向くと、感情が先に動き、状況が見えにくくなります。まず「何が起きているか」を言葉にする練習が入口です。' }
    },
    {
      q: '失敗したとき、その経験から<b>次の行動を変える</b>ことができますか？',
      scene: '同じような失敗が、形を変えて繰り返されていないか。',
      opts: CAN, kind: 'can',
      w: { C: [0, 1, 2, 3] },
      reflect: { hi: '経験を次につなげる循環が回っている。振り返りの深さが、成長の速度を決めます。', lo: '振り返りが「反省」で止まると、行動は変わりません。「次に何を変えるか」を一つだけ決めることが入口です。' }
    },
    {
      q: '自分と違う意見を聞いたとき、<b>「なぜこの人はそう考えるのだろう？」</b>と考えられますか？',
      scene: '反論したくなる気持ちが先に来る、そんな場面。',
      opts: CAN, kind: 'can',
      w: { B: [0, 1, 2, 3] }, know: [3, 2, 1, 0],
      reflect: { hi: '相手の認識に関心を向けられている。次は、それを対話の中で実際に確かめる段階です。', lo: '違う意見を「自分への否定」として受け取ると、相手の世界が見えなくなります。「なぜ？」を一つ添えることが入口です。' }
    }
  ];

  const TYPES = {
    A: {
      name: 'TYPE A', title: '自分を知ることから始める',
      lead: 'あなたは現在、<b>感情 → 価値観 → 認識</b> を整理することで、次の一歩が見えやすくなる可能性があります。自分の心が分かると、自分で自分の一歩を選べるようになります。',
      chain: ['感情に気づく', '言葉にする', '大切にしていることを知る', '一歩を選ぶ'],
      rec: 'h',
      h: '感情・価値観・認識を、まず「知る」ところから。EQコアカードで感情に名前をつけ、EQ Skillsで感情の扱い方と思考の癖を学ぶ。',
      v: '整理した自分の認識を、対話の中で確かめる。「自分ではこう思っていた」が、人との関わりで更新されていきます。'
    },
    B: {
      name: 'TYPE B', title: '人との関係から変えていく',
      lead: 'あなたは現在、<b>自分と相手の認識の違い</b>に気づくことで、コミュニケーションの可能性が広がるかもしれません。すれ違いは、能力の問題ではなく「認識のズレ」から生まれています。',
      chain: ['相手は何を感じている？', '認識は違わないか？', '相手は何を大切にしている？', '本音で対話する'],
      rec: 'v',
      h: '「相手の話を聴く」「伝え方を選ぶ」の型を、EQ Skillsで学ぶ。知識は対話の土台になります。',
      v: 'セッションや対話を通じて、「聴いているつもり」「伝えたつもり」の自分に気づく。EIA・EQ Humanityが、他者理解と合意形成を深めます。'
    },
    C: {
      name: 'TYPE C', title: '行動を変えることから始める',
      lead: '考えることは、できている。次に必要なのは、<b>小さく行動して、結果から学ぶこと</b>。感情ではなく目的から選び、振り返りを次の行動につなげていく段階です。',
      chain: ['目的から考える', '小さく試す', '結果を見る', '次の行動を変える'],
      rec: 'h',
      h: 'EQ Skillsの「行動スキルの習得」と、EQコアカードを使った日々の振り返り。知る → 実践する → 経験する の循環を自分で回していきます。',
      v: '一人の実践に、仲間からのフィードバックを加える。EQTMのような実践の場で、自分では見えない行動の癖に気づけます。'
    },
    D: {
      name: 'TYPE D', title: '人との関わりから深める',
      lead: '知識を増やすだけではなく、<b>人との関わりを通じて、自分では見えていない自分に気づくこと</b>が次の成長につながる可能性があります。「知っている」と「できている」は違う。そして「できているつもり」と「他者から見てもできている」も違います。',
      chain: ['人と関わる', 'フィードバックを受ける', '気づけなかった自分に気づく', '認識が深まる'],
      rec: 'v',
      h: '学んだことを、言葉として整理し直す。EQ認識理論の枠組みが、経験を言語化する手がかりになります。',
      v: 'EIA・EQ Humanity・EQ認識理論。対話とフィードバックの中で、価値観が揺さぶられ、自己理解が深まる縦の成長へ。'
    },
    E: {
      name: 'TYPE E', title: '組織との関係から考える',
      lead: '個人の問題ではなく、<b>人・関係・目的・組織文化</b>を一つのつながりとして捉える段階です。リーダーが変わり、関係性が変わり、行動が変わり、文化が変わる。理念が人の行動に表れる組織へ。',
      chain: ['何が起きているかを見る', '目的を共有する', '関係性を整える', '文化として根づかせる'],
      rec: 'v',
      h: 'チームで共通言語を持つために、EQ Skillsを組織で学ぶ。認識のズレを確認できる土台をつくります。',
      v: 'EQ Business Nexusで、個人・経営者・組織の課題に伴走する。EQTMで、理念を実践する仲間と習慣化していきます。'
    }
  };

  const ORDER = ['A', 'B', 'C', 'D', 'E'];
  const panel = document.getElementById('diagPanel');
  if (!panel) return;
  const introEl = document.getElementById('diagIntro');
  const quizEl = document.getElementById('diagQuiz');
  const resultEl = document.getElementById('diagResult');
  const answers = new Array(QUESTIONS.length).fill(null);
  let idx = 0;

  const show = (el) => { [introEl, quizEl, resultEl].forEach((e) => { e.hidden = e !== el; }); };
  const toTop = () => { const y = panel.getBoundingClientRect().top + window.scrollY - 110; window.scrollTo({ top: y, behavior: 'smooth' }); };

  document.getElementById('diagStart').addEventListener('click', () => { idx = 0; show(quizEl); renderQ(); toTop(); });

  function renderQ() {
    const q = QUESTIONS[idx];
    quizEl.innerHTML = `
      <div class="diag__progress"><span>Q ${String(idx + 1).padStart(2, '0')} / ${String(QUESTIONS.length).padStart(2, '0')}</span><div class="bar"><i style="transform:scaleX(${idx / QUESTIONS.length})"></i></div></div>
      <div class="q-card">
        <div class="q-card__num">QUESTION ${String(idx + 1).padStart(2, '0')}</div>
        <p class="q-card__q">${q.q}</p>
        <p class="q-card__scene">${q.scene}</p>
        <div class="choices">
          ${q.opts.map((o, i) => `<button class="choice${answers[idx] === i ? ' is-picked' : ''}" data-i="${i}"><span class="dot"></span>${o}</button>`).join('')}
        </div>
        <div class="diag__nav">
          <button class="diag__back" ${idx === 0 ? 'style="visibility:hidden"' : ''}>← ひとつ前へ</button>
          <span class="muted" style="font-size:12px;letter-spacing:.1em">直感で選んでください</span>
        </div>
      </div>`;
    requestAnimationFrame(() => {
      const bar = quizEl.querySelector('.bar i'); if (bar) bar.style.transform = `scaleX(${(idx + 1) / QUESTIONS.length})`;
      quizEl.querySelector('.q-card').classList.add('is-in');
    });
    quizEl.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      answers[idx] = Number(b.dataset.i);
      quizEl.querySelectorAll('.choice').forEach((c) => c.classList.remove('is-picked'));
      b.classList.add('is-picked');
      setTimeout(() => { if (idx < QUESTIONS.length - 1) { idx++; renderQ(); } else { renderResult(); } toTop(); }, 320);
    }));
    const back = quizEl.querySelector('.diag__back');
    if (back) back.addEventListener('click', () => { if (idx > 0) { idx--; renderQ(); } });
  }

  function compute() {
    const score = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    let know = 0, struggle = 0;
    QUESTIONS.forEach((q, i) => {
      const a = answers[i];
      Object.keys(q.w).forEach((t) => { score[t] += q.w[t][a]; });
      if (q.know) know += q.know[a];
      if (q.struggle) struggle += q.struggle[a];
    });
    // D = "知っているのに、関係の中ではうまくいかない" gap
    if (know >= 5 && struggle >= 3) score.D += 4;
    if (know >= 7) score.D += 1;
    const max = Math.max(...Object.values(score));
    if (max < 3) return { type: 'D', score };
    const type = ORDER.find((t) => score[t] === max);
    return { type, score };
  }

  function renderResult() {
    const { type } = compute();
    const T = TYPES[type];
    // choose 3 reflections that most shaped the result
    const contrib = QUESTIONS.map((q, i) => {
      const a = answers[i];
      const pts = Object.keys(q.w).reduce((s, t) => s + (t === type ? q.w[t][a] : 0), 0) + (type === 'D' && q.struggle ? q.struggle[a] * 0.5 : 0) + (type === 'D' && q.know ? q.know[a] * 0.3 : 0);
      const strong = q.kind === 'can' ? a <= 1 : a >= 2; // "hi" text applies when they can / rarely struggle
      return { i, pts, text: strong ? q.reflect.hi : q.reflect.lo };
    }).sort((x, y) => y.pts - x.pts || x.i - y.i).slice(0, 3).sort((x, y) => x.i - y.i);

    resultEl.innerHTML = `
      <div class="result">
        <div class="result__type">YOUR ENTRANCE — ${T.name}</div>
        <h2 class="result__title">${T.title}</h2>
        <p class="result__lead">${T.lead}</p>
        <div class="result__chain">${T.chain.map((c, i) => `${i ? '<i>→</i>' : ''}<span>${c}</span>`).join('')}</div>
        <div class="result__reflect">
          <h4>あなたの回答から見えたこと</h4>
          <ul>${contrib.map((c) => `<li><b>Q${c.i + 1}</b>　${c.text}</li>`).join('')}</ul>
        </div>
        <div class="result__paths">
          <div class="path path--h ${T.rec === 'h' ? 'is-rec' : ''}">${T.rec === 'h' ? '<span class="rec">RECOMMENDED</span>' : ''}<div class="k">横成長 — 自分自身で広げる</div><div class="t">知る・学ぶ・実践する</div><p>${T.h}</p><ul><li>EQコアカード</li><li>EQ Skills</li></ul></div>
          <div class="path path--v ${T.rec === 'v' ? 'is-rec' : ''}">${T.rec === 'v' ? '<span class="rec">RECOMMENDED</span>' : ''}<div class="k">縦成長 — 人と関わり深める</div><div class="t">自分では気づけなかった自分に気づく</div><p>${T.v}</p><ul><li>EIA</li><li>EQ Humanity</li><li>EQ認識理論</li>${type === 'E' ? '<li>EQ Business Nexus</li>' : ''}${type === 'C' ? '<li>EQTM</li>' : ''}</ul></div>
        </div>
        <div class="result__actions">
          <a class="btn" href="https://brifu-eq-platform-ixrklwz.gamma.site/" target="_blank" rel="noopener">EQ Platformで学びを見る <span class="arr">→</span></a>
          <a class="btn btn--ghost" href="index.html#platform">学びの全体像へ戻る</a>
          <button class="diag__back" id="diagRetry">もう一度診断する</button>
        </div>
        <div class="result__others">
          <h4>5つの「変化の入口」</h4>
          <ul>${ORDER.map((t) => `<li class="${t === type ? 'is-me' : ''}"><b>${TYPES[t].name}</b>${TYPES[t].title}</li>`).join('')}</ul>
        </div>
      </div>`;
    show(resultEl);
    requestAnimationFrame(() => resultEl.querySelector('.result').classList.add('is-in'));
    document.getElementById('diagRetry').addEventListener('click', () => { answers.fill(null); idx = 0; show(quizEl); renderQ(); toTop(); });
  }
})();
