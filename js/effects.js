/* =========================================================
   株式会社Brifu — 動きの部品（DESIGN_RULES.md 第2章の「動きの語彙」）
   どのページでも、HTMLに data 属性を付けるだけで使える。
   ・カウントアップ        data-count="2000" data-suffix="+"（事実の数字だけ）
   ・ラインドロー          <svg data-draw> の中の path / line / circle が順に描かれる
   ・テキストスクランブル  data-scramble="置き換わったあとの言葉"
   ・マグネットボタン      data-magnetic（マウスの端末だけ。スマホでは動かない）
   ・3Dチルト              data-tilt（マウスの端末だけ。最大6度）
   ・テキストリビール      .tr（中の .tr-line が1行ずつ下からせり上がる）
   動きを減らす設定（prefers-reduced-motion）のときは、どれも最終状態をそのまま表示する。
   ========================================================= */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;
  root.classList.add('fx');
  if (reduce) root.classList.add('fx-reduce');

  // 画面に入ったら一度だけ呼ぶ
  function onEnter(els, fn, margin) {
    els = [].slice.call(els);
    if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (el) { fn(el, true); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        fn(en.target, false);
      });
    }, { rootMargin: margin || '0px 0px -12% 0px', threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- カウントアップ ---------- */
  var fmt = function (n) { return Math.round(n).toLocaleString('ja-JP'); };
  // 画面に入るまでは0にしておく（JSが動かない環境では、HTMLに書いた最終の数字がそのまま見える）
  if (!reduce) [].forEach.call(document.querySelectorAll('[data-count]'), function (el) { el.textContent = '0' + (el.getAttribute('data-suffix') || ''); });
  onEnter(document.querySelectorAll('[data-count]'), function (el, instant) {
    var to = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (instant) { el.textContent = fmt(to) + suffix; return; }
    var t0 = performance.now(), dur = 1600;
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(2, -10 * p);              // 最初は速く、最後はゆっくり止まる
      el.textContent = fmt(to * (p === 1 ? 1 : e)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  });

  /* ---------- ラインドロー ---------- */
  onEnter(document.querySelectorAll('svg[data-draw]'), function (svg, instant) {
    var parts = svg.querySelectorAll('path, line, polyline, circle');
    [].forEach.call(parts, function (el, i) {
      if (!el.getTotalLength) return;
      var len = el.getTotalLength();
      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = instant ? 0 : len;
      if (instant) return;
      el.getBoundingClientRect();                     // 初期位置を確定させてから動かす
      el.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.65,0,.35,1) ' + (i * 0.18) + 's';
      el.style.strokeDashoffset = 0;
    });
    svg.classList.add('is-drawn');
  });

  /* ---------- テキストスクランブル ---------- */
  var GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ感情認識行動選択';
  onEnter(document.querySelectorAll('[data-scramble]'), function (el, instant) {
    var to = el.getAttribute('data-scramble');
    if (instant) { el.textContent = to; el.classList.add('is-done'); return; }
    var from = el.textContent, len = Math.max(from.length, to.length), frame = 0, total = 38;
    setTimeout(function tick() {
      frame++;
      var out = '';
      for (var i = 0; i < len; i++) {
        var settleAt = Math.floor(total * (i + 1) / len);       // 左の文字から順にそろう
        if (frame >= settleAt) out += to[i] || '';
        else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (frame < total) requestAnimationFrame(tick);
      else { el.textContent = to; el.classList.add('is-done'); }
    }, 700);
  }, '0px 0px -25% 0px');

  /* ---------- テキストリビール ---------- */
  onEnter(document.querySelectorAll('.tr'), function (el) { el.classList.add('is-in'); });

  /* ---------- マグネットボタン／3Dチルト（マウスの端末だけ） ---------- */
  if (fine && !reduce) {
    [].forEach.call(document.querySelectorAll('[data-magnetic]'), function (el) {
      var max = 8;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'translate(' + (x * max * 2).toFixed(1) + 'px,' + (y * max).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
    [].forEach.call(document.querySelectorAll('[data-tilt]'), function (el) {
      var max = 6;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-y * max).toFixed(2) + 'deg) rotateY(' + (x * max).toFixed(2) + 'deg)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }
})();
