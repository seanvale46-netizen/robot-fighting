'use strict';
/*
 * Lukisan robot gergasi menggunakan rangka (skeleton) 2D.
 * Koordinat tempatan: asal di tanah antara kaki, robot menghadap kanan (+x), y negatif ke atas.
 * Sudut anggota: 0 = menghala ke bawah, positif = berpusing ke hadapan.
 */
const Robot = (() => {
  const OUT = '#141a2c';
  const TH = 72, SH = 68, UA = 54, FA = 52, TORSO = 100, FOOT = 16;

  function rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  function mix(a, b, t) {
    const A = rgb(a), B = rgb(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function pal(d) {
    if (d._p) return d._p;
    const metal = d.metal || '#aab4c4';
    const mk = dark => {
      const m = c => dark ? mix(c, '#0a0d18', 0.3) : c;
      return {
        main: m(d.main), mainL: m(mix(d.main, '#ffffff', 0.38)), mainD: m(mix(d.main, '#000000', 0.3)),
        metal: m(metal), metalD: m(mix(metal, '#000000', 0.4)), accent: m(d.accent),
        glow: d.glow, joint: m('#384055'), out: OUT
      };
    };
    const solid = (c, o) => ({ main: c, mainL: c, mainD: c, metal: c, metalD: c, accent: c, glow: c, joint: c, out: o || c });
    d._p = { front: mk(false), back: mk(true), flash: solid('#ffffff', '#fff3c4'), ghost: solid(d.glow) };
    return d._p;
  }

  function legDrop(h, k) { return TH * Math.cos(h) + SH * Math.cos(h + k); }

  function solve(p, d) {
    const bulk = (d && d.bulk) || 1;
    const dF = legDrop(p.fh, p.fk), dB = legDrop(p.bh, p.bk);
    const hipH = Math.max(dF, dB) + FOOT;
    const hip = { x: p.dx || 0, y: -hipH };
    const L = p.lean, cs = Math.cos(L), sn = Math.sin(L);
    const tl = (u, v) => ({ x: hip.x + u * cs + v * sn, y: hip.y + u * sn - v * cs });
    const shF = tl(12 * bulk, 86), shB = tl(-12 * bulk, 86);
    const hpF = tl(9, -2), hpB = tl(-9, -2);
    const arm = (sh, s, e) => {
      const a1 = s, a2 = s + e;
      const el = { x: sh.x + UA * Math.sin(a1), y: sh.y + UA * Math.cos(a1) };
      const hd = { x: el.x + FA * Math.sin(a2), y: el.y + FA * Math.cos(a2) };
      return { el, hd, a1, a2 };
    };
    const leg = (hp, h, k) => {
      const kn = { x: hp.x + TH * Math.sin(h), y: hp.y + TH * Math.cos(h) };
      const ft = { x: kn.x + SH * Math.sin(h + k), y: kn.y + SH * Math.cos(h + k) };
      return { kn, ft, a1: h, a2: h + k };
    };
    return {
      hip, L, shF, shB, hpF, hpB, neck: tl(4, 108), core: tl(14 * bulk, 72),
      aF: arm(shF, p.fs, p.fe), aB: arm(shB, p.bs, p.be),
      lF: leg(hpF, p.fh, p.fk), lB: leg(hpB, p.bh, p.bk),
      gF: dF >= dB - 3, gB: dB >= dF - 3
    };
  }

  // Bar bulat (anggota)
  function bar(ctx, a, b, w, fill, out, hl) {
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), an = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(a.x, a.y); ctx.rotate(an);
    rr(ctx, -w * 0.35, -w / 2, L + w * 0.7, w, w * 0.42);
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = out; ctx.stroke();
    if (hl) { rr(ctx, w * 0.05, -w / 2 + 4, L * 0.75, w * 0.22, w * 0.11); ctx.fillStyle = hl; ctx.fill(); }
    ctx.restore();
  }
  function circle(ctx, x, y, r, fill, out) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill();
    if (out) { ctx.lineWidth = 3.5; ctx.strokeStyle = out; ctx.stroke(); }
  }

  function drawLeg(ctx, hp, l, P, flat) {
    bar(ctx, hp, l.kn, 28, P.metal, P.out);
    // pelindung peha
    const m1 = { x: hp.x + (l.kn.x - hp.x) * 0.15, y: hp.y + (l.kn.y - hp.y) * 0.15 };
    const m2 = { x: hp.x + (l.kn.x - hp.x) * 0.82, y: hp.y + (l.kn.y - hp.y) * 0.82 };
    bar(ctx, m1, m2, 34, P.main, P.out, P.mainL);
    // betis (but)
    bar(ctx, l.kn, l.ft, 38, P.main, P.out, P.mainL);
    const s1 = { x: l.kn.x + (l.ft.x - l.kn.x) * 0.55, y: l.kn.y + (l.ft.y - l.kn.y) * 0.55 };
    const s2 = { x: l.kn.x + (l.ft.x - l.kn.x) * 0.8, y: l.kn.y + (l.ft.y - l.kn.y) * 0.8 };
    bar(ctx, s1, s2, 40, P.accent, P.out);
    // lutut
    circle(ctx, l.kn.x, l.kn.y, 14, P.joint, P.out);
    circle(ctx, l.kn.x, l.kn.y, 6, P.accent);
    // tapak kaki
    ctx.save();
    ctx.translate(l.ft.x, l.ft.y);
    if (!flat) ctx.rotate(-l.a2 * 0.85);
    ctx.beginPath();
    ctx.moveTo(-22, -8); ctx.lineTo(22, -8);
    ctx.quadraticCurveTo(40, -4, 40, FOOT);
    ctx.lineTo(-24, FOOT);
    ctx.quadraticCurveTo(-28, 2, -22, -8);
    ctx.closePath();
    ctx.fillStyle = P.metalD; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = P.out; ctx.stroke();
    rr(ctx, 10, -6, 28, 12, 6); ctx.fillStyle = P.main; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }

  function drawArm(ctx, sh, a, P, d) {
    bar(ctx, sh, a.el, 24, P.metal, P.out);
    bar(ctx, a.el, a.hd, 33, P.main, P.out, P.mainL);
    const b1 = { x: a.el.x + (a.hd.x - a.el.x) * 0.62, y: a.el.y + (a.hd.y - a.el.y) * 0.62 };
    const b2 = { x: a.el.x + (a.hd.x - a.el.x) * 0.8, y: a.el.y + (a.hd.y - a.el.y) * 0.8 };
    bar(ctx, b1, b2, 35, P.accent, P.out);
    circle(ctx, a.el.x, a.el.y, 12, P.joint, P.out);
    // penumbuk / cakar
    const ux = Math.sin(a.a2), uy = Math.cos(a.a2);
    const fx = a.hd.x + ux * 8, fy = a.hd.y + uy * 8;
    ctx.save();
    ctx.translate(fx, fy); ctx.rotate(Math.atan2(uy, ux));
    if (d.claws) {
      ctx.fillStyle = '#f4f1e8'; ctx.strokeStyle = P.out; ctx.lineWidth = 3;
      for (const y of [-11, 0, 11]) {
        ctx.beginPath(); ctx.moveTo(6, y - 5); ctx.lineTo(34, y + 1); ctx.lineTo(6, y + 5); ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
    }
    rr(ctx, -15, -16, 31, 32, 9);
    ctx.fillStyle = P.metalD; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = P.out; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, -12); ctx.lineTo(8, 12); ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }

  function drawPad(ctx, sh, a, L, P, d, big) {
    ctx.save();
    ctx.translate(sh.x, sh.y);
    ctx.rotate(L * 0.8 + (a.a1 - 0.45) * 0.22);
    const s = big ? 1 : 0.9;
    ctx.scale(s, s);
    if (d.spikes) {
      ctx.beginPath(); ctx.moveTo(-14, -20); ctx.lineTo(-4, -46); ctx.lineTo(6, -20); ctx.closePath();
      ctx.fillStyle = P.accent; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = P.out; ctx.stroke();
    }
    rr(ctx, -30, -26, 60, 44, 17);
    ctx.fillStyle = P.main; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = P.out; ctx.stroke();
    rr(ctx, -22, -20, 32, 8, 4); ctx.fillStyle = P.mainL; ctx.fill();
    rr(ctx, -24, -4, 48, 8, 4); ctx.fillStyle = P.accent; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }

  function drawTorso(ctx, J, P, d, f) {
    const bulk = d.bulk || 1;
    ctx.save();
    ctx.translate(J.hip.x, J.hip.y);
    ctx.rotate(J.L);
    // pinggul
    rr(ctx, -31, -14, 62, 32, 11);
    ctx.fillStyle = P.metalD; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = P.out; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(10, -6); ctx.lineTo(0, 12); ctx.closePath();
    ctx.fillStyle = P.accent; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    // pinggang
    rr(ctx, -21, -52, 42, 44, 8);
    ctx.fillStyle = P.joint; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = P.metal; ctx.lineWidth = 3;
    for (const y of [-42, -32, -22]) { ctx.beginPath(); ctx.moveTo(-14, y); ctx.lineTo(14, y); ctx.stroke(); }
    // dada
    ctx.save();
    ctx.scale(bulk, 1);
    ctx.beginPath();
    ctx.moveTo(-34, -48);
    ctx.lineTo(34, -48);
    ctx.quadraticCurveTo(54, -72, 48, -106);
    ctx.lineTo(-44, -110);
    ctx.quadraticCurveTo(-52, -72, -34, -48);
    ctx.closePath();
    ctx.fillStyle = P.main; ctx.fill();
    ctx.lineWidth = 4 / bulk; ctx.strokeStyle = P.out; ctx.stroke();
    // plat dada
    ctx.beginPath();
    ctx.moveTo(-30, -96); ctx.lineTo(40, -94); ctx.lineTo(36, -80); ctx.lineTo(-28, -82); ctx.closePath();
    ctx.fillStyle = P.mainL; ctx.fill();
    // jalur V
    ctx.beginPath();
    ctx.moveTo(-26, -60); ctx.lineTo(0, -50); ctx.lineTo(30, -60); ctx.lineTo(30, -66); ctx.lineTo(0, -56); ctx.lineTo(-26, -66); ctx.closePath();
    ctx.fillStyle = P.accent; ctx.fill(); ctx.lineWidth = 2.5 / bulk; ctx.stroke();
    // leher
    rr(ctx, -18, -122, 36, 16, 6);
    ctx.fillStyle = P.metal; ctx.fill(); ctx.lineWidth = 3.5 / bulk; ctx.stroke();
    // duri belakang
    if (d.spikes) {
      ctx.fillStyle = P.accent; ctx.strokeStyle = P.out; ctx.lineWidth = 3;
      for (const y of [-100, -80, -60]) {
        ctx.beginPath(); ctx.moveTo(-40, y - 8); ctx.lineTo(-68, y - 18); ctx.lineTo(-42, y + 8); ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
    }
    ctx.restore();
    // teras tenaga
    const e = Math.min(1, (f.energy || 0) / 100);
    const full = e >= 1;
    const pulse = full ? 0.5 + 0.5 * Math.sin(f.t * 10) : 0;
    const cx = 14 * bulk, cy = -72;
    circle(ctx, cx, cy, 14, P.out);
    ctx.save();
    ctx.shadowColor = P.glow;
    ctx.shadowBlur = 10 + e * 18 + pulse * 16;
    circle(ctx, cx, cy, 10.5, P.glow);
    ctx.restore();
    ctx.globalAlpha *= 0.65 * (1 - e) + 0.05;
    circle(ctx, cx, cy, 10.5, '#1a2035');
    ctx.globalAlpha = f._alpha ?? 1;
    circle(ctx, cx - 3, cy - 3, 3.5, 'rgba(255,255,255,.85)');
    ctx.restore();
  }

  function drawHead(ctx, J, P, d, f) {
    ctx.save();
    ctx.translate(J.neck.x, J.neck.y);
    ctx.rotate(J.L + (f.pose.head || 0));
    const type = d.head || 'visor';
    const glowOn = () => { ctx.shadowColor = P.glow; ctx.shadowBlur = 14; };
    const glowOff = () => { ctx.shadowBlur = 0; };
    ctx.lineWidth = 4; ctx.strokeStyle = P.out;
    if (type === 'visor' || type === 'antena' || type === 'mahkota') {
      if (type === 'antena') {
        ctx.lineWidth = 4;
        for (const [x, tx] of [[-8, -22], [8, 4]]) {
          ctx.beginPath(); ctx.moveTo(x, -38); ctx.lineTo(tx, -66); ctx.strokeStyle = P.out; ctx.stroke();
          circle(ctx, tx, -66, 5, P.accent, P.out);
        }
      }
      if (type === 'mahkota') {
        ctx.beginPath();
        ctx.moveTo(-20, -38); ctx.lineTo(-18, -66); ctx.lineTo(-8, -48); ctx.lineTo(2, -72); ctx.lineTo(10, -48); ctx.lineTo(20, -66); ctx.lineTo(22, -38);
        ctx.closePath(); ctx.fillStyle = '#f5c518'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = P.out; ctx.stroke();
      }
      if (type === 'visor') {
        ctx.beginPath(); ctx.moveTo(-10, -40); ctx.lineTo(-2, -64); ctx.lineTo(10, -40); ctx.closePath();
        ctx.fillStyle = P.accent; ctx.fill(); ctx.lineWidth = 3.5; ctx.stroke();
      }
      rr(ctx, -22, -46, 46, 48, 16);
      ctx.fillStyle = P.main; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = P.out; ctx.stroke();
      rr(ctx, -16, -42, 24, 8, 4); ctx.fillStyle = P.mainL; ctx.fill();
      // pelindung muka
      ctx.beginPath(); ctx.moveTo(6, -6); ctx.lineTo(28, -12); ctx.lineTo(28, -24); ctx.lineTo(8, -22); ctx.closePath();
      ctx.fillStyle = P.metal; ctx.fill(); ctx.lineWidth = 3.5; ctx.stroke();
      // visor bercahaya
      glowOn(); rr(ctx, 2, -36, 26, 11, 5); ctx.fillStyle = P.glow; ctx.fill(); glowOff();
      ctx.lineWidth = 3; ctx.stroke();
      // telinga
      circle(ctx, -6, -22, 8, P.accent, P.out);
    } else if (type === 'mono') {
      circle(ctx, 0, -22, 26, P.main, P.out);
      rr(ctx, -14, -44, 20, 7, 3.5); ctx.fillStyle = P.mainL; ctx.fill();
      circle(ctx, 12, -24, 12, P.out);
      glowOn(); circle(ctx, 13, -24, 8, P.glow); glowOff();
      circle(ctx, 16, -27, 2.5, '#ffffff');
      ctx.beginPath(); ctx.moveTo(-26, -14); ctx.lineTo(26, -10); ctx.lineWidth = 3; ctx.strokeStyle = P.out; ctx.stroke();
    } else if (type === 'kotak') {
      ctx.beginPath(); ctx.moveTo(-4, -40); ctx.quadraticCurveTo(-14, -52, -4, -58); ctx.quadraticCurveTo(6, -64, -2, -72);
      ctx.lineWidth = 3.5; ctx.strokeStyle = P.out; ctx.stroke();
      circle(ctx, -2, -73, 5, P.accent, P.out);
      rr(ctx, -22, -42, 48, 42, 5);
      ctx.fillStyle = P.main; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = P.out; ctx.stroke();
      circle(ctx, 6, -26, 8, '#ffffff', P.out); circle(ctx, 22, -26, 7, '#ffffff', P.out);
      glowOn(); circle(ctx, 8, -26, 3.5, P.glow); circle(ctx, 23, -26, 3, P.glow); glowOff();
      ctx.beginPath(); ctx.moveTo(4, -10); ctx.lineTo(24, -10); ctx.lineWidth = 3; ctx.stroke();
      for (const x of [9, 14, 19]) { ctx.beginPath(); ctx.moveTo(x, -13); ctx.lineTo(x, -7); ctx.stroke(); }
      circle(ctx, -14, -36, 2.5, P.out); circle(ctx, -14, -8, 2.5, P.out);
    } else if (type === 'raksasa') {
      if (d.horns) {
        ctx.fillStyle = '#f4ecd8'; ctx.strokeStyle = P.out; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(-14, -36); ctx.quadraticCurveTo(-40, -50, -40, -76); ctx.quadraticCurveTo(-26, -56, -2, -42); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      // duri kepala
      ctx.fillStyle = P.accent; ctx.strokeStyle = P.out; ctx.lineWidth = 3;
      for (const [x, y] of [[-20, -32], [-10, -42], [2, -46]]) {
        ctx.beginPath(); ctx.moveTo(x - 6, y + 6); ctx.lineTo(x - 10, y - 14); ctx.lineTo(x + 8, y + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      // kepala & muncung
      ctx.beginPath();
      ctx.moveTo(-22, -4); ctx.quadraticCurveTo(-26, -40, 4, -42);
      ctx.quadraticCurveTo(30, -40, 42, -22); ctx.lineTo(44, -12); ctx.lineTo(10, -10); ctx.closePath();
      ctx.fillStyle = P.main; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = P.out; ctx.stroke();
      // rahang
      ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(10, -8); ctx.lineTo(40, -8); ctx.quadraticCurveTo(34, 6, 8, 6); ctx.quadraticCurveTo(-10, 6, -14, -4); ctx.closePath();
      ctx.fillStyle = P.mainD; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      for (const x of [16, 24, 32]) { ctx.beginPath(); ctx.moveTo(x - 3, -11); ctx.lineTo(x, -4); ctx.lineTo(x + 3, -11); ctx.closePath(); ctx.fill(); }
      // mata
      glowOn();
      ctx.beginPath(); ctx.moveTo(10, -30); ctx.lineTo(28, -26); ctx.lineTo(12, -22); ctx.closePath(); ctx.fillStyle = P.glow; ctx.fill();
      glowOff();
    }
    ctx.restore();
  }

  function drawTail(ctx, J, P, t) {
    const sway = Math.sin(t * 2.4) * 14;
    const p0 = { x: J.hip.x - 24, y: J.hip.y + 4 };
    const p1 = { x: J.hip.x - 100, y: J.hip.y + 20 + sway * 0.5 };
    const p2 = { x: J.hip.x - 160, y: J.hip.y + 70 + sway };
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const u = i / 14, a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
      pts.push({ x: a * p0.x + b * p1.x + c * p2.x, y: a * p0.y + b * p1.y + c * p2.y, r: 19 * (1 - u) + 5 });
    }
    for (const q of pts) circle(ctx, q.x, q.y, q.r + 3, P.out);
    for (const q of pts) circle(ctx, q.x, q.y, q.r, P.main);
    for (let i = 2; i < pts.length - 1; i += 3) circle(ctx, pts[i].x, pts[i].y - pts[i].r * 0.4, pts[i].r * 0.35, P.accent);
  }

  function drawJet(ctx, J, P, f) {
    ctx.save();
    ctx.translate(J.hip.x, J.hip.y); ctx.rotate(J.L);
    if (f.thrust > 0.05) {
      const fl = 30 + f.thrust * 50 + Math.random() * 12;
      for (const x of [-58, -44]) {
        const g = ctx.createLinearGradient(0, -44, 0, -44 + fl);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, P.glow); g.addColorStop(1, 'rgba(255,120,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(x - 6, -44); ctx.lineTo(x + 6, -44); ctx.lineTo(x, -44 + fl); ctx.closePath(); ctx.fill();
      }
    }
    rr(ctx, -70, -110, 32, 68, 9);
    ctx.fillStyle = P.metal; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = P.out; ctx.stroke();
    rr(ctx, -66, -100, 8, 40, 4); ctx.fillStyle = P.accent; ctx.fill();
    for (const x of [-58, -44]) { rr(ctx, x - 7, -50, 14, 10, 3); ctx.fillStyle = P.metalD; ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); }
    ctx.restore();
  }

  /**
   * Lukis robot.
   * f: { x, y(ground), facing, size, pose, d (design), t, energy, thrust, koA, flash }
   * mode: undefined | 'flash' | 'ghost'
   */
  function draw(ctx, f, mode) {
    const d = f.d, PP = pal(d);
    const pf = mode ? PP[mode] : PP.front, pb = mode ? PP[mode] : PP.back;
    const J = solve(f.pose, d);
    ctx.save();
    f._alpha = ctx.globalAlpha;
    ctx.translate(f.x, f.y);
    ctx.scale(f.facing * f.size, f.size);
    if (f.rot) { ctx.translate(0, -150); ctx.rotate(-f.rot); ctx.translate(0, 150); }
    if (f.koA) { ctx.translate(-20, 0); ctx.rotate(-f.koA); ctx.translate(20, 0); }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (d.tail) drawTail(ctx, J, pb, f.t);
    drawArm(ctx, J.shB, J.aB, pb, d);
    drawPad(ctx, J.shB, J.aB, J.L, pb, d, false);
    drawLeg(ctx, J.hpB, J.lB, pb, J.gB);
    if (d.jet) drawJet(ctx, J, pf, f);
    drawLeg(ctx, J.hpF, J.lF, pf, J.gF);
    drawTorso(ctx, J, pf, d, f);
    drawHead(ctx, J, pf, d, f);
    drawArm(ctx, J.shF, J.aF, pf, d);
    drawPad(ctx, J.shF, J.aF, J.L, pf, d, true);
    ctx.restore();
  }

  // Titik penting dalam koordinat dunia
  function points(f) {
    const J = solve(f.pose, f.d);
    const w = p => ({ x: f.x + p.x * f.facing * f.size, y: f.y + p.y * f.size });
    return {
      handF: w({ x: J.aF.hd.x + Math.sin(J.aF.a2) * 14, y: J.aF.hd.y + Math.cos(J.aF.a2) * 14 }),
      handB: w(J.aB.hd),
      elbowF: w(J.aF.el),
      footF: w({ x: J.lF.ft.x + 20, y: J.lF.ft.y }),
      core: w(J.core),
      head: w({ x: J.neck.x, y: J.neck.y - 24 }),
      chest: w({ x: J.hip.x, y: J.hip.y - 70 }),
    };
  }

  return { draw, points, mix, rr };
})();
