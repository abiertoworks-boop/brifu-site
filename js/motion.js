/* =========================================================
   株式会社Brifu — トップページの動き
   旧サイト（js/main.js）の演出から、今のコーポレートサイトに合うものだけを
   作り直したもの。GSAPは使わず、素のJSとCSSで動かしています。
   ・見出しを一文字ずつ立ち上げる
   ・奥行きのある粒子の背景（Three.jsがあるときだけ）
   ・SERVICEの画像が横に流れ続けるスライダー
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ?capture=1 … 画面確認用に動きを止めるモード（旧サイトと同じ合図）
  var CAPTURE = new URLSearchParams(location.search).has('capture');

  /* ---------- なめらかスクロール（Lenis） ---------- */
  if (typeof Lenis !== 'undefined' && !reduce && !CAPTURE) {
    var lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
    var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    // ページ内リンクはLenis側で動かす
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id === '#') return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -90 });
      });
    });
  }

  // 画面確認モードでは、スクロールしなくても中身が見えている状態にする
  if (CAPTURE) {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- 見出しを一文字ずつ ---------- */
  var titles = [].slice.call(document.querySelectorAll('[data-split]'));
  titles.forEach(function (el) {
    el.classList.add('txt-split');
    var i = 0;
    var walk = function (node) {
      [].slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.nodeValue.split('').forEach(function (c) {
            var s = document.createElement('i');
            s.className = 'ch';
            s.textContent = c;
            s.style.setProperty('--i', i++);
            frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
  });

  /* ---------- 画面に入ったら動かす ---------- */
  var watch = [].slice.call(document.querySelectorAll('.txt-split'));
  if (watch.length) {
    if (!('IntersectionObserver' in window) || CAPTURE) {
      watch.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
      watch.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- 奥行きのある粒子の背景 ----------
     旧サイトの depthField を、必要なところだけ取り出したもの。
     Three.jsが読み込めないときや、動きを減らす設定のときは何もしません。 */
  function depthField(canvas, variant) {
    if (typeof THREE === 'undefined' || reduce) return;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b1a30, variant === 'spiral' ? 0.018 : 0.024);
    var camera = new THREE.PerspectiveCamera(62, 1, 0.1, 120);
    camera.position.set(0, 0, 18);

    var COUNT = window.innerWidth < 768 ? 1100 : 2200;
    var pos = new Float32Array(COUNT * 3);
    var col = new Float32Array(COUNT * 3);
    var cA = new THREE.Color(0xe6c57f), cB = new THREE.Color(0x4f84c4), cW = new THREE.Color(0xffffff);
    for (var i = 0; i < COUNT; i++) {
      var x, y, z;
      if (variant === 'spiral') {
        // ゆっくり回る3本の渦（学びの循環）
        var arm = i % 3, t = Math.random();
        var ang = t * Math.PI * 4 + (arm * Math.PI * 2) / 3;
        var rad = 3 + t * 16;
        x = Math.cos(ang) * rad + (Math.random() - 0.5) * 2.4;
        y = Math.sin(ang) * rad * 0.6 + (Math.random() - 0.5) * 2.4;
        z = -Math.random() * 50;
      } else {
        // 奥へ続くトンネル
        var a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 11;
        x = Math.cos(a) * r;
        y = Math.sin(a) * r * 0.62;
        z = -Math.random() * 52;
      }
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      var mix = Math.random();
      var c = mix > 0.88 ? cW : mix > 0.5 ? cA : cB;
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    var cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    var g = cv.getContext('2d').createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    var ctx = cv.getContext('2d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);

    var points = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.28, map: new THREE.CanvasTexture(cv), vertexColors: true, transparent: true,
      opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
    }));
    scene.add(points);

    var rings = new THREE.Group();
    for (var k = 0; k < 3; k++) {
      rings.add(new THREE.Mesh(
        new THREE.TorusGeometry(6 + k * 2.8, 0.015, 8, 140),
        new THREE.MeshBasicMaterial({ color: 0xe6c57f, transparent: true, opacity: 0.18 - k * 0.04 })
      ));
    }
    rings.position.z = -8;
    scene.add(rings);

    function resize() {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    var clock = new THREE.Clock();
    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { rootMargin: '120px' }).observe(canvas);
    }
    canvas.classList.add('is-on');

    (function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;
      var dt = Math.min(clock.getDelta(), 0.05);
      // 旧サイトと同じく、トンネルはゆっくり奥から手前へ流れる
      points.position.z += dt * (variant === 'spiral' ? 1.6 : 2.6);
      if (points.position.z > 26) points.position.z -= 26;
      points.rotation.z += dt * (variant === 'spiral' ? 0.05 : 0.012);
      rings.rotation.z -= dt * 0.06;
      rings.rotation.x = Math.sin(clock.elapsedTime * 0.12) * 0.12;
      renderer.render(scene, camera);
    })();
  }

  document.querySelectorAll('[data-depth]').forEach(function (cv) {
    if (CAPTURE && !new URLSearchParams(location.search).has('anim')) {
      // 画面確認のときは1コマだけ描く
      depthField(cv, cv.getAttribute('data-depth'));
      return;
    }
    depthField(cv, cv.getAttribute('data-depth'));
  });

  /* ---------- SERVICE：画像が横に流れ続けるスライダー ----------
     旧サイトと同じ作り。前後に複製を置いて、1周ぶん進んだら同じ見た目の位置へ
     そっと戻すので、いつまでも流れ続けます。
     マウスを乗せる・つかむ・ボタンを押す・指で触る間は止まり、少し経つと再開します。 */
  var slider = document.querySelector('.flow-slider');
  if (slider) {
    var vp = slider.querySelector('.flow-slider__viewport');
    var track = slider.querySelector('.flow-track');
    var originals = [].slice.call(track.children);
    var n = originals.length;

    var clone = function (c) {
      var k = c.cloneNode(true);
      k.setAttribute('aria-hidden', 'true');
      k.querySelectorAll('img').forEach(function (im) { im.alt = ''; im.loading = 'eager'; });
      return k;
    };
    originals.slice().reverse().forEach(function (c) { track.insertBefore(clone(c), track.firstChild); });
    originals.forEach(function (c) { track.appendChild(clone(c)); });
    var cards = [].slice.call(track.children); // 3n枚。本物は n〜2n-1
    var dotsWrap = slider.querySelector('.flow-dots');
    var prevBtn = slider.querySelector('.flow-nav[data-dir="-1"]');
    var nextBtn = slider.querySelector('.flow-nav[data-dir="1"]');
    var current = n, shown = -1, ticking = false, down = false;

    originals.forEach(function (c, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', (i + 1) + '枚目を表示');
      b.addEventListener('click', function () { hold(); goTo(nearest(i)); });
      dotsWrap.appendChild(b);
    });
    var dots = [].slice.call(dotsWrap.children);

    // 位置はレイアウトから計算する（カードは拡大縮小しているので実測だとずれるため）
    var metrics = function () {
      var cs = getComputedStyle(track);
      var gap = parseFloat(cs.columnGap || cs.gap) || 0;
      var pad = parseFloat(cs.paddingLeft) || 0;
      var w = cards[0].offsetWidth;
      return { gap: gap, pad: pad, w: w, step: w + gap };
    };
    var centerOf = function (i, m) { return m.pad + i * m.step + m.w / 2; };
    var scrollFor = function (i, m) { return centerOf(i, m) - vp.clientWidth / 2; };
    var nearest = function (k) {
      var best = k, d = Infinity;
      for (var j = k; j < 3 * n; j += n) {
        var dd = Math.abs(j - current);
        if (dd < d) { d = dd; best = j; }
      }
      return best;
    };
    var wrap = function (m) {
      var set = n * m.step;
      if (vp.scrollLeft > scrollFor(2 * n, m) - m.step / 2) vp.scrollLeft -= set;
      else if (vp.scrollLeft < scrollFor(n, m) - m.step / 2) vp.scrollLeft += set;
    };

    var paint = function () {
      ticking = false;
      var m = metrics();
      var viewCenter = vp.scrollLeft + vp.clientWidth / 2;
      var best = 0, bestD = Infinity;
      cards.forEach(function (c, i) {
        var d = Math.abs(centerOf(i, m) - viewCenter);
        var t = Math.min(1, d / (m.step * 1.6));
        c.style.setProperty('--s', (1 - t * 0.26).toFixed(3));
        c.style.setProperty('--o', (1 - t * 0.5).toFixed(3));
        c.style.zIndex = String(50 - Math.round(t * 50));
        if (d < bestD) { bestD = d; best = i; }
      });
      current = best;
      var k = best % n;
      cards.forEach(function (c, i) { c.classList.toggle('is-center', i === best); });
      if (k !== shown) {
        shown = k;
        dots.forEach(function (d, i) {
          d.classList.toggle('is-on', i === k);
          d.setAttribute('aria-current', i === k ? 'true' : 'false');
        });
      }
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } };
    var goTo = function (i) {
      var m = metrics();
      var left = scrollFor(Math.max(0, Math.min(3 * n - 1, i)), m);
      vp.scrollTo({ left: left, behavior: reduce ? 'auto' : 'smooth' });
      setTimeout(function () {
        if (Math.abs(vp.scrollLeft - left) > 4) vp.scrollLeft = left;
        wrap(metrics());
        paint();
      }, 700);
    };

    var SPEED = 40; // 1秒あたりの流れる量（px）
    var auto = !reduce && !CAPTURE, restUntil = 0, visible = false, hovering = false, last = 0, carry = 0;
    var hold = function (ms) { restUntil = performance.now() + (ms || 3500); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(slider);
    } else { visible = true; }
    (function flow(t) {
      requestAnimationFrame(flow);
      var dt = last ? Math.min(t - last, 50) / 1000 : 0;
      last = t;
      if (!auto || !visible || hovering || down || t < restUntil) return;
      carry += SPEED * dt;
      var px = Math.floor(carry);
      if (!px) return;
      carry -= px;
      vp.scrollLeft += px;
      wrap(metrics());
    })(0);

    slider.addEventListener('mouseenter', function () { hovering = true; });
    slider.addEventListener('mouseleave', function () { hovering = false; hold(1200); });
    slider.addEventListener('focusin', function () { hold(6000); });
    vp.addEventListener('wheel', function () { hold(); }, { passive: true });
    vp.addEventListener('touchstart', function () { hold(5000); }, { passive: true });
    vp.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { vp.scrollLeft = scrollFor(current, metrics()); paint(); });
    prevBtn.addEventListener('click', function () { hold(); goTo(current - 1); });
    nextBtn.addEventListener('click', function () { hold(); goTo(current + 1); });
    vp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); hold(); goTo(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); hold(); goTo(current - 1); }
    });

    // マウスでつかんで動かす
    var sx = 0, sl = 0;
    vp.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;
      down = true; sx = e.clientX; sl = vp.scrollLeft; vp.style.cursor = 'grabbing';
    });
    var endDrag = function () {
      if (!down) return;
      down = false; vp.style.cursor = ''; hold(); goTo(current);
    };
    vp.addEventListener('pointermove', function (e) { if (down) vp.scrollLeft = sl - (e.clientX - sx); });
    vp.addEventListener('pointerup', endDrag);
    vp.addEventListener('pointerleave', endDrag);

    var start = function () { vp.scrollLeft = scrollFor(n, metrics()); paint(); };
    start();
    window.addEventListener('load', start);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
    var img0 = originals[0].querySelector('img');
    if (img0 && !img0.complete) img0.addEventListener('load', start, { once: true });
  }
})();
