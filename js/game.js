'use strict';
/* Enjin pertarungan: pejuang, AI musuh, kesan visual, latar bandar dan HUD. */
const Game = (() => {
  const W = 960, H = 540, GROUND = 488, LEFT = 50, RIGHT = 910;
  const FONT = '"Arial Rounded MT Bold","Trebuchet MS","Segoe UI",Verdana,sans-serif';

  const THEMES = [
    { sky: ['#3d8fe0', '#bfe6ff'], far: '#8fb5d9', mid: '#5d7fa6', win: '#d6ecff', winOff: '#46658c', lit: 0.25, road: '#3b404c', curb: '#9aa3b0', cloud: 'rgba(255,255,255,.85)', house: '#7d93b0', roof: '#c0563f', sun: { x: 820, y: 120, r: 44, c: '#fff6b0' } },
    { sky: ['#ff6a5a', '#ffc27a'], far: '#c0708a', mid: '#6e3b6e', win: '#ffd98a', winOff: '#4e2a52', lit: 0.45, road: '#3a2f3d', curb: '#a37b7b', cloud: 'rgba(255,214,190,.75)', house: '#5b3557', roof: '#2e1a30', sun: { x: 760, y: 330, r: 70, c: '#ffe08a' } },
    { sky: ['#070b26', '#283070'], far: '#1d2457', mid: '#141a3d', win: '#ffe27a', winOff: '#1d2550', lit: 0.55, road: '#23263a', curb: '#4c5272', cloud: 'rgba(120,130,190,.3)', house: '#1b2148', roof: '#0e1230', stars: true, moon: { x: 790, y: 105, r: 34 } },
    { sky: ['#2c3340', '#6a7386'], far: '#4a5263', mid: '#30363f', win: '#cfe3ff', winOff: '#3a414c', lit: 0.3, road: '#2a2e36', curb: '#5b636f', cloud: 'rgba(60,66,80,.85)', house: '#3b424d', roof: '#22262d', rain: true },
  ];

  const MOVES = {
    punch: { wind: 0.11, act: 0.09, rec: 0.2, range: 185, dmg: 7, push: 170, stun: 0.3, en: 7, shake: 4 },
    kick: { wind: 0.22, act: 0.1, rec: 0.3, range: 212, dmg: 12, push: 330, stun: 0.45, en: 10, shake: 7 },
    special: { wind: 0.55, act: 0.55, rec: 0.45, range: 2000, dmg: 28, push: 560, stun: 0.8, en: 0, shake: 14 },
  };

  const BASE = { lean: 0.04, head: 0, fs: 0.45, fe: 2.1, bs: 0.15, be: 2.25, fh: 0.3, fk: -0.5, bh: -0.3, bk: -0.2, dx: 0 };
  const POSE = {
    block: { lean: -0.06, head: 0.15, fs: 1.15, fe: 1.85, bs: 0.95, be: 2.0, fh: 0.35, fk: -0.6, bh: -0.42, bk: -0.25 },
    hurt: { lean: -0.32, head: -0.35, fs: -0.2, fe: 0.9, bs: -0.45, be: 0.7, fh: 0.45, fk: -0.6, bh: -0.45, bk: -0.1, dx: -8 },
    punchW: { lean: -0.08, fs: 0.05, fe: 2.5, bs: 0.5, be: 1.9, dx: -6 },
    punchA: { lean: 0.18, fs: 1.52, fe: 0.04, bs: -0.25, be: 2.0, dx: 14, fh: 0.45, fk: -0.55, bh: -0.45, bk: -0.15 },
    kickW: { lean: -0.12, fh: 1.1, fk: -1.9, fs: 0.6, fe: 2.0, bs: -0.1, be: 2.0, bh: -0.05, bk: -0.1 },
    kickA: { lean: -0.32, head: -0.1, fh: 1.5, fk: -0.04, fs: 0.1, fe: 1.5, bs: 0.6, be: 1.5, bh: -0.08, bk: -0.05 },
    specW: { lean: -0.15, head: -0.1, fs: 0.35, fe: 2.4, bs: 0.35, be: 2.4, fh: 0.5, fk: -0.6, bh: -0.55, bk: -0.15 },
    specA: { lean: 0.12, fs: 1.45, fe: 0.08, bs: 1.38, be: 0.12, fh: 0.55, fk: -0.55, bh: -0.6, bk: -0.1 },
    dodge: { lean: -0.3, fs: -0.1, fe: 1.2, bs: -0.3, be: 1.0, fh: 0.6, fk: -1.0, bh: -0.5, bk: -0.4 },
    win: { lean: -0.05, head: -0.15, fs: 2.95, fe: 0.1, bs: 0.3, be: 2.2 },
    ko: { lean: -0.2, head: -0.4, fs: -0.6, fe: 0.3, bs: -0.7, be: 0.2, fh: 0.3, fk: -0.2, bh: -0.2, bk: -0.1 },
  };

  // Senarai musuh (rekaan asli)
  const MUSUH = [
    { nama: 'BESI BURUK', d: { main: '#b5651d', metal: '#8d7b68', accent: '#f2c14e', glow: '#ffef8a', head: 'kotak', bulk: 1.0 }, spd: 0.8 },
    { nama: 'KALA HIJAU', d: { main: '#3fa34d', metal: '#556b2f', accent: '#d4ff3a', glow: '#ff5252', head: 'raksasa', spikes: true, tail: true, claws: true, bulk: 1.05 }, spd: 0.95 },
    { nama: 'TAUFAN', d: { main: '#5b7c99', metal: '#c0ccd8', accent: '#00d1ff', glow: '#00f0ff', head: 'antena', bulk: 0.92 }, spd: 1.3, hp: 0.9 },
    { nama: 'GERGASI BATU', d: { main: '#7d7d7d', metal: '#5a5246', accent: '#ff9f1c', glow: '#ff7b00', head: 'mono', bulk: 1.25, spikes: true }, spd: 0.75, size: 1.1, hp: 1.25 },
    { nama: 'LEBAH NEON', d: { main: '#f5c400', metal: '#2b2b2b', accent: '#151515', glow: '#b6ff00', head: 'antena', bulk: 0.95 }, spd: 1.2 },
    { nama: 'NAGA MERAH', d: { main: '#c62828', metal: '#5d1a1a', accent: '#ffb300', glow: '#ffee58', head: 'raksasa', spikes: true, tail: true, claws: true, horns: true, bulk: 1.1 }, spd: 1.0, size: 1.08, hp: 1.1 },
    { nama: 'RATU AIS', d: { main: '#8fe3ff', metal: '#e8f7ff', accent: '#3a7bd5', glow: '#ffffff', head: 'visor', bulk: 0.95 }, spd: 1.15 },
    { nama: 'HANTU MALAM', d: { main: '#4a2a7a', metal: '#24183b', accent: '#ff2fd2', glow: '#ff4df0', head: 'mono', bulk: 1.0, spikes: true }, spd: 1.2 },
    { nama: 'KOMANDER ZIRKON', d: { main: '#d4a017', metal: '#6e5a1e', accent: '#1e88e5', glow: '#7df9ff', head: 'antena', bulk: 1.1 }, spd: 1.1, size: 1.08, hp: 1.1 },
    { nama: 'RAJA GERHANA', d: { main: '#2a2a3e', metal: '#4a4a66', accent: '#ff1744', glow: '#ff1744', head: 'mahkota', bulk: 1.25, spikes: true, claws: true }, spd: 1.05, size: 1.18, hp: 1.25 },
  ];

  const SKINS = [
    { nama: 'Biru Perkasa', main: '#2f7de1', accent: '#ffd23f', glow: '#5ff6ff', harga: 0 },
    { nama: 'Merah Api', main: '#e23b3b', accent: '#ffd23f', glow: '#ffb35f', harga: 300 },
    { nama: 'Hijau Hutan', main: '#2ea65a', accent: '#f4f4f4', glow: '#b6ff6a', harga: 300 },
    { nama: 'Ungu Galaksi', main: '#7b4de0', accent: '#ff7ad9', glow: '#e7a6ff', harga: 400 },
    { nama: 'Emas Diraja', main: '#e0a92f', accent: '#2b2b2b', glow: '#fff27a', harga: 600 },
    { nama: 'Putih Salji', main: '#e8eef5', accent: '#3a86ff', glow: '#7ae1ff', harga: 600 },
  ];

  let cv, ctx, k = 1, pw = W, ph = H;
  let scene = 'menu', phase = 'none', phaseT = 0;
  let P = null, E = null, level = 1, roundT = 90, theme = 1;
  let shake = 0, hitStop = 0, slow = 1, flash = 0, bolt = 0, nextBolt = 5;
  let parts = [], floats = [], clouds = [], drops = [], heli = null;
  let bg = null, bgKey = '', time = 0, beepIdx = -1;
  let paused = false, frozen = false, resumeT = 0, resultSent = false, timeUp = false, winner = null, loser = null;
  const input = { left: false, right: false, block: false, buf: null };
  const NOCTRL = { move: 0, block: false, action: null };
  const cb = { onResult: null };

  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // ───────────── Pejuang ─────────────
  function makeFighter(o) {
    return {
      name: o.name, d: o.d, isP: !!o.isP, size: o.size || 1, x: o.x, y: GROUND, vx: 0, facing: o.facing,
      state: 'idle', stateT: 0, phaseA: 'wind', hp: o.hp, maxHp: o.hp, hpShow: o.hp, hpHold: 0, energy: 0,
      dmgMult: o.dmg, defMult: o.def, spdMult: o.spd, enMult: o.en,
      pose: Object.assign({}, BASE), t: Math.random() * 10, walkPh: 0,
      flash: 0, invuln: 0, dodgeCd: 0, stun: 0, hitDone: false, combo: 0, comboT: 0,
      ctrl: { move: 0, block: false, action: null }, ai: o.ai || null, aiT: 0.6, aiPlan: 'wait', aiBlockT: 0, aiSaw: false,
      trail: [], trailT: 0, koA: 0, koLanded: false, thrust: 0, hint: 0
    };
  }
  function playerDesign() {
    const s = SKINS[Save.d.skin] || SKINS[0];
    return { main: s.main, metal: '#c3ccd8', accent: s.accent, glow: s.glow, head: 'visor', bulk: 1.05, jet: true };
  }
  function playerStats() {
    const u = Save.d.upg;
    return { hp: 140 + u.perisai * 16, dmg: 1 + u.kuasa * 0.12, def: 1 - u.perisai * 0.035, spd: 1 + u.laju * 0.07, en: 1 + u.tenaga * 0.15 };
  }
  function makePlayer(x) {
    const s = playerStats();
    return makeFighter({ name: 'PERKASA', d: playerDesign(), isP: true, x, facing: 1, size: 1, hp: s.hp, dmg: s.dmg, def: s.def, spd: s.spd, en: s.en });
  }
  function enemyInfo(L) { return MUSUH[(L - 1) % MUSUH.length]; }
  function makeEnemy(L, x) {
    const m = enemyInfo(L), loop = Math.floor((L - 1) / MUSUH.length);
    return makeFighter({
      name: m.nama, d: Object.assign({}, m.d), x, facing: -1, size: m.size || 1,
      hp: Math.round((88 + L * 16 + loop * 70) * (m.hp || 1)),
      dmg: 0.6 + L * 0.06 + loop * 0.22, def: 1, spd: (m.spd || 1) * (0.85 + Math.min(L, 12) * 0.015), en: 1,
      ai: {
        react: Math.max(0.28, 1.2 - L * 0.08 - loop * 0.1),
        aggr: Math.min(0.88, 0.36 + L * 0.045 + loop * 0.05),
        blockP: Math.min(0.6, 0.03 + L * 0.05 + loop * 0.06),
        dodgeP: L < 3 ? 0 : Math.min(0.5, (L - 2) * 0.06 + loop * 0.08),
        specialP: 0.2 + L * 0.03
      }
    });
  }
  function setState(f, s, force) {
    if (f.state !== s || force) { f.state = s; f.stateT = 0; }
  }

  // ───────────── Babak ─────────────
  function startLevel(L) {
    level = L; scene = 'fight'; phase = 'intro'; phaseT = 0; roundT = 90; beepIdx = -1;
    theme = (L - 1) % THEMES.length;
    P = makePlayer(270); E = makeEnemy(L, 690);
    resetFx();
    resultSent = false; timeUp = false; winner = null; loser = null; resumeT = 0; paused = false;
    clearInput();
  }
  function showMenu() {
    scene = 'menu'; phase = 'none'; theme = 1;
    P = makePlayer(250); E = null; resetFx(); clearInput();
  }
  function showGarage() {
    scene = 'garage'; phase = 'none';
    P = makePlayer(250); P.size = 1.15; E = null; resetFx(); clearInput();
  }
  function refreshLook() { if (P) { P.d = playerDesign(); } }
  function resetFx() {
    parts = []; floats = []; shake = 0; hitStop = 0; slow = 1; flash = 0; bolt = 0; nextBolt = rnd(4, 8);
    clouds = [];
    for (let i = 0; i < 6; i++) clouds.push({ x: rnd(-100, W), y: rnd(50, 230), s: rnd(0.6, 1.4), v: rnd(5, 16) });
    drops = [];
    if (THEMES[theme].rain) for (let i = 0; i < 150; i++) drops.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(700, 1000) });
    heli = { x: rnd(-200, W), y: rnd(120, 210), v: rnd(28, 45) * (Math.random() < 0.5 ? 1 : -1) };
  }

  // ───────────── Input ─────────────
  function key(k, down) {
    if (k === 'left' || k === 'right' || k === 'block') input[k] = down;
    else if (down) input.buf = { a: k, t: time };
  }
  function clearInput() { input.left = input.right = input.block = false; input.buf = null; }

  // ───────────── Kesan ─────────────
  function sparks(x, y, c, n, sp) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), v = rnd(sp * 0.3, sp);
      parts.push({ t: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: rnd(0.2, 0.45), max: 0.45, c, w: rnd(2, 4) });
    }
  }
  function smoke(x, y, n, c, s) {
    for (let i = 0; i < n; i++) parts.push({ t: 'smoke', x: x + rnd(-15, 15), y: y + rnd(-10, 10), vx: rnd(-40, 40), vy: rnd(-70, -20), r: rnd(8, 18) * (s || 1), life: rnd(0.6, 1.2), max: 1.2, c: c || '120,120,130' });
  }
  function dust(x, y, n) {
    for (let i = 0; i < n; i++) parts.push({ t: 'smoke', x: x + rnd(-25, 25), y: y - rnd(0, 6), vx: rnd(-90, 90), vy: rnd(-40, -5), r: rnd(6, 12), life: rnd(0.4, 0.8), max: 0.8, c: '170,150,120' });
  }
  function ring(x, y, c, r) { parts.push({ t: 'ring', x, y, r: 6, R: r || 60, life: 0.3, max: 0.3, c }); }
  function boom(x, y, s) {
    s = s || 1;
    for (let i = 0; i < 14 * s; i++) {
      const a = rnd(0, Math.PI * 2), v = rnd(40, 260) * s;
      parts.push({ t: 'fire', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, r: rnd(10, 26) * s, life: rnd(0.35, 0.75), max: 0.75 });
    }
    smoke(x, y, 6 * s, '70,70,80', 1.6 * s);
    sparks(x, y, '#ffcf4a', 10 * s, 600);
    for (let i = 0; i < 5 * s; i++) parts.push({ t: 'debris', x, y, vx: rnd(-300, 300), vy: rnd(-500, -150), a: rnd(0, 6), va: rnd(-12, 12), s: rnd(5, 11), life: 1.6, max: 1.6, c: '#5a6272' });
    ring(x, y, 'rgba(255,230,160,', 120 * s);
  }
  function floatText(x, y, text, c, size) { floats.push({ x, y, text: String(text), c, size: size || 26, life: 1, max: 1 }); }

  // ───────────── Logik pejuang ─────────────
  function tryAction(f, a) {
    if (a === 'special') {
      if (f.energy < 100) { if (f.isP) f.hint = 1.2; return true; }
      f.energy = 0; startMove(f, 'special'); return true;
    }
    if (a === 'dodge') {
      if (f.dodgeCd > 0) return false;
      setState(f, 'dodge', true);
      f.vx = -f.facing * 640; f.invuln = 0.32; f.dodgeCd = 0.9; f.thrust = 1;
      Sfx.play('dodge');
      return true;
    }
    if (MOVES[a]) { startMove(f, a); return true; }
    return false;
  }
  function startMove(f, m) {
    setState(f, m, true);
    f.hitDone = false; f.phaseA = 'wind';
    if (m === 'special') Sfx.play('charge'); else Sfx.play('whoosh', 0.6);
  }

  function footstep(f) {
    const pts = Robot.points(f);
    dust(pts.footF.x, GROUND, 3);
    shake = Math.max(shake, 1.6 * f.size);
    Sfx.play('step', f.isP ? 0.8 : 0.55);
  }

  function stepFighter(f, o, dt, ctl) {
    f.t += dt; f.stateT += dt;
    f.flash = Math.max(0, f.flash - dt); f.invuln -= dt; f.dodgeCd -= dt;
    f.comboT -= dt; if (f.comboT <= 0) f.combo = 0;
    f.thrust = Math.max(0, f.thrust - dt * 2.2);
    f.hint = Math.max(0, f.hint - dt);
    f.hpHold -= dt;
    if (f.state !== 'ko' && f.state !== 'win' && phase === 'fight') f.energy = Math.min(100, f.energy + dt * 1.5 * f.enMult);
    const c = ctl ? f.ctrl : NOCTRL;
    let used = false;
    const free = f.state === 'idle' || f.state === 'walk' || f.state === 'block';
    if (free && o) f.facing = o.x >= f.x ? 1 : -1;
    if (free && c.action) used = tryAction(f, c.action);

    if (f.state === 'idle' || f.state === 'walk' || f.state === 'block') {
      if (c.block) setState(f, 'block');
      else if (c.move) setState(f, 'walk');
      else setState(f, 'idle');
    }
    if (f.state === 'walk') {
      const fwd = c.move === f.facing;
      f.x += c.move * 210 * f.spdMult * (fwd ? 1 : 0.72) * dt;
      const prev = Math.sin(f.walkPh);
      f.walkPh += dt * 7.5 * f.spdMult * (fwd ? 1 : -1);
      const now = Math.sin(f.walkPh);
      if ((prev < 0) !== (now < 0)) footstep(f);
    }
    if (MOVES[f.state]) attackUpdate(f, o);
    else if (f.state === 'hurt') { if (f.stateT >= f.stun) setState(f, 'idle'); }
    else if (f.state === 'dodge') {
      f.trailT -= dt;
      if (f.trailT <= 0) { f.trailT = 0.045; f.trail.push({ x: f.x, pose: Object.assign({}, f.pose), facing: f.facing, life: 0.25 }); }
      if (f.stateT >= 0.38) setState(f, 'idle');
    } else if (f.state === 'ko') {
      f.koA = Math.min(1.45, f.koA + dt * (1.2 + f.koA * 3));
      if (f.koA >= 1.45 && !f.koLanded) {
        f.koLanded = true; shake += 14; dust(f.x - f.facing * 120 * f.size, GROUND, 16); Sfx.play('kick');
      }
    }
    for (const g of f.trail) g.life -= dt;
    f.trail = f.trail.filter(g => g.life > 0);

    f.x += f.vx * dt;
    f.vx *= Math.exp(-dt * 7);
    f.x = clamp(f.x, LEFT + 30, RIGHT - 30);
    if (f.hpShow > f.hp && f.hpHold <= 0) f.hpShow = Math.max(f.hp, f.hpShow - dt * f.maxHp * 0.4);
    animPose(f, dt);
    return used;
  }

  function attackUpdate(f, o) {
    const m = MOVES[f.state], t = f.stateT;
    const ph = t < m.wind ? 'wind' : t < m.wind + m.act ? 'act' : 'rec';
    if (ph !== f.phaseA) {
      f.phaseA = ph;
      if (ph === 'act') {
        if (f.state === 'special') { Sfx.play('beam'); shake += 6; f.thrust = 1; }
        else f.vx += f.facing * (f.state === 'kick' ? 60 : 90);
      }
    }
    if (ph === 'act' && !f.hitDone && o && (f.state === 'special' ? t < m.wind + 0.14 : t >= m.wind + 0.03)) tryHit(f, o, m);
    if (t >= m.wind + m.act + m.rec) setState(f, 'idle');
  }

  function tryHit(a, d, m) {
    const dx = (d.x - a.x) * a.facing;
    const reach = m.range * a.size + (d.size - 1) * 45;
    if (dx < 0 || dx > reach) return;
    if (d.state === 'ko' || d.invuln > 0) return;
    a.hitDone = true;
    const kind = a.state;
    // gunakan pose serangan penuh supaya percikan muncul di penumbuk/kaki
    const tpose = Object.assign({}, BASE, POSE[kind === 'kick' ? 'kickA' : kind === 'special' ? 'specA' : 'punchA']);
    const pts = Robot.points({ x: a.x, y: a.y, facing: a.facing, size: a.size, d: a.d, pose: tpose });
    let hx, hy;
    if (kind === 'special') { hx = d.x - a.facing * 30 * d.size; hy = GROUND - 200 * d.size; }
    else if (kind === 'kick') { hx = pts.footF.x; hy = pts.footF.y; }
    else { hx = pts.handF.x; hy = pts.handF.y; }
    hx = clamp(hx, Math.min(a.x, d.x) - 20, Math.max(a.x, d.x) + 20);

    let dmg = m.dmg * a.dmgMult;
    const blocked = d.state === 'block' && d.facing === -a.facing;
    if (blocked) {
      dmg *= (kind === 'special' ? 0.35 : 0.15) * d.defMult;
      d.hp -= dmg; d.vx = a.facing * m.push * 0.35; d.hpHold = 0.45;
      d.energy = Math.min(100, d.energy + 5 * d.enMult);
      Sfx.play('block');
      sparks(hx, hy, '#9ff3ff', 12, 420); ring(hx, hy, 'rgba(160,245,255,', 70);
      hitStop = 0.03; shake += m.shake * 0.4;
      floatText(hx, hy - 30, '🛡️', '#9ff3ff', 26);
    } else {
      dmg *= d.defMult;
      d.hp -= dmg; d.flash = 0.09; d.hpHold = 0.5;
      setState(d, 'hurt', true); d.stun = m.stun; d.vx = a.facing * m.push;
      a.combo = (a.comboT > 0 ? a.combo : 0) + 1; a.comboT = 0.9;
      Sfx.play(kind === 'kick' ? 'kick' : kind === 'special' ? 'boom' : 'punch');
      sparks(hx, hy, '#ffd34d', kind === 'kick' ? 16 : 11, 540);
      ring(hx, hy, 'rgba(255,255,255,', kind === 'special' ? 140 : 70);
      if (kind === 'special') boom(hx, hy, 1);
      hitStop = kind === 'special' ? 0.14 : kind === 'kick' ? 0.08 : 0.05;
      shake += m.shake;
      floatText(hx, hy - 24, Math.max(1, Math.round(dmg)), a.isP ? '#ffe14d' : '#ff7070', kind === 'special' ? 40 : 28);
      if (a.combo >= 2) { floats = floats.filter(t => !t.combo || t.owner !== a); floats.push({ x: a.isP ? 150 : W - 150, y: 128, text: a.combo + ' KOMBO!', c: '#ff9f1c', size: 30, life: 1, max: 1, combo: true, owner: a }); }
      d.energy = Math.min(100, d.energy + dmg * 0.55 * d.enMult);
    }
    if (kind !== 'special') a.energy = Math.min(100, a.energy + (m.en + dmg * 0.4) * a.enMult);
    d.hp = Math.max(0, d.hp);
    if (d.hp <= 0) doKO(d);
  }

  function doKO(l) {
    if (phase === 'ko') return;
    phase = 'ko'; phaseT = 0;
    loser = l; winner = l === P ? E : P;
    setState(l, 'ko', true);
    l.vx = (l.x < winner.x ? -1 : 1) * 200;
    l.facing = l.x < winner.x ? 1 : -1;
    slow = 0.3; shake = 20; flash = 0.6;
    Sfx.play('explode');
    boom(l.x, GROUND - 200 * l.size, 1.6);
  }

  function timeOver() {
    timeUp = true;
    const pp = P.hp / P.maxHp, ep = E.hp / E.maxHp;
    doKO(pp >= ep ? E : P);
  }

  function animPose(f, dt) {
    const tp = poseFor(f);
    const rate = MOVES[f.state] ? 42 : f.state === 'hurt' || f.state === 'dodge' ? 30 : 13;
    const a = 1 - Math.exp(-dt * rate);
    for (const kk in tp) f.pose[kk] += (tp[kk] - f.pose[kk]) * a;
  }
  function poseFor(f) {
    const p = Object.assign({}, BASE);
    const br = Math.sin(f.t * 3.2) * 0.04;
    switch (f.state) {
      case 'idle': p.fs += br; p.bs -= br; p.lean += br * 0.3; break;
      case 'walk': {
        const s = Math.sin(f.walkPh), c = Math.cos(f.walkPh);
        p.fh = 0.08 + s * 0.42; p.fk = -0.25 - Math.max(0, c) * 0.7;
        p.bh = 0.08 - s * 0.42; p.bk = -0.25 - Math.max(0, -c) * 0.7;
        p.fs = 0.45 - s * 0.15; p.bs = 0.15 + s * 0.15; p.lean = 0.08;
        break;
      }
      case 'block': Object.assign(p, POSE.block); break;
      case 'hurt': Object.assign(p, POSE.hurt); break;
      case 'dodge': Object.assign(p, POSE.dodge); break;
      case 'win': Object.assign(p, POSE.win); p.fs += Math.sin(f.t * 6) * 0.08; break;
      case 'ko': Object.assign(p, POSE.ko); break;
      case 'punch': case 'kick': case 'special': {
        const m = MOVES[f.state], key = f.state === 'punch' ? 'punch' : f.state === 'kick' ? 'kick' : 'spec';
        if (f.phaseA === 'wind') Object.assign(p, POSE[key + 'W']);
        else if (f.phaseA === 'act' || f.stateT < m.wind + m.act + m.rec * 0.4) Object.assign(p, POSE[key + 'A']);
        if (f.state === 'special' && f.phaseA === 'wind') p.head += Math.sin(f.t * 40) * 0.03;
        break;
      }
    }
    return p;
  }

  // ───────────── AI musuh ─────────────
  function aiBrain(e, p, dt) {
    const c = e.ctrl, A = e.ai;
    c.action = null;
    if (!(e.state === 'idle' || e.state === 'walk' || e.state === 'block')) { c.move = 0; c.block = false; e.aiBlockT = 0; return; }
    const dist = Math.abs(p.x - e.x), toward = p.x > e.x ? 1 : -1;
    if (MOVES[p.state] && p.phaseA === 'wind') {
      if (!e.aiSaw) {
        e.aiSaw = true;
        const r = Math.random();
        if (p.state === 'special') {
          if (r < A.dodgeP) { c.action = 'dodge'; return; }
          if (r < A.dodgeP + A.blockP + 0.1) e.aiBlockT = 1.15;
        } else if (dist < MOVES[p.state].range * p.size + 30 && r < A.blockP) e.aiBlockT = 0.5;
      }
    } else if (!MOVES[p.state]) e.aiSaw = false;
    if (e.aiBlockT > 0) { e.aiBlockT -= dt; c.block = true; c.move = 0; return; }
    c.block = false;
    if (e.energy >= 100 && Math.random() < A.specialP * dt * 3) { c.action = 'special'; return; }
    e.aiT -= dt;
    const reach = MOVES.punch.range * e.size;
    if (e.aiT <= 0) {
      e.aiT = A.react * (0.55 + Math.random() * 0.9);
      const r = Math.random();
      if (dist > reach - 10) e.aiPlan = r < 0.82 ? 'approach' : 'wait';
      else if (r < A.aggr) { c.action = Math.random() < 0.62 ? 'punch' : 'kick'; e.aiPlan = 'wait'; return; }
      else if (r < A.aggr + 0.18) e.aiPlan = 'retreat';
      else e.aiPlan = 'wait';
    }
    if (e.aiPlan === 'approach') {
      c.move = dist > reach - 30 ? toward : 0;
      if (!c.move) e.aiT = Math.min(e.aiT, 0.12);
    } else if (e.aiPlan === 'retreat') c.move = dist < 360 ? -toward : 0;
    else c.move = 0;
  }

  function separate() {
    const minD = 118 * (P.size + E.size) / 2;
    const dx = E.x - P.x;
    if (Math.abs(dx) < minD) {
      const s = dx === 0 ? 1 : Math.sign(dx), push = (minD - Math.abs(dx)) / 2;
      P.x = clamp(P.x - s * push, LEFT + 30, RIGHT - 30);
      E.x = clamp(E.x + s * push, LEFT + 30, RIGHT - 30);
      if (Math.abs(E.x - P.x) < minD - 1) {
        if (P.x <= LEFT + 31 || P.x >= RIGHT - 31) E.x = P.x + s * minD; else P.x = E.x - s * minD;
      }
    }
  }

  // ───────────── Kemas kini ─────────────
  function update(dtReal) {
    time += dtReal;
    updateAmbience(dtReal);
    if (paused || frozen) return;
    if (scene !== 'fight') {
      if (P) stepFighter(P, null, dtReal, false);
      updateParts(dtReal);
      shake *= Math.exp(-dtReal * 10);
      return;
    }
    const dt = dtReal * slow;
    phaseT += dtReal;
    if (phase === 'intro') {
      const idx = phaseT < 1.5 ? -1 : phaseT < 2.1 ? 0 : phaseT < 2.7 ? 1 : phaseT < 3.3 ? 2 : 3;
      if (idx !== beepIdx) { beepIdx = idx; if (idx >= 0 && idx < 3) Sfx.play('beep'); if (idx === 3) Sfx.play('go'); }
      if (phaseT >= 3.3) phase = 'fight';
      stepFighter(P, E, dt, false); stepFighter(E, P, dt, false);
    } else if (phase === 'fight') {
      if (resumeT > 0) {
        resumeT -= dtReal;
        stepFighter(P, E, dt, false); stepFighter(E, P, dt, false);
      } else {
        roundT -= dt;
        if (roundT <= 0) { roundT = 0; timeOver(); }
        P.ctrl.move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        P.ctrl.block = input.block;
        P.ctrl.action = input.buf && time - input.buf.t < 0.3 ? input.buf.a : null;
        if (input.buf && time - input.buf.t >= 0.3) input.buf = null;
        aiBrain(E, P, dt);
        if (hitStop > 0) hitStop -= dtReal;
        else {
          if (stepFighter(P, E, dt, true)) input.buf = null;
          if (phase === 'fight') stepFighter(E, P, dt, true);
          separate();
        }
      }
    } else if (phase === 'ko') {
      if (phaseT > 1.1) slow = 1;
      // pastikan robot yang tumbang kelihatan di dalam skrin (seperti kamera bergerak)
      const away = loser.x < winner.x ? -1 : 1;
      const over = away > 0 ? loser.x + 300 * loser.size - (W - 10) : 10 - (loser.x - 300 * loser.size);
      if (over > 0 && loser.koA > 0.2) { const mv = Math.min(over, 320 * dtReal) * -away; loser.x += mv; winner.x += mv; }
      if (hitStop > 0) hitStop -= dtReal;
      stepFighter(winner, loser, dt, false);
      stepFighter(loser, winner, dt, false);
      if (phaseT > 0.4 && phaseT < 2.6 && Math.random() < dtReal * 5) {
        boom(loser.x + rnd(-110, 110) * loser.size, GROUND - rnd(20, 120) * loser.size, rnd(0.5, 0.9));
        Sfx.play('boom', 0.5); shake += 4;
      }
      if (phaseT > 1.5 && winner.state !== 'win') { setState(winner, 'win', true); if (winner === P) Sfx.play('win'); else Sfx.play('lose'); }
      if (phaseT > 3.8 && !resultSent) {
        resultSent = true; phase = 'done';
        if (cb.onResult) cb.onResult({ win: winner === P, level, hpPct: P.hp / P.maxHp, timeUp, enemy: E.name });
      }
    } else if (phase === 'done') {
      stepFighter(winner, loser, dtReal, false);
      stepFighter(loser, winner, dtReal, false);
    }
    updateParts(dt);
    shake *= Math.exp(-dtReal * 9);
    flash = Math.max(0, flash - dtReal * 1.5);
  }

  function updateAmbience(dt) {
    for (const c of clouds) { c.x += c.v * dt; if (c.x > W + 160) { c.x = -160; c.y = rnd(50, 230); } }
    if (heli) { heli.x += heli.v * dt; if (heli.x > W + 80 || heli.x < -80) { heli.v = -heli.v; heli.y = rnd(120, 210); } }
    for (const d of drops) { d.y += d.v * dt; d.x -= d.v * 0.18 * dt; if (d.y > H) { d.y = rnd(-40, 0); d.x = rnd(0, W + 100); } }
    if (THEMES[theme].rain && scene !== 'garage') {
      nextBolt -= dt;
      if (nextBolt <= 0) { nextBolt = rnd(5, 10); bolt = 0.35; Sfx.play('thunder'); }
    }
    bolt = Math.max(0, bolt - dt);
  }

  function updateParts(dt) {
    for (const p of parts) {
      p.life -= dt;
      if (p.t === 'spark') { p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
      else if (p.t === 'smoke') { p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 22; p.vx *= 0.97; }
      else if (p.t === 'fire') { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy = p.vy * 0.92 - 30 * dt; }
      else if (p.t === 'ring') { p.r += (p.R - p.r) * Math.min(1, dt * 14); }
      else if (p.t === 'debris') {
        p.vy += 1100 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt;
        if (p.y > GROUND + 20) { p.y = GROUND + 20; p.vy *= -0.35; p.vx *= 0.6; p.va *= 0.5; }
      }
    }
    parts = parts.filter(p => p.life > 0);
    if (parts.length > 500) parts.splice(0, parts.length - 500);
    for (const f of floats) { f.life -= dt; f.y -= (f.combo ? 8 : 50) * dt; }
    floats = floats.filter(f => f.life > 0);
  }

  // ───────────── Latar belakang ─────────────
  function mulberry(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const M = 14; // jidar untuk gegaran skrin
  function makeBg(th) {
    const c = document.createElement('canvas');
    c.width = Math.round((W + M * 2) * k); c.height = Math.round((H + M * 2) * k);
    const g = c.getContext('2d');
    g.setTransform(k, 0, 0, k, M * k, M * k);
    const T = THEMES[th], r = mulberry(th * 977 + 13);
    const sg = g.createLinearGradient(0, -M, 0, GROUND);
    sg.addColorStop(0, T.sky[0]); sg.addColorStop(1, T.sky[1]);
    g.fillStyle = sg; g.fillRect(-M, -M, W + M * 2, H + M * 2);
    if (T.stars) for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`; const s = r() < 0.1 ? 2.5 : 1.5; g.fillRect(r() * W, r() * 330, s, s); }
    if (T.sun) {
      const rg = g.createRadialGradient(T.sun.x, T.sun.y, T.sun.r * 0.6, T.sun.x, T.sun.y, T.sun.r * 3);
      rg.addColorStop(0, 'rgba(255,240,180,.6)'); rg.addColorStop(1, 'rgba(255,240,180,0)');
      g.fillStyle = rg; g.fillRect(0, 0, W, GROUND);
      g.beginPath(); g.arc(T.sun.x, T.sun.y, T.sun.r, 0, Math.PI * 2); g.fillStyle = T.sun.c; g.fill();
    }
    if (T.moon) {
      g.beginPath(); g.arc(T.moon.x, T.moon.y, T.moon.r, 0, Math.PI * 2); g.fillStyle = '#f3f1d8'; g.fill();
      for (const [dx, dy, rr2] of [[-10, -6, 6], [8, 10, 4], [10, -12, 3]]) { g.beginPath(); g.arc(T.moon.x + dx, T.moon.y + dy, rr2, 0, Math.PI * 2); g.fillStyle = '#dcd9bd'; g.fill(); }
    }
    // latar jauh
    let x = -M;
    while (x < W + M) {
      const w = 26 + r() * 48, h = 110 + r() * 210;
      g.fillStyle = T.far; g.fillRect(x, GROUND - 40 - h, w, h + 40);
      if (r() < 0.25) { g.fillRect(x + w / 2 - 1.5, GROUND - 40 - h - 26, 3, 26); }
      x += w + r() * 8;
    }
    // bangunan tengah dengan tingkap
    x = -M - 10;
    while (x < W + M) {
      const w = 50 + r() * 70, h = 80 + r() * 150, top = GROUND - 14 - h;
      g.fillStyle = T.mid; g.fillRect(x, top, w, h + 14);
      g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x + w - 8, top, 8, h + 14);
      for (let wy = top + 10; wy < GROUND - 30; wy += 16)
        for (let wx = x + 7; wx < x + w - 12; wx += 12) { g.fillStyle = r() < T.lit ? T.win : T.winOff; g.fillRect(wx, wy, 6, 9); }
      if (r() < 0.3) { g.fillStyle = T.mid; g.fillRect(x + w * 0.3, top - 12, w * 0.4, 12); }
      x += w + 4 + r() * 14;
    }
    // rumah & pokok kecil (menunjukkan robot sangat besar!)
    x = -M;
    while (x < W + M) {
      const kind = r();
      if (kind < 0.55) {
        const w = 18 + r() * 22, h = 12 + r() * 16, base = GROUND - 14;
        g.fillStyle = T.house; g.fillRect(x, base - h, w, h);
        g.fillStyle = T.roof; g.beginPath(); g.moveTo(x - 3, base - h); g.lineTo(x + w / 2, base - h - 10); g.lineTo(x + w + 3, base - h); g.closePath(); g.fill();
        g.fillStyle = r() < 0.5 ? T.win : T.winOff; g.fillRect(x + 4, base - h + 4, 4, 4);
        x += w + 4 + r() * 8;
      } else {
        const base = GROUND - 14;
        g.fillStyle = '#3c2a1e'; g.fillRect(x + 4, base - 10, 3, 10);
        g.fillStyle = th === 2 ? '#1d4a3a' : th === 1 ? '#5b4a3a' : '#3f8f4f';
        g.beginPath(); g.arc(x + 5.5, base - 14, 8, 0, Math.PI * 2); g.fill();
        x += 14 + r() * 8;
      }
    }
    // jalan raya
    g.fillStyle = T.curb; g.fillRect(-M, GROUND - 16, W + M * 2, 8);
    g.fillStyle = T.road; g.fillRect(-M, GROUND - 8, W + M * 2, H - GROUND + 8 + M);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(-M, GROUND - 8, W + M * 2, 3);
    g.fillStyle = 'rgba(255,230,120,.6)';
    for (let lx = -M; lx < W + M; lx += 70) g.fillRect(lx, GROUND + 30, 36, 5);
    return c;
  }
  function ensureBg() {
    const key = theme + ':' + pw;
    if (bgKey !== key || !bg) { bg = makeBg(theme); bgKey = key; }
  }

  // ───────────── Lukisan ─────────────
  function drawClouds() {
    const T = THEMES[theme];
    ctx.fillStyle = T.cloud;
    for (const c of clouds) {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 50 * c.s, 16 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + 26 * c.s, c.y - 10 * c.s, 30 * c.s, 18 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x - 24 * c.s, c.y - 6 * c.s, 24 * c.s, 13 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (heli) {
      const hx = heli.x, hy = heli.y, s = heli.v > 0 ? 1 : -1;
      ctx.save(); ctx.translate(hx, hy); ctx.scale(s, 1);
      ctx.fillStyle = theme === 2 ? '#0a0d22' : 'rgba(30,35,50,.8)';
      ctx.beginPath(); ctx.ellipse(0, 0, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(-22, -1.5, 14, 3);
      ctx.fillRect(-14, -9, 28, 1.5);
      ctx.fillStyle = Math.sin(time * 8) > 0 ? '#ff4040' : 'rgba(0,0,0,0)';
      ctx.fillRect(-23, -3, 3, 3);
      ctx.restore();
    }
  }
  function drawShadow(f) {
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    ctx.beginPath(); ctx.ellipse(f.x - (f.koA ? f.facing * 80 * f.size * f.koA / 1.45 : 0), GROUND + 3, (70 + (f.koA ? 90 : 0)) * f.size, 11, 0, 0, Math.PI * 2); ctx.fill();
  }
  function drawFighter(f) {
    for (const g of f.trail) {
      ctx.globalAlpha = Math.max(0, g.life / 0.25) * 0.35;
      Robot.draw(ctx, { x: g.x, y: GROUND, facing: g.facing, size: f.size, pose: g.pose, d: f.d, t: f.t, energy: 0, thrust: 0, koA: 0 }, 'ghost');
    }
    ctx.globalAlpha = 1;
    Robot.draw(ctx, f, f.flash > 0 ? 'flash' : undefined);
    if (f.state === 'block') {
      const sx = f.x + f.facing * 92 * f.size, sy = GROUND - 205 * f.size;
      const a = 0.45 + Math.sin(time * 14) * 0.12;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(140,240,255,${a})`; ctx.lineWidth = 4;
      ctx.fillStyle = `rgba(120,220,255,${a * 0.25})`;
      ctx.beginPath(); ctx.ellipse(sx, sy, 20 * f.size, 92 * f.size, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(sx - 14 * f.size, sy + i * 30 * f.size); ctx.lineTo(sx + 14 * f.size, sy + i * 30 * f.size); ctx.stroke(); }
      ctx.restore();
    }
  }
  function drawBeam(f) {
    if (f.state !== 'special') return;
    const m = MOVES.special, t = f.stateT;
    const pts = Robot.points(f);
    const ox = (pts.handF.x + pts.handB.x) / 2 + f.facing * 10, oy = (pts.handF.y + pts.handB.y) / 2;
    const glow = f.d.glow;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (t < m.wind) {
      const u = t / m.wind, r = (6 + u * 26) * f.size;
      const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, r * 2.2);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, glow); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox, oy, r * 2.2, 0, Math.PI * 2); ctx.fill();
      if (Math.random() < 0.7) {
        const a = rnd(0, Math.PI * 2), d = rnd(70, 130);
        parts.push({ t: 'spark', x: ox + Math.cos(a) * d, y: oy + Math.sin(a) * d, vx: -Math.cos(a) * d * 4, vy: -Math.sin(a) * d * 4 + 0, life: 0.22, max: 0.45, c: glow, w: 3 });
      }
    } else if (t < m.wind + m.act + 0.08) {
      const u = (t - m.wind) / m.act;
      const w = Math.max(0, (46 * (1 - Math.pow(Math.min(1, u), 3)) + Math.sin(time * 70) * 5)) * f.size;
      const ex = f.facing > 0 ? W + 40 : -40;
      const x0 = Math.min(ox, ex), x1 = Math.max(ox, ex);
      const g = ctx.createLinearGradient(0, oy - w, 0, oy + w);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.3, glow); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.7, glow); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(x0, oy - w, x1 - x0, w * 2);
      const rg = ctx.createRadialGradient(ox, oy, 0, ox, oy, w * 1.8);
      rg.addColorStop(0, '#ffffff'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(ox, oy, w * 1.8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  function drawParts() {
    for (const p of parts) {
      const a = Math.max(0, p.life / p.max);
      if (p.t === 'spark') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = p.c; ctx.globalAlpha = Math.min(1, a * 2); ctx.lineWidth = p.w;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); ctx.stroke();
        ctx.restore();
      } else if (p.t === 'smoke') {
        ctx.fillStyle = `rgba(${p.c},${a * 0.45})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      } else if (p.t === 'fire') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const col = a > 0.6 ? '255,240,180' : a > 0.35 ? '255,160,50' : '200,60,20';
        ctx.fillStyle = `rgba(${col},${Math.min(1, a * 1.4)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.6 + a * 0.6), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (p.t === 'ring') {
        ctx.strokeStyle = p.c + a + ')'; ctx.lineWidth = 5 * a + 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
      } else if (p.t === 'debris') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.globalAlpha = Math.min(1, a * 3); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.7);
        ctx.restore();
      }
    }
  }
  function outlinedText(text, x, y, size, fill, align, stroke) {
    ctx.font = `900 ${size}px ${FONT}`;
    ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size / 7); ctx.strokeStyle = stroke || '#12162a';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill; ctx.fillText(text, x, y);
  }
  function drawFloats() {
    for (const f of floats) {
      ctx.globalAlpha = Math.min(1, f.life * 2.5);
      const s = f.size * (1 + (1 - f.life) * 0.15);
      outlinedText(f.text, f.x, f.y, s, f.c);
    }
    ctx.globalAlpha = 1;
  }
  function drawRain() {
    ctx.strokeStyle = 'rgba(200,220,255,.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const d of drops) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + 5, d.y - 22); }
    ctx.stroke();
  }
  function drawBolt() {
    if (bolt <= 0) return;
    ctx.fillStyle = `rgba(230,240,255,${bolt * 0.9})`; ctx.fillRect(-M, -M, W + M * 2, H + M * 2);
    if (bolt > 0.2) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
      ctx.beginPath(); let x = 300 + (nextBolt * 97) % 400, y = 0; ctx.moveTo(x, y);
      while (y < 300) { x += rnd(-30, 30); y += rnd(20, 40); ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }

  function hpBar(x, y, w, h, f, right) {
    ctx.fillStyle = 'rgba(10,14,30,.8)';
    Robot.rr(ctx, x - 5, y - 5, w + 10, h + 10, 10); ctx.fill();
    const pct = clamp(f.hp / f.maxHp, 0, 1), gh = clamp(f.hpShow / f.maxHp, 0, 1);
    const draw = (p, col) => {
      if (p <= 0) return;
      const bw = w * p, bx = right ? x + w - bw : x;
      ctx.fillStyle = col; Robot.rr(ctx, bx, y, bw, h, 6); ctx.fill();
    };
    draw(gh, '#ffffff');
    const col = pct > 0.5 ? '#38d66b' : pct > 0.25 ? '#ffc93c' : '#ff4b4b';
    draw(pct, col);
    ctx.fillStyle = 'rgba(255,255,255,.28)';
    if (pct > 0) { const bw = w * pct; Robot.rr(ctx, right ? x + w - bw : x, y + 2, bw, h * 0.35, 4); ctx.fill(); }
  }
  function enBar(x, y, w, h, f, right) {
    ctx.fillStyle = 'rgba(10,14,30,.8)';
    Robot.rr(ctx, x - 3, y - 3, w + 6, h + 6, 6); ctx.fill();
    const p = clamp(f.energy / 100, 0, 1), full = p >= 1;
    const bw = w * p, bx = right ? x + w - bw : x;
    if (bw > 0) {
      ctx.fillStyle = full ? (Math.sin(time * 12) > 0 ? '#ffffff' : f.d.glow) : '#3ec6ff';
      Robot.rr(ctx, bx, y, bw, h, 4); ctx.fill();
    }
  }
  function fmt(s) { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }

  function drawHUD() {
    const bw = 350;
    outlinedText(P.name, 22, 20, 18, '#ffffff', 'left');
    outlinedText(E.name, W - 22, 20, 18, '#ffffff', 'right');
    hpBar(22, 34, bw, 24, P, false);
    hpBar(W - 22 - bw, 34, bw, 24, E, true);
    enBar(22, 68, 220, 11, P, false);
    enBar(W - 22 - 220, 68, 220, 11, E, true);
    outlinedText('⚡', 252, 73, 16, '#ffe14d', 'left');
    outlinedText('⚡', W - 252, 73, 16, '#ffe14d', 'right');
    if (P.energy >= 100) outlinedText('PENUH! Tekan ⚡', 276, 74, 14, Math.sin(time * 10) > 0 ? '#ffe14d' : '#ffffff', 'left');
    else if (P.hint > 0) outlinedText('Belum penuh!', 276, 74, 14, '#ff9d9d', 'left');
    // pemasa pusingan
    ctx.fillStyle = 'rgba(10,14,30,.85)';
    ctx.beginPath(); ctx.arc(W / 2, 44, 32, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.stroke();
    outlinedText(String(Math.ceil(roundT)), W / 2, 46, 30, roundT <= 10 ? '#ff6b6b' : '#ffffff');
    outlinedText('PERINGKAT ' + level, W / 2, 90, 13, '#ffd23f');
    // kiraan masa rehat
    if (typeof Rehat !== 'undefined') {
      const rem = Rehat.remaining();
      const txt = '⏰ Rehat ' + fmt(rem);
      ctx.font = `900 13px ${FONT}`;
      const tw = ctx.measureText(txt).width + 18;
      ctx.fillStyle = rem < 60 ? 'rgba(220,60,60,.85)' : 'rgba(10,14,30,.7)';
      Robot.rr(ctx, W / 2 - tw / 2, 102, tw, 22, 11); ctx.fill();
      outlinedText(txt, W / 2, 114, 13, '#ffffff');
    }
  }

  function drawBanner() {
    if (phase === 'intro' || (phase === 'fight' && phaseT < 4.1)) {
      if (phaseT < 1.5) {
        const u = Math.min(1, phaseT / 0.3);
        outlinedText('PERINGKAT ' + level, W / 2 + (1 - u) * -400, 210, 64, '#ffd23f');
        outlinedText('PERKASA  VS  ' + E.name, W / 2 + (1 - u) * 400, 275, 30, '#ffffff');
      } else if (phaseT < 3.3) {
        const n = 3 - Math.floor((phaseT - 1.5) / 0.6), u = ((phaseT - 1.5) % 0.6) / 0.6;
        outlinedText(String(n), W / 2, 240, 110 * (1.3 - u * 0.3), '#ffffff');
      } else {
        const u = (phaseT - 3.3) / 0.8;
        ctx.globalAlpha = 1 - Math.max(0, u - 0.6) / 0.4;
        outlinedText('LAWAN!', W / 2, 240, 100 * (1 + u * 0.15), '#ff5e3a');
        ctx.globalAlpha = 1;
      }
    }
    if (phase === 'fight' && resumeT > 0) {
      if (resumeT > 0.7) outlinedText('SEDIA...', W / 2, 240, 70, '#ffd23f');
      else outlinedText('LAWAN!', W / 2, 240, 100, '#ff5e3a');
    }
    if (phase === 'ko' || phase === 'done') {
      const u = Math.min(1, phaseT / 0.25);
      const txt = timeUp ? 'MASA TAMAT!' : 'K.O.!';
      outlinedText(txt, W / 2, 220, (timeUp ? 70 : 120) * (2 - u), '#ff3d3d', 'center', '#ffffff');
      if (phaseT > 1.5) {
        const win = winner === P;
        outlinedText(win ? 'KAMU MENANG! 🏆' : 'ALAMAK, KALAH!', W / 2, 310, 42, win ? '#ffe14d' : '#9ecbff');
      }
    }
  }

  function drawGarage() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#26304a'); g.addColorStop(1, '#0c111d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.04)';
    for (let x = 0; x < W; x += 80) ctx.fillRect(x, 0, 4, GROUND);
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    for (let y = 60; y < GROUND; y += 90) ctx.fillRect(0, y, W, 3);
    // lampu sorot
    const sg = ctx.createRadialGradient(250, 120, 10, 250, 380, 330);
    sg.addColorStop(0, 'rgba(255,255,220,.28)'); sg.addColorStop(1, 'rgba(255,255,220,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(200, 0); ctx.lineTo(300, 0); ctx.lineTo(470, GROUND); ctx.lineTo(30, GROUND); ctx.closePath(); ctx.fill();
    // lantai
    ctx.fillStyle = '#1a2030'; ctx.fillRect(0, GROUND - 8, W, H);
    for (let x = -40; x < W; x += 40) {
      ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.moveTo(x, H - 18); ctx.lineTo(x + 20, H - 18); ctx.lineTo(x + 40, H); ctx.lineTo(x + 20, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(x + 20, H - 18); ctx.lineTo(x + 40, H - 18); ctx.lineTo(x + 60, H); ctx.lineTo(x + 40, H); ctx.closePath(); ctx.fill();
    }
    // pelantar
    ctx.fillStyle = '#3a4560'; ctx.beginPath(); ctx.ellipse(250, GROUND + 6, 160, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = P ? P.d.glow : '#5ff6ff'; ctx.lineWidth = 3; ctx.globalAlpha = 0.6 + Math.sin(time * 3) * 0.3;
    ctx.beginPath(); ctx.ellipse(250, GROUND + 6, 150, 22, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    if (P) { drawShadow(P); Robot.draw(ctx, P); }
    drawParts();
  }

  function render() {
    if (!ctx) return;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    if (scene === 'garage') { drawGarage(); return; }
    ensureBg();
    const sx = shake > 0.3 ? rnd(-shake, shake) * 0.6 : 0, sy = shake > 0.3 ? rnd(-shake, shake) * 0.6 : 0;
    ctx.save();
    ctx.translate(clamp(sx, -M, M), clamp(sy, -M, M));
    ctx.drawImage(bg, -M, -M, W + M * 2, H + M * 2);
    drawClouds();
    drawBolt();
    if (E) drawShadow(E);
    if (P) drawShadow(P);
    const order = [E, P].filter(Boolean);
    if (phase === 'ko' || phase === 'done') order.sort((a, b) => (a === loser ? -1 : 1));
    for (const f of order) drawFighter(f);
    for (const f of order) drawBeam(f);
    drawParts();
    if (THEMES[theme].rain) drawRain();
    drawFloats();
    ctx.restore();
    if (scene === 'fight' && P && E) { drawHUD(); drawBanner(); }
    if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.6})`; ctx.fillRect(0, 0, W, H); }
  }

  function resize(cssW, cssH, dpr) {
    k = (cssW * dpr) / W;
    pw = Math.round(W * k); ph = Math.round(H * k);
    cv.width = pw; cv.height = ph;
    cv.style.width = cssW + 'px'; cv.style.height = cssH + 'px';
    bg = null;
  }
  function init(canvas) {
    cv = canvas; ctx = cv.getContext('2d');
    showMenu();
  }

  return {
    init, resize, update, render, startLevel, showMenu, showGarage, refreshLook, key, clearInput,
    enemyInfo, SKINS, MUSUH, playerStats, cb,
    setPaused(v) { paused = !!v; if (v) clearInput(); },
    setFrozen(v) { const was = frozen; frozen = !!v; if (v) clearInput(); if (was && !v && scene === 'fight' && phase === 'fight') resumeT = 1.6; },
    get scene() { return scene; }, get phase() { return phase; }, get paused() { return paused; }, get level() { return level; }
  };
})();
