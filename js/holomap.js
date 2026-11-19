/* =========================================================
   株式会社Brifu — EQ Platform 関連マップ（3Dホログラム）
   EQ Platform ガイド（2026.11.13）の構成図を、立体で表したもの。
   ・中心のコア         … EQ Platform
   ・内側の4つの球      … EQ Academy / EQ Humanity / EQTM / EQ Business Nexus
   ・外側の球           … その下にあるコース・事業（構成図のとおりに枝分かれ）
   ・光の線             … 親子のつながり。光の粒が親から子へ流れる
   ・ドラッグで回転、球にカーソルを合わせると説明、クリックでその球へ寄る
   Three.js r128 + OrbitControls。EQ PlatformサイトのMAPと同じ作り方です。
   ========================================================= */
(() => {
  'use strict';
  const root = document.getElementById('holo');
  if (!root || !window.THREE) return;
  const THREE = window.THREE;

  const canvas = root.querySelector('.holo__canvas');
  const labelsEl = root.querySelector('.holo__labels');
  const infoK = root.querySelector('.holo__info-k');
  const infoName = root.querySelector('.holo__info-name');
  const infoDesc = root.querySelector('.holo__info-desc');
  const infoLinksWrap = root.querySelector('.holo__info-links');
  const infoLinks = infoLinksWrap.querySelector('ul');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COMPACT = window.matchMedia('(max-width:820px)').matches;
  const COARSE = window.matchMedia('(pointer: coarse)').matches; // 指で操作する端末か
  const FEW_LABELS = window.matchMedia('(max-width:820px)');

  /* ---------- 色：4つの領域をそれぞれの色で ---------- */
  const CORE_C = new THREE.Color('#d8f0ff');
  const C = {
    academy: new THREE.Color('#5ff6ff'),
    humanity: new THREE.Color('#b9a2ff'),
    eqtm: new THREE.Color('#5dff9e'),
    nexus: new THREE.Color('#ffb547'),
  };
  const FRAME = new THREE.Color('#6f93b8');

  /* ---------- 構成（構成図のとおり） ----------
     deg＝中心から見た向き、ring＝中心からの距離の段、y＝高さ */
  const AREAS = [
    {
      id: 'academy', name: 'EQ Academy', no: '①', deg: 150, c: 'academy',
      role: 'EQの知識・活用法・育成法を学ぶ',
      desc: 'EQを仕事や教育に取り入れたい方へ。知識と手法を学ぶコースと、一定の基準で実践・提供するための認定事業で構成します。',
      children: [
        {
          id: 'skillcourse', name: 'EQ知識実践スキルコース',
          desc: 'EQの知識・手法を学び、仕事・対話・教育に活かすためのコースです。',
          children: [
            { id: 'katsuyo', name: 'EQ活用スキル講座', desc: 'EQの知識や手法を、自分の仕事・対話・教育などに活かすことを学びます。' },
            { id: 'ikusei', name: 'EQ育成スキル講座', desc: '他者のEQを高める方法、教え方、コーチングのノウハウを学びます。' },
          ],
        },
        {
          id: 'nintei', name: 'EQ認定事業',
          desc: 'EQの知識・手法・育成法を、一定の基準で実践・提供するための認定です。',
          children: [
            { id: 'navi', name: 'ナビゲーター認定', desc: 'EQの入口を案内する役割の認定です。' },
            { id: 'inst', name: 'インストラクター認定', desc: 'EQの講座を実施する役割の認定です。' },
            { id: 'coach', name: 'コーチ認定', desc: '対話を通じて個人の成長を支える役割の認定です。' },
          ],
        },
      ],
    },
    {
      id: 'humanity', name: 'EQ Humanity', no: '②', deg: 230, c: 'humanity',
      role: '自身の成長を土台に、EQプロを目指す',
      desc: 'EIA STEP2まで進んだ方を対象に、ご自身の成長を土台として、他者の成長を支えるEQプロを育成します。',
      children: [
        { id: 'pro', name: 'EQプロ育成コース', desc: 'EIAの先の成長と、他者の成長を支えるプロとしての力を育てます。' },
      ],
    },
    {
      id: 'eqtm', name: 'EQTM', no: '③', deg: 310, c: 'eqtm',
      role: '学びと実践で、自分自身のEQを高める',
      desc: 'EQ Skillsで横成長、EIAで縦成長を学び、EQ Growthで実践する。学びと実践の循環で、自分自身のEQを高めます。',
      children: [
        {
          id: 'manabu', name: '学ぶ',
          desc: '横成長と縦成長の、2つの学びがあります。',
          children: [
            { id: 'eqskills', name: 'EQ Skills', desc: '〈横成長〉感情リテラシー、コミュニケーション、自己理解・他者理解など、EQの基礎となる知識とスキルを身につけます。' },
            { id: 'eia', name: 'EIA', desc: '〈縦成長〉自分の認識を自覚し、更新していく継続成長プログラムです。' },
          ],
        },
        {
          id: 'growth', name: '実践する：EQ Growth',
          desc: '学んだことを日常で実践し、気づきを次の学びに戻します。',
          children: [
            { id: 'rinen', name: '理念実践プログラムコース', desc: '理念を日々の行動として実践し続けるためのコースです。' },
            { id: 'jiko', name: '自己能力実践プログラムコース', desc: '自分の力を実際の場面で発揮し、育てていくためのコースです。' },
          ],
        },
      ],
    },
    {
      id: 'nexus', name: 'EQ Business Nexus', no: '④', deg: 30, c: 'nexus',
      role: '事業・組織に合わせた個別コンサルティング',
      desc: '経営・事業・組織づくり・人材育成の課題を整理し、実際に形になるまで個別に伴走します。',
      children: [
        { id: 'consul', name: '事業・組織に合わせた個別コンサルティング', short: '個別コンサルティング', desc: 'No.2・右腕人材の育成を中心に、事業・商品設計、組織づくり・理念教育など、10の支援内容をご用意しています。' },
      ],
    },
  ];

  /* ---------- 立体の座標に並べる ---------- */
  const R1 = COMPACT ? 2.3 : 3.0;   // 4つの領域
  const R2 = COMPACT ? 3.8 : 5.1;   // その下のコース・事業
  const R3 = COMPACT ? 5.0 : 6.9;   // さらにその下
  const rad = (d) => THREE.MathUtils.degToRad(d);
  const place = (deg, r, y) => new THREE.Vector3(Math.cos(rad(deg)) * r, y, Math.sin(rad(deg)) * r);

  const NODES = [];
  const LINKS = [];
  const byId = {};
  const core = {
    id: 'core', name: 'EQ Platform', role: 'Brifuの中核事業', depth: 0, c: CORE_C,
    desc: '学び・実践・人材育成・ビジネスへの活用を、ひとつにつないだBrifuの中核事業です。4つの領域で構成しています。',
    pos: new THREE.Vector3(0, 0.1, 0),
  };
  NODES.push(core); byId.core = core;

  AREAS.forEach((area) => {
    const color = C[area.c];
    const a = {
      id: area.id, name: area.name, no: area.no, role: area.role, desc: area.desc,
      depth: 1, c: color, area: area.id, pos: place(area.deg, R1, 0.95),
    };
    NODES.push(a); byId[a.id] = a;
    LINKS.push({ a: 'core', b: a.id, area: area.id, strong: true });

    const kids = area.children || [];
    const spread2 = kids.length > 1 ? 24 : 0;
    kids.forEach((kid, i) => {
      const deg = area.deg + (kids.length > 1 ? -spread2 / 2 + (spread2 / (kids.length - 1)) * i : 0);
      const n = {
        id: kid.id, name: kid.name, short: kid.short, role: area.name, desc: kid.desc,
        depth: 2, c: color, area: area.id, pos: place(deg, R2, -0.25),
      };
      NODES.push(n); byId[n.id] = n;
      LINKS.push({ a: a.id, b: n.id, area: area.id });

      const grand = kid.children || [];
      const spread3 = grand.length > 2 ? 22 : 14;
      grand.forEach((g, j) => {
        const gdeg = deg + (grand.length > 1 ? -spread3 / 2 + (spread3 / (grand.length - 1)) * j : 0);
        const gn = {
          id: g.id, name: g.name, short: g.short, role: kid.name, desc: g.desc,
          depth: 3, c: color, area: area.id, pos: place(gdeg, R3, -1.45 - (j % 2) * 0.45),
        };
        NODES.push(gn); byId[gn.id] = gn;
        LINKS.push({ a: n.id, b: gn.id, area: area.id, thin: true });
      });
    });
  });
  NODES.forEach((n, i) => { n.i = i; n.heat = 0; });

  /* ---------- 描画の下ごしらえ ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
  camera.position.set(0, COMPACT ? 7.6 : 6.2, COMPACT ? 7.4 : 9.4);
  const world = new THREE.Group();
  scene.add(world);
  const add = (o) => { world.add(o); return o; };

  const glowMat = (color, opacity) => new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const lineMat = (color, opacity) => new THREE.LineBasicMaterial({
    color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false,
  });

  // ぼかした丸（光の粒とグローに使う）
  const dot = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.18, 'rgba(255,255,255,.75)');
    grd.addColorStop(0.45, 'rgba(255,255,255,.18)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const halo = (color, size, opacity) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.set(size, size, 1); return s;
  };
  const circle = (r, y, color, opacity) => {
    const pts = [];
    for (let i = 0; i <= 160; i++) { const t = (i / 160) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r)); }
    return add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(color, opacity)));
  };

  /* ---------- 土台（EQ Platform）：この上に4つの領域が建っている ---------- */
  const BASE = -2.4;
  const PLAT_R = R1 * 1.08;

  // 土台の床面：中心から外へ光が薄れる円盤。同心円と放射線を焼き込んで「面」として見せる
  const deckTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(256, 256, 0, 256, 256, 256);
    grd.addColorStop(0, 'rgba(198,238,255,.42)');
    grd.addColorStop(0.38, 'rgba(126,198,242,.17)');
    grd.addColorStop(0.78, 'rgba(92,170,226,.07)');
    grd.addColorStop(1, 'rgba(92,170,226,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 512, 512);
    g.lineWidth = 2;
    g.strokeStyle = 'rgba(206,242,255,.17)';
    [0.26, 0.46, 0.66, 0.86].forEach((r) => { g.beginPath(); g.arc(256, 256, 256 * r, 0, Math.PI * 2); g.stroke(); });
    g.strokeStyle = 'rgba(196,236,255,.08)';
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      g.beginPath();
      g.moveTo(256 + Math.cos(a) * 44, 256 + Math.sin(a) * 44);
      g.lineTo(256 + Math.cos(a) * 252, 256 + Math.sin(a) * 252);
      g.stroke();
    }
    return new THREE.CanvasTexture(c);
  })();
  const deck = add(new THREE.Mesh(
    new THREE.CircleGeometry(PLAT_R, 96),
    new THREE.MeshBasicMaterial({ map: deckTex, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  ));
  deck.rotation.x = -Math.PI / 2; deck.position.y = BASE;

  // 床の縁（＝土台の輪郭）
  const rimMat = glowMat(CORE_C, 0.22);
  const rim = add(new THREE.Mesh(new THREE.TorusGeometry(PLAT_R, 0.018, 8, 160), rimMat));
  rim.rotation.x = Math.PI / 2; rim.position.y = BASE;
  const rimGlow = add(new THREE.Mesh(new THREE.TorusGeometry(PLAT_R, 0.13, 8, 160), glowMat(CORE_C, 0.045)));
  rimGlow.rotation.x = Math.PI / 2; rimGlow.position.y = BASE;

  // 土台の外枠（八角形）：自然物ではなく「つくられた基盤」に見せる
  const octa = [];
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    octa.push(new THREE.Vector3(Math.cos(a) * PLAT_R * 1.11, BASE, Math.sin(a) * PLAT_R * 1.11));
  }
  add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(octa), lineMat(FRAME, 0.26)));
  [0.5, 0.85, 1.25].forEach((r, i) => circle(r, BASE, FRAME, 0.5 - i * 0.12));

  const rings = [circle(R1, 0.95, FRAME, 0.14), circle(R2, -0.25, FRAME, 0.1), circle(R3, -1.6, FRAME, 0.07)];
  const emitter = add(halo(CORE_C, 1.7, 0.26)); emitter.position.set(0, BASE, 0);

  // 土台から中心の球へ立ちのぼる光の柱
  const COL_H = 2.5;
  const column = add(new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.4, COL_H, 28, 1, true),
    new THREE.MeshBasicMaterial({ color: CORE_C, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  ));
  column.position.y = BASE + COL_H / 2;
  add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, BASE, 0), new THREE.Vector3(0, 1.6, 0)]), lineMat(CORE_C, 0.32)));

  // 4つの領域の「脚」：土台の縁から、それぞれの領域の球へ伸びる支柱
  const feet = [];
  AREAS.forEach((area) => {
    const col = C[area.c];
    const dir = rad(area.deg);
    const top = place(area.deg, R1, 0.95);
    const foot = new THREE.Vector3(top.x, BASE, top.z);
    // 支柱（真下に下ろす）
    add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([foot, top]), lineMat(col, 0.55)));
    // 土台の中心から足元へ伸びる床の線（「この台の上に建っている」ことを示す）
    add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(Math.cos(dir) * 0.3, BASE, Math.sin(dir) * 0.3), foot,
    ]), lineMat(col, 0.32)));
    // 土台に落ちる足元の光
    const mark = add(halo(col, 0.7, 0.4));
    mark.position.copy(foot).setY(BASE + 0.012);
    feet.push(mark);
  });

  /* ---------- 球（縁が光るフレネル） ---------- */
  const fresnel = (color) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: color }, uPower: { value: 1 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uColor; uniform float uPower; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.0); gl_FragColor = vec4(uColor, (f * 1.15 + 0.06) * uPower); }',
  });
  /* ---------- 中心：虹色に光るガラスの球（土台の上でゆっくり回る） ---------- */
  const iridMat = () => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPower: { value: 1 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vP = position; gl_Position = projectionMatrix * mv; }',
    fragmentShader: [
      'uniform float uTime; uniform float uPower;',
      'varying vec3 vN; varying vec3 vV; varying vec3 vP;',
      'vec3 iris(float t){ return 0.55 + 0.45 * cos(6.2831 * (t + vec3(0.0, 0.33, 0.67))); }',
      'void main(){',
      '  float f = pow(1.0 - abs(dot(vN, vV)), 2.2);',
      '  vec3 c = mix(vec3(0.72, 0.92, 1.0), iris(f * 0.9 + vP.y * 0.9 + vP.x * 0.35 + uTime * 0.08), 0.58);',
      '  gl_FragColor = vec4(c * (0.75 + f * 0.8), (f * 1.15 + 0.035) * uPower);',
      '}',
    ].join('\n'),
  });
  function makeCore(size) {
    const grp = new THREE.Group();
    const outMat = iridMat(), inMat = iridMat();
    // ガラスの球（面として光る。ワイヤーだけにしない）
    const outer = new THREE.Mesh(new THREE.SphereGeometry(size, 56, 36), outMat);
    // 経線・緯線：球であることを読み取りやすくする骨組み
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(size * 1.012, 15, 9)),
      lineMat(new THREE.Color('#dff2ff'), 0.1),
    );
    const inner = new THREE.Mesh(new THREE.SphereGeometry(size * 0.54, 36, 24), inMat);
    const innerWire = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(size * 0.57, 1)),
      lineMat(new THREE.Color('#cfe9ff'), 0.16),
    );
    inner.add(innerWire);
    const seed = new THREE.Mesh(
      new THREE.SphereGeometry(size * 0.11, 18, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    // 赤道の輪：土台と同じ向きに寝かせて、球が台に据えられて見えるようにする
    const eq = new THREE.Mesh(new THREE.TorusGeometry(size * 1.06, size * 0.018, 8, 128), glowMat(new THREE.Color('#eaf7ff'), 0.45));
    eq.rotation.x = Math.PI / 2;
    const neb = nebula(CORE_C, size * 0.8);
    grp.add(outer, wire, inner, seed, eq, neb);
    return { grp, outer, inner, wire, eq, neb, mats: [outMat, inMat] };
  }

  /* ---------- 4つの領域：ガラスの球の中で、光の粒が漂う ---------- */
  function nebula(color, radius) {
    const N = COMPACT ? 110 : 200;
    const pos = new Float32Array(N * 3), ph = new Float32Array(N), sz = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      // 球の内側に、中心ほど密に
      const u = Math.random(), v = Math.random(), r = radius * Math.pow(Math.random(), 0.6);
      const th = u * Math.PI * 2, ph2 = Math.acos(2 * v - 1);
      pos[i * 3] = r * Math.sin(ph2) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph2) * Math.sin(th) * 0.9;
      pos[i * 3 + 2] = r * Math.cos(ph2);
      ph[i] = Math.random() * Math.PI * 2;
      sz[i] = 1.2 + Math.random() * 2.6;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uTex: { value: dot }, uPx: { value: renderer.getPixelRatio() }, uColor: { value: color }, uPower: { value: 1 } },
      vertexShader: 'attribute float aPhase; attribute float aSize; uniform float uTime; uniform float uPx; varying float vA; void main(){ vec3 p = position; p += 0.012 * vec3(sin(uTime*0.6+aPhase), cos(uTime*0.5+aPhase*1.7), sin(uTime*0.4+aPhase*2.3)) * 3.0; vec4 mv = modelViewMatrix * vec4(p,1.0); vA = 0.3 + 0.7 * pow(0.5 + 0.5 * sin(uTime * 2.0 + aPhase * 3.0), 2.0); gl_PointSize = aSize * uPx * (15.0 / -mv.z); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D uTex; uniform vec3 uColor; uniform float uPower; varying float vA; void main(){ vec4 t = texture2D(uTex, gl_PointCoord); vec3 c = mix(uColor, vec3(1.0), 0.45); gl_FragColor = vec4(c, t.a * vA * uPower * 1.25); }',
    });
    return new THREE.Points(geo, mat);
  }

  /* ---------- 下の階層：輪をまとったガラスの球 ---------- */
  function planetRing(color, r) {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.045, 8, 72), glowMat(color, 0.85));
    const ringGlow = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.16, 8, 72), glowMat(color, 0.1));
    g.add(ring, ringGlow);
    g.rotation.x = Math.PI / 2 - 0.42;
    g.rotation.z = 0.35;
    return { g, ring, ringGlow };
  }

  const SIZE = { 0: 1.15, 1: 0.85, 2: 0.6, 3: 0.44 };
  const pickables = [];
  NODES.forEach((n) => {
    const k = SIZE[n.depth];
    const g = new THREE.Group();
    g.position.copy(n.pos);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.5 * Math.max(k, 0.8), 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
    hit.userData.node = n;
    let shell = null, neb = null, ring = null;
    const glowBase = n.depth === 0 ? 0.95 : 1.5;
    const glow = halo(n.c, glowBase * k, n.depth === 0 ? 0.3 : 0.45);

    if (n.depth === 0) {
      const orb = makeCore(0.78);
      g.add(orb.grp, glow, hit);
      n.orb = orb;
    } else {
      shell = new THREE.Mesh(new THREE.SphereGeometry(0.3 * k, 36, 24), fresnel(n.c));
      g.add(shell, glow, hit);
      if (n.depth === 1) {
        neb = nebula(n.c, 0.26 * k);
        // 中心のほうは濃く光らせて、星雲らしく見せる
        const inner = halo(n.c, 0.62 * k, 0.5);
        const innerW = halo(new THREE.Color(0xffffff), 0.3 * k, 0.45);
        g.add(neb, inner, innerW);
        n.nebCore = inner;
      } else {
        g.add(new THREE.Mesh(new THREE.SphereGeometry(0.075 * k, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff })));
        ring = planetRing(n.c, 0.52 * k);
        g.add(ring.g);
      }
    }
    add(g);
    pickables.push(hit);
    Object.assign(n, { g, shell, glow, glowBase, neb, ring, k });
  });

  /* ---------- つながりの線と、流れる光 ---------- */
  function curveOf(A, B) {
    const pts = [];
    for (let i = 0; i <= 32; i++) {
      const t = i / 32, bump = Math.sin(Math.PI * t);
      const p = new THREE.Vector3().lerpVectors(A.pos, B.pos, t);
      p.y += bump * 0.22;                 // ふわりとふくらませる
      p.multiplyScalar(1 + bump * 0.02);
      pts.push(p);
    }
    return new THREE.CatmullRomCurve3(pts);
  }
  const links = LINKS.map((L) => {
    const A = byId[L.a], B = byId[L.b];
    const color = C[L.area] || CORE_C;
    const curve = curveOf(A, B);
    const r0 = L.strong ? 0.016 : L.thin ? 0.006 : 0.009;
    const tube = add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, r0, 6, false), glowMat(color, 0.65)));
    const glow = add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, L.strong ? 0.06 : 0.035, 8, false), glowMat(color, L.strong ? 0.16 : 0.07)));
    const count = L.strong ? 4 : 2;
    const pulses = Array.from({ length: count }, (_, i) => {
      const p = add(halo(color, L.strong ? 0.42 : 0.3, 0.9));
      p.userData.o = i / count;
      return p;
    });
    return { ...L, A, B, curve, tube, glow, pulses, base: { tube: 0.65, glow: L.strong ? 0.16 : 0.07 } };
  });

  /* ---------- 漂う光の粒 ---------- */
  const PN = COMPACT ? 760 : 1500;
  const pPos = new Float32Array(PN * 3), pPhase = new Float32Array(PN), pSize = new Float32Array(PN);
  for (let i = 0; i < PN; i++) {
    const r = Math.sqrt(Math.random()) * (R3 + 1.2), t = Math.random() * Math.PI * 2;
    pPos[i * 3] = Math.cos(t) * r; pPos[i * 3 + 1] = BASE + Math.random() * 4.6; pPos[i * 3 + 2] = Math.sin(t) * r;
    pPhase[i] = Math.random() * Math.PI * 2; pSize[i] = 0.13 + Math.random() * 0.3;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('aPhase', new THREE.BufferAttribute(pPhase, 1));
  pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSize, 1));
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uTex: { value: dot }, uPx: { value: renderer.getPixelRatio() } },
    vertexShader: 'attribute float aPhase; attribute float aSize; uniform float uTime; uniform float uPx; varying float vA; void main(){ vec3 p = position; p.y += sin(uTime * 0.3 + aPhase) * 0.12; vec4 mv = modelViewMatrix * vec4(p,1.0); vA = 0.25 + 0.75 * pow(0.5 + 0.5 * sin(uTime * 1.5 + aPhase * 3.0), 3.0); gl_PointSize = aSize * uPx * (7.0 / -mv.z); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform sampler2D uTex; varying float vA; void main(){ vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(vec3(0.62, 0.95, 1.0), t.a * vA * 0.62); }',
  });
  add(new THREE.Points(pGeo, pMat));

  /* ---------- 背景の幾何学（トップの冒頭と同じ、骨組みの多面体と輪） ---------- */
  const geoFrame = new THREE.Group();
  geoFrame.add(new THREE.Mesh(
    new THREE.IcosahedronGeometry(R3 + 1.6, 2),
    new THREE.MeshBasicMaterial({ color: 0x5fe0ff, wireframe: true, transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false }),
  ));
  const halos = [
    new THREE.Mesh(new THREE.TorusGeometry(R3 + 2.6, 0.02, 8, 160), glowMat(new THREE.Color('#9defff'), 0.16)),
    new THREE.Mesh(new THREE.TorusGeometry(R3 + 4.0, 0.016, 8, 160), glowMat(new THREE.Color('#9defff'), 0.1)),
  ];
  halos[0].rotation.set(1.15, 0.3, 0.2);
  halos[1].rotation.set(0.75, -0.4, -0.3);
  halos.forEach((h) => geoFrame.add(h));
  add(geoFrame);

  /* ---------- 名前（HTML） ---------- */
  NODES.forEach((n) => {
    const el = document.createElement('div');
    el.className = 'holo__label holo__label--d' + n.depth;
    el.style.setProperty('--lc', '#' + n.c.getHexString());
    const nm = n.short || n.name;
    el.innerHTML = n.depth === 1
      ? `<small>${n.no}</small><b>${nm}</b>`
      : n.depth === 0 ? `<b>${nm}</b>` : `<b>${nm}</b>`;
    labelsEl.appendChild(el);
    n.label = el;
  });

  /* ---------- 回転 ---------- */
  let controls = null;
  if (THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, canvas);
    Object.assign(controls, {
      // 指・マウスで上下左右とも一周できるようにする（真上・真下だけは反転を避けて少し残す）
      enablePan: false, enableDamping: true, dampingFactor: 0.08,
      rotateSpeed: COMPACT ? 0.95 : 0.8, zoomSpeed: 0.85,
      autoRotate: !reduceMotion, autoRotateSpeed: 0.5,
      minPolarAngle: 0.06, maxPolarAngle: Math.PI - 0.06,
      // 拡大縮小：指が使える端末では常に、マウスの端末は全画面のときだけ（ページのスクロールを奪わないため）
      enableZoom: COARSE,
    });
    if (THREE.TOUCH) controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
    controls.target.set(0, -0.15, 0);
    let idle = 0;
    controls.addEventListener('start', () => { clearTimeout(idle); controls.autoRotate = false; fly = null; root.classList.add('is-touched'); });
    controls.addEventListener('end', () => { clearTimeout(idle); idle = setTimeout(() => { controls.autoRotate = !reduceMotion && !zoomed; }, 4000); });
  }

  /* ---------- カーソルとクリック ---------- */
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2(9, 9);
  let hover = null, focus = null, downAt = null, pinned = false;
  const rectOf = () => canvas.getBoundingClientRect();
  canvas.addEventListener('pointermove', (e) => {
    const r = rectOf();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  });
  canvas.addEventListener('pointerleave', () => ptr.set(9, 9));
  canvas.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved > 6) return;
    const r = rectOf();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const n = pick();
    if (!n) { if (zoomed) goHome(); return; }
    setFocus(n, true);
    flyToNode(n);
  });
  function pick() {
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    return hit ? hit.object.userData.node : null;
  }

  /* ---------- 寄る・戻る ---------- */
  const HOME = new THREE.Vector3(0, 0, 0);
  let baseDist = 14, fly = null, zoomed = false, userZoomed = false;
  // 指で拡大縮小したあとは、画面サイズが変わっても勝手に戻さない
  if (controls) controls.addEventListener('change', () => {
    if (fly) return;
    userZoomed = Math.abs(camera.position.distanceTo(controls.target) - baseDist) > 0.6;
  });
  function flyToNode(n) {
    const p = new THREE.Vector3(); n.g.getWorldPosition(p);
    fly = { target: p, dist: baseDist * 0.5 };
    zoomed = true;
    if (controls) controls.autoRotate = false;
    root.classList.add('is-zoomed');
  }
  function goHome() {
    fly = { target: HOME.clone(), dist: baseDist };
    zoomed = false; pinned = false; userZoomed = false;
    if (controls) controls.autoRotate = !reduceMotion;
    root.classList.remove('is-zoomed');
  }
  const backBtn = root.querySelector('.holo__back');
  if (backBtn) backBtn.addEventListener('click', goHome);

  /* ---------- 全画面 ---------- */
  const fsBtn = root.querySelector('.holo__fs');
  let full = false, home = null;
  function setFull(on) {
    if (on === full) return;
    full = on;
    if (on) { home = document.createComment('holo'); root.before(home); document.body.appendChild(root); }
    else if (home) { home.replaceWith(root); home = null; }
    document.documentElement.classList.toggle('holo-open', on);
    root.classList.toggle('is-full', on);
    if (fsBtn) {
      fsBtn.setAttribute('aria-label', on ? '全画面を閉じる' : '全画面で見る');
      fsBtn.querySelector('span').textContent = on ? '閉じる' : '全画面';
    }
    if (controls) controls.enableZoom = on || COARSE;
    resize();
  }
  if (fsBtn) fsBtn.addEventListener('click', () => setFull(!full));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && full) setFull(false); });
  root.addEventListener('wheel', (e) => { if (full) e.stopPropagation(); }, { passive: true });

  /* ---------- 照らす球と、そのつながり ---------- */
  const related = new Set();
  function setFocus(n, pin) {
    pinned = !!pin;
    if (focus === n) return;
    focus = n;
    if (!n) return;
    const peers = links.filter((l) => l.A === n || l.B === n).map((l) => (l.A === n ? l.B : l.A));
    related.clear(); related.add(n.id);
    peers.forEach((p) => related.add(p.id));
    infoK.textContent = n.depth === 1 ? n.no + ' ' + n.role : n.role || 'EQ PLATFORM';
    infoK.style.color = '#' + n.c.getHexString();
    infoName.textContent = n.name;
    infoDesc.textContent = n.desc;
    infoLinks.replaceChildren(...peers.map((p) => {
      const li = document.createElement('li');
      li.style.setProperty('--lc', '#' + p.c.getHexString());
      li.textContent = p.short || p.name;
      return li;
    }));
    infoLinksWrap.hidden = !peers.length;
  }

  /* ---------- サイズ ---------- */
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const halfW = COMPACT ? R3 * 0.74 : R3 + 1.1;
    baseDist = Math.max(halfW / (tanV * camera.aspect), (R3 * (COMPACT ? 0.5 : 0.62)) / tanV) + 1.2;
    if (controls) {
      controls.minDistance = baseDist * (COARSE ? 0.22 : 0.3);
      controls.maxDistance = baseDist * (COARSE ? 1.95 : 1.6);
      if (!zoomed && !userZoomed) {
        const off = camera.position.clone().sub(controls.target).setLength(baseDist);
        camera.position.copy(controls.target).add(off);
      }
    } else camera.position.setLength(baseDist);
    camera.updateProjectionMatrix();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  window.addEventListener('resize', resize);
  resize();

  /* ---------- 描画 ---------- */
  let running = false, raf = 0, tourAt = 0, tourI = 0;
  const TOUR = ['core', 'academy', 'skillcourse', 'nintei', 'humanity', 'eqtm', 'manabu', 'growth', 'nexus'];
  const clock = new THREE.Clock();
  const v = new THREE.Vector3(), tmp = new THREE.Vector3();
  const lerp = THREE.MathUtils.lerp;

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (fly && controls) {
      controls.target.lerp(fly.target, 0.1);
      const off = camera.position.clone().sub(controls.target);
      const L = lerp(off.length(), fly.dist, 0.1);
      camera.position.copy(controls.target).add(off.setLength(L));
      if (controls.target.distanceTo(fly.target) < 0.005 && Math.abs(L - fly.dist) < 0.01) fly = null;
    }
    if (controls) controls.update();

    const hit = ptr.x < 2 ? pick() : null;
    if (hit !== hover) { hover = hit; root.classList.toggle('is-pointing', !!hit); }
    if (hover) setFocus(hover, false);
    else if (!pinned && !reduceMotion && t - tourAt > 3.4) { tourAt = t; setFocus(byId[TOUR[tourI++ % TOUR.length]], false); }

    NODES.forEach((n) => {
      const on = n === focus ? (hover === n ? 1 : 0.72) : related.has(n.id) && focus ? 0.3 : 0;
      n.heat = lerp(n.heat, on, 1 - Math.pow(0.001, dt));
      n.g.scale.setScalar(1 + n.heat * 0.34 + Math.sin(t * 2 + n.i) * 0.02);
      n.glow.material.opacity = (n.depth === 0 ? 0.26 : 0.38) + n.heat * 0.5;
      n.glow.scale.setScalar((n.glowBase + n.heat * 1.1) * n.k);
      if (n.shell) n.shell.material.uniforms.uPower.value = 0.85 + n.heat * 1.1;
      // 中心の球：土台の上で、軸を保ったままゆっくり回る
      if (n.orb) {
        const c = n.orb;
        c.grp.rotation.y = t * 0.16;
        c.wire.rotation.y = t * 0.09;
        c.wire.rotation.x = Math.sin(t * 0.17) * 0.1;
        c.inner.rotation.y = -t * 0.34;
        c.inner.rotation.z = t * 0.17;
        c.inner.scale.setScalar(1 + Math.sin(t * 1.1) * 0.06);
        c.eq.rotation.z = t * 0.2;
        c.neb.material.uniforms.uTime.value = t;
        c.neb.material.uniforms.uPower.value = 0.55 + n.heat * 0.5;
        c.mats.forEach((m) => { m.uniforms.uTime.value = t; m.uniforms.uPower.value = 0.72 + n.heat * 0.7; });
        c.wire.material.opacity = 0.09 + n.heat * 0.16;
      }
      // 4つの領域：球の中の光の粒が漂う
      if (n.neb) {
        n.neb.material.uniforms.uTime.value = t;
        n.neb.material.uniforms.uPower.value = 0.75 + n.heat * 0.6;
        n.neb.rotation.y = t * 0.12 + n.i;
        n.neb.rotation.x = Math.sin(t * 0.18 + n.i) * 0.3;
      }
      // 下の階層：輪がゆっくり回る
      if (n.ring) {
        n.ring.g.rotation.y = t * 0.35 + n.i;
        n.ring.ring.material.opacity = 0.6 + n.heat * 0.4;
        n.ring.ringGlow.material.opacity = 0.08 + n.heat * 0.16;
      }
    });

    links.forEach((l) => {
      const rel = focus && (l.A === focus || l.B === focus);
      const k = focus ? (rel ? 1.7 : 0.3) : 1;
      l.tube.material.opacity = lerp(l.tube.material.opacity, l.base.tube * k, 0.12);
      l.glow.material.opacity = lerp(l.glow.material.opacity, l.base.glow * k, 0.12);
      const a = rel || !focus ? 1 : 0.2;
      l.pulses.forEach((p) => {
        const u = (t * (rel ? 0.34 : 0.17) + p.userData.o) % 1;
        p.position.copy(l.curve.getPointAt(u));
        p.material.opacity = a * 0.95 * Math.sin(Math.PI * u);
      });
    });

    geoFrame.rotation.y = t * 0.02;
    halos[0].rotation.z = 0.2 + t * 0.03;
    halos[1].rotation.z = -0.3 - t * 0.02;
    emitter.material.opacity = 0.35 + Math.sin(t * 2.1) * 0.1;
    rings.forEach((r, i) => { r.material.opacity = (0.14 - i * 0.03) + Math.sin(t * 1.2 + i) * 0.03; });
    pMat.uniforms.uTime.value = t;

    renderer.render(scene, camera);

    // 名前を球の位置へ。奥にあるものは薄く、小さい球は近くで focus したときだけ
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const put = (el, pos, lift) => {
      v.copy(pos); v.y += lift; v.project(camera);
      tmp.copy(pos).applyMatrix4(camera.matrixWorldInverse);
      const depth = THREE.MathUtils.clamp((-tmp.z - (camera.position.length() - R2)) / (2 * R2), 0, 1);
      el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px,${(-v.y * 0.5 + 0.5) * h}px) translate(-50%,-100%)`;
      el.style.opacity = (1 - depth * 0.75).toFixed(2);
      el.style.zIndex = String(100 - Math.round(depth * 50));
    };
    NODES.forEach((n) => {
      n.g.getWorldPosition(tmp);
      put(n.label, tmp.clone(), ((n.depth === 0 ? 1.18 : 0.4) + n.heat * 0.16) * n.k);
      n.label.classList.toggle('is-on', n === focus);
      // 下の階層は、その領域を照らしているときだけ名前を出す（重なりを防ぐ）
      if (n.depth >= 2 && !(focus && focus.area === n.area)) n.label.style.opacity = '0';
    });
  }
  function start() { if (running) return; running = true; clock.getDelta(); frame(); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? start() : stop())), { rootMargin: '150px' }).observe(root);
  } else start();
  if (reduceMotion) setFocus(core, true);
})();
