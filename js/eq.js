/* =========================================================
   株式会社Brifu — BrifuのEQ（eq.html）専用の動き
   ・背景色の切り替え       区画の data-theme に合わせて地の色をゆっくり替える
   ・タイプライター         [data-type] の言葉を1文字ずつ打つ（1ページ1か所）
   ・スクロールテリング①   「心が変わると、〇〇が変わる。」の〇〇がスクロールで替わる
   ・スクロールテリング②   EQ認識理論の循環が、スクロールに合わせて描かれる（ラインドロー）
   ・カードスタック         5つの変化のカードが重なり、うしろのカードが少し小さくなる
   動きを減らす設定のときは、スクロール連動をやめ、全部の内容を並べて表示する。
   ========================================================= */
(function () {
  'use strict';
  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  html.classList.add('eqx-live');
  if (reduce) html.classList.add('eqx-static');
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- 背景色の切り替え ---------- */
  var COLORS = { night: '#040816', ice: '#eef4ff', day: '#ffffff' };
  var bg = document.querySelector('.eqx-bg');
  var themed = [].slice.call(document.querySelectorAll('.eqx [data-theme]'));
  function pickTheme() {
    var mid = innerHeight * 0.5, cur = themed[0];
    themed.forEach(function (s) { if (s.getBoundingClientRect().top <= mid) cur = s; });
    var c = COLORS[cur && cur.getAttribute('data-theme')] || COLORS.night;
    if (bg && bg.style.backgroundColor !== c) bg.style.backgroundColor = c;
  }

  /* ---------- タイプライター ---------- */
  var typeEl = document.querySelector('[data-type]');
  if (typeEl && !reduce && 'IntersectionObserver' in window) {
    var text = typeEl.getAttribute('data-type');
    typeEl.textContent = '';
    typeEl.classList.add('is-typing');
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      var i = 0;
      setTimeout(function step() {
        typeEl.textContent = text.slice(0, ++i);
        if (i < text.length) setTimeout(step, 150);
        else setTimeout(function () { typeEl.classList.remove('is-typing'); }, 1600);
      }, 600);
    }, { rootMargin: '0px 0px -20% 0px' });
    io.observe(typeEl);
  }

  // 区画の中をどこまで読み進めたか（0〜1）
  function progressOf(el) {
    var r = el.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
  }

  /* ---------- スクロールテリング①：心が変わると、〇〇が変わる。 ---------- */
  var story = document.querySelector('[data-story]');
  var words = story ? [].slice.call(story.querySelectorAll('.eqx-story__slot b')) : [];
  var storyItems = story ? [].slice.call(story.querySelectorAll('.eqx-story__list li')) : [];
  var storyIdx = -1;
  function updateStory() {
    if (!story) return;
    var i = Math.min(words.length - 1, Math.floor(progressOf(story) * words.length * 0.999));
    if (i === storyIdx) return;
    storyIdx = i;
    words.forEach(function (w, k) { w.classList.toggle('is-on', k === i); w.classList.toggle('is-past', k < i); });
    storyItems.forEach(function (li, k) { li.classList.toggle('is-on', k === i); });
  }

  /* ---------- スクロールテリング②：EQ認識理論の循環 ---------- */
  var cycle = document.querySelector('[data-cycle]');
  var steps = cycle ? [].slice.call(cycle.querySelectorAll('.eqx-cycle__steps li')) : [];
  var path = cycle && cycle.querySelector('.eqx-cycle__path');
  var nodesG = cycle && cycle.querySelector('.eqx-cycle__nodes');
  var numEl = cycle && cycle.querySelector('.eqx-cycle__num');
  var nameEl = cycle && cycle.querySelector('.eqx-cycle__name');
  var R = 160, C = 2 * Math.PI * R, nodes = [], labels = [], cycleIdx = -1;
  if (cycle && nodesG) {
    var NS = 'http://www.w3.org/2000/svg';
    steps.forEach(function (li, k) {
      var a = -Math.PI / 2 + k * (2 * Math.PI / steps.length);
      var x = 200 + Math.cos(a) * R, y = 200 + Math.sin(a) * R;
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1)); c.setAttribute('r', 10);
      var t = document.createElementNS(NS, 'text');
      var lx = 200 + Math.cos(a) * (R + 32), ly = 200 + Math.sin(a) * (R + 32);
      t.setAttribute('x', lx.toFixed(1)); t.setAttribute('y', ly.toFixed(1));
      t.textContent = ('0' + (k + 1)).slice(-2);
      nodesG.appendChild(c); nodesG.appendChild(t);
      nodes.push(c); labels.push(t);
    });
    path.style.strokeDasharray = C;
    path.style.strokeDashoffset = reduce ? 0 : C;
  }
  function setCycle(i) {
    if (i === cycleIdx) return;
    cycleIdx = i;
    steps.forEach(function (li, k) { li.classList.toggle('is-on', k === i); });
    nodes.forEach(function (n, k) { n.classList.toggle('is-on', k <= i); });
    labels.forEach(function (n, k) { n.classList.toggle('is-on', k <= i); });
    if (numEl) numEl.textContent = ('0' + (i + 1)).slice(-2);
    if (nameEl) nameEl.textContent = steps[i].getAttribute('data-step');
  }
  function updateCycle() {
    if (!cycle) return;
    var p = progressOf(cycle);
    // 線は最後の点（認識の更新）から最初の点（感情）へ戻るところまで描き、循環を閉じる
    path.style.strokeDashoffset = (C * (1 - p)).toFixed(1);
    setCycle(Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999)));
  }

  /* ---------- カードスタック ---------- */
  var cards = [].slice.call(document.querySelectorAll('.eqx-card'));
  function updateStack() {
    for (var k = 0; k < cards.length - 1; k++) {
      var cur = cards[k].getBoundingClientRect(), next = cards[k + 1].getBoundingClientRect();
      // 次のカードが重なるほど、うしろのカードを少し小さく・暗くする
      var cover = clamp((cur.bottom - next.top) / cur.height, 0, 1);
      cards[k].style.transform = cover > 0 ? 'scale(' + (1 - cover * 0.06).toFixed(3) + ')' : '';
      cards[k].style.filter = cover > 0 ? 'brightness(' + (1 - cover * 0.25).toFixed(3) + ')' : '';
    }
  }

  /* ---------- まとめてスクロールごとに更新 ---------- */
  var ticking = false;
  function frame() {
    ticking = false;
    pickTheme();
    if (!reduce) { updateStory(); updateCycle(); updateStack(); }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (reduce) {                                    // 動かさない：最終の状態をそのまま見せる
    if (cycle) { setCycle(steps.length - 1); steps.forEach(function (li) { li.classList.add('is-on'); }); }
  }
  frame();
})();
