/* =========================================================
   EQ CORE CARD page
   Motion here only shows something becoming visible:
   the card ring (fronts and backs), words appearing, a sentence developing,
   the four layers lighting in turn, colour returning to a photo, one card turned over.
   ========================================================= */
(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const CAPTURE = params.has('capture');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FRONTS = 8;
  const NAMES = ['考える', '挑戦する', '言葉にする', '理解する', '責任を持つ', '競争する', '頼る', '共感する'];
  const front = (i) => `images/cards/front-${(i % FRONTS) + 1}.png`;
  const BACK = 'images/cards/back.jpg';

  const once = (els, cls, opts) => {
    if (CAPTURE || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add(cls)); return; }
    const io = new IntersectionObserver((en) => en.forEach((x) => {
      if (x.isIntersecting) { x.target.classList.add(cls); io.unobserve(x.target); }
    }), opts);
    els.forEach((e) => io.observe(e));
  };

  /* ---------- card ring ---------- */
  // The reference showed 52 cards; 20% fewer is 42. Cards stand on a tilted wheel with one edge
  // pointing outward, so the faces are tangential: one half of the ring shows fronts, the other backs.
  const wheel = document.querySelector('.cc-ring__wheel');
  if (wheel) {
    const N = 42;
    const small = window.matchMedia('(max-width: 900px)').matches;
    const cw = small ? 70 : 104, ch = Math.round(cw * 1.4), r0 = small ? 110 : 168;
    wheel.style.setProperty('--cw', cw + 'px');
    wheel.style.setProperty('--ch', ch + 'px');
    const cards = [];
    for (let i = 0; i < N; i++) {
      const c = document.createElement('div');
      c.className = 'cc-card';
      c.style.setProperty('--i', i);
      c.innerHTML = `<img src="${front(i)}" alt="" decoding="async"><img class="bk" src="${BACK}" alt="" decoding="async">`;
      c.dataset.a = (360 / N) * i;
      wheel.appendChild(c);
      cards.push(c);
    }
    const place = (r) => cards.forEach((c) => { c.style.transform = `rotateZ(${c.dataset.a}deg) translateX(${r}px) rotateX(-90deg)`; });
    // cards are thrown out from the hub once, then settle into the ring
    if (reduce || CAPTURE) place(r0);
    else { place(0); requestAnimationFrame(() => requestAnimationFrame(() => place(r0))); }

    let spin = CAPTURE ? 18 : 0, visible = true, last = performance.now(), boost = 0, lastY = window.scrollY;
    wheel.style.setProperty('--spin', spin + 'deg');
    if (!reduce && !CAPTURE) {
      new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(document.querySelector('.cc-ring'));
      window.addEventListener('scroll', () => { boost = Math.min(boost + Math.abs(window.scrollY - lastY) * 0.02, 6); lastY = window.scrollY; }, { passive: true });
      const tick = (t) => {
        const dt = Math.min(t - last, 50) / 1000; last = t;
        if (visible) {
          spin = (spin + dt * (6 + boost * 10)) % 360; // one turn a minute, faster while scrolling
          boost *= 0.94;
          wheel.style.setProperty('--spin', spin.toFixed(2) + 'deg');
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  /* ---------- characters that appear one at a time ---------- */
  document.querySelectorAll('.cc-chars').forEach((el) => {
    let n = 0;
    el.querySelectorAll('.l').forEach((line) => {
      line.innerHTML = Array.from(line.textContent).map((ch) => `<span class="cc-ch" style="--i:${n++}">${ch}</span>`).join('');
    });
  });
  once(document.querySelectorAll('.cc-chars'), 'is-in', { threshold: 0.3 });

  /* ---------- a sentence that develops as the reader scrolls through it ---------- */
  document.querySelectorAll('.cc-develop').forEach((el) => {
    const parts = el.innerHTML.split(/(<br>)/);
    el.innerHTML = parts.map((p) => (p === '<br>' ? p : Array.from(p).map((ch) => `<span class="cc-dv">${ch}</span>`).join(''))).join('');
    const chars = el.querySelectorAll('.cc-dv');
    if (CAPTURE || reduce) { chars.forEach((c) => c.classList.add('on')); return; }
    const update = () => {
      const r = el.getBoundingClientRect(), vh = window.innerHeight;
      const p = Math.min(Math.max((vh * 0.85 - r.top) / (vh * 0.55), 0), 1);
      const k = Math.round(p * chars.length);
      chars.forEach((c, i) => c.classList.toggle('on', i < k));
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  });

  /* ---------- 03: the card turns over when it comes into view ---------- */
  once(document.querySelectorAll('.cc-what__cards'), 'is-flip', { threshold: 0.4 });

  /* ---------- 04: the four layers light in turn ---------- */
  const words = document.querySelectorAll('.cc-how__words li');
  const steps = document.querySelectorAll('.cc-how__step');
  if (words.length && steps.length && 'IntersectionObserver' in window && !CAPTURE) {
    const io = new IntersectionObserver((en) => en.forEach((x) => {
      if (!x.isIntersecting) return;
      const k = Number(x.target.dataset.step);
      words.forEach((w, i) => { w.classList.toggle('is-on', i === k); w.classList.toggle('is-past', i < k); });
    }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => io.observe(s));
  }

  /* ---------- 05 / 06: colour returns, the chain lights up ---------- */
  once(document.querySelectorAll('.cc-row'), 'is-lit', { threshold: 0.45 });
  once(document.querySelectorAll('.cc-proc__list li'), 'is-lit', { rootMargin: '0px 0px -40% 0px' });

  /* ---------- 09: pick one of the face-down cards ---------- */
  const fan = document.querySelector('.cc-pick__fan');
  if (fan) {
    const ask = document.querySelector('.cc-pick__ask');
    const order = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 8; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cc-pick__card';
      b.style.setProperty('--r', ((i - 3.5) * 8) + 'deg');
      b.setAttribute('aria-label', `伏せたカード ${i + 1}枚目をめくる`);
      b.innerHTML = `<span class="in"><img src="${BACK}" alt=""><img class="fr" src="${front(order[i])}" alt=""></span>`;
      b.addEventListener('click', () => {
        const was = b.classList.contains('is-picked');
        fan.querySelectorAll('.cc-pick__card').forEach((c) => c.classList.remove('is-picked'));
        fan.classList.toggle('has-pick', !was);
        if (was) { ask.textContent = ''; return; }
        b.classList.add('is-picked');
        ask.innerHTML = `「${NAMES[order[i]]}」。<br>最近、この言葉を感じた場面はありましたか？`;
      });
      fan.appendChild(b);
    }
  }
})();
