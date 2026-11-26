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

  const GRAV = 2600;

  /*
   * Serangan biasa & kombo.
   * next: butang seterusnya yang menyambung kombo (tekan semasa serangan sedang berlaku).
   */
  const MOVES = {
    jab: { wind: 0.09, act: 0.08, rec: 0.2, range: 185, dmg: 6, push: 120, stun: 0.34, en: 6, shake: 3, fx: 'punch', next: { punch: 'cross', kick: 'kick' } },
    cross: { wind: 0.09, act: 0.09, rec: 0.24, range: 192, dmg: 7, push: 150, stun: 0.36, en: 7, shake: 4, fx: 'punch', next: { punch: 'upper', kick: 'spin' } },
    upper: { wind: 0.13, act: 0.12, rec: 0.32, range: 180, dmg: 11, push: 90, launch: 900, en: 10, shake: 9, fx: 'upper', hop: 380, name: 'UPPERCUT GERGASI!', next: { kick: 'meteor' } },
    kick: { wind: 0.2, act: 0.1, rec: 0.3, range: 212, dmg: 10, push: 260, stun: 0.44, en: 9, shake: 6, fx: 'kick', next: { kick: 'flip', punch: 'jab' } },
    spin: { wind: 0.2, act: 0.12, rec: 0.34, range: 230, dmg: 14, push: 720, launch: 420, en: 12, shake: 12, fx: 'kick', name: 'TENDANG PUTING BELIUNG!' },
    flip: { wind: 0.06, act: 0.24, rec: 0.34, range: 205, dmg: 13, push: 150, launch: 850, en: 12, shake: 10, fx: 'kick', jump: 700, name: 'BACKFLIP KICK!' },
    meteor: { wind: 0.1, act: 0.6, rec: 0.3, range: 200, dmg: 16, push: 90, slam: true, en: 12, shake: 16, fx: 'kick', jump: 880, zr: 300, name: 'HENTAKAN METEOR!' },
    jet: { wind: 0.05, act: 0.24, rec: 0.26, range: 200, dmg: 12, push: 480, stun: 0.5, en: 10, shake: 9, fx: 'punch', dash: 950, name: 'TUMBUKAN JET!' },
  };

  // Kuasa khas (guna bila tenaga ⚡ penuh)
  const POWERS = {
    laser: { ikon: '⚡', nama: 'Meriam Laser', desc: 'Tembakan laser sepanjang skrin', harga: 0, wind: 0.55, act: 0.55, rec: 0.45 },
    roket: { ikon: '🚀', nama: 'Roket Berpandu', desc: '6 roket terbang mengejar musuh', harga: 400, wind: 0.35, act: 0.62, rec: 0.35 },
    gempa: { ikon: '🌋', nama: 'Hentakan Gempa', desc: 'Lompat tinggi & hentak tanah — gelombang gegaran!', harga: 600, wind: 1.6, act: 0.45, rec: 0.35 },
    pedang: { ikon: '🗡️', nama: 'Pedang Tenaga', desc: 'Meluru & tetak musuh 5 kali', harga: 800, wind: 0.3, act: 1.15, rec: 0.35 },
    petir: { ikon: '🌩️', nama: 'Panahan Petir', desc: 'Panggil 3 petir dari langit', harga: 1000, wind: 0.45, act: 1.4, rec: 0.3 },
    ais: { ikon: '❄️', nama: 'Sinar Beku', desc: 'Bekukan musuh selama 2 saat', harga: 1200, wind: 0.4, act: 0.35, rec: 0.35 },
  };
  const POWER_IDS = Object.keys(POWERS);
  const SUPER_INFO = { laser: 'Meriam Hiper', roket: 'Hujan Roket', gempa: 'Gempa Gergasi', pedang: 'Tetakan Seribu', petir: 'Ribut Petir', ais: 'Zaman Ais' };
  for (const id of POWER_IDS) POWERS[id].sup = SUPER_INFO[id];

  const COMBOS = [
    { keys: '👊 👊 👊', nama: 'Uppercut Gergasi', desc: 'Lambung musuh tinggi ke udara' },
    { keys: '👊 👊 👊 🦶', nama: 'Hentakan Meteor', desc: 'Lompat & hempas musuh ke tanah' },
    { keys: '👊 👊 🦶', nama: 'Tendang Puting Beliung', desc: 'Tendangan pusing — musuh tercampak jauh' },
    { keys: '🦶 🦶', nama: 'Backflip Kick', desc: 'Balik kuang sambil menendang ke atas' },
    { keys: '💨 👊', nama: 'Tumbukan Jet', desc: 'Elak, kemudian meluru dengan roket' },
    { keys: '🌀 + 👊', nama: 'Kombo Udara', desc: 'Musuh terapung? Terus pukul sebelum dia jatuh!' },
  ];
  const TIPS = ['👊 👊 👊 = UPPERCUT GERGASI!', '🦶 🦶 = BACKFLIP KICK!', '👊 👊 🦶 = TENDANG PUTING BELIUNG!', '👊 👊 👊 🦶 = HENTAKAN METEOR!', '💨 lepas itu 👊 = TUMBUKAN JET!', 'Pukul musuh di udara untuk KOMBO UDARA!', 'Beli kuasa ⚡ baharu di 🔧 Garaj!', 'Bar emas ⭐ penuh? Tekan ⭐ SUPER!'];

  const BASE = { lean: 0.04, head: 0, fs: 0.45, fe: 2.1, bs: 0.15, be: 2.25, fh: 0.3, fk: -0.5, bh: -0.3, bk: -0.2, dx: 0 };
  const CROUCH = { lean: 0.3, fs: 0.0, fe: 2.7, bs: 0.4, be: 2.0, fh: 0.75, fk: -1.35, bh: -0.45, bk: -0.9, dx: 4 };
  const POSE = {
    block: { lean: -0.06, head: 0.15, fs: 1.15, fe: 1.85, bs: 0.95, be: 2.0, fh: 0.35, fk: -0.6, bh: -0.42, bk: -0.25 },
    hurt: { lean: -0.32, head: -0.35, fs: -0.2, fe: 0.9, bs: -0.45, be: 0.7, fh: 0.45, fk: -0.6, bh: -0.45, bk: -0.1, dx: -8 },
    air: { lean: -0.4, head: -0.4, fs: -0.5, fe: 0.6, bs: -0.7, be: 0.5, fh: 0.6, fk: -0.9, bh: 0.2, bk: -0.7 },
    getup: { lean: 0.35, fs: 0.8, fe: 1.0, bs: 0.4, be: 1.2, fh: 0.9, fk: -1.6, bh: -0.5, bk: -1.1 },
    dodge: { lean: -0.3, fs: -0.1, fe: 1.2, bs: -0.3, be: 1.0, fh: 0.6, fk: -1.0, bh: -0.5, bk: -0.4 },
    win: { lean: -0.05, head: -0.15, fs: 2.95, fe: 0.1, bs: 0.3, be: 2.2 },
    ko: { lean: -0.2, head: -0.4, fs: -0.6, fe: 0.3, bs: -0.7, be: 0.2, fh: 0.3, fk: -0.2, bh: -0.2, bk: -0.1 },
    jabW: { lean: -0.04, fs: 0.15, fe: 2.4, dx: -4 },
    jabA: { lean: 0.16, fs: 1.52, fe: 0.04, bs: 0.1, be: 2.2, dx: 12, fh: 0.42, fk: -0.55, bh: -0.42, bk: -0.15 },
    crossW: { lean: -0.08, bs: 0.0, be: 2.5, fs: 0.6, fe: 2.0, dx: -6 },
    crossA: { lean: 0.3, bs: 1.55, be: 0.04, fs: 0.25, fe: 2.3, dx: 20, fh: 0.5, fk: -0.6, bh: -0.5, bk: -0.1 },
    upperW: CROUCH,
    upperA: { lean: -0.12, head: -0.25, fs: 2.85, fe: 0.12, bs: -0.2, be: 1.6, fh: 0.2, fk: -0.15, bh: -0.35, bk: -0.1, dx: 10 },
    kickW: { lean: -0.12, fh: 1.1, fk: -1.9, fs: 0.6, fe: 2.0, bs: -0.1, be: 2.0, bh: -0.05, bk: -0.1 },
    kickA: { lean: -0.32, head: -0.1, fh: 1.5, fk: -0.04, fs: 0.1, fe: 1.5, bs: 0.6, be: 1.5, bh: -0.08, bk: -0.05 },
    spinW: { lean: 0.15, fs: 0.6, fe: 2.0, bs: 0.6, be: 2.0, fh: 0.5, fk: -1.2, bh: -0.2, bk: -0.2 },
    spinA: { lean: -0.42, head: -0.1, fh: 1.8, fk: -0.02, fs: -0.2, fe: 1.2, bs: 0.9, be: 1.2, bh: -0.05, bk: -0.05 },
    flipW: { lean: 0.1, fh: 0.8, fk: -1.4, bh: -0.3, bk: -1.0, fs: -0.3, fe: 1.0, bs: -0.3, be: 1.0 },
    flipA: { lean: -0.25, head: -0.2, fh: 1.9, fk: -0.05, bh: 0.6, bk: -0.9, fs: -0.8, fe: 0.5, bs: -0.9, be: 0.5 },
    meteorW: CROUCH,
    meteorA: { lean: -0.1, head: 0.1, fh: 2.5, fk: -0.05, bh: -0.15, bk: -0.4, fs: 2.3, fe: 0.4, bs: 2.0, be: 0.5 },
    jetW: { lean: 0.3, fs: 0.3, fe: 2.2 },
    jetA: { lean: 0.5, fs: 1.55, fe: 0.0, bs: -0.7, be: 0.6, fh: -0.1, fk: -0.5, bh: -0.6, bk: -0.4, dx: 12 },
    laserW: { lean: -0.15, head: -0.1, fs: 0.35, fe: 2.4, bs: 0.35, be: 2.4, fh: 0.5, fk: -0.6, bh: -0.55, bk: -0.15 },
    laserA: { lean: 0.12, fs: 1.45, fe: 0.08, bs: 1.38, be: 0.12, fh: 0.55, fk: -0.55, bh: -0.6, bk: -0.1 },
    aisW: { lean: -0.1, fs: 0.4, fe: 2.2, bs: 0.3, be: 2.4, fh: 0.5, fk: -0.6, bh: -0.55, bk: -0.15 },
    aisA: { lean: 0.1, fs: 1.5, fe: 0.04, bs: 0.3, be: 2.2, fh: 0.5, fk: -0.6, bh: -0.55, bk: -0.15 },
    roketW: { lean: -0.15, head: -0.2, fs: 0.2, fe: 1.8, bs: 0.1, be: 1.8, fh: 0.45, fk: -0.7, bh: -0.5, bk: -0.3 },
    roketA: { lean: -0.25, head: -0.3, fs: 1.1, fe: 1.0, bs: 0.9, be: 1.0, fh: 0.5, fk: -0.7, bh: -0.55, bk: -0.3 },
    gempaW: { lean: -0.1, fs: 2.8, fe: 0.2, bs: 2.7, be: 0.2, fh: 0.9, fk: -1.6, bh: -0.4, bk: -1.2 },
    gempaA: { lean: 0.5, head: 0.2, fs: 1.0, fe: 0.3, bs: 0.9, be: 0.3, fh: 0.8, fk: -1.4, bh: -0.6, bk: -1.0 },
    pedangW: { lean: -0.05, fs: 2.4, fe: 0.6, bs: 0.3, be: 2.2 },
    pedangA: { lean: 0.25, fs: 0.75, fe: 0.1, bs: 0.2, be: 2.2, dx: 14, fh: 0.5, fk: -0.6, bh: -0.5, bk: -0.15 },
    pedangB: { lean: -0.05, fs: 2.6, fe: 0.3, bs: 0.2, be: 2.2, fh: 0.45, fk: -0.6, bh: -0.45, bk: -0.15 },
    petirW: { lean: -0.08, head: -0.35, fs: 3.05, fe: 0.02, bs: 0.2, be: 2.3 },
    superW: { lean: -0.15, head: -0.3, fs: 2.4, fe: 0.3, bs: 2.3, be: 0.3, fh: 0.5, fk: -0.6, bh: -0.55, bk: -0.15 },
    superUp: { lean: 0, head: -0.2, fs: 2.95, fe: 0.05, bs: 0.2, be: 1.6, fh: 0.1, fk: -0.15, bh: -0.1, bk: -0.2 },
    petirA: { lean: -0.1, head: -0.4, fs: 3.05, fe: 0.02, bs: -0.3, be: 1.6, fh: 0.45, fk: -0.6, bh: -0.5, bk: -0.2 },
  };

  // Senarai musuh (rekaan asli) — setiap satu ada kuasa khas sendiri
  const MUSUH = [
    { nama: 'BESI BURUK', power: 'roket', d: { main: '#b5651d', metal: '#8d7b68', accent: '#f2c14e', glow: '#ffef8a', head: 'kotak', bulk: 1.0 }, spd: 0.8 },
    { nama: 'KALA HIJAU', power: 'gempa', d: { main: '#3fa34d', metal: '#556b2f', accent: '#d4ff3a', glow: '#ff5252', head: 'raksasa', spikes: true, tail: true, claws: true, bulk: 1.05 }, spd: 0.95 },
    { nama: 'TAUFAN', power: 'petir', d: { main: '#5b7c99', metal: '#c0ccd8', accent: '#00d1ff', glow: '#00f0ff', head: 'antena', bulk: 0.92 }, spd: 1.3, hp: 0.9 },
    { nama: 'GERGASI BATU', power: 'gempa', d: { main: '#7d7d7d', metal: '#5a5246', accent: '#ff9f1c', glow: '#ff7b00', head: 'mono', bulk: 1.25, spikes: true }, spd: 0.75, size: 1.1, hp: 1.25 },
    { nama: 'LEBAH NEON', power: 'roket', d: { main: '#f5c400', metal: '#2b2b2b', accent: '#151515', glow: '#b6ff00', head: 'antena', bulk: 0.95 }, spd: 1.2 },
    { nama: 'NAGA MERAH', power: 'laser', d: { main: '#c62828', metal: '#5d1a1a', accent: '#ffb300', glow: '#ffb02e', head: 'raksasa', spikes: true, tail: true, claws: true, horns: true, bulk: 1.1 }, spd: 1.0, size: 1.08, hp: 1.1 },
    { nama: 'RATU AIS', power: 'ais', d: { main: '#8fe3ff', metal: '#e8f7ff', accent: '#3a7bd5', glow: '#ffffff', head: 'visor', bulk: 0.95 }, spd: 1.15 },
    { nama: 'HANTU MALAM', power: 'pedang', d: { main: '#4a2a7a', metal: '#24183b', accent: '#ff2fd2', glow: '#ff4df0', head: 'mono', bulk: 1.0, spikes: true }, spd: 1.2 },
    { nama: 'KOMANDER ZIRKON', power: 'petir', d: { main: '#d4a017', metal: '#6e5a1e', accent: '#1e88e5', glow: '#7df9ff', head: 'antena', bulk: 1.1 }, spd: 1.1, size: 1.08, hp: 1.1 },
    { nama: 'RAJA GERHANA', power: 'rawak', d: { main: '#2a2a3e', metal: '#4a4a66', accent: '#ff1744', glow: '#ff1744', head: 'mahkota', bulk: 1.25, spikes: true, claws: true }, spd: 1.05, size: 1.18, hp: 1.25 },
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
  let P = null, E = null, level = 1, roundT = 90, theme = 1, tip = '';
  let shake = 0, hitStop = 0, slow = 1, slowT = 0, flash = 0, bolt = 0, nextBolt = 5, dark = 0;
  let superSeq = null, camZ = 1, camX = W / 2, camY = H / 2;
  let parts = [], floats = [], clouds = [], drops = [], heli = null, projs = [], banner = null;
  let bg = null, bgKey = '', time = 0, beepIdx = -1;
  let paused = false, frozen = false, resumeT = 0, resultSent = false, timeUp = false, winner = null, loser = null;
  const input = { left: false, right: false, block: false, buf: null };
  const NOCTRL = { move: 0, block: false, action: null };
  const cb = { onResult: null };

  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // ───────────── Pejuang ─────────────
  function makeFighter(o) {
    return {
      name: o.name, d: o.d, isP: !!o.isP, size: o.size || 1, x: o.x, y: GROUND, z: 0, vx: 0, vz: 0, facing: o.facing,
      state: 'idle', stateT: 0, phaseA: 'wind', hp: o.hp, maxHp: o.hp, hpShow: o.hp, hpHold: 0, energy: 0,
      dmgMult: o.dmg, defMult: o.def, spdMult: o.spd, enMult: o.en, power: o.power || 'laser', curPower: 'laser',
      pose: Object.assign({}, BASE), t: Math.random() * 10, walkPh: 0, rot: 0,
      flash: 0, invuln: 0, dodgeCd: 0, stun: 0, hitDone: false, lastHitOk: false, combo: 0, comboT: 0, juggle: 0, slammed: false,
      pwCount: 0, pwFired: false, hits: 0,
      ctrl: { move: 0, block: false, action: null }, ai: o.ai || null, aiT: 0.6, aiPlan: 'wait', aiBlockT: 0, aiSaw: false, aiChain: false,
      trail: [], trailT: 0, koA: 0, koLanded: false, thrust: 0, hint: 0, hintS: 0,
      superE: 0, superMult: o.superMult != null ? o.superMult : 1
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
    const pwr = POWERS[Save.d.power] ? Save.d.power : 'laser';
    return makeFighter({ name: 'PERKASA', d: playerDesign(), isP: true, x, facing: 1, size: 1, hp: s.hp, dmg: s.dmg, def: s.def, spd: s.spd, en: s.en, power: pwr });
  }
  function enemyInfo(L) { return MUSUH[(L - 1) % MUSUH.length]; }
  function makeEnemy(L, x) {
    const m = enemyInfo(L), loop = Math.floor((L - 1) / MUSUH.length);
    return makeFighter({
      name: m.nama, d: Object.assign({}, m.d), x, facing: -1, size: m.size || 1, power: m.power,
      superMult: L < 3 ? 0 : Math.min(0.9, 0.35 + L * 0.05),
      hp: Math.round((100 + L * 18 + loop * 80) * (m.hp || 1)),
      dmg: 0.6 + L * 0.06 + loop * 0.22, def: 1, spd: (m.spd || 1) * (0.85 + Math.min(L, 12) * 0.015), en: 1,
      ai: {
        react: Math.max(0.28, 1.2 - L * 0.08 - loop * 0.1),
        aggr: Math.min(0.88, 0.36 + L * 0.045 + loop * 0.05),
        blockP: Math.min(0.6, 0.03 + L * 0.05 + loop * 0.06),
        dodgeP: L < 3 ? 0 : Math.min(0.5, (L - 2) * 0.06 + loop * 0.08),
        chainP: Math.min(0.8, (L - 1) * 0.09 + loop * 0.15),
        specialP: 0.2 + L * 0.03
      }
    });
  }
  function setState(f, s, force) {
    if (f.state !== s || force) { f.state = s; f.stateT = 0; }
  }
  const isFree = f => (f.state === 'idle' || f.state === 'walk' || f.state === 'block') && f.z <= 0;
  const isAttack = f => !!MOVES[f.state] || f.state === 'special';
  function moveData(f) { return f.state === 'special' ? POWERS[f.curPower] : MOVES[f.state]; }

  // ───────────── Babak ─────────────
  function startLevel(L) {
    level = L; scene = 'fight'; phase = 'intro'; phaseT = 0; roundT = 90; beepIdx = -1;
    theme = (L - 1) % THEMES.length;
    tip = L === 1 ? TIPS[0] : L === 2 ? TIPS[1] : pick(TIPS);
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
  function refreshLook() { if (P) { P.d = playerDesign(); P.power = POWERS[Save.d.power] ? Save.d.power : 'laser'; } }
  function resetFx() {
    parts = []; floats = []; projs = []; banner = null; shake = 0; hitStop = 0; slow = 1; slowT = 0; flash = 0; bolt = 0; dark = 0; nextBolt = rnd(4, 8);
    superSeq = null; camZ = 1;
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
  function dust(x, y, n, spread) {
    spread = spread || 1;
    for (let i = 0; i < n; i++) parts.push({ t: 'smoke', x: x + rnd(-25, 25) * spread, y: y - rnd(0, 6), vx: rnd(-90, 90) * spread, vy: rnd(-40, -5), r: rnd(6, 12), life: rnd(0.4, 0.8), max: 0.8, c: '170,150,120' });
  }
  function ring(x, y, c, r) { parts.push({ t: 'ring', x, y, r: 6, R: r || 60, life: 0.3, max: 0.3, c }); }
  function arc(f, kind) { parts.push({ t: 'arc', f, kind, x: f.x, y: f.y, facing: f.facing, size: f.size, life: 0.18, max: 0.18, c: f.d.glow }); }
  function ice(x, y, n) {
    for (let i = 0; i < n; i++) parts.push({ t: 'debris', x: x + rnd(-40, 40), y: y + rnd(-120, 40), vx: rnd(-320, 320), vy: rnd(-520, -120), a: rnd(0, 6), va: rnd(-12, 12), s: rnd(6, 13), life: 1.2, max: 1.2, c: '#d8f7ff' });
  }
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
  function showBanner(text, f) { banner = { text, c: f.isP ? '#ffe14d' : '#ff8a8a', life: 1.3, max: 1.3 }; }

  // ───────────── Logik pejuang ─────────────
  function tryAction(f, a) {
    if (a === 'super') {
      if (f.superE < 100 || !(f === P ? E : P)) { if (f.isP) f.hintS = 1.4; return true; }
      startSuper(f); return true;
    }
    if (a === 'special') {
      if (f.energy < 100) { if (f.isP) f.hint = 1.2; return true; }
      f.energy = 0;
      f.curPower = f.power === 'rawak' ? pick(POWER_IDS) : f.power;
      startMove(f, 'special');
      const pw = POWERS[f.curPower];
      showBanner(pw.ikon + ' ' + pw.nama.toUpperCase() + '!', f);
      return true;
    }
    if (a === 'dodge') {
      if (f.dodgeCd > 0) return false;
      setState(f, 'dodge', true);
      f.vx = -f.facing * 640; f.invuln = 0.32; f.dodgeCd = 0.9; f.thrust = 1;
      Sfx.play('dodge');
      return true;
    }
    if (a === 'punch') { startMove(f, 'jab'); return true; }
    if (a === 'kick') { startMove(f, 'kick'); return true; }
    return false;
  }
  function startMove(f, m) {
    setState(f, m, true);
    f.hitDone = false; f.lastHitOk = false; f.phaseA = 'wind'; f.aiChain = false; f.aiNext = null; f.pwCount = 0; f.pwFired = false; f.hits = 0;
    if (m === 'special') {
      const id = f.curPower;
      Sfx.play(id === 'pedang' ? 'saber' : id === 'petir' ? 'zap' : id === 'ais' ? 'freeze' : 'charge');
      if (id === 'gempa') { f.vz = 1050; f.vx = f.facing * 160; Sfx.play('jump'); }
    } else Sfx.play(MOVES[m].name ? 'swoosh' : 'whoosh', 0.6);
  }

  function footstep(f) {
    const pts = Robot.points(f);
    dust(pts.footF.x, GROUND, 3);
    shake = Math.max(shake, 1.6 * f.size);
    Sfx.play('step', f.isP ? 0.8 : 0.55);
  }

  function land(f, impact) {
    if (f.state === 'air') {
      if (f.slammed) {
        f.slammed = false; f.vz = 520; f.z = 1;
        shake += 18; dust(f.x, GROUND, 26, 2.2); ring(f.x, GROUND, 'rgba(255,220,150,', 200);
        Sfx.play('explode');
        return;
      }
      setState(f, 'down', true);
      f.koA = 0.9; f.rot = 0; f.invuln = 1.05; f.vx *= 0.4;
      shake += 10; dust(f.x - f.facing * 100 * f.size, GROUND, 18, 1.6); Sfx.play('kick');
    } else if (f.state === 'special' && f.curPower === 'gempa' && !f.pwFired) {
      f.pwFired = true; f.stateT = POWERS.gempa.wind; f.vx = 0;
      projs.push({ t: 'shock', x: f.x + f.facing * 70 * f.size, dir: f.facing, owner: f, tgt: f === P ? E : P, hit: false, life: 1.3 });
      shake += 22; flash = Math.max(flash, 0.3);
      dust(f.x, GROUND, 34, 2.6); ring(f.x, GROUND, 'rgba(255,200,120,', 260);
      Sfx.play('explode');
    } else if (f.state === 'ko') {
      dust(f.x, GROUND, 14, 1.4); shake += 8;
    } else if (impact < -900) {
      shake += 8; dust(f.x, GROUND, 14, 1.5); Sfx.play('step', 1);
    } else {
      dust(f.x, GROUND, 6); Sfx.play('step', 0.6);
    }
  }

  function stepFighter(f, o, dt, ctl) {
    f.t += dt; f.stateT += dt;
    f.flash = Math.max(0, f.flash - dt); f.invuln -= dt; f.dodgeCd -= dt;
    f.comboT -= dt; if (f.comboT <= 0) f.combo = 0;
    f.thrust = Math.max(0, f.thrust - dt * 2.2);
    f.hint = Math.max(0, f.hint - dt); f.hintS = Math.max(0, f.hintS - dt);
    f.hpHold -= dt;
    if (f.state !== 'ko' && f.state !== 'win' && phase === 'fight') f.energy = Math.min(100, f.energy + dt * 1.5 * f.enMult);
    const c = ctl ? f.ctrl : NOCTRL;
    let used = false;
    if (isFree(f) && o) f.facing = o.x >= f.x ? 1 : -1;
    if (c.action) {
      if (isFree(f)) used = tryAction(f, c.action);
      else if (MOVES[f.state]) {
        // sambungan kombo
        const m = MOVES[f.state], nx = m.next && m.next[c.action];
        if (nx && f.stateT >= m.wind + m.act * 0.5) { startMove(f, nx); used = true; }
      } else if (f.state === 'dodge' && c.action === 'punch' && f.stateT > 0.04) {
        startMove(f, 'jet'); used = true;
      }
    }

    if (isFree(f)) {
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
    if (isAttack(f)) attackUpdate(f, o, dt);
    else if (f.state === 'hurt') { if (f.stateT >= f.stun) setState(f, 'idle'); }
    else if (f.state === 'frozen') {
      if (f.stateT >= f.stun) { setState(f, 'idle'); ice(f.x, f.y - 160 * f.size, 18); Sfx.play('shatter'); }
    } else if (f.state === 'dodge' || f.state === 'jet') {
      // dikendalikan di bawah (jejak bayang)
    } else if (f.state === 'air') {
      f.rot = Math.min(0.9, f.rot + dt * 2.6);
    } else if (f.state === 'down') {
      f.koA = Math.min(1.45, f.koA + dt * 6);
      if (f.stateT >= 0.55) setState(f, 'getup', true);
    } else if (f.state === 'getup') {
      f.koA = Math.max(0, f.koA - dt * 4.5);
      if (f.stateT >= 0.38) { f.koA = 0; f.invuln = Math.max(f.invuln, 0.15); setState(f, 'idle'); }
    } else if (f.state === 'ko') {
      f.koA = Math.min(1.45, f.koA + dt * (1.2 + f.koA * 3));
      if (f.koA >= 1.45 && !f.koLanded && f.z <= 0) {
        f.koLanded = true; shake += 14; dust(f.x - f.facing * 120 * f.size, GROUND, 16); Sfx.play('kick');
      }
    }
    if (f.state === 'dodge') {
      if (f.stateT >= 0.38) setState(f, 'idle');
    }
    if (f.state === 'dodge' || f.state === 'jet' || f.state === 'flip' || (f.state === 'special' && f.curPower === 'pedang' && f.phaseA === 'act')) {
      f.trailT -= dt;
      if (f.trailT <= 0) { f.trailT = 0.045; f.trail.push({ x: f.x, y: f.y, rot: f.rot, pose: Object.assign({}, f.pose), facing: f.facing, life: 0.25 }); }
    }
    for (const g of f.trail) g.life -= dt;
    f.trail = f.trail.filter(g => g.life > 0);

    // putaran badan
    if (f.state === 'flip') {
      const m = MOVES.flip, u = clamp((f.stateT - m.wind) / (m.act + m.rec * 0.7), 0, 1);
      f.rot = (1 - Math.pow(1 - u, 2)) * Math.PI * 2;
    } else if (f.state !== 'air') {
      if (f.rot > Math.PI) f.rot -= Math.PI * 2;
      f.rot *= Math.exp(-dt * 18);
      if (Math.abs(f.rot) < 0.001) f.rot = 0;
    }
    if (!(f.state === 'ko' || f.state === 'down' || f.state === 'getup')) f.koA = 0;

    // fizik
    f.x += f.vx * dt;
    const fr = f.z > 0 ? 1.2 : f.state === 'frozen' ? 9 : 7;
    f.vx *= Math.exp(-dt * fr);
    f.x = clamp(f.x, LEFT + 30, RIGHT - 30);
    if (f.z > 0 || f.vz > 0) {
      f.vz -= GRAV * dt;
      f.z += f.vz * dt;
      if (f.z <= 0) { f.z = 0; const imp = f.vz; f.vz = 0; land(f, imp); }
    }
    f.y = GROUND - f.z;
    if (f.hpShow > f.hp && f.hpHold <= 0) f.hpShow = Math.max(f.hp, f.hpShow - dt * f.maxHp * 0.4);
    if (f.state !== 'frozen') animPose(f, dt);
    return used;
  }

  function attackUpdate(f, o, dt) {
    const m = moveData(f), t = f.stateT;
    const ph = t < m.wind ? 'wind' : t < m.wind + m.act ? 'act' : 'rec';
    if (ph !== f.phaseA) {
      f.phaseA = ph;
      if (ph === 'act') onActStart(f, o, m);
    }
    if (f.state === 'special') powerUpdate(f, o, m, t, dt);
    else if (ph === 'act' && !f.hitDone && o) {
      let ok = t >= m.wind + 0.03;
      if (f.state === 'meteor') ok = f.vz < 260;
      if (ok) meleeHit(f, o, m);
    }
    if (f.state === 'jet' && ph === 'act') { f.thrust = 1; if (Math.random() < 0.6) smoke(f.x - f.facing * 60, f.y - 200 * f.size, 1, '200,200,210', 0.8); }
    if (f.state === 'meteor' && f.z > 0 && f.stateT > m.wind + m.act - 0.02) f.stateT = m.wind + m.act - 0.02; // tunggu mendarat
    if (t >= m.wind + m.act + m.rec) setState(f, 'idle');
  }

  function onActStart(f, o, m) {
    const s = f.state;
    if (s === 'upper') { f.vz = m.hop; arc(f, 'up'); }
    else if (s === 'flip') { f.vz = m.jump; f.vx = -f.facing * 120; Sfx.play('jump'); }
    else if (s === 'meteor') {
      const dist = o ? Math.abs(o.x - f.x) : 200;
      f.vz = m.jump; f.vx = f.facing * clamp((dist - 120) * 2.2, 0, 750); Sfx.play('jump');
    } else if (s === 'jet') { f.vx = f.facing * m.dash; f.thrust = 1; Sfx.play('dodge'); }
    else if (s === 'spin') { arc(f, 'spin'); Sfx.play('swoosh'); f.vx += f.facing * 60; }
    else if (s === 'jab' || s === 'cross') f.vx += f.facing * 90;
    else if (s === 'kick') { f.vx += f.facing * 60; arc(f, 'kick'); }
    else if (s === 'special') {
      const id = f.curPower;
      if (id === 'laser') { Sfx.play('beam'); shake += 6; f.thrust = 1; }
      else if (id === 'ais') { Sfx.play('beam'); shake += 3; }
      else if (id === 'petir') { dark = 1; }
    }
  }

  function meleeHit(a, d, m) {
    const dx = (d.x - a.x) * a.facing;
    const reach = m.range * a.size + (d.size - 1) * 45;
    const dz = d.z - a.z;
    if (dx < -20 || dx > reach || dz < -140 || dz > (m.zr || 270)) return;
    const hy = d.y - (m.fx === 'kick' ? 170 : m.fx === 'upper' ? 235 : 210) * d.size;
    const r = applyHit(a, d, {
      dmg: m.dmg, push: m.push, stun: m.stun || 0.4, launch: m.launch, slam: m.slam, shake: m.shake, en: m.en,
      x: d.x - a.facing * 45 * d.size, y: hy, sfx: m.fx === 'punch' ? 'punch' : m.fx === 'upper' ? 'upper' : 'kick',
      stop: m.name ? 0.09 : m.fx === 'kick' ? 0.07 : 0.05, name: m.name
    });
    if (r) a.hitDone = true;
  }

  /**
   * Kenakan serangan pada d.
   * h: { dmg, push, stun, launch, slam, freeze, blockMul, unblockable, shake, en, x, y, sfx, stop, name, big }
   */
  function applyHit(a, d, h) {
    if (d.state === 'ko' || (d.invuln > 0 && !h.pierce)) return false;
    const blocked = !h.unblockable && d.state === 'block' && d.facing === -a.facing && d.z <= 0;
    const scale = !h.noScale && a.comboT > 0 ? Math.max(0.55, 1 - 0.07 * a.combo) : 1;
    let dmg = h.dmg * a.dmgMult * scale;
    const hx = h.x != null ? h.x : d.x, hy = h.y != null ? h.y : d.y - 200 * d.size;
    if (blocked) {
      dmg *= (h.blockMul != null ? h.blockMul : 0.15) * d.defMult;
      d.hp -= dmg; d.vx = a.facing * (h.push || 100) * 0.35; d.hpHold = 0.45;
      d.energy = Math.min(100, d.energy + 5 * d.enMult);
      Sfx.play('block');
      sparks(hx, hy, '#9ff3ff', 12, 420); ring(hx, hy, 'rgba(160,245,255,', 70);
      hitStop = Math.max(hitStop, 0.03); shake += (h.shake || 4) * 0.4;
      floatText(hx, hy - 30, '🛡️', '#9ff3ff', 26);
      a.lastHitOk = false;
    } else {
      dmg *= d.defMult;
      d.hp -= dmg; d.flash = 0.09; d.hpHold = 0.5;
      if (d.state === 'frozen') {
        ice(hx, hy, 4); d.vx += a.facing * 30;
      } else if (h.freeze) {
        setState(d, 'frozen', true); d.stun = h.freeze; d.vx = a.facing * 60; d.vz = Math.min(d.vz, 0);
        ice(hx, hy, 10); Sfx.play('freeze');
      } else if (h.slam && d.z > 0) {
        setState(d, 'air', true); d.slammed = true; d.vz = -1500; d.vx = a.facing * 60;
      } else if (h.launch || d.z > 0) {
        d.juggle = d.state === 'air' ? d.juggle + 1 : 0;
        const lv = (h.launch || 450) * Math.max(0.3, 1 - d.juggle * 0.2);
        setState(d, 'air', true);
        d.vz = Math.max(d.vz * 0.3, lv); if (d.z <= 0) d.z = 1;
        d.vx = a.facing * (h.push || 150);
        if (d.juggle >= 1 && a.isP) floatText(d.x, d.y - 320 * d.size, 'KOMBO UDARA!', '#7df9ff', 24);
      } else {
        setState(d, 'hurt', true); d.stun = h.stun || 0.4; d.vx = a.facing * (h.push || 150);
      }
      a.combo = (a.comboT > 0 ? a.combo : 0) + 1; a.comboT = 1.0;
      Sfx.play(h.sfx || 'punch');
      sparks(hx, hy, '#ffd34d', h.name ? 18 : 11, h.name ? 650 : 540);
      ring(hx, hy, 'rgba(255,255,255,', h.name || h.big ? 130 : 70);
      if (h.big) boom(hx, hy, 0.9);
      hitStop = Math.max(hitStop, h.stop || 0.05);
      shake += h.shake || 4;
      floatText(hx, hy - 24, Math.max(1, Math.round(dmg)), a.isP ? '#ffe14d' : '#ff7070', h.name || h.big ? 38 : 28);
      if (h.name) showBanner(h.name, a);
      if (a.combo >= 2) { floats = floats.filter(t => !t.combo || t.owner !== a); floats.push({ x: a.isP ? 150 : W - 150, y: 136, text: a.combo + ' KOMBO!', c: '#ff9f1c', size: 30 + Math.min(14, a.combo * 2), life: 1.1, max: 1.1, combo: true, owner: a }); }
      d.energy = Math.min(100, d.energy + dmg * 0.55 * d.enMult);
      a.lastHitOk = true;
    }
    if (h.en != null) a.energy = Math.min(100, a.energy + (h.en + dmg * 0.4) * a.enMult);
    if (!h.isSuper) {
      a.superE = Math.min(100, a.superE + (dmg * (blocked ? 0.3 : 0.6) + (h.name && !blocked ? 5 : 0)) * a.superMult);
      d.superE = Math.min(100, d.superE + dmg * 0.4 * d.superMult);
    }
    d.hp = Math.max(0, d.hp);
    if (d.hp <= 0) doKO(d);
    return blocked ? 'block' : 'hit';
  }

  // ───────────── Kuasa khas ─────────────
  function beamOrigin(f) {
    const pts = Robot.points(f);
    if (f.curPower === 'ais') return { x: pts.handF.x + f.facing * 8, y: pts.handF.y };
    return { x: (pts.handF.x + pts.handB.x) / 2 + f.facing * 10, y: (pts.handF.y + pts.handB.y) / 2 };
  }
  function powerUpdate(f, o, m, t, dt) {
    const id = f.curPower, at = t - m.wind;
    if (!o) return;
    if (id === 'laser' || id === 'ais') {
      if (f.phaseA === 'act' && !f.hitDone && at < 0.14) {
        const dx = (o.x - f.x) * f.facing;
        if (dx > 0 && o.z < 320) {
          const org = beamOrigin(f);
          const r = applyHit(f, o, id === 'laser'
            ? { dmg: 28, push: 520, launch: 600, blockMul: 0.35, shake: 14, x: o.x - f.facing * 30 * o.size, y: org.y, sfx: 'boom', stop: 0.14, big: true }
            : { dmg: 10, freeze: 2.1, blockMul: 0.3, shake: 6, x: o.x - f.facing * 30 * o.size, y: org.y, sfx: 'punch', stop: 0.08 });
          if (r) f.hitDone = true;
        }
      }
    } else if (id === 'roket') {
      if (f.phaseA === 'act') {
        const want = Math.min(6, Math.floor(at / 0.09) + 1);
        while (f.pwCount < want) {
          f.pwCount++;
          const side = f.pwCount % 2 ? 1 : -1;
          projs.push({
            t: 'missile', x: f.x - f.facing * 40 * f.size + side * 14, y: f.y - 285 * f.size,
            vx: -f.facing * rnd(60, 220), vy: -rnd(480, 680), age: 0, life: 3, owner: f, tgt: o, smokeT: 0
          });
          Sfx.play('missile');
        }
      }
    } else if (id === 'gempa') {
      if (f.phaseA === 'wind' && t > 0.28 && f.vz < 200) f.vz = Math.min(f.vz, -1900);
    } else if (id === 'pedang') {
      if (f.phaseA === 'act') {
        const dist = Math.abs(o.x - f.x);
        if (at < 0.22 && dist > 165) { f.x += f.facing * 1300 * dt; f.thrust = 1; }
        const times = [0.22, 0.4, 0.58, 0.76, 0.98];
        while (f.hits < times.length && at >= times[f.hits]) {
          const last = f.hits === times.length - 1;
          f.hits++;
          arc(f, last ? 'big' : f.hits % 2 ? 'down' : 'up');
          Sfx.play('slash');
          const dx = (o.x - f.x) * f.facing;
          if (dx > -20 && dx < 260 * f.size && o.z < 300) {
            applyHit(f, o, last
              ? { dmg: 12, push: 300, launch: 750, blockMul: 0.3, shake: 10, x: o.x - f.facing * 40 * o.size, y: o.y - 210 * o.size, sfx: 'kick', stop: 0.1, big: true }
              : { dmg: 6, push: 60, stun: 0.35, blockMul: 0.3, shake: 4, x: o.x - f.facing * 40 * o.size, y: o.y - 200 * o.size, sfx: 'punch', stop: 0.04 });
          }
        }
      }
    } else if (id === 'petir') {
      dark = Math.max(dark, f.phaseA === 'wind' ? t / m.wind : 1);
      if (f.phaseA === 'act') {
        const want = Math.min(3, Math.floor(at / 0.42) + 1);
        while (f.pwCount < want) {
          f.pwCount++;
          const pts = [];
          projs.push({ t: 'strike', x: clamp(o.x + o.vx * 0.15, LEFT + 40, RIGHT - 40), delay: 0.38, owner: f, tgt: o, fired: false, life: 0.25, last: f.pwCount === 3, pts });
          Sfx.play('tick');
        }
      }
    }
  }

  function updateProjs(dt) {
    for (const p of projs) {
      if (p.t === 'missile') {
        const tg = p.tgt, tx = tg.x, ty = tg.y - 180 * tg.size;
        p.age += dt; p.life -= dt;
        if (p.age > 0.22) {
          const dx = tx - p.x, dy = ty - p.y, dist = Math.hypot(dx, dy) || 1;
          const sp = Math.min(780, 320 + p.age * 900), s = Math.min(1, dt * 5);
          p.vx += (dx / dist * sp - p.vx) * s; p.vy += (dy / dist * sp - p.vy) * s;
        } else p.vy += 900 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.smokeT -= dt;
        if (p.smokeT <= 0) { p.smokeT = 0.025; parts.push({ t: 'smoke', x: p.x, y: p.y, vx: 0, vy: -10, r: 5, life: 0.45, max: 0.6, c: '210,210,220' }); }
        const inside = Math.abs(p.x - tg.x) < 48 * tg.size && p.y > tg.y - 320 * tg.size && p.y < tg.y + 5;
        if (inside && tg.state !== 'ko') {
          applyHit(p.owner, tg, { dmg: 6, push: 90, stun: 0.28, blockMul: 0.3, shake: 5, x: p.x, y: p.y, sfx: 'boom', stop: 0.03, en: 2 });
          boom(p.x, p.y, 0.45); p.life = 0;
        } else if (p.y > GROUND - 4) { boom(p.x, GROUND - 6, 0.4); Sfx.play('boom', 0.4); p.life = 0; }
      } else if (p.t === 'shock') {
        p.x += p.dir * 820 * dt; p.life -= dt;
        if (Math.random() < 0.9) parts.push({ t: 'debris', x: p.x + rnd(-20, 20), y: GROUND - 4, vx: rnd(-80, 80) + p.dir * 120, vy: rnd(-650, -300), a: rnd(0, 6), va: rnd(-12, 12), s: rnd(6, 14), life: 1, max: 1, c: '#7a6a58' });
        if (Math.random() < 0.7) dust(p.x, GROUND, 2, 0.8);
        shake = Math.max(shake, 5);
        const tg = p.tgt;
        if (!p.hit && Math.abs(p.x - tg.x) < 60 * tg.size && tg.z < 70) {
          if (applyHit(p.owner, tg, { dmg: 24, push: 200, launch: 800, unblockable: true, shake: 14, x: tg.x, y: GROUND - 60, sfx: 'boom', stop: 0.12, big: true })) p.hit = true;
        }
        if (p.x < LEFT - 40 || p.x > RIGHT + 40) p.life = 0;
      } else if (p.t === 'strike') {
        if (!p.fired) {
          p.delay -= dt;
          if (p.delay <= 0) {
            p.fired = true;
            let x = p.x, y = -20; p.pts.push([x, y]);
            while (y < GROUND) { x += rnd(-28, 28); y += rnd(30, 60); p.pts.push([x, Math.min(y, GROUND)]); }
            p.pts[p.pts.length - 1][0] = p.x;
            Sfx.play('thunder'); Sfx.play('boom', 0.7);
            flash = Math.max(flash, 0.35); shake += 10;
            sparks(p.x, GROUND - 10, '#e8f4ff', 16, 600); ring(p.x, GROUND - 10, 'rgba(200,230,255,', 110);
            const tg = p.tgt;
            if (Math.abs(tg.x - p.x) < 80 * tg.size) {
              applyHit(p.owner, tg, p.last
                ? { dmg: 12, push: 120, launch: 700, blockMul: 0.5, shake: 10, x: tg.x, y: tg.y - 200 * tg.size, sfx: 'boom', stop: 0.1, big: true }
                : { dmg: 10, push: 60, stun: 0.55, blockMul: 0.5, shake: 6, x: tg.x, y: tg.y - 200 * tg.size, sfx: 'punch', stop: 0.06 });
            }
          }
        } else p.life -= dt;
      }
    }
    projs = projs.filter(p => p.life > 0);
  }

  // ───────────── Serangan Super (sinematik, ikut kuasa yang dipakai) ─────────────
  const GOLD = '#ffd23f';
  const SUPERS = {
    laser: { nama: 'MERIAM HIPER', ikon: '⚡', col: null, desc: 'Laser gergasi berterusan yang menolak musuh ke dinding' },
    roket: { nama: 'HUJAN ROKET', ikon: '🚀', col: '#ff9f1c', desc: '15 roket jatuh dari langit ke atas musuh' },
    gempa: { nama: 'GEMPA GERGASI', ikon: '🌋', col: '#ff7b2e', desc: 'Hentakan dari langit, tiang batu meletus dari tanah' },
    pedang: { nama: 'TETAKAN SERIBU', ikon: '🗡️', col: '#ff4df0', desc: 'Tetak dari semua arah, kemudian pedang gergasi' },
    petir: { nama: 'RIBUT PETIR', ikon: '🌩️', col: '#7fd4ff', desc: 'Terapung di langit & panggil 9 petir' },
    ais: { nama: 'ZAMAN AIS', ikon: '❄️', col: '#bff6ff', desc: 'Bekukan musuh dalam kristal gergasi, kemudian pecahkan!' },
    nova: { nama: 'NOVA GERGASI', ikon: '⭐', col: GOLD, desc: 'Terbang ke langit & menjunam macam komet' },
  };
  function rgbOf(hex) { const n = parseInt(hex.replace('#', ''), 16); return `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`; }

  function startSuper(f) {
    const o = f === P ? E : P;
    f.superE = 0;
    f.facing = o.x >= f.x ? 1 : -1;
    const type = f.power === 'rawak' ? pick([...POWER_IDS, 'nova']) : (SUPERS[f.power] ? f.power : 'nova');
    const D = SUPERS[type];
    const total = (f.isP ? 45 + o.maxHp * 0.12 : 28 + o.maxHp * 0.08) / f.dmgMult * (f.isP ? 1 + (f.dmgMult - 1) * 0.6 : 1);
    superSeq = { f, o, t: 0, type, col: D.col || f.d.glow, total, stage: 0, n1: 0, n2: 0, p: [], pose: 'superW', sx: 0 };
    setState(f, 'super', true);
    f.vx = 0; f.vz = 0; f.rot = 0; f.trail = [];
    if (isAttack(o) || o.state === 'block' || o.state === 'walk' || o.state === 'dodge') setState(o, 'idle', true);
    o.vx = 0;
    projs = [];
    if (f.isP) clearInput();
    banner = { text: `${D.ikon} SUPER ${D.nama}! ${D.ikon}`, c: f.isP ? GOLD : '#ff8a8a', life: 2.4, max: 2.4 };
    Sfx.play('superCharge');
    flash = Math.max(flash, 0.4);
  }

  function superHit(S, frac, h) {
    const f = S.f, o = S.o;
    return applyHit(f, o, Object.assign({
      dmg: S.total * frac, unblockable: true, pierce: true, noScale: true, isSuper: true, en: 0,
      push: 60, stun: 0.35, sfx: 'punch', stop: 0.03, shake: 5,
      x: o.x - f.facing * 30 * o.size, y: o.y - 190 * o.size
    }, h));
  }
  function superFinal(S, frac, h) {
    const o = S.o;
    if (o.state === 'frozen' || o.state === 'down' || o.state === 'getup') { o.koA = 0; setState(o, 'idle', true); }
    const hx = o.x - S.f.facing * 30 * o.size, hy = o.y - 180 * o.size;
    superHit(S, frac, Object.assign({ launch: 1000, push: 280, big: true, sfx: 'superHit', stop: 0.22, shake: 32, x: hx, y: hy }, h));
    boom(hx, hy, 1.7); boom(hx + rnd(-60, 60), hy + rnd(-80, 40), 1.1);
    ring(hx, hy, `rgba(${rgbOf(S.col)},`, 320); ring(hx, hy, 'rgba(255,255,255,', 200);
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; parts.push({ t: 'spark', x: hx, y: hy, vx: Math.cos(a) * 900, vy: Math.sin(a) * 900, life: 0.5, max: 0.5, c: S.col, w: 5 }); }
    flash = 1;
    if (phase === 'fight') { slow = 0.35; slowT = 0.9; }
    floatText(o.x, o.y - 360 * o.size, 'SUPER!', GOLD, 48);
  }
  function superEnd() {
    const S = superSeq;
    if (!S) return;
    superSeq = null;
    const f = S.f;
    f.rot = 0; f.trail = [];
    setState(f, 'idle', true);
    if (f.z > 0) f.vz = Math.min(f.vz, 0);
  }

  function updateSuper(dt) {
    const S = superSeq, f = S.f, o = S.o;
    S.t += dt; f.t += dt;
    for (const g of f.trail) g.life -= dt;
    f.trail = f.trail.filter(g => g.life > 0);
    if (S.t < 0.9) {
      // fasa cas: gelap, zum, aura
      S.pose = 'superW';
      dark = Math.min(1.5, S.t / 0.25);
      shake = Math.max(shake, 2.5);
      const cx = f.x, cy = f.y - 170 * f.size;
      for (let i = 0; i < 3; i++) {
        const a = rnd(0, Math.PI * 2), r = rnd(60, 160) * f.size;
        parts.push({ t: 'spark', x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 1.3, vx: rnd(-30, 30), vy: rnd(-420, -200), life: rnd(0.3, 0.6), max: 0.6, c: i ? S.col : '#ffffff', w: rnd(2, 4) });
      }
    } else {
      const tt = S.t - 0.9;
      SUPER_UPD[S.type](S, tt, dt);
      if (!superSeq) return;
      if (S.type !== 'nova') stepFighter(o, f, dt, false);
      updateSuperParts(S, dt);
    }
    if (!superSeq) return;
    f.y = GROUND - f.z;
    animPose(f, dt);
  }

  function addBolt(S, x, big) {
    const pts = []; let bx = x, by = -30; pts.push([bx, by]);
    while (by < GROUND) { bx += rnd(-30, 30); by += rnd(30, 60); pts.push([bx, Math.min(by, GROUND)]); }
    pts[pts.length - 1][0] = x;
    parts.push({ t: 'bolt', pts, life: big ? 0.45 : 0.22, max: big ? 0.45 : 0.22, big });
    sparks(x, GROUND - 10, '#e8f4ff', big ? 30 : 12, big ? 800 : 500);
    ring(x, GROUND - 10, 'rgba(200,230,255,', big ? 220 : 100);
    flash = Math.max(flash, big ? 0.9 : 0.25);
  }

  const SUPER_UPD = {
    laser(S, tt, dt) {
      const f = S.f, o = S.o;
      if (tt < 0.25) { S.pose = 'laserW'; if (!S.stage) { S.stage = 1; Sfx.play('charge'); } S.beam = 0; }
      else if (tt < 1.45) {
        S.pose = 'laserA'; S.beam = 1;
        if (S.stage === 1) { S.stage = 2; Sfx.play('beam'); Sfx.play('superDive'); }
        shake = Math.max(shake, 7);
        S.tick = (S.tick || 0) - dt;
        if (S.tick <= 0 && S.n1 < 10) { S.tick = 0.11; S.n1++; superHit(S, 0.05, { push: 160, stun: 0.4, stop: 0.015, shake: 4 }); }
      } else {
        S.beam = Math.max(0, 1 - (tt - 1.45) / 0.4);
        if (S.stage === 2) { S.stage = 3; superFinal(S, 0.5); }
      }
      dark = 1.5;
      if (tt > 1.95) superEnd();
    },
    roket(S, tt, dt) {
      const f = S.f, o = S.o;
      S.pose = 'roketA';
      if (tt < 0.6) {
        while (S.n1 < Math.floor(tt / 0.035) && S.n1 < 16) {
          S.n1++;
          S.p.push({ k: 'up', x: f.x - f.facing * 40 * f.size + rnd(-16, 16), y: f.y - 285 * f.size, vx: rnd(-80, 80), vy: -1150 });
          if (S.n1 % 3 === 0) Sfx.play('missile');
        }
      }
      if (tt > 0.75) {
        const want = Math.min(14, Math.floor((tt - 0.75) / 0.075) + 1);
        while (S.n2 < want) { S.n2++; S.p.push({ k: 'down', x: o.x + rnd(-120, 120), y: -80, vx: 0, vy: 1100 }); }
      }
      if (tt > 1.95 && S.stage === 0) { S.stage = 1; S.p.push({ k: 'big', x: o.x, y: -200, vx: 0, vy: 1500 }); Sfx.play('superDive'); }
      dark = 1.2;
      if (tt > 2.7 && !S.p.some(q => q.k === 'big')) superEnd();
    },
    gempa(S, tt, dt) {
      const f = S.f, o = S.o;
      if (tt < 0.4) {
        S.pose = 'gempaW';
        if (S.stage === 0) { S.stage = 1; Sfx.play('jump'); dust(f.x, GROUND, 20, 2); S.tx = clamp(o.x - f.facing * 240, LEFT + 30, RIGHT - 30); }
        const u = tt / 0.4; f.z = (1 - (1 - u) * (1 - u)) * 900;
      } else if (tt < 0.62) {
        S.pose = 'gempaA';
        const u = (tt - 0.4) / 0.22; f.z = 900 * (1 - u * u);
        f.x += (S.tx - f.x) * Math.min(1, dt * 12);
      } else {
        if (S.stage === 1) {
          S.stage = 2; f.z = 0;
          shake += 34; flash = 0.8; Sfx.play('explode');
          dust(f.x, GROUND, 40, 3); ring(f.x, GROUND, 'rgba(255,190,110,', 380);
          parts.push({ t: 'crack', x: f.x, life: 2.6, max: 2.6, pts: [-1, 1].map(dir => { const a = [[f.x, GROUND + 4]]; let x = f.x; while (x > -20 && x < W + 20) { x += dir * rnd(30, 60); a.push([x, GROUND + 4 + rnd(-4, 26)]); } return a; }) });
        }
        shake = Math.max(shake, 6);
        const times = [0.8, 1.02, 1.26], fr = [0.2, 0.25, 0.55], ln = [480, 560, 950];
        while (S.n1 < 3 && tt >= times[S.n1]) {
          const i = S.n1++;
          parts.push({ t: 'pillar', x: o.x + rnd(-10, 10), life: 0.75, max: 0.75, h: 170 + i * 70 });
          if (i < 2) superHit(S, fr[i], { launch: ln[i], push: 40, sfx: 'boom', stop: 0.06, shake: 12 });
          else superFinal(S, fr[i], { launch: ln[i] });
          Sfx.play('explode');
          for (let j = 0; j < 10; j++) parts.push({ t: 'debris', x: o.x + rnd(-40, 40), y: GROUND - 10, vx: rnd(-300, 300), vy: rnd(-800, -400), a: rnd(0, 6), va: rnd(-12, 12), s: rnd(8, 16), life: 1.3, max: 1.3, c: '#7a6a58' });
        }
      }
      dark = 1.2;
      if (tt > 2.05) superEnd();
    },
    pedang(S, tt, dt) {
      const f = S.f, o = S.o;
      if (tt < 0.3) { S.pose = 'pedangW'; S.sword = tt / 0.3; S.big = 0; if (S.stage === 0) { S.stage = 1; Sfx.play('saber'); } }
      else if (tt < 1.5) {
        S.sword = 1;
        const want = Math.min(6, Math.floor((tt - 0.3) / 0.2) + 1);
        while (S.n1 < want) {
          S.n1++;
          f.trail.push({ x: f.x, y: f.y, rot: 0, pose: Object.assign({}, f.pose), facing: f.facing, life: 0.3 });
          const side = f.x < o.x ? 1 : -1;
          f.x = clamp(o.x + side * 175 * o.size, LEFT + 30, RIGHT - 30);
          f.facing = o.x >= f.x ? 1 : -1;
          S.pose = S.n1 % 2 ? 'pedangA' : 'pedangB';
          parts.push({ t: 'slash', x: o.x, y: o.y - 190 * o.size, a: rnd(-0.9, 0.9), life: 0.45, max: 0.45, c: S.col });
          Sfx.play('slash');
          superHit(S, 0.07, { push: 0, stun: 0.45, stop: 0.03, shake: 6 });
        }
      } else if (tt < 1.8) {
        S.pose = 'pedangB'; S.big = Math.min(1, (tt - 1.5) / 0.25);
        f.facing = o.x >= f.x ? 1 : -1;
        if (S.stage === 1) { S.stage = 2; Sfx.play('saber'); }
      } else {
        S.pose = 'pedangA';
        if (S.stage === 2) {
          S.stage = 3; Sfx.play('slash');
          parts.push({ t: 'slash', x: o.x, y: o.y - 190 * o.size, a: Math.PI / 2 - 0.15 * f.facing, life: 0.7, max: 0.7, big: true, c: S.col });
          superFinal(S, 0.58, { launch: 900 });
        }
      }
      dark = 1.3;
      if (tt > 2.35) superEnd();
    },
    petir(S, tt, dt) {
      const f = S.f, o = S.o;
      S.pose = 'petirA';
      f.z = tt < 0.4 ? (tt / 0.4) * 110 : 110 + Math.sin(tt * 6) * 8;
      dark = 1.8;
      while (S.n1 < 8 && tt >= 0.4 + S.n1 * 0.15) {
        S.n1++;
        addBolt(S, o.x + rnd(-25, 25), false);
        Sfx.play('zap'); Sfx.play('boom', 0.4);
        superHit(S, 0.05, { push: 40, stun: 0.4, stop: 0.02, shake: 7, y: o.y - 200 * o.size });
      }
      if (tt >= 1.85 && S.stage === 0) {
        S.stage = 1; addBolt(S, o.x, true); Sfx.play('thunder');
        superFinal(S, 0.6);
      }
      if (tt > 2.4) superEnd();
    },
    ais(S, tt, dt) {
      const f = S.f, o = S.o;
      S.snow = Math.min(1, S.t / 0.6);
      for (let i = 0; i < 4; i++) parts.push({ t: 'spark', x: rnd(-50, W + 50), y: rnd(-40, 300), vx: -f.facing * rnd(250, 450), vy: rnd(100, 260), life: 0.6, max: 0.6, c: '#ffffff', w: rnd(1.5, 3) });
      if (tt < 0.5) S.pose = 'aisW';
      else if (tt < 0.8) {
        S.pose = 'aisA';
        if (S.stage === 0) { S.stage = 1; Sfx.play('beam'); S.wx0 = f.x; }
        S.waveX = S.wx0 + (o.x - S.wx0) * ((tt - 0.5) / 0.3);
        if (Math.random() < 0.9) parts.push({ t: 'debris', x: S.waveX, y: GROUND - 6, vx: rnd(-80, 80), vy: rnd(-500, -250), a: rnd(0, 6), va: rnd(-10, 10), s: rnd(6, 12), life: 0.8, max: 0.8, c: '#d8f7ff' });
      }
      if (tt >= 0.8 && S.stage === 1) {
        S.stage = 2; S.waveX = null;
        superHit(S, 0.2, { freeze: 3.5, push: 0, stop: 0.08, shake: 10 });
        S.crystal = 1; Sfx.play('freeze'); ice(o.x, o.y - 160 * o.size, 16);
      }
      if (tt >= 0.95 && tt < 1.4) {
        S.pose = 'jetA'; f.thrust = 1;
        const tx = clamp(o.x - f.facing * 140 * o.size, LEFT + 30, RIGHT - 30);
        f.x += (tx - f.x) * Math.min(1, dt * 9);
      } else if (tt >= 1.4 && tt < 1.5) S.pose = 'crossA';
      if (tt >= 1.5 && S.stage === 2) {
        S.stage = 3; S.crystal = 0;
        superFinal(S, 0.8);
        ice(o.x, o.y - 160 * o.size, 60); Sfx.play('shatter');
      }
      dark = 1.0;
      if (tt > 2.15) superEnd();
    },
    nova(S, tt, dt) {
      const f = S.f, o = S.o;
      if (tt < 0.4) {
        S.pose = 'superUp';
        if (S.stage === 0) { S.stage = 1; Sfx.play('jump'); Sfx.play('swoosh'); dust(f.x, GROUND, 24, 2); ring(f.x, GROUND, 'rgba(255,220,120,', 220); shake += 8; }
        const u = tt / 0.4; f.z = u * u * 800; f.thrust = 1;
        if (Math.random() < 0.8) parts.push({ t: 'fire', x: f.x + rnd(-20, 20), y: f.y - rnd(0, 60), vx: rnd(-40, 40), vy: rnd(100, 300), r: rnd(10, 20), life: 0.5, max: 0.75 });
      } else if (tt < 0.88) {
        S.pose = 'jetA';
        if (S.stage === 1) { S.stage = 2; Sfx.play('superDive'); S.sx = clamp(o.x - f.facing * 460, LEFT - 160, RIGHT + 160); }
        const u = (tt - 0.4) / 0.48, e = Math.pow(u, 1.5);
        const ex = o.x - f.facing * 100 * o.size;
        f.x = S.sx + (ex - S.sx) * e;
        f.z = 480 + (Math.max(o.z, 40) + 30 - 480) * e;
        f.rot = -0.65; f.thrust = 1;
        for (let i = 0; i < 3; i++) parts.push({ t: 'fire', x: f.x - f.facing * rnd(0, 60), y: f.y - 180 * f.size + rnd(-40, 40), vx: -f.facing * rnd(100, 300), vy: rnd(-200, -60), r: rnd(14, 28), life: 0.45, max: 0.75 });
        sparks(f.x, f.y - 180 * f.size, GOLD, 2, 300);
      } else {
        if (o.state === 'air' || o.state === 'down' || o.state === 'getup' || o.state === 'frozen' || o.state === 'hurt') { o.koA = 0; setState(o, 'idle', true); }
        superFinal(S, 1, { launch: 1000 });
        superEnd();
        f.vz = 420; f.vx = -f.facing * 260; f.thrust = 1;
        return;
      }
      dark = 1.5;
    },
  };

  function updateSuperParts(S, dt) {
    const o = S.o;
    for (const q of S.p) {
      if (q.k === 'up') { q.x += q.vx * dt; q.y += q.vy * dt; if (q.y < -120) q.dead = true; if (Math.random() < 0.5) parts.push({ t: 'smoke', x: q.x, y: q.y + 10, vx: 0, vy: 30, r: 5, life: 0.4, max: 0.6, c: '220,220,230' }); }
      else if (q.k === 'down' || q.k === 'big') {
        q.vx = (o.x - q.x) * 3;
        q.x += q.vx * dt; q.y += q.vy * dt;
        if (Math.random() < 0.6) parts.push({ t: 'smoke', x: q.x, y: q.y - 16, vx: 0, vy: -30, r: q.k === 'big' ? 12 : 5, life: 0.4, max: 0.6, c: '220,220,230' });
        const hitY = o.y - (q.k === 'big' ? 260 : 300) * o.size;
        if (q.y >= hitY && Math.abs(q.x - o.x) < (q.k === 'big' ? 120 : 75) * o.size) {
          q.dead = true;
          if (q.k === 'down') { superHit(S, 0.035, { push: 40, stun: 0.4, sfx: 'boom', stop: 0.015, shake: 5, x: q.x, y: q.y }); boom(q.x, q.y, 0.55); }
          else superFinal(S, 0.51);
        } else if (q.y > GROUND) { q.dead = true; boom(q.x, GROUND - 6, 0.5); }
      } else { q.life -= dt; if (q.life <= 0) q.dead = true; }
    }
    S.p = S.p.filter(q => !q.dead);
  }

  function doKO(l) {
    if (phase === 'ko') return;
    if (superSeq) superEnd();
    phase = 'ko'; phaseT = 0;
    loser = l; winner = l === P ? E : P;
    setState(l, 'ko', true);
    l.vx = (l.x < winner.x ? -1 : 1) * 200;
    l.facing = l.x < winner.x ? 1 : -1;
    l.rot = 0;
    slow = 0.3; shake = 20; flash = 0.6;
    Sfx.play('explode');
    boom(l.x, l.y - 200 * l.size, 1.6);
  }

  function timeOver() {
    timeUp = true;
    const pp = P.hp / P.maxHp, ep = E.hp / E.maxHp;
    doKO(pp >= ep ? E : P);
  }

  function animPose(f, dt) {
    const tp = poseFor(f);
    const rate = isAttack(f) || f.state === 'super' ? 42 : f.state === 'hurt' || f.state === 'dodge' || f.state === 'air' ? 30 : 13;
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
      case 'air': Object.assign(p, POSE.air); break;
      case 'down': Object.assign(p, POSE.ko); break;
      case 'getup': Object.assign(p, POSE.getup); break;
      case 'dodge': Object.assign(p, POSE.dodge); break;
      case 'win': Object.assign(p, POSE.win); p.fs += Math.sin(f.t * 6) * 0.08; break;
      case 'ko': Object.assign(p, POSE.ko); break;
      case 'super': {
        const S = superSeq && superSeq.f === f ? superSeq : null;
        const key = !S || S.t < 0.9 ? 'superW' : S.pose;
        Object.assign(p, POSE[key] || POSE.superW);
        if (key === 'superW') { p.fs += Math.sin(f.t * 50) * 0.03; p.bs -= Math.sin(f.t * 50) * 0.03; }
        break;
      }
      default: {
        if (!isAttack(f)) break;
        const m = moveData(f), key = f.state === 'special' ? f.curPower : f.state;
        if (f.phaseA === 'wind') Object.assign(p, POSE[key + 'W'] || {});
        else if (f.state === 'special' && key === 'pedang' && f.phaseA === 'act') Object.assign(p, f.hits % 2 ? POSE.pedangA : POSE.pedangB);
        else if (f.phaseA === 'act' || f.stateT < m.wind + m.act + m.rec * 0.4 || f.z > 0) Object.assign(p, POSE[key + 'A'] || {});
        if (f.state === 'special' && f.phaseA === 'wind') p.head += Math.sin(f.t * 40) * 0.03;
      }
    }
    return p;
  }

  // ───────────── AI musuh ─────────────
  function aiBrain(e, p, dt) {
    const c = e.ctrl, A = e.ai;
    c.action = null;
    // sambung kombo jika serangan tadi kena
    if (MOVES[e.state]) {
      const nx = MOVES[e.state].next;
      if (nx && e.lastHitOk && !e.aiChain) { e.aiChain = true; e.aiNext = Math.random() < A.chainP ? pick(Object.keys(nx)) : null; }
      c.action = e.aiNext || null; c.move = 0; c.block = false;
      return;
    }
    if (!isFree(e)) { c.move = 0; c.block = false; e.aiBlockT = 0; return; }
    const dist = Math.abs(p.x - e.x), toward = p.x > e.x ? 1 : -1;
    if (isAttack(p) && p.phaseA === 'wind') {
      if (!e.aiSaw) {
        e.aiSaw = true;
        const r = Math.random();
        if (p.state === 'special') {
          if (r < A.dodgeP + (p.curPower === 'gempa' || p.curPower === 'petir' ? 0.1 : 0)) { c.action = 'dodge'; return; }
          if (r < A.dodgeP + A.blockP + 0.1) e.aiBlockT = 1.15;
        } else if (dist < moveData(p).range * p.size + 30 && r < A.blockP) e.aiBlockT = 0.5;
      }
    } else if (!isAttack(p)) e.aiSaw = false;
    if (e.aiBlockT > 0) { e.aiBlockT -= dt; c.block = true; c.move = 0; return; }
    c.block = false;
    if (e.superE >= 100 && Math.random() < dt * 0.7) { c.action = 'super'; return; }
    if (e.energy >= 100 && Math.random() < A.specialP * dt * 3) { c.action = 'special'; return; }
    e.aiT -= dt;
    const reach = MOVES.jab.range * e.size;
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
    if (!superSeq && !(P.state === 'special' && P.curPower === 'petir') && !(E.state === 'special' && E.curPower === 'petir')) dark = Math.max(0, dark - dtReal * 2);
    // kamera zum semasa serangan super
    const zt = superSeq && superSeq.t < 0.9 ? 1.35 : 1;
    camZ += (zt - camZ) * Math.min(1, dtReal * 7);
    if (superSeq) { camX += (superSeq.f.x - camX) * Math.min(1, dtReal * 8); camY += (superSeq.f.y - 170 - camY) * Math.min(1, dtReal * 8); }
    if (phase === 'intro') {
      const idx = phaseT < 1.5 ? -1 : phaseT < 2.1 ? 0 : phaseT < 2.7 ? 1 : phaseT < 3.3 ? 2 : 3;
      if (idx !== beepIdx) { beepIdx = idx; if (idx >= 0 && idx < 3) Sfx.play('beep'); if (idx === 3) Sfx.play('go'); }
      if (phaseT >= 3.3) phase = 'fight';
      stepFighter(P, E, dt, false); stepFighter(E, P, dt, false);
    } else if (phase === 'fight') {
      if (resumeT > 0) {
        resumeT -= dtReal;
        stepFighter(P, E, dt, false); stepFighter(E, P, dt, false);
      } else if (superSeq) {
        if (hitStop > 0) hitStop -= dtReal; else updateSuper(dtReal);
      } else {
        if (slowT > 0) { slowT -= dtReal; if (slowT <= 0) slow = 1; }
        roundT -= dt;
        if (roundT <= 0) { roundT = 0; timeOver(); }
        P.ctrl.move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        P.ctrl.block = input.block;
        P.ctrl.action = input.buf && time - input.buf.t < 0.35 ? input.buf.a : null;
        if (input.buf && time - input.buf.t >= 0.35) input.buf = null;
        aiBrain(E, P, dt);
        if (hitStop > 0) hitStop -= dtReal;
        else {
          if (stepFighter(P, E, dt, true)) input.buf = null;
          if (phase === 'fight') stepFighter(E, P, dt, true);
          if (phase === 'fight') updateProjs(dt);
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
      projs = [];
      if (phaseT > 0.4 && phaseT < 2.6 && Math.random() < dtReal * 5) {
        boom(loser.x + rnd(-110, 110) * loser.size, GROUND - rnd(20, 120) * loser.size, rnd(0.5, 0.9));
        Sfx.play('boom', 0.5); shake += 4;
      }
      if (phaseT > 1.5 && winner.state !== 'win' && winner.z <= 0) { setState(winner, 'win', true); if (winner === P) Sfx.play('win'); else Sfx.play('lose'); }
      if (phaseT > 3.8 && !resultSent) {
        resultSent = true; phase = 'done';
        if (cb.onResult) cb.onResult({ win: winner === P, level, hpPct: P.hp / P.maxHp, timeUp, enemy: E.name });
      }
    } else if (phase === 'done') {
      stepFighter(winner, loser, dtReal, false);
      stepFighter(loser, winner, dtReal, false);
    }
    updateParts(dt);
    if (banner) { banner.life -= dtReal; if (banner.life <= 0) banner = null; }
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
    const lift = Math.min(0.65, (f.z || 0) / 450);
    ctx.fillStyle = `rgba(0,0,0,${0.32 * (1 - lift * 0.6)})`;
    const ox = f.koA ? f.facing * -80 * f.size * f.koA / 1.45 : 0;
    ctx.beginPath(); ctx.ellipse(f.x + ox, GROUND + 3, (70 + (f.koA ? 90 : 0)) * f.size * (1 - lift), 11 * (1 - lift * 0.5), 0, 0, Math.PI * 2); ctx.fill();
  }
  function drawSword(f) {
    const m = POWERS.pedang;
    const S = superSeq && superSeq.f === f && superSeq.type === 'pedang' && superSeq.t >= 0.9 ? superSeq : null;
    if (!S && !(f.state === 'special' && f.curPower === 'pedang')) return;
    if (!S && f.phaseA === 'rec' && f.stateT > m.wind + m.act + 0.15) return;
    const pts = Robot.points(f);
    let dx = pts.handF.x - pts.elbowF.x, dy = pts.handF.y - pts.elbowF.y;
    const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const grow = S ? (S.sword || 0) : f.phaseA === 'wind' ? clamp(f.stateT / m.wind, 0, 1) : 1;
    const len = 130 * f.size * grow * (S ? 1.4 + (S.big || 0) * 2.2 : 1);
    const x0 = pts.handF.x - dx * 6, y0 = pts.handF.y - dy * 6, x1 = x0 + dx * len, y1 = y0 + dy * len;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2a2f45'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(x0 - dx * 18, y0 - dy * 18); ctx.lineTo(x0, y0); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = f.d.glow; ctx.globalAlpha = 0.45; ctx.lineWidth = 20;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.globalAlpha = 1; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.restore();
  }
  function drawIce(f) {
    if (f.state !== 'frozen' || (superSeq && superSeq.crystal && superSeq.o === f)) return;
    const s = f.size, x = f.x - 78 * s, y = f.y - 330 * s, w = 156 * s, h = 336 * s;
    const left = clamp(1 - f.stateT / f.stun, 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.25 * left;
    ctx.fillStyle = '#bdf3ff'; Robot.rr(ctx, x, y, w, h, 18 * s); ctx.fill();
    ctx.globalAlpha = 0.9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
    ctx.globalAlpha = 0.6; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + w * 0.2, y + 20); ctx.lineTo(x + w * 0.35, y + h * 0.45); ctx.moveTo(x + w * 0.7, y + 30); ctx.lineTo(x + w * 0.55, y + h * 0.3);
    ctx.moveTo(x + w * 0.8, y + h * 0.6); ctx.lineTo(x + w * 0.65, y + h * 0.85); ctx.stroke();
    ctx.restore();
    outlinedText('❄️ BEKU!', f.x, y - 18, 22, '#bdf3ff');
  }
  function drawFighter(f) {
    for (const g of f.trail) {
      ctx.globalAlpha = Math.max(0, g.life / 0.25) * 0.35;
      Robot.draw(ctx, { x: g.x, y: g.y, facing: g.facing, size: f.size, pose: g.pose, d: f.d, t: f.t, energy: 0, thrust: 0, koA: 0, rot: g.rot }, 'ghost');
    }
    ctx.globalAlpha = 1;
    let df = f;
    if (f.state === 'spin' && f.phaseA === 'wind' && f.stateT > MOVES.spin.wind * 0.3) df = Object.assign({}, f, { facing: -f.facing });
    Robot.draw(ctx, df, f.flash > 0 ? 'flash' : undefined);
    drawSword(f);
    drawIce(f);
    if (f.state === 'block') {
      const sx = f.x + f.facing * 92 * f.size, sy = f.y - 205 * f.size;
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
  function drawPowerFx(f) {
    if (f.state !== 'special') return;
    const id = f.curPower, m = POWERS[id], t = f.stateT, glow = f.d.glow;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (id === 'laser' || id === 'ais') {
      const o = beamOrigin(f), ox = o.x, oy = o.y;
      const col = id === 'ais' ? '#9ff0ff' : glow;
      if (t < m.wind) {
        const u = t / m.wind, r = (6 + u * (id === 'ais' ? 18 : 26)) * f.size;
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, r * 2.2);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, col); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox, oy, r * 2.2, 0, Math.PI * 2); ctx.fill();
        if (Math.random() < 0.7) {
          const a = rnd(0, Math.PI * 2), d = rnd(70, 130);
          parts.push({ t: 'spark', x: ox + Math.cos(a) * d, y: oy + Math.sin(a) * d, vx: -Math.cos(a) * d * 4, vy: -Math.sin(a) * d * 4, life: 0.22, max: 0.45, c: col, w: 3 });
        }
      } else if (t < m.wind + m.act + 0.08) {
        const u = (t - m.wind) / m.act;
        const base = id === 'ais' ? 20 : 46;
        const w = Math.max(0, (base * (1 - Math.pow(Math.min(1, u), 3)) + Math.sin(time * 70) * (id === 'ais' ? 2 : 5))) * f.size;
        const ex = f.facing > 0 ? W + 40 : -40;
        const x0 = Math.min(ox, ex), x1 = Math.max(ox, ex);
        const g = ctx.createLinearGradient(0, oy - w, 0, oy + w);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.3, col); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.7, col); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(x0, oy - w, x1 - x0, w * 2);
        if (id === 'ais') {
          ctx.fillStyle = 'rgba(220,250,255,.8)';
          for (let x = ox; f.facing > 0 ? x < W : x > 0; x += f.facing * 46) {
            const yy = oy + Math.sin(x * 0.05 + time * 20) * w * 0.9;
            ctx.beginPath(); ctx.moveTo(x, yy - 6); ctx.lineTo(x + 5, yy); ctx.lineTo(x, yy + 6); ctx.lineTo(x - 5, yy); ctx.closePath(); ctx.fill();
          }
        }
        const rg = ctx.createRadialGradient(ox, oy, 0, ox, oy, w * 1.8);
        rg.addColorStop(0, '#ffffff'); rg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(ox, oy, w * 1.8, 0, Math.PI * 2); ctx.fill();
      }
    } else if (id === 'petir') {
      const pts = Robot.points(f), hx = pts.handF.x, hy = pts.handF.y;
      const r = (14 + Math.sin(time * 30) * 4) * f.size;
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 2.5);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#9fd8ff'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, r * 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#dff1ff'; ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); let x = hx, y = hy; ctx.moveTo(x, y);
        for (let j = 0; j < 5; j++) { x += rnd(-22, 22); y -= rnd(16, 34); ctx.lineTo(x, y); }
        ctx.stroke();
      }
    } else if (id === 'roket' && t < m.wind + m.act) {
      const x = f.x - f.facing * 40 * f.size, y = f.y - 285 * f.size;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 30 * f.size);
      g.addColorStop(0, 'rgba(255,220,140,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 30 * f.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  function drawProjs() {
    for (const p of projs) {
      if (p.t === 'missile') {
        const a = Math.atan2(p.vy, p.vx);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a);
        ctx.globalCompositeOperation = 'lighter';
        const fl = 16 + Math.random() * 10;
        ctx.fillStyle = 'rgba(255,170,60,.9)';
        ctx.beginPath(); ctx.moveTo(-12, -5); ctx.lineTo(-12 - fl, 0); ctx.lineTo(-12, 5); ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        Robot.rr(ctx, -13, -5.5, 24, 11, 5); ctx.fillStyle = '#e9edf3'; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#141a2c'; ctx.stroke();
        ctx.fillStyle = p.owner.d.accent; ctx.beginPath(); ctx.moveTo(11, -5.5); ctx.quadraticCurveTo(20, 0, 11, 5.5); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      } else if (p.t === 'shock') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(p.x, GROUND, 0, p.x, GROUND, 90);
        g.addColorStop(0, 'rgba(255,230,160,.95)'); g.addColorStop(0.5, 'rgba(255,140,40,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(p.x, GROUND, 90, 60, 0, Math.PI, 0); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#6b5a48'; ctx.strokeStyle = '#141a2c'; ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          const x = p.x - p.dir * i * 34, hgt = (60 - i * 13) * (0.8 + Math.sin(time * 40 + i) * 0.2);
          ctx.beginPath(); ctx.moveTo(x - 14, GROUND); ctx.lineTo(x + p.dir * 4, GROUND - hgt); ctx.lineTo(x + 14, GROUND); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      } else if (p.t === 'strike') {
        if (!p.fired) {
          const u = 1 - clamp(p.delay / 0.38, 0, 1);
          ctx.save();
          ctx.strokeStyle = `rgba(255,240,120,${0.5 + 0.5 * Math.sin(time * 40)})`; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.ellipse(p.x, GROUND + 2, 80 * (1.2 - u * 0.4), 14, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = `rgba(255,240,120,${0.15 + u * 0.25})`; ctx.fill();
          ctx.restore();
        } else {
          const a = clamp(p.life / 0.25, 0, 1);
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = `rgba(150,200,255,${a * 0.7})`; ctx.lineWidth = 18; ctx.lineJoin = 'round';
          ctx.beginPath(); p.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
          ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 6; ctx.stroke();
          ctx.restore();
        }
      }
    }
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
      } else if (p.t === 'slash') {
        const L = p.big ? 1100 : 760, wv = (p.big ? 26 : 12) * Math.min(1, a * 1.6);
        const dx = Math.cos(p.a) * L / 2, dy = Math.sin(p.a) * L / 2;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
        ctx.globalAlpha = a; ctx.strokeStyle = p.c; ctx.lineWidth = wv * 2.2;
        ctx.beginPath(); ctx.moveTo(p.x - dx, p.y - dy); ctx.lineTo(p.x + dx, p.y + dy); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = wv * 0.7; ctx.stroke();
        ctx.restore();
      } else if (p.t === 'bolt') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
        ctx.strokeStyle = `rgba(150,200,255,${a * 0.7})`; ctx.lineWidth = p.big ? 46 : 18;
        ctx.beginPath(); p.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = p.big ? 14 : 6; ctx.stroke();
        ctx.restore();
      } else if (p.t === 'arc') {
        const R = { kick: 115, spin: 150, up: 120, down: 120, big: 165 }[p.kind] * p.size;
        const [a0, a1] = { kick: [-0.9, 0.7], spin: [-1.7, 1.1], up: [1.3, -1.5], down: [-1.5, 1.3], big: [-2.3, 1.6] }[p.kind];
        const cy = p.y - ({ kick: 175, spin: 200, up: 215, down: 200, big: 200 }[p.kind]) * p.size;
        ctx.save(); ctx.translate(p.x, cy); ctx.scale(p.facing, 1);
        ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
        const n = 10;
        for (let i = 0; i < n; i++) {
          const u0 = i / n, u1 = (i + 1) / n;
          ctx.globalAlpha = a * (0.15 + 0.85 * u1);
          ctx.strokeStyle = i > n - 3 ? '#ffffff' : p.c; ctx.lineWidth = (4 + u1 * 14) * p.size;
          ctx.beginPath(); ctx.arc(30 * p.size, 0, R, a0 + (a1 - a0) * u0, a0 + (a1 - a0) * u1, a1 < a0); ctx.stroke();
        }
        ctx.restore();
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
  function superBar(x, y, w, h, f, right) {
    ctx.fillStyle = 'rgba(10,14,30,.8)';
    Robot.rr(ctx, x - 3, y - 3, w + 6, h + 6, 6); ctx.fill();
    const p = clamp(f.superE / 100, 0, 1), bw = w * p;
    if (bw > 0) {
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, '#ff9f1c'); g.addColorStop(1, '#ffe066');
      ctx.fillStyle = p >= 1 && Math.sin(time * 12) > 0 ? '#ffffff' : g;
      Robot.rr(ctx, right ? x + w - bw : x, y, bw, h, 4); ctx.fill();
    }
  }

  function drawHUD() {
    const bw = 350;
    outlinedText(P.name, 22, 20, 18, '#ffffff', 'left');
    outlinedText(E.name, W - 22, 20, 18, '#ffffff', 'right');
    hpBar(22, 34, bw, 24, P, false);
    hpBar(W - 22 - bw, 34, bw, 24, E, true);
    enBar(22, 68, 220, 11, P, false);
    enBar(W - 22 - 220, 68, 220, 11, E, true);
    outlinedText(POWERS[P.power] ? POWERS[P.power].ikon : '⚡', 250, 73, 17, '#ffe14d', 'left');
    outlinedText(E.power === 'rawak' ? '🎲' : (POWERS[E.power] ? POWERS[E.power].ikon : '⚡'), W - 250, 73, 17, '#ffe14d', 'right');
    if (P.energy >= 100) outlinedText('PENUH! Tekan ⚡', 276, 74, 14, Math.sin(time * 10) > 0 ? '#ffe14d' : '#ffffff', 'left');
    else if (P.hint > 0) outlinedText('Belum penuh!', 276, 74, 14, '#ff9d9d', 'left');
    superBar(22, 88, 220, 8, P, false);
    if (E.superMult > 0) superBar(W - 22 - 220, 88, 220, 8, E, true);
    outlinedText('⭐', 250, 92, 15, GOLD, 'left');
    if (E.superMult > 0) outlinedText('⭐', W - 250, 92, 15, GOLD, 'right');
    if (P.superE >= 100) outlinedText('SUPER SEDIA!', 274, 93, 14, Math.sin(time * 12) > 0 ? GOLD : '#ffffff', 'left');
    else if (P.hintS > 0) outlinedText('Belum penuh!', 274, 93, 14, '#ff9d9d', 'left');
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
        if (tip) outlinedText('💡 Tip: ' + tip, W / 2, 330, 22, '#7df9ff');
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
    if (banner && (phase === 'fight' || phase === 'ko')) {
      const u = 1 - banner.life / banner.max;
      const sc = u < 0.12 ? 0.6 + u / 0.12 * 0.5 : u < 0.2 ? 1.1 - (u - 0.12) / 0.08 * 0.1 : 1;
      ctx.globalAlpha = Math.min(1, banner.life * 3);
      outlinedText(banner.text, W / 2, 196, 34 * sc, banner.c, 'center', '#12162a');
      ctx.globalAlpha = 1;
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

  function drawSuperBack() {
    if (!superSeq) return;
    const S = superSeq, f = S.f, tt = S.t - 0.9, rgb = rgbOf(S.col);
    const cx = f.x, cy = f.y - 170 * f.size;
    ctx.save();
    if (S.type === 'ais' && S.snow) { ctx.fillStyle = `rgba(190,235,255,${0.22 * S.snow})`; ctx.fillRect(-M * 3, -M * 3, W + M * 6, H + M * 6); }
    ctx.globalCompositeOperation = 'lighter';
    const charging = S.t < 0.9 || (S.type === 'nova' && tt < 0.4);
    if (charging) {
      const pw = S.t < 0.9 ? Math.min(1, S.t / 0.3) : 1 - tt / 0.4;
      const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 260 * f.size);
      g.addColorStop(0, `rgba(255,255,230,${0.8 * pw})`); g.addColorStop(0.5, `rgba(${rgb},${0.4 * pw})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 260 * f.size, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(${rgb},${0.3 * pw})`;
      for (let i = 0; i < 14; i++) {
        const a = time * 1.6 + (i / 14) * Math.PI * 2, L = 420 * f.size;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a - 0.08) * L, cy + Math.sin(a - 0.08) * L);
        ctx.lineTo(cx + Math.cos(a + 0.08) * L, cy + Math.sin(a + 0.08) * L);
        ctx.closePath(); ctx.fill();
      }
    } else if (S.type === 'nova' && tt >= 0.4) {
      const tx = S.sx - f.facing * 120, ty = GROUND - 600 - 180 * f.size;
      const g = ctx.createLinearGradient(f.x, f.y - 180 * f.size, tx, ty);
      g.addColorStop(0, 'rgba(255,250,210,.95)'); g.addColorStop(0.3, 'rgba(255,190,40,.6)'); g.addColorStop(1, 'rgba(255,120,0,0)');
      ctx.strokeStyle = g; ctx.lineCap = 'round';
      ctx.lineWidth = 120 * f.size; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.moveTo(f.x, f.y - 180 * f.size); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.lineWidth = 50 * f.size; ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(f.x, f.y - 180 * f.size); ctx.lineTo(tx, ty); ctx.stroke();
    } else if (S.type === 'petir') {
      // aura elektrik
      const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 200 * f.size);
      g.addColorStop(0, 'rgba(200,235,255,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 200 * f.size, 0, Math.PI * 2); ctx.fill();
    }
    if (S.type === 'ais' && S.waveX != null) {
      const x0 = Math.min(S.wx0, S.waveX), x1 = Math.max(S.wx0, S.waveX);
      ctx.fillStyle = 'rgba(200,245,255,.55)';
      for (let x = x0; x <= x1; x += 26) {
        const h = 26 + ((x * 13) % 30);
        ctx.beginPath(); ctx.moveTo(x - 12, GROUND); ctx.lineTo(x, GROUND - h); ctx.lineTo(x + 12, GROUND); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawMissile(x, y, vx, vy, accent, sc) {
    const a = Math.atan2(vy, vx);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(sc, sc);
    ctx.globalCompositeOperation = 'lighter';
    const fl = 16 + Math.random() * 10;
    ctx.fillStyle = 'rgba(255,170,60,.9)';
    ctx.beginPath(); ctx.moveTo(-12, -5); ctx.lineTo(-12 - fl, 0); ctx.lineTo(-12, 5); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    Robot.rr(ctx, -13, -5.5, 24, 11, 5); ctx.fillStyle = '#e9edf3'; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#141a2c'; ctx.stroke();
    ctx.fillStyle = accent; ctx.beginPath(); ctx.moveTo(11, -5.5); ctx.quadraticCurveTo(20, 0, 11, 5.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawSuperFront() {
    if (!superSeq) return;
    const S = superSeq, f = S.f, o = S.o;
    // aura berwarna pada robot
    if (!f._supD || f._supD.src !== f.d || f._supD.glow !== S.col) f._supD = Object.assign({}, f.d, { glow: S.col, _p: null, src: f.d });
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.28 + 0.14 * Math.sin(time * 25);
    Robot.draw(ctx, Object.assign({}, f, { d: f._supD }), 'ghost');
    ctx.restore();
    ctx.globalAlpha = 1;
    // laser hiper
    if (S.type === 'laser' && S.beam > 0) {
      const pts = Robot.points(f);
      const ox = (pts.handF.x + pts.handB.x) / 2 + f.facing * 10, oy = (pts.handF.y + pts.handB.y) / 2;
      const w = (95 + Math.sin(time * 60) * 10) * S.beam * f.size;
      const ex = f.facing > 0 ? W + 60 : -60, x0 = Math.min(ox, ex), x1 = Math.max(ox, ex);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, oy - w, 0, oy + w);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.25, S.col); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.75, S.col); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(x0, oy - w, x1 - x0, w * 2);
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      for (let i = 0; i < 6; i++) { const x = x0 + Math.random() * (x1 - x0), y = oy + rnd(-w, w) * 0.8; ctx.fillRect(x, y, 40, 3); }
      const rg = ctx.createRadialGradient(ox, oy, 0, ox, oy, w * 1.6);
      rg.addColorStop(0, '#ffffff'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(ox, oy, w * 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // roket
    for (const q of S.p) {
      if (q.k === 'up') drawMissile(q.x, q.y, q.vx, q.vy, f.d.accent, 1.1);
      else if (q.k === 'down') drawMissile(q.x, q.y, q.vx, q.vy, f.d.accent, 1.2);
      else if (q.k === 'big') drawMissile(q.x, q.y, q.vx, q.vy, f.d.accent, 3.2);
    }
    // kristal ais gergasi
    if (S.type === 'ais' && S.crystal) {
      const s = o.size, cx = o.x, top = o.y - 380 * s, bot = o.y + 4, w = 120 * s;
      ctx.save();
      ctx.globalAlpha = 0.55;
      const g = ctx.createLinearGradient(cx - w, top, cx + w, bot);
      g.addColorStop(0, '#e9fbff'); g.addColorStop(0.5, '#9fe7ff'); g.addColorStop(1, '#d4f6ff');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx, top - 40 * s); ctx.lineTo(cx + w, top + 60 * s); ctx.lineTo(cx + w * 0.9, bot - 20 * s);
      ctx.lineTo(cx, bot); ctx.lineTo(cx - w * 0.9, bot - 20 * s); ctx.lineTo(cx - w, top + 60 * s); ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.95; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
      ctx.globalAlpha = 0.6; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, top - 40 * s); ctx.lineTo(cx, bot); ctx.moveTo(cx - w, top + 60 * s); ctx.lineTo(cx + w * 0.3, bot - 60 * s); ctx.stroke();
      ctx.restore();
      if (Math.random() < 0.4) sparks(cx + rnd(-w, w), rnd(top, bot), '#ffffff', 1, 80);
    }
  }

  function drawGroundParts() {
    for (const p of parts) {
      const a = Math.max(0, p.life / p.max);
      if (p.t === 'crack') {
        ctx.save(); ctx.globalAlpha = Math.min(1, a * 2);
        ctx.strokeStyle = '#1a140f'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
        for (const line of p.pts) { ctx.beginPath(); line.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
        ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,120,40,.6)'; ctx.lineWidth = 2;
        for (const line of p.pts) { ctx.beginPath(); line.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
        ctx.restore();
      } else if (p.t === 'pillar') {
        const u = 1 - a, grow = u < 0.15 ? u / 0.15 : u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1;
        const h = p.h * grow, w = 60;
        ctx.save();
        ctx.fillStyle = '#7a6550'; ctx.strokeStyle = '#141a2c'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(p.x - w, GROUND + 4); ctx.lineTo(p.x - w * 0.45, GROUND - h * 0.7); ctx.lineTo(p.x, GROUND - h); ctx.lineTo(p.x + w * 0.5, GROUND - h * 0.65); ctx.lineTo(p.x + w, GROUND + 4); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#9b8468'; ctx.beginPath(); ctx.moveTo(p.x - w * 0.3, GROUND); ctx.lineTo(p.x, GROUND - h * 0.9); ctx.lineTo(p.x + w * 0.15, GROUND); ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,140,40,${0.5 * grow})`;
        ctx.beginPath(); ctx.ellipse(p.x, GROUND, w * 1.3, 16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
  }

  function render() {
    if (!ctx) return;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    if (scene === 'garage') { drawGarage(); return; }
    ensureBg();
    const sx = shake > 0.3 ? rnd(-shake, shake) * 0.6 : 0, sy = shake > 0.3 ? rnd(-shake, shake) * 0.6 : 0;
    ctx.save();
    ctx.translate(clamp(sx, -M, M), clamp(sy, -M, M));
    if (camZ > 1.001) { ctx.translate(camX, camY); ctx.scale(camZ, camZ); ctx.translate(-camX, -camY); }
    ctx.drawImage(bg, -M, -M, W + M * 2, H + M * 2);
    drawClouds();
    drawBolt();
    if (dark > 0) { ctx.fillStyle = `rgba(8,10,30,${Math.min(0.78, dark * 0.5)})`; ctx.fillRect(-M * 3, -M * 3, W + M * 6, H + M * 6); }
    if (E) drawShadow(E);
    if (P) drawShadow(P);
    const order = [E, P].filter(Boolean);
    if (phase === 'ko' || phase === 'done') order.sort((a, b) => (a === loser ? -1 : 1));
    drawGroundParts();
    drawSuperBack();
    for (const f of order) drawFighter(f);
    drawSuperFront();
    for (const f of order) drawPowerFx(f);
    drawProjs();
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
    enemyInfo, SKINS, MUSUH, POWERS, POWER_IDS, COMBOS, playerStats, cb,
    setPaused(v) { paused = !!v; if (v) clearInput(); },
    setFrozen(v) { const was = frozen; frozen = !!v; if (v) clearInput(); if (was && !v && scene === 'fight' && phase === 'fight') resumeT = 1.6; },
    get scene() { return scene; }, get phase() { return phase; }, get paused() { return paused; }, get level() { return level; },
    debug: () => ({ P, E, projs, sup: superSeq }),
    superReady: () => !!(P && scene === 'fight' && P.superE >= 100)
  };
})();
