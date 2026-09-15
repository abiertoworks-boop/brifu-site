/* =========================================================
   Brifu Corporate Site — main.js
   Smooth scroll (Lenis) + GSAP/ScrollTrigger + Three.js depth
   Every effect degrades gracefully if a library fails to load.
   ========================================================= */
(function () {
  'use strict';

  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const hasLenis = typeof Lenis !== 'undefined';
  const hasThree = typeof THREE !== 'undefined';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = () => window.matchMedia('(min-width: 901px)').matches;
  // ?capture=1&sec=#id&off=NNN&p=0..1&isolate=1 : deterministic mode for visual QA
  const params = new URLSearchParams(location.search);
  const CAPTURE = params.has('capture');
  const captureFns = []; // (progress 0..1) setters for pinned effects, used by capture mode only

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }
  const mm = hasGSAP ? gsap.matchMedia() : null;

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (hasLenis && !reduceMotion && !CAPTURE) {
    lenis = new Lenis({ lerp: 0.08, smoothWheel: true, wheelMultiplier: 0.9 });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.4 });
    else {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /* ---------- Internal links ----------
     Same-page anchors scroll smoothly; every other in-site link navigates
     (with a wipe when GSAP is available, plainly otherwise). */
  const transition = document.getElementById('transition');
  const isExternal = (href) => /^(https?:|mailto:|tel:|javascript:)/i.test(href);
  document.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || href === '#' || isExternal(href) || a.target === '_blank' || a.hasAttribute('download')) return;

    if (href.startsWith('#')) {
      a.addEventListener('click', (e) => {
        if (!document.querySelector(href)) return; // no such section: let the browser handle it
        e.preventDefault();
        closeMenu();
        scrollTo(href);
        history.replaceState(null, '', href);
      });
      return;
    }
    // in-site page link: play the wipe, then navigate
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // let the browser open a new tab
      if (!transition || !hasGSAP || reduceMotion) return;                // plain navigation
      e.preventDefault();
      let navigated = false;
      const go = () => { if (navigated) return; navigated = true; window.location.href = a.href; };
      gsap.set(transition, { transformOrigin: 'bottom' });
      gsap.to(transition, { scaleY: 1, duration: 0.55, ease: 'expo.inOut', onComplete: go });
      // requestAnimationFrame is throttled in background tabs, which would stall the tween and
      // strand the visitor on the current page. This timer navigates no matter what.
      setTimeout(go, 900);
    });
  });
  window.addEventListener('pageshow', (e) => {
    if (transition) { transition.style.transform = 'scaleY(0)'; if (hasGSAP) gsap.set(transition, { scaleY: 0 }); }
    if (e.persisted && lenis) lenis.start();
  });

  /* ---------- Title text: character-level motion ---------- */
  function splitTitles() {
    document.querySelectorAll('.split-group').forEach((group) => {
      if (group.dataset.split) return;
      group.dataset.split = '1';
      group.querySelectorAll('.split-line > span').forEach((span) => {
        const walk = (node) => {
          Array.from(node.childNodes).forEach((n) => {
            if (n.nodeType === 3) {
              if (!n.textContent.length) return;
              const frag = document.createDocumentFragment();
              Array.from(n.textContent).forEach((c) => {
                const i = document.createElement('i');
                const blank = c === ' ' || c === '　';
                i.className = blank ? 'ch sp' : 'ch';
                i.textContent = blank ? ' ' : c;
                frag.appendChild(i);
              });
              node.replaceChild(frag, n);
            } else if (n.nodeType === 1) walk(n);
          });
        };
        walk(span);
        span.parentElement.classList.add('is-split');
      });
      group.querySelectorAll('.ch').forEach((c, i) => {
        c.style.transitionDelay = Math.min(i * 0.024, 0.95).toFixed(3) + 's';
      });
    });
  }

  /* ---------- Loader ---------- */
  const loader = document.getElementById('loader');
  const startPage = () => {
    document.body.classList.add('is-ready');
    revealInit();
    if (hasGSAP) ScrollTrigger.refresh();
  };
  if (!reduceMotion) splitTitles();
  if (loader) {
    const letters = loader.querySelectorAll('.word span');
    const bar = loader.querySelector('.bar i');
    const pct = loader.querySelector('.pct');
    const curtain = loader.querySelector('.curtain');
    if (lenis) lenis.stop();
    if (hasGSAP && !reduceMotion && !CAPTURE) {
      const tl = gsap.timeline({
        onComplete: () => { loader.remove(); if (lenis) lenis.start(); }
      });
      const counter = { v: 0 };
      tl.to(letters, { y: 0, opacity: 1, duration: 1, stagger: 0.06, ease: 'expo.out' }, 0)
        .to(bar, { scaleX: 1, duration: 1.4, ease: 'power2.inOut' }, 0.1)
        .to(counter, { v: 100, duration: 1.4, ease: 'power2.inOut', onUpdate: () => { if (pct) pct.textContent = String(Math.round(counter.v)).padStart(3, '0'); } }, 0.1)
        .to(curtain, { scaleY: 1, duration: 0.7, ease: 'expo.inOut' }, 1.5)
        .add(startPage, 1.85)
        .to(loader, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, 1.95);
      // safety net: if rAF is throttled (background tab), never leave the loader covering the page
      setTimeout(() => { if (document.getElementById('loader')) tl.progress(1); }, 6000);
    } else {
      loader.remove();
      if (lenis) lenis.start();
      startPage();
    }
  } else {
    startPage();
  }

  /* ---------- Cursor ---------- */
  const cursor = document.getElementById('cursor');
  if (cursor && window.matchMedia('(hover:hover)').matches) {
    let cx = 0, cy = 0, tx = 0, ty = 0;
    window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
    const loop = () => { cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18; cursor.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); };
    loop();
    document.querySelectorAll('a,button,.tilt,.gcard').forEach((el) => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  /* ---------- Header + Menu ---------- */
  const header = document.querySelector('.header');
  const onScroll = () => { if (header) header.classList.toggle('is-scrolled', window.scrollY > 40); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const menuBtn = document.querySelector('.menu-btn');
  function closeMenu() {
    if (!document.body.classList.contains('menu-open')) return;
    document.body.classList.remove('menu-open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start();
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (lenis) open ? lenis.stop() : lenis.start();
    });
    document.querySelectorAll('.menu a').forEach((a) => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- Reveal on scroll ---------- */
  function revealInit() {
    const targets = document.querySelectorAll('[data-reveal],.img-reveal,.q-list li,.split-group');
    if (!('IntersectionObserver' in window)) { targets.forEach((t) => t.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const delay = parseFloat(en.target.dataset.delay || 0);
          setTimeout(() => en.target.classList.add('is-in'), delay * 1000);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((t) => io.observe(t));
  }

  /* ---------- Marquee ---------- */
  document.querySelectorAll('.marquee__track').forEach((track) => {
    track.innerHTML += track.innerHTML; // duplicate for a seamless loop
    if (hasGSAP && !reduceMotion) {
      const w = track.scrollWidth / 2;
      gsap.to(track, { x: -w, duration: w / 60, ease: 'none', repeat: -1 });
    }
  });

  /* ---------- Parallax backgrounds ---------- */
  if (hasGSAP && !reduceMotion) {
    document.querySelectorAll('[data-parallax]').forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 12;
      gsap.fromTo(el, { yPercent: -amt }, {
        yPercent: amt, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------- HERO : Three.js depth field ---------- */
  const heroCanvas = document.getElementById('hero-canvas');
  if (heroCanvas && hasThree && !reduceMotion) {
    try {
      const renderer = new THREE.WebGLRenderer({ canvas: heroCanvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x061033, 0.045);
      const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
      camera.position.set(0, 0, 14);

      const N = isDesktop() ? 2200 : 900;
      const pos = new Float32Array(N * 3);
      const col = new Float32Array(N * 3);
      const c1 = new THREE.Color(0x5fe0ff), c2 = new THREE.Color(0x2f7bff), c3 = new THREE.Color(0xffffff);
      for (let i = 0; i < N; i++) {
        const r = 6 + Math.random() * 18;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th) * 1.6;
        pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.9;
        pos[i * 3 + 2] = r * Math.cos(ph) - 6;
        const m = Math.random();
        const c = m < 0.15 ? c3 : (m < 0.6 ? c1 : c2);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const sprite = (() => {
        const cv = document.createElement('canvas'); cv.width = cv.height = 64;
        const g = cv.getContext('2d');
        const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.35, 'rgba(255,255,255,.6)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(cv);
      })();
      const mat = new THREE.PointsMaterial({ size: 0.22, map: sprite, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
      const points = new THREE.Points(geo, mat);
      scene.add(points);

      const wire1 = new THREE.Mesh(new THREE.IcosahedronGeometry(5.2, 1), new THREE.MeshBasicMaterial({ color: 0x5fe0ff, wireframe: true, transparent: true, opacity: 0.08 }));
      wire1.position.set(6, 0.5, -4);
      const wire2 = new THREE.Mesh(new THREE.TorusGeometry(9, 0.02, 8, 120), new THREE.MeshBasicMaterial({ color: 0x9defff, transparent: true, opacity: 0.25 }));
      wire2.position.copy(wire1.position); wire2.rotation.x = Math.PI / 2.4;
      const wire3 = wire2.clone(); wire3.rotation.x = Math.PI / 1.6; wire3.rotation.y = 0.6; wire3.scale.setScalar(0.72);
      scene.add(wire1, wire2, wire3);

      const mouse = { x: 0, y: 0 }, target = { x: 0, y: 0 };
      window.addEventListener('mousemove', (e) => { target.x = (e.clientX / innerWidth - 0.5) * 2; target.y = (e.clientY / innerHeight - 0.5) * 2; });
      let scrollP = 0;
      window.addEventListener('scroll', () => { scrollP = Math.min(1, window.scrollY / innerHeight); }, { passive: true });

      const resize = () => {
        const hero = heroCanvas.parentElement;
        const w = hero.clientWidth, h = hero.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', resize); resize();

      const clock = new THREE.Clock();
      let visible = true;
      new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(heroCanvas.parentElement);
      const tick = () => {
        requestAnimationFrame(tick);
        if (!visible) return;
        const t = clock.getElapsedTime();
        mouse.x += (target.x - mouse.x) * 0.04; mouse.y += (target.y - mouse.y) * 0.04;
        points.rotation.y = t * 0.03 + mouse.x * 0.15;
        points.rotation.x = Math.sin(t * 0.08) * 0.08 + mouse.y * 0.1;
        wire1.rotation.y = t * 0.12; wire1.rotation.x = t * 0.07;
        wire2.rotation.z = t * 0.1; wire3.rotation.z = -t * 0.08;
        camera.position.x = mouse.x * 0.8; camera.position.y = -mouse.y * 0.5 - scrollP * 3;
        camera.position.z = 14 - scrollP * 5;
        camera.lookAt(0, -scrollP * 2, 0);
        renderer.render(scene, camera);
      };
      tick();
    } catch (err) { console.warn('hero 3D disabled', err); }
  }

  /* ---------- Depth fields for 02 WHY, 05 WHY EQ and 09 EXPERIENCE ----------
     Same idea as the hero, three other patterns: a tunnel of particles that
     drifts toward the viewer, a slow wave-grid, and a turning spiral. */
  function depthField(canvas, variant) {
    if (!canvas || !hasThree || reduceMotion) return;
    try {
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x061033, variant === 'tunnel' ? 0.03 : variant === 'spiral' ? 0.022 : 0.05);
      const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 120);
      camera.position.set(0, 0, 12);

      const N = isDesktop() ? 1700 : 700;
      const pos = new Float32Array(N * 3);
      const col = new Float32Array(N * 3);
      const cA = new THREE.Color(0x5fe0ff), cB = new THREE.Color(0x2f7bff), cW = new THREE.Color(0xffffff);
      const DEPTH = 90;
      for (let i = 0; i < N; i++) {
        if (variant === 'tunnel') {
          const a = Math.random() * Math.PI * 2;
          const r = 3.5 + Math.random() * 12;
          pos[i * 3] = Math.cos(a) * r;
          pos[i * 3 + 1] = Math.sin(a) * r * 0.62;
          pos[i * 3 + 2] = -Math.random() * DEPTH;
        } else if (variant === 'spiral') {
          // three arms of a slowly turning spiral: the learning cycle, drawn in light
          const arm = i % 3;
          const r = 1 + Math.pow(Math.random(), 0.7) * 19;
          const a = r * 0.34 + arm * (Math.PI * 2 / 3) + (Math.random() - 0.5) * 0.5;
          pos[i * 3] = Math.cos(a) * r;
          pos[i * 3 + 1] = (Math.random() - 0.5) * Math.max(0.4, 2.4 - r * 0.09);
          pos[i * 3 + 2] = Math.sin(a) * r;
        } else {
          pos[i * 3] = (Math.random() - 0.5) * 46;
          pos[i * 3 + 1] = (Math.random() - 0.5) * 26;
          pos[i * 3 + 2] = -Math.random() * 46;
        }
        const m = Math.random();
        const c = m < 0.18 ? cW : (m < 0.62 ? cA : cB);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const sprite = (() => {
        const cv = document.createElement('canvas'); cv.width = cv.height = 64;
        const g = cv.getContext('2d');
        const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.35, 'rgba(255,255,255,.6)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(cv);
      })();
      const points = new THREE.Points(geo, new THREE.PointsMaterial({
        size: variant === 'tunnel' ? 0.3 : variant === 'spiral' ? 0.26 : 0.24, map: sprite, vertexColors: true, transparent: true,
        opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
      }));
      scene.add(points);
      if (variant === 'spiral') { points.position.set(5, -3, -14); points.rotation.x = 0.55; }

      let rings = null;
      if (variant === 'waves') {
        rings = new THREE.Group();
        for (let i = 0; i < 4; i++) {
          const t = new THREE.Mesh(
            new THREE.TorusGeometry(5 + i * 2.6, 0.015, 8, 140),
            new THREE.MeshBasicMaterial({ color: 0x9defff, transparent: true, opacity: 0.22 - i * 0.035 })
          );
          t.rotation.x = Math.PI / 2.2 + i * 0.06;
          rings.add(t);
        }
        rings.position.set(-4, -1, -8);
        scene.add(rings);
      }

      const target = { x: 0, y: 0 }, mouse = { x: 0, y: 0 };
      window.addEventListener('mousemove', (e) => { target.x = (e.clientX / innerWidth - 0.5) * 2; target.y = (e.clientY / innerHeight - 0.5) * 2; });

      const resize = () => {
        const host = canvas.parentElement;
        const w = host.clientWidth, h = host.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', resize); resize();

      const clock = new THREE.Clock();
      let visible = true;
      new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(canvas.parentElement);
      const tick = () => {
        requestAnimationFrame(tick);
        if (!visible) return;
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.getElapsedTime();
        mouse.x += (target.x - mouse.x) * 0.04; mouse.y += (target.y - mouse.y) * 0.04;
        if (variant === 'tunnel') {
          const p = geo.attributes.position.array;
          for (let i = 0; i < N; i++) {
            p[i * 3 + 2] += dt * 5.5;                // toward the camera (half the original speed)
            if (p[i * 3 + 2] > 10) p[i * 3 + 2] -= DEPTH + 10;
          }
          geo.attributes.position.needsUpdate = true;
          points.rotation.z = t * 0.01;
          camera.position.x = mouse.x * 1.1; camera.position.y = -mouse.y * 0.7;
        } else if (variant === 'spiral') {
          points.rotation.y = t * 0.06;
          camera.position.x = mouse.x * 0.8; camera.position.y = -mouse.y * 0.5;
        } else {
          points.rotation.y = t * 0.035 + mouse.x * 0.1;
          points.rotation.x = Math.sin(t * 0.09) * 0.06 + mouse.y * 0.07;
          if (rings) { rings.rotation.z = t * 0.06; rings.rotation.y = Math.sin(t * 0.12) * 0.2; }
          camera.position.x = mouse.x * 0.9; camera.position.y = -mouse.y * 0.6;
        }
        camera.lookAt(0, 0, -10);
        renderer.render(scene, camera);
      };
      tick();
    } catch (err) { console.warn('depth field disabled', err); }
  }
  depthField(document.getElementById('why-canvas'), 'tunnel');
  depthField(document.getElementById('eq-canvas'), 'waves');
  depthField(document.getElementById('exp-canvas'), 'spiral');

  /* ---------- 02 WHY : the object on the right comes toward you ---------- */
  if (hasGSAP && !reduceMotion) {
    const whyOrbit = document.querySelector('.why__orbit');
    if (whyOrbit) {
      gsap.fromTo(whyOrbit,
        { scale: 0.42, xPercent: 14, opacity: 0.35 },
        {
          scale: 1.5, xPercent: -8, opacity: 1, ease: 'none',
          scrollTrigger: { trigger: '.why', start: 'top bottom', end: 'bottom top', scrub: 0.8 }
        });
      gsap.to(whyOrbit.querySelectorAll('span'), { rotate: 360, duration: 46, ease: 'none', repeat: -1, stagger: { each: 5, repeat: -1 } });
    }
    // 08 GROWTH : the overlapping circles grow and drift as you pass
    const gDepth = document.querySelector('.growth__depth');
    if (gDepth) {
      gsap.fromTo(gDepth,
        { scale: 0.6, yPercent: 12, xPercent: 6, opacity: 0.5 },
        {
          scale: 1.35, yPercent: -14, xPercent: -10, opacity: 1, ease: 'none',
          scrollTrigger: { trigger: '.growth', start: 'top bottom', end: 'bottom top', scrub: 0.8 }
        });
    }
    // 07 DOMAINS : each photo zooms inside its frame while the card is on screen
    gsap.utils.toArray('.domain').forEach((card) => {
      const img = card.querySelector('.domain__visual img');
      if (img) gsap.fromTo(img, { scale: 1 }, {
        scale: 1.14, ease: 'none',
        scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      });
    });
  }

  /* ---------- Hero orbit tilt + scroll fade ---------- */
  const orbit = document.querySelector('.hero__orbit');
  if (orbit && hasGSAP && !reduceMotion) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / innerWidth - 0.5), y = (e.clientY / innerHeight - 0.5);
      gsap.to(orbit, { rotateY: x * 26, rotateX: -y * 26, duration: 1.2, ease: 'power3.out' });
    });
    gsap.to(orbit.querySelectorAll('.ring'), { rotateZ: 360, duration: 40, ease: 'none', repeat: -1, stagger: { each: 4, repeat: -1 } });
    gsap.to('.hero__content', { yPercent: -12, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__photo', { yPercent: 18, scale: 1.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- 03 CORE : 3D ring ---------- */
  const ring = document.querySelector('.core__ring');
  if (ring) {
    const items = Array.from(ring.querySelectorAll('.core__item'));
    const n = items.length;
    const dots = document.querySelectorAll('.core__progress i');
    const setActive = (i) => {
      items.forEach((it, k) => it.classList.toggle('is-active', k === i));
      dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
    };
    let lastP = 0;
    const updateRing = (p) => {
      lastP = p;
      if (!isDesktop()) {
        items.forEach((it) => { it.style.transform = ''; it.style.opacity = ''; it.style.zIndex = ''; });
        ring.style.transform = '';
        setActive(0);
        return;
      }
      const R = Math.min(330, Math.max(250, innerWidth * 0.23));
      const angle = -p * 360 * ((n - 1) / n);
      ring.style.transform = `rotateX(-8deg) rotateY(${angle}deg)`;
      items.forEach((it, i) => {
        const slot = (360 / n) * i;
        it.style.transform = `rotateY(${slot}deg) translateZ(${R}px)`;
        const rad = ((slot + angle) * Math.PI) / 180;
        const facing = (Math.cos(rad) + 1) / 2; // 1 = facing the viewer
        it.style.opacity = String(0.22 + facing * 0.78);
        it.style.zIndex = String(Math.round(facing * 10));
      });
      setActive(Math.min(n - 1, Math.round(p * (n - 1))));
    };
    updateRing(0);
    window.addEventListener('resize', () => updateRing(lastP));
    captureFns.push(updateRing);

    if (mm && !reduceMotion) {
      mm.add('(min-width: 901px)', () => {
        const st = ScrollTrigger.create({
          trigger: '.core__pin', start: 'top top', end: '+=' + (n * 520),
          pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 3,
          onUpdate: (self) => updateRing(self.progress)
        });
        return () => { st.kill(); items.forEach((it) => { it.style.transform = ''; it.style.opacity = ''; it.style.zIndex = ''; }); ring.style.transform = ''; };
      });
    }
  }

  /* ---------- 04 EQ definition : video background ---------- */
  const eqVideo = document.querySelector('.eq__video');
  if (eqVideo && !reduceMotion && !CAPTURE) {
    eqVideo.addEventListener('playing', () => eqVideo.classList.add('is-playing'), { once: true });
    // the clip is large, so it is only fetched once the section is close to the viewport
    const tryPlay = () => {
      const p = eqVideo.play();
      if (p && p.catch) p.catch(() => { /* autoplay blocked: the gradient stands on its own */ });
    };
    new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          eqVideo.dataset.want = '1';
          if (!eqVideo.getAttribute('src')) eqVideo.setAttribute('src', eqVideo.dataset.src);
          tryPlay();
        } else {
          eqVideo.dataset.want = '';
          if (!eqVideo.paused) eqVideo.pause();
        }
      });
    }, { rootMargin: '300px 0px' }).observe(eqVideo.parentElement);
    // browsers pause media in a hidden tab; pick it back up on return
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && eqVideo.dataset.want === '1' && eqVideo.paused) tryPlay();
    });
  }

  /* ---------- 05 GAIN : centre-weighted horizontal slider ---------- */
  const slider = document.querySelector('.gain-slider');
  if (slider) {
    const vp = slider.querySelector('.gain-slider__viewport');
    const track = slider.querySelector('.gain-track');
    const cards = Array.from(track.children);
    const dotsWrap = slider.querySelector('.gdots');
    const prevBtn = slider.querySelector('.gnav[data-dir="-1"]');
    const nextBtn = slider.querySelector('.gnav[data-dir="1"]');
    const chipVp = document.querySelector('.gain-row__viewport');
    const chips = Array.from(document.querySelectorAll('.gchip'));
    let current = 0, ticking = false;

    cards.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', (i + 1) + '枚目を表示');
      b.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(b);
    });
    const dots = Array.from(dotsWrap.children);

    // Positions are computed from the layout, never from getBoundingClientRect,
    // because the cards carry a scale transform that would skew the measurement.
    const metrics = () => {
      const cs = getComputedStyle(track);
      const gap = parseFloat(cs.columnGap || cs.gap) || 0;
      const pad = parseFloat(cs.paddingLeft) || 0;
      const w = cards[0].offsetWidth;
      return { gap, pad, w, step: w + gap };
    };
    const centerOf = (i, m) => m.pad + i * m.step + m.w / 2;
    const scrollFor = (i, m) => centerOf(i, m) - vp.clientWidth / 2;

    const paint = () => {
      ticking = false;
      const m = metrics();
      const viewCenter = vp.scrollLeft + vp.clientWidth / 2;
      let best = 0, bestD = Infinity;
      cards.forEach((c, i) => {
        const d = Math.abs(centerOf(i, m) - viewCenter);
        const t = Math.min(1, d / (m.step * 1.6));  // 0 at centre, 1 about two cards away
        c.style.setProperty('--s', (1 - t * 0.3).toFixed(3));
        c.style.setProperty('--o', (1 - t * 0.55).toFixed(3));
        c.style.zIndex = String(50 - Math.round(t * 50));
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best !== current || !cards[best].classList.contains('is-center')) {
        current = best;
        cards.forEach((c, i) => c.classList.toggle('is-center', i === best));
        dots.forEach((d, i) => {
          d.classList.toggle('is-on', i === best);
          d.setAttribute('aria-current', i === best ? 'true' : 'false');
        });
        // keep the upper "学ぶもの" row in step with the lower "得られるもの" slider
        chips.forEach((c, i) => c.classList.toggle('is-on', i === best));
        const on = chips[best];
        if (on && chipVp) {
          const want = on.offsetLeft - (chipVp.clientWidth - on.offsetWidth) / 2;
          chipVp.scrollTo({ left: Math.max(0, want), behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      }
      prevBtn.disabled = vp.scrollLeft <= 2;
      nextBtn.disabled = vp.scrollLeft >= vp.scrollWidth - vp.clientWidth - 2;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } };
    const goTo = (i) => {
      const t = Math.max(0, Math.min(cards.length - 1, i));
      const left = scrollFor(t, metrics());
      vp.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
      // if the smooth scroll is throttled (background tab), land on the card anyway
      setTimeout(() => { if (Math.abs(vp.scrollLeft - left) > 4) { vp.scrollLeft = left; paint(); } }, 700);
    };

    chips.forEach((c, i) => c.addEventListener('click', () => goTo(i)));
    vp.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { vp.scrollLeft = scrollFor(current, metrics()); paint(); });
    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));
    vp.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
    });
    // drag to scrub, for mouse users without a trackpad
    let down = false, sx = 0, sl = 0;
    vp.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      down = true; sx = e.clientX; sl = vp.scrollLeft; vp.style.cursor = 'grabbing';
    });
    const endDrag = () => { if (!down) return; down = false; vp.style.cursor = ''; goTo(current); };
    vp.addEventListener('pointermove', (e) => { if (down) vp.scrollLeft = sl - (e.clientX - sx); });
    vp.addEventListener('pointerup', endDrag);
    vp.addEventListener('pointerleave', endDrag);

    // start with 感情を知る centred
    const start = () => { vp.scrollLeft = scrollFor(0, metrics()); paint(); };
    start();
    window.addEventListener('load', start);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
    if (cards[0].querySelector('img')) {
      const img0 = cards[0].querySelector('img');
      if (!img0.complete) img0.addEventListener('load', start, { once: true });
    }
  }

  /* ---------- 05 Domain stacking cards ---------- */
  if (hasGSAP && !reduceMotion) {
    const cards = gsap.utils.toArray('.domain');
    cards.forEach((card, i) => {
      if (i === cards.length - 1) return;
      gsap.fromTo(card, { scale: 1, opacity: 1 }, {
        scale: 0.93, opacity: 0.5, ease: 'none',
        scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 90px', scrub: true }
      });
    });
  }

  /* ---------- 07 Tilt cards ---------- */
  document.querySelectorAll('.tilt').forEach((box) => {
    const inner = box.querySelector('.tilt__inner');
    if (!inner || !window.matchMedia('(hover:hover)').matches) return;
    box.addEventListener('mousemove', (e) => {
      const r = box.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      inner.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateZ(10px)`;
    });
    box.addEventListener('mouseleave', () => { inner.style.transform = ''; });
  });

  /* ---------- 08 Platform horizontal scroll ---------- */
  const track = document.querySelector('.platform__track');
  if (track && mm && !reduceMotion) {
    mm.add('(min-width: 901px)', () => {
      const getX = () => Math.min(0, -(track.scrollWidth - window.innerWidth));
      const bar = document.querySelector('.platform__bar i');
      const tween = gsap.to(track, {
        x: getX, ease: 'none',
        scrollTrigger: {
          trigger: '.platform__pin', start: 'top top',
          end: () => '+=' + Math.max(400, track.scrollWidth - window.innerWidth + 200),
          pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 2,
          onUpdate: (self) => { if (bar) bar.style.transform = `scaleX(${self.progress})`; }
        }
      });
      gsap.utils.toArray('.stage').forEach((s) => {
        gsap.fromTo(s, { rotateY: 7, z: -50 }, {
          rotateY: -7, z: 0, ease: 'none',
          scrollTrigger: { trigger: s, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
        });
      });
      captureFns.push((p) => { track.style.transform = `translate3d(${getX() * p}px,0,0)`; if (bar) bar.style.transform = `scaleX(${p})`; });
      return () => { track.style.transform = ''; };
    });
  }

  /* ---------- 09 RIPPLE : concentric rings coming forward ---------- */
  const rippleStage = document.querySelector('.ripple__stage');
  if (rippleStage) {
    const rings = Array.from(rippleStage.querySelectorAll('.ripple__ring'));
    const n = rings.length;
    // Centre each ring with negative margins only. GSAP then owns `transform`
    // outright, so scale/z never fight a centring translate — that was the jitter.
    const layoutRings = () => {
      rings.forEach((r, i) => {
        const pct = 20 + i * (80 / (n - 1));
        r.style.width = pct + '%';
        r.style.height = pct + '%';
        r.style.marginLeft = (-pct / 2) + '%';
        r.style.marginTop = (-pct / 2) + '%';
      });
    };
    layoutRings();
    window.addEventListener('resize', layoutRings);

    if (mm && !reduceMotion) {
      mm.add('(min-width: 901px)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: '.ripple__pin', start: 'top top', end: '+=' + (n * 400),
            pin: true, scrub: 0.55, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1
          }
        });
        // fromTo everywhere: explicit start values survive every ScrollTrigger refresh,
        // so the rings cannot drift out of sync when the layout is re-measured.
        const flash = document.querySelector('.ripple__flash');
        tl.fromTo(rippleStage, { rotateX: 0 }, { rotateX: 34, duration: n, ease: 'none' }, 0);
        tl.fromTo('.ripple__core', { scale: 1 }, { scale: 1.65, duration: n, ease: 'sine.inOut' }, 0);
        rings.forEach((r, i) => {
          // each ring arrives, flares, then settles to a soft steady glow
          tl.fromTo(r,
            { opacity: 0, scale: 0.35, z: -300, '--glow': 0 },
            { opacity: 1, scale: 1, z: 0, '--glow': 1, duration: 0.9, ease: 'power2.out' },
            i * 0.85);
          tl.to(r, { '--glow': 0.3, duration: 0.55, ease: 'power1.out' }, i * 0.85 + 0.9);
          if (flash) {
            tl.fromTo(flash, { opacity: 0, scale: 0.35 },
              { opacity: 0.5, scale: 1, duration: 0.4, ease: 'power2.out' }, i * 0.85 + 0.45)
              .to(flash, { opacity: 0, duration: 0.4, ease: 'power1.in' }, i * 0.85 + 0.85);
          }
        });
        tl.fromTo('.ripple__text',
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' },
          (n - 1) * 0.85 + 0.3);
        captureFns.push((p) => tl.progress(p));
        return () => { layoutRings(); };
      });
      mm.add('(max-width: 900px)', () => {
        gsap.set(rings, { opacity: 1, scale: 1, z: 0 });
        gsap.set(rippleStage, { rotateX: 0 });
        gsap.set('.ripple__text', { opacity: 1, y: 0 });
      });
    } else {
      rings.forEach((r) => { r.style.opacity = 1; });
      const rt = document.querySelector('.ripple__text'); if (rt) rt.style.opacity = 1;
    }
  }

  /* ---------- Nav active state ---------- */
  if (hasGSAP) {
    document.querySelectorAll('.nav-links a[href^="#"]').forEach((a) => {
      const sec = document.querySelector(a.getAttribute('href'));
      if (!sec) return;
      ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => a.classList.toggle('is-active', s.isActive) });
    });
  }

  /* ---------- Keep pinned sections measured correctly ---------- */
  if (hasGSAP) {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', () => setTimeout(refresh, 300));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(refresh, 120));
    document.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
    });
  }

  /* ---------- Capture mode (visual QA only) ---------- */
  window.addEventListener('load', () => {
    if (!CAPTURE) return;
    // Headless screenshots cannot capture a scrolled window reliably, so capture mode shifts the
    // document up with a negative margin instead of scrolling, and sets pinned effects by hand.
    const st = document.createElement('style');
    st.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
    document.head.appendChild(st);
    setTimeout(() => {
      if (hasGSAP) { gsap.globalTimeline.pause(); ScrollTrigger.refresh(); }
      const sec = params.get('sec');
      const off = parseFloat(params.get('off') || 0);
      const el = sec ? document.querySelector(sec) : null;
      const y = el ? el.getBoundingClientRect().top + window.scrollY + off : off;
      document.querySelectorAll('[data-reveal],.img-reveal,.q-list li,.split-group').forEach((t) => t.classList.add('is-in'));
      const p = parseFloat(params.get('p'));
      if (!isNaN(p)) captureFns.forEach((fn) => { try { fn(p); } catch (e) { console.warn('capture fn failed', e); } });
      // ?video=1 loads a still frame of the background video so screenshots can show it
      const cv = params.has('video') ? document.querySelector('.eq__video') : null;
      if (cv && cv.dataset.src) {
        cv.addEventListener('loadeddata', () => { cv.currentTime = 3; cv.classList.add('is-playing'); }, { once: true });
        cv.setAttribute('src', cv.dataset.src);
      }
      if (params.has('isolate') && el) {
        const top = el.closest('main > *') || el;
        Array.from(document.querySelector('main').children).forEach((c) => { if (c !== top) c.style.display = 'none'; });
        const footer = document.querySelector('.footer'); if (footer && top !== footer) footer.style.display = 'none';
        if (off) top.style.marginTop = -off + 'px';
        document.querySelector('.header').classList.add('is-scrolled');
      } else if (y > 0) {
        document.body.style.marginTop = -y + 'px';
        document.querySelector('.header').classList.add('is-scrolled');
      }
    }, 700);
  });
})();
