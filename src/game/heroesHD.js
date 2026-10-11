/* Motor de los personajes en tres cuartos (HD) y sus diseños. Viene de la página de comparación
   «Personajes mejorados»; cada personaje es HD_<NOMBRE>34 (Xitin: HD_XITIN_NUEVA2). */
/* ============================================================================
   PERSONAJES MEJORADOS (opción C)
   ----------------------------------------------------------------------------
   Sistema común: grilla de 32 × 40 (cabeza y torso dibujados; brazo y piernas
   en código), tres tonos por material, brazo con codo, piernas con rodilla,
   capa o pelo que se mueven, y un ataque en fases: guardia → impulso → golpe →
   choque → sigue → vuelve. Cada personaje trae su dibujo, sus colores, sus
   piernas, su brazo y su arma.
   ========================================================================== */
const HDK = "#1A1020";
const HD_OX = 8, HD_OY = 6;

function hdLinea(x0, y0, x1, y1, fn) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
  for (;;) { fn(x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
/* Rellena píxeles [x, y, color] y les pone un contorno de 1 px. */
function hdContorno(px, pts, color) {
  const set = new Map(pts.map(([x, y, c]) => [x + "," + y, [x, y, c]]));
  set.forEach(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { if (!set.has((x + a) + "," + (y + b))) px(x + a, y + b, HDK); }));
  set.forEach(([x, y, c]) => px(x, y, c || color));
}
const hdFilas = (px, filas, pal) => Object.entries(filas).forEach(([f, txt]) => [...txt].forEach((k, c) => { if (k === "K") px(c, +f, HDK); else if (pal[k]) px(c, +f, typeof pal[k] === "function" ? pal[k](c, +f) : pal[k]); }));   // un color puede ser una función (cuadrillé)

/* Brazo en dos tramos (hombro → codo → mano). col: { luz, base, sombra, mano, codo } */
function hdBrazo(px, hombro, mano, col, grueso = 3, codoFijo, codoAfuera) {
  const [sx, sy] = hombro, [hx, hy] = mano;
  const mx = (sx + hx) / 2, my = (sy + hy) / 2, L = Math.hypot(hx - sx, hy - sy) || 1;
  let nx = -(hy - sy) / L, ny = (hx - sx) / L; if (ny < 0) { nx = -nx; ny = -ny; }
  if (codoAfuera && hy - sy > 0.8 * Math.abs(hx - sx) && nx < 0) { nx = -nx; ny = -ny; }   // brazo colgando: el codo hacia afuera, no hacia la espalda
  const flex = Math.max(0, 3.2 - L * 0.18);
  const [ex, ey] = codoFijo || [Math.round(mx + nx * flex), Math.round(my + ny * flex)];
  const pts = [];
  const tramo = (x0, y0, x1, y1) => hdLinea(x0, y0, x1, y1, (x, y) => { for (let i = 0; i < grueso; i++) for (let j = 0; j < grueso; j++) pts.push([x - 1 + i, y - 1 + j, j === 0 ? col.luz : j === grueso - 1 ? col.sombra : col.base]); });
  tramo(sx, sy, ex, ey); tramo(ex, ey, hx, hy);
  if (col.hombrera) { const r2 = grueso >= 3 ? 4 : 2; for (let i = -2; i <= 2; i++) for (let j = -2; j <= 1; j++) if (i * i + j * j <= r2) pts.push([sx + i, sy + j, j < 0 ? col.luz : col.base]); }   // hombrera proporcional al brazo
  const m = grueso >= 3 ? 2 : 1;   // la mano crece con el brazo
  for (let i = -1; i <= m; i++) for (let j = -1; j <= m; j++) pts.push([hx + i, hy + j, i === -1 || j === -1 ? col.manoLuz || col.mano : col.mano]);
  hdContorno(px, pts);
  if (col.codo) px(ex, ey, col.codo);
}
/* Pierna en dos tramos (cadera → rodilla → pie), la rodilla hacia adelante. */
function hdPierna(pf, cadera, pie, col, adelante, largo = 11) {
  const [cx, cy] = cadera, [fx, fy] = pie, d = Math.hypot(fx - cx, fy - cy) || 1;
  const doblez = Math.sqrt(Math.max(0, (largo / 2) ** 2 - (d / 2) ** 2));
  let nx = -(fy - cy) / d, ny = (fx - cx) / d; if (nx < 0) { nx = -nx; ny = -ny; }
  const kx = Math.round((cx + fx) / 2 + nx * doblez), ky = Math.round((cy + fy) / 2 + ny * doblez);
  const pts = [];
  const tramo = (x0, y0, x1, y1, arriba) => hdLinea(x0, y0, x1, y1, (x, y) => { const w = (adelante && col.anchoAdelante) || col.ancho || 4; for (let i = 0; i < w; i++) for (let j = 0; j < 2; j++) pts.push([x - 1 + i, y + j, i === 0 ? (arriba ? col.luz : col.luz2 || col.luz) : i === w - 1 ? (arriba ? col.sombra : col.sombra2 || col.sombra) : (arriba ? col.base : col.base2 || col.base)]); });
  tramo(cx, cy, kx, ky, true); tramo(kx, ky, fx, fy - 1, false);
  for (let i = 0; i < ((adelante && col.anchoAdelante) || col.ancho || 4) + 2; i++) for (let j = 0; j < 2; j++) pts.push([fx - 1 + i, fy - 1 + j, j === 0 ? col.bota : col.botaSombra]);
  hdContorno(pf, pts);
  if (col.rodilla) { pf(kx, ky, adelante ? col.rodilla : col.luz); pf(kx + 1, ky, col.luz); }
}

/* Vuelo del vestido: cuando las piernas se abren, la falda se ensancha hacia cada pie, más abajo que arriba,
   para que la pierna de adelante no se escape por el costado. */
function hdFaldaVuelo(falda, adelante, atras) {
  const filas = Object.keys(falda).map(Number).sort((a, b) => a - b), n = filas.length;
  if (adelante <= 0 && atras <= 0) return falda;
  const out = {};
  filas.forEach((f, i) => {
    let t = falda[f]; const der = Math.round(Math.max(0, adelante + 1) * (i + 1) / n), izq = Math.round(Math.max(0, atras) * (i + 1) / n);
    const fin = t.lastIndexOf("K"), ini = t.indexOf("K");
    if (fin > ini + 1 && der > 0) { const rel = t[fin - 1] === "K" ? "K" : t[fin - 1]; t = t.slice(0, fin) + rel.repeat(der) + "K" + t.slice(fin + 1); }
    if (ini >= 0 && izq > 0) { const rel = t[ini + 1] === "K" ? "K" : t[ini + 1]; const pad = Math.max(0, izq - ini); t = ".".repeat(pad) + t; const i2 = ini + pad; t = t.slice(0, i2 - izq) + "K" + rel.repeat(izq) + t.slice(i2 + 1); }
    out[f] = t;
  });
  return out;
}

/* Dibuja un personaje mejorado. p: { mano, inclina, bob, agacha, pies, capa, pelo, fase, t } */
function hdDibujar(g, x, y, c, p) {
  if (c.forma) { const f = c.forma(p); if (f) { p = { ...p, mano: f.manos[p.fase] || f.manos.guardia }; c = f; } }   // transformación (Xitin → oso)
  if (c.manoDinamica) p = { ...p, mano: c.manoDinamica(p) };   // la mano sigue un arco cuadro a cuadro (martillazo de July)
  const bj = c.bajar || 0, baja = (p.bob || 0) + (p.agacha || 0) + bj, inc = p.inclina || 0;   // bajar: personajes más bajitos, de piernas cortas
  const px = (a, b, col) => { g.fillStyle = col; g.fillRect(x + HD_OX + a + inc, y + HD_OY + b + baja, 1, 1); };
  const pf = (a, b, col) => { g.fillStyle = col; g.fillRect(x + HD_OX + a, y + HD_OY + b, 1, 1); };
  const [pa, pd] = p.pies || c.pies, alto = Math.min(0, p.bob || 0);
  if (c.capa) hdFilas(px, c.capa[(p.capa || 0) % c.capa.length], c.pal);
  if (c.atras) c.atras(px, p);
  if (!c.sinPiernas) hdPierna(pf, [c.caderas[0][0] + inc, c.caderas[0][1] + baja], [pa[0], pa[1] + alto], c.pierna, false, 11 - bj);
  const brazoAtras = c.brazoAtras && c.brazoAtras(p);   // la mano en alto pasa detrás de la cabeza
  if (brazoAtras) { hdBrazo(px, c.hombro, p.mano, c.brazo, c.brazoGrueso); if (c.arma) c.arma(px, p); }
  hdFilas(px, Object.fromEntries(c.cuerpo.map((f, i) => [i + (c.top || 0), f])), c.pal);
  if (c.pelo) hdFilas(px, c.pelo[(p.pelo || 0) % c.pelo.length], c.pal);
  if (!c.sinPiernas) hdPierna(pf, [c.caderas[1][0] + inc, c.caderas[1][1] + baja], [pd[0], pd[1] + alto], c.pierna, true, 11 - bj);
  if (c.falda) hdFilas(px, c.faldaVuelo ? hdFaldaVuelo(c.falda, (p.pies || c.pies)[1][0] - c.pies[1][0] + (p.fase === "sube" || p.fase === "alto" ? Math.round((p.agacha || 0) * 1.5) : 0), c.pies[0][0] - (p.pies || c.pies)[0][0]) : c.falda, c.pal);   // vestido largo: va encima de las piernas
  const brazoCerca = () => {   // tres cuartos: el brazo de cerca, tranquilo junto al cuerpo con el codo hacia afuera
    const [sx, sy] = c.brazoCerca.hombro;
    const [mano, codo] = { sube: [[-5, -2], [-4, 2]], alto: [[-6, -9], [-5, -3]], ...(c.brazoCerca.poses || {}) }[p.fase] || c.brazoCerca.todas || [[-1, 7], [-3, 4]];   // al celebrar levanta los dos brazos
    hdBrazo(px, [sx, sy], [sx + mano[0], sy + mano[1]], c.brazoCerca.col || c.brazo, c.brazoGrueso, [sx + codo[0], sy + codo[1]]);
  };
  if (c.brazoCerca && !c.brazoCerca.encima) brazoCerca();
  if (c.armaDetras) c.armaDetras(px, p);
  if (c.brazoCerca && c.brazoCerca.encima) brazoCerca();   // el brazo de cerca va sobre el instrumento (Kenny)
  const codo = (c.codoDinamico && c.codoDinamico(p)) || (c.codos && (c.codos[p.fase] || (p.fase === "vuelve" ? c.codos.guardia : undefined)));   // codo a mano: el brazo sube y baja con naturalidad
  if (!brazoAtras) hdBrazo(px, c.hombro, p.mano, c.brazo, c.brazoGrueso, codo, !!c.brazoCerca);
  if (c.arma && !brazoAtras) c.arma(px, p);
  if (c.manoEncima && !brazoAtras) {   // la mano se dibuja sobre el mango: se ve agarrando el arma
    const [hx, hy] = p.mano, m = (c.brazoGrueso || 3) >= 3 ? 2 : 1, pts = [];
    for (let i = -1; i <= m; i++) for (let j = -1; j <= m; j++) pts.push([hx + i, hy + j, i === -1 || j === -1 ? c.brazo.manoLuz || c.brazo.mano : c.brazo.mano]);
    hdContorno(px, pts);
  }
}

/* Las fases comunes. Cada personaje da las manos de cada fase en c.manos. */
function hdPose(c, anim, t) {
  t = t || 0;   // el rival parte con el reloj en negativo: los cuadros se cuentan igual sin salirse de la lista
  const ciclo = (ms, n) => ((Math.floor(t / ms) % n) + n) % n;
  const capa = ciclo(180, 3), pelo = ciclo(260, 2), bob = ciclo(520, 2);
  const m = c.manos, pies = c.pies;
  if (anim === "guardia") return { mano: m.guardia, capa, pelo, agacha: bob, pies, fase: "guardia", t };
  if (anim === "victoria") {
    const T = t % 2600;
    if (T < 400) return { mano: m.guardia, capa, pelo, agacha: bob, pies, fase: "guardia", t };
    if (T < 650) return { mano: m.sube, capa, pelo, agacha: 2, pies, fase: "sube", t };
    const sal = Math.floor(t / 260) % 2;
    return { mano: m.alto, capa, pelo, bob: sal ? -3 : 0, agacha: sal ? 0 : 2, pies, fase: "alto", t };
  }
  const T = t % 2400;
  if (T < 500) return { mano: m.guardia, capa, pelo, agacha: bob, pies, fase: "guardia", t };
  if (T < 760) return { mano: m.impulso, capa: 2, pelo: 1, inclina: -2, agacha: 3, pies: [[pies[0][0] - 2, 39], [pies[1][0] - 1, 39]], fase: "impulso", t, k: (T - 500) / 260 };
  if (T < 900) return { mano: m.golpe, capa: 0, pelo: 0, inclina: 2, agacha: 1, pies: [[pies[0][0] - 3, 39], [pies[1][0] + 5, 39]], fase: "golpe", t, k: (T - 760) / 140 };
  if (T < 1150) return { mano: m.choque || m.golpe, capa: 1, pelo: 0, inclina: 3, agacha: 3, pies: [[pies[0][0] - 3, 39], [pies[1][0] + 6, 39]], fase: "choque", t, k: (T - 900) / 250 };
  if (T < 1400) return { mano: m.sigue || m.golpe, capa: 2, pelo: 1, inclina: 2, agacha: 2, pies: [[pies[0][0] - 2, 39], [pies[1][0] + 5, 39]], fase: "sigue", t, k: (T - 1150) / 250 };
  return { mano: m.guardia, capa, pelo, agacha: bob, pies, fase: "vuelve", t };
}

/* ======================= JELIC ======================= */
const HD_JELIC = (() => {
  const pal = {
    L: "#E6EBF3", M: "#AEB7C6", m: "#7E8798", d: "#555D6E", Q: "#4F74E0", A: "#2747B8", a: "#18308A",
    P: "#F26B7A", R: "#D7263D", r: "#9B1428", z: "#CC9670", S: "#B07B55", s: "#86583A", W: "#F2F3F6", w: "#BFC4CE", Y: "#F0C04A", y: "#A87C20", B: "#2A2440",
  };
  const escudo = (px, cx, top) => {
    const Hh = 17, media = (i) => (i < 9 ? 5 : Math.max(0, Math.round(5 * (Hh - 1 - i) / 8))), pts = [];
    for (let i = 0; i < Hh; i++) { const w = media(i); for (let x = cx - w; x <= cx + w; x++) {
      const borde = Math.abs(x - cx) === w || i === 0 || i >= Hh - 2;
      pts.push([x, top + i, borde ? (x < cx ? pal.L : pal.M) : (i < 4 ? pal.Q : i < 11 ? pal.A : pal.a)]); } }
    hdContorno(px, pts);
    for (let i = 2; i <= 8; i++) { px(cx - 3, top + i, pal.R); px(cx + 3, top + i, pal.R); px(cx + 2, top + i, i > 6 ? pal.R : pal.r); }
    for (let x = cx - 2; x <= cx + 2; x++) px(x, top + 9, pal.R); px(cx - 3, top + 9, pal.r); px(cx + 3, top + 9, pal.r);
    px(cx - 4, top + 2, "#9FB4F2"); px(cx - 4, top + 3, "#9FB4F2"); px(cx - 4, top + 4, "#7F98E8");
  };
  return {
    id: "jelic", nombre: "Jelic", pal,
    cuerpo: [
      "...............................", "...............................", "............KKKKKK.............", "...........KLLLMMMKK...........",
      "..........KLLMMMMMMMK..........", ".........KLMMMMMMMMMMK.........", ".........KLMMMMMMMMMMMK........", "........KLMMMMMMMMMMMMK........",
      "........KLMMMmmmmmmmMMK........", "........KMMMmKKKKKKKKmK........", "........KMMmKzSSSSSSSKK........", "........KMMmKSSSSSSKSSK........",
      "........KMMmKSSSSSSKSSK........", "........KMmmKsSSSSSSSSK........", "........KMmmKsSWWWWWSSK........", "........KmmmKssSwWWwSK.........",
      ".........KmmKKssSSSSK..........", "..........KKdddKKKKK...........", ".........KKdMMMMMMMMK..........", "........KdMLLMMMMMMMMK.........",
      "........KMLLQAAAAAMMMMK........", "........KMLQAARRAAAMMMK........", "........KMLQARRRRAAAMMK........", "........KMLQAARRAAAAMMK........",
      "........KMMQAAAAAAAAAMK........", "........KBBBBBYBBBBBBBK........", "........KRaRaRaRaRaRaK.........", "........KaRaRaRaRaRaRK.........",
    ],
    capa: [
      { 15: ".......KK", 16: "......KQAK", 17: ".....KQAAK", 18: "....KQAAAK", 19: "...KQAAAK", 20: "..KQAAAK", 21: "..KQAAAK", 22: ".KQAAAaK", 23: ".KQAAaAK", 24: ".KQAaAAK", 25: "KQAAaAAK", 26: "KQAaAAAK", 27: "KQaAAAaK", 28: "KAaAAaAK", 29: "KaAAaAK.", 30: "KaAaAK..", 31: ".KaaK...", 32: "..KK...." },
      { 15: ".......KK", 16: "......KQAK", 17: ".....KQAAK", 18: "....KQAAAK", 19: "...KQAAAK", 20: "..KQAAAK", 21: ".KQAAAAK", 22: ".KQAAAaK", 23: "KQAAAaAK", 24: "KQAAaAAK", 25: "KQAaAAAK", 26: "KQaAAAaK", 27: "KAaAAaAK", 28: "KaAAaAK.", 29: ".KaAaK..", 30: ".KaaK...", 31: "..KK....", 32: "........" },
      { 15: ".......KK", 16: "......KQAK", 17: ".....KQAAK", 18: "....KQAAAK", 19: "....KQAAK", 20: "...KQAAK", 21: "..KQAAAK", 22: "..KQAAaK", 23: ".KQAAaAK", 24: ".KQAaAAK", 25: ".KQaAAAK", 26: "KQAaAAaK", 27: "KQaAAaAK", 28: "KAaAaAAK", 29: "KaAaAAK.", 30: "KaaAAK..", 31: "KaaK....", 32: ".KK....." },
    ],
    pelo: [
      { 0: "..........RRRR", 1: "........PRRRRRr", 2: "......PRRrr.", 3: ".....PRr....", 4: "....Rr......", 5: "...r........" },
      { 0: "...........RRRR", 1: ".........PRRRRr", 2: ".......PRRrr", 3: "......PRr...", 4: ".....Rr.....", 5: "....r......." },
    ],
    hombro: [13, 19], caderas: [[11, 28], [16, 28]], pies: [[11, 39], [18, 39]],
    brazo: { luz: pal.L, base: pal.M, sombra: pal.m, mano: pal.d, manoLuz: pal.M, codo: pal.Y, hombrera: true },
    pierna: { luz: pal.L, base: pal.M, sombra: pal.m, bota: pal.M, botaSombra: pal.d, rodilla: pal.Y },
    manos: { guardia: [19, 26], impulso: [15, 25], golpe: [24, 23], choque: [26, 23], sigue: [25, 24], sube: [22, 16], alto: [25, 11] },
    arma: (px, p) => { const [hx, hy] = p.mano; escudo(px, hx + 3, hy - 9); },
    choque: [36, 20],
  };
})();

/* ======================= LATTE ======================= */
const HD_LATTE = (() => {
  const pal = {
    T: "#2A2733", t: "#45405A", u: "#17151D", Y: "#C0263A", y: "#8A1A2A", W: "#F4F1E8",
    H: "#C8622E", h: "#8E3E18", i: "#E58A4E", S: "#D9A27A", s: "#A8714C", z: "#EDBE96", X: "#45393F", x: "#2E262B", E: "#1A1020",
    C: "#2F4A3A", c: "#1C2E24", V: "#4A6E55", J: "#B9804A", j: "#85562E", k: "#D9A46C", L: "#EAD7B7", l: "#C9B48F", B: "#4A2E22", G: "#D4AF4F",
  };
  /* Abanico de tres naipes, cada uno con su borde, delante de la mano. */
  const naipes = (px, hx, hy, abiertos = 1) => {
    [[-4, -7], [0, -9], [4, -7]].forEach(([dx, dy], i) => {
      const x0 = hx + Math.round(dx * abiertos), y0 = hy + dy, pts = [];
      for (let a = 0; a < 4; a++) for (let b = 0; b < 6; b++) pts.push([x0 + a, y0 + b, a === 3 || b === 5 ? "#D9D2C2" : "#F8F5EE"]);
      hdContorno(px, pts);
      const tinta = i === 1 ? "#1A1020" : "#D7263D";
      px(x0, y0, tinta); px(x0 + 1, y0 + 2, tinta); px(x0 + 2, y0 + 2, tinta); px(x0 + 1, y0 + 3, tinta); px(x0 + 3, y0 + 5, tinta);
    });
  };
  return {
    id: "latte", nombre: "Latte", pal,
    cuerpo: [
      "............KKKKKKK", "............KtTTTTK", "............KtTTTuK", "............KtTTTuK",
      "............KtTTWWK", "............KYYYWYK", "............KyyyyyK", ".........KKKKTTTTTKKKK",
      "........KtTTTTTTTTTTTuK", ".........KKHHHHHHHHHKK", "........KHiHHHHKzSSSSSK", "........KHiHHHKSSSSSEsK",
      "........KhHHHKSSSSSSESK", "........KhHHHKXSSSSSSSK", ".........KhHKXXSSSSXXXK", ".........KhHKXXXSSXXXK",
      "..........KKKXXXXXXXK", "..........KKLLKKKKK", "........KLLLLLJJJJK", "........KJLLLJJJJJJK",
      "........KjJLJJkJJJJJK", "........KjJJJJkJJJJJK", "........KjJBJJkJJJJJK", "........KjJJBJJJJJJJK",
      "........KjBBBGBBBBBBK", "........KjJJJJJBJJJJK", "........KjjJJJJjJJJJK", "........KKjjjjjjjjjjK",
    ],
    capa: [
      { 15: ".......KK", 16: "......KVCK", 17: ".....KVCCK", 18: "....KVCCCK", 19: "...KVCCcK", 20: "...KVCcCK", 21: "..KVCCcCK", 22: "..KVCcCCK", 23: "..KVCcCCK", 24: ".KVCCcCCK", 25: ".KVCcCCCK", 26: ".KVcCCCcK", 27: "KVCcCCcCK", 28: "KVcCCcCK.", 29: "KCcCcCK..", 30: "KccCK....", 31: ".KKK....." },
      { 15: ".......KK", 16: "......KVCK", 17: ".....KVCCK", 18: "....KVCCCK", 19: "...KVCCcK", 20: "..KVCCcCK", 21: "..KVCcCCK", 22: ".KVCCcCCK", 23: ".KVCcCCCK", 24: ".KVcCCCcK", 25: "KVCcCCcCK", 26: "KVcCCcCK.", 27: "KCcCcCK..", 28: "KccCcK...", 29: ".KccK....", 30: "..KK.....", 31: "........." },
      { 15: ".......KK", 16: "......KVCK", 17: ".....KVCCK", 18: "....KVCCCK", 19: "....KVCcK", 20: "...KVCcCK", 21: "...KVCcCK", 22: "..KVCcCCK", 23: "..KVcCCCK", 24: "..KVCCcCK", 25: ".KVCcCCcK", 26: ".KVcCCcCK", 27: "KVCcCcCK.", 28: "KVcCcCCK.", 29: "KCcCCcK..", 30: "KcCcK....", 31: "KccK.....", 32: ".KK......" },
    ],
    hombro: [13, 19], caderas: [[11, 28], [16, 28]], pies: [[11, 39], [18, 39]],
    brazo: { luz: pal.k, base: pal.J, sombra: pal.j, mano: "#3E6E78", manoLuz: "#5E8E98" },
    pierna: { luz: "#56637E", base: "#3B4660", sombra: "#283147", luz2: "#56637E", base2: "#3B4660", sombra2: "#283147", bota: "#2A2230", botaSombra: "#1A1520" },
    manos: { guardia: [19, 25], impulso: [8, 25], golpe: [26, 20], choque: [27, 21], sigue: [25, 22], sube: [22, 16], alto: [25, 11] },
    arma: (px, p) => {
      const [hx, hy] = p.mano;
      if (p.fase === "golpe" || p.fase === "choque" || p.fase === "sigue") return;   // ya los lanzó
      naipes(px, hx, hy, p.fase === "impulso" ? 0.6 : 1);
    },
    /* Los dos naipes vuelan girando desde la mano. */
    proyectil: (g, x, y, p) => {
      if (p.fase !== "golpe" && p.fase !== "choque") return;
      const avance = p.fase === "golpe" ? p.k : 1;
      [[0, -1], [-6, 3]].forEach(([atras, dy], i) => {
        const cx = Math.round(x + HD_OX + 30 + atras + avance * 18), cy = y + HD_OY + 18 + dy, gira = Math.floor((p.t + i * 60) / 60) % 2;
        const [w, h] = gira ? [6, 3] : [3, 5];
        g.fillStyle = HDK; g.fillRect(cx - 1, cy - 1, w + 2, h + 2); g.fillStyle = "#F8F5EE"; g.fillRect(cx, cy, w, h); g.fillStyle = "#D7263D"; g.fillRect(cx + (w >> 1), cy + (h >> 1), 1, 1);
      });
    },
    choque: [56, 22],
  };
})();

const HEROES_HD = { jelic: HD_JELIC, latte: HD_LATTE };

/* ======================= AGATTITA ======================= */
const HD_AGATTITA = (() => {
  const pal = {
    F: "#8C7B6A", f: "#4F4236", Z: "#B5A592", W: "#F6F0E6", w: "#D9CDBB", I: "#E7A9A0", N: "#E39A86", O: "#D8DEE8", M: "#34D399",
    G: "#2F6B45", g: "#1E4A2F", H: "#4C8E62", A: "#8FA6AE", a: "#62777F", Q: "#B7CAD0", B: "#7A4A2A", b: "#55331C", T: "#2F6B45", t: "#1E4A2F",
  };
  /* Enredaderas: salen del suelo y avanzan ondulando hasta el rival. */
  const enredadera = (g, x0, x1, prog, suelo, alto, t) => {
    const punto = (u, fase, amp) => [x0 + (x1 - x0) * u, suelo + (alto - suelo) * Math.sin(u * Math.PI / 2) + Math.sin(u * Math.PI * 3 + fase) * amp * Math.sin(u * Math.PI) - Math.sin(u * Math.PI) * 9];
    const tallo = (fase, amp, gr, hasta) => {
      const pts = []; for (let i = 0; i <= 70 * hasta; i++) pts.push(punto(i / 70, fase, amp).map(Math.round));
      pts.forEach(([x, y]) => { g.fillStyle = HDK; g.fillRect(x - 1, y - 1, gr + 2, gr + 2); });
      pts.forEach(([x, y], i) => { g.fillStyle = i % 6 === 0 ? "#8A9A4E" : "#6B7A3A"; g.fillRect(x, y, gr, gr); g.fillStyle = "#4C5728"; if (gr > 2) g.fillRect(x, y + gr - 1, gr, 1); });
      pts.forEach(([x, y], i) => { if (i % 7 === 3) { g.fillStyle = "#3F4A22"; g.fillRect(x + (i % 14 ? -1 : gr), y - 1, 1, 1); } });
      return pts;
    };
    if (prog <= 0) return;
    tallo(2.2, 3, 2, Math.min(1, prog * 0.85));
    const pts = tallo(0, 5, 3, prog);
    const [tx, ty] = pts[pts.length - 1];
    for (let k = 0; k <= 18; k++) { const an = k / 18 * Math.PI * 1.6, rr = 3.5 * (1 - k / 26); g.fillStyle = HDK; g.fillRect(Math.round(tx + 2 + Math.cos(an) * rr) - 1, Math.round(ty - 2 + Math.sin(an) * rr) - 1, 3, 3); }
    for (let k = 0; k <= 18; k++) { const an = k / 18 * Math.PI * 1.6, rr = 3.5 * (1 - k / 26); g.fillStyle = "#6B7A3A"; g.fillRect(Math.round(tx + 2 + Math.cos(an) * rr), Math.round(ty - 2 + Math.sin(an) * rr), 1, 1); }
    [[0.35, -4], [0.62, 4]].forEach(([u, d]) => { if (prog > u) { const [lx, ly] = pts[Math.round(pts.length * u / prog) - 1] || pts[0]; g.fillStyle = HDK; g.fillRect(lx - 1, ly + d - 1, 5, 4); g.fillStyle = "#4ADE80"; g.fillRect(lx, ly + d, 3, 2); g.fillStyle = "#86EFAC"; g.fillRect(lx, ly + d, 1, 1); } });
  };
  /* Bastón en espiral, vertical, sostenido por la mano. */
  const baston = (px, hx, hy) => {
    const top = hy - 15, pts = [];
    for (let y = top; y <= hy + 9; y++) for (let i = 0; i < 2; i++) pts.push([hx + 1 + i, y, i === 0 ? "#9A6A3A" : "#6E4824"]);
    [[0, -1], [1, -2], [2, -3], [3, -2], [3, -1], [3, 0], [2, 1], [1, 1], [0, 0], [4, -4], [5, -3], [5, -1], [4, 1]].forEach(([dx, dy]) => pts.push([hx + 2 + dx, top + dy, "#9A6A3A"]));
    hdContorno(px, pts);
    px(hx + 4, top - 1, "#4ADE80"); px(hx + 5, top - 2, "#86EFAC"); px(hx + 2, top + 3, "#4ADE80");
  };
  return {
    id: "agattita", nombre: "Agattita", pal,
    cuerpo: [
      "..........KK.........KK", ".........KIFK.......KFIK", "........KIIFFK.....KFFIK", "........KIFFFFKKKKKFFFFK",
      ".......KFFfFFOOOOOOFFFFK", ".......KFFFfFFOMOFFfFFFFK", "......KZFFFFfFFFFFFfFFFFK", "......KZFFFFFFFFFFFFFFFFFK",
      "......KZFFFKKFFFFFKKFFFFK", "......KZFFFKWFFFFFKWFFFFFK", "......KZFFFKKFFFFFKKFFFWWK", "......KZFFFFFFFFFFFFFWWNNK",
      ".......KZFFFFFWWWWWWWWWKK", "........KZFFFWWWWKWWWWK", ".........KKFFWWWWWWWKK", "...........KKKKKKKKK",
      "..........KGGGGGGGGGK", ".........KHGGGGMGGGGGK", ".........KHgGGGGGGGgGK", "..........KKKWWWWWKKK",
      ".........KAAKWWWWWWKK", ".........KaAKWWwWWWK", ".........KaAKFWWWWFK", ".........KWWKBBBBBBK",
      "..........KKKBbBBbBK", "...........KTTTTTTTK", "...........KTTWWWTTK", "...........KKTTTTTKK",
    ],
    /* La cola atigrada se mueve detrás, como una capa. */
    capa: [
      { 16: "..KK", 17: ".KFfK", 18: ".KFFK", 19: "..KfFK", 20: "..KFFK", 21: "...KfFK", 22: "...KFFK", 23: "....KfFK", 24: "....KFFKK", 25: ".....KFfFK", 26: "......KKK" },
      { 15: "...KK", 16: "..KFfK", 17: "..KFFK", 18: "..KfFK", 19: "...KFFK", 20: "...KfFK", 21: "...KFFK", 22: "....KfFK", 23: "....KFFK", 24: ".....KFfK", 25: ".....KFFKK", 26: "......KKK" },
      { 17: "KK", 18: "KFfK", 19: ".KFFK", 20: ".KfFK", 21: "..KFFK", 22: "..KfFK", 23: "...KFFK", 24: "...KfFFK", 25: "....KFfFK", 26: ".....KKK" },
    ],
    hombro: [21, 19], caderas: [[13, 28], [17, 28]], pies: [[13, 39], [18, 39]],
    brazo: { luz: pal.Q, base: pal.A, sombra: pal.a, mano: pal.W, manoLuz: pal.W },
    pierna: { luz: pal.Z, base: pal.F, sombra: pal.f, bota: pal.W, botaSombra: pal.w },
    manos: { guardia: [27, 24], impulso: [27, 18], golpe: [26, 9], choque: [26, 8], sigue: [26, 10], sube: [26, 14], alto: [26, 6] },
    arma: (px, p) => baston(px, p.mano[0], p.mano[1]),
    proyectil: (g, x, y, p) => {
      if (p.fase !== "golpe" && p.fase !== "choque" && p.fase !== "sigue") return;
      const prog = p.fase === "golpe" ? p.k : 1;
      enredadera(g, x + HD_OX + 24, x + 74, prog, y + HD_OY + 39, y + HD_OY + 22, p.t);
    },
    choque: [74, 22],
  };
})();
HEROES_HD.agattita = HD_AGATTITA;

/* ======================= MALALA ======================= */
const HD_MALALA = (() => {
  const pal = {
    H: "#1F4D3A", h: "#12301F", j: "#2E6B52", Y: "#D9A13B", y: "#A87420", L: "#3A2A30", l: "#5E4A56", S: "#F4D3BE", s: "#D4A58C", p: "#C9707A",
    D: "#1F4D3A", C: "#E9E2CF", c: "#C4B999", E: "#14B8A6",
    Q: (x, y) => { const i = (x >> 1) & 1, j = (y >> 1) & 1; return i && j ? "#2E8B57" : i || j ? "#86CFA0" : "#F4F8F2"; },
  };
  const escoba = (px, hx, hy, horizontal) => {
    const pts = [], PAJA = "#E0B04A", PAJA2 = "#A8762A", ATADO = "#9A3B2A";
    if (horizontal) {
      for (let x = hx - 9; x <= hx + 11; x++) pts.push([x, hy, "#9A6A3A"], [x, hy + 1, "#6E4824"]);
      for (let x = hx - 15; x <= hx - 10; x++) for (let y = hy - 2 - Math.round((hx - 10 - x) / 2); y <= hy + 3 + Math.round((hx - 10 - x) / 2); y++) pts.push([x, y, (y - hy) % 2 ? PAJA2 : PAJA]);
      pts.push([hx - 10, hy - 1, ATADO], [hx - 10, hy + 2, ATADO]);
      hdContorno(px, pts);
      [[12, 0], [13, -1], [13, 1], [14, 0]].forEach(([dx, dy]) => px(hx + dx, hy + dy, dx === 13 && !dy ? "#FFFFFF" : "#A7F3D0"));
    } else {
      for (let y = hy - 13; y <= hy + 5; y++) pts.push([hx + 1, y, "#9A6A3A"], [hx + 2, y, "#6E4824"]);
      for (let y = hy + 6; y <= hy + 12; y++) for (let x = hx - 1 - Math.round((y - hy - 6) / 2); x <= hx + 4 + Math.round((y - hy - 6) / 2); x++) pts.push([x, y, (x - hx) % 2 ? PAJA2 : PAJA]);
      pts.push([hx, hy + 6, ATADO], [hx + 3, hy + 6, ATADO]);
      hdContorno(px, pts);
      [[1, -14], [0, -15], [2, -15], [1, -16]].forEach(([dx, dy]) => px(hx + 1 + dx - 1, hy + dy, "#A7F3D0"));
    }
  };
  return {
    id: "malala", nombre: "Malala", pal,
    cuerpo: [
      "...................KK", "..............KKKKHHK", ".............KHHHHKK", "............KHHhK",
      "...........KHHhK", "..........KHHHhK", ".........KHjHHhK", "........KHHYYYYK",
      "...KKKKKHHHHHHHHKKKKK", "..KhhhhhhhhhhhhhhhhhhK", "...KYKKYKKYKKYKKYKKYK", "....KLLLLLLLLLLLLK",
      "....KLLLlLLLLLLLLK", "....KLLlLLLLLLLLLK", "....KLlLLLlLLlLLLK", "....KLlLKSSSSSSSK",
      "....KLlLKSSSpSSK", "....KLLKKDDDDDKK", "...KCKYYYYYYYYYK", "..KCCKYYYYEYYYYK",
      "..KCCCKYYYYYYYK", "...KCKQQQQQQQK", "....KQQQQQQQQK", "....KYDYDYDYDK",
      "....KQQQQQQQQQK", "....KQQQQQQQQQK", "...KQQQQQQQQQQK", "...KQQQQQQQQQQQK",
    ],
    falda: { 28: "...KQQQQQQQQQQQK", 29: "..KQQQQQQQQQQQQK", 30: "..KQQQQQQQQQQQQQK", 31: "..KQQQQQQQQQQQQQK", 32: ".KQQQQQQQQQQQQQQK", 33: ".KYYYYYYYYYYYYYYK", 34: "..KKKKKKKKKKKKKK" },
    /* Las borlas del ala se balancean. */
    pelo: [
      { 11: "...Y..............Y..Y", 12: "...Y" },
      { 11: "..Y..............Y....Y", 12: "....Y" },
    ],
    capa: [
      { 18: "..KK", 19: ".KCK", 20: ".KCCK", 21: "KCcCK", 22: "KCCcK", 23: "KCcCK", 24: "KCCcK", 25: "KcCcK", 26: "KCcCK", 27: ".KCcK", 28: ".KccK", 29: "..KK" },
      { 18: "..KK", 19: ".KCK", 20: "KCCK", 21: "KCcK", 22: "KCCcK", 23: "KcCCK", 24: "KCcCK", 25: "KCCcK", 26: ".KcCK", 27: ".KCcK", 28: "..KK" },
      { 18: "..KK", 19: ".KCK", 20: ".KCCK", 21: ".KCcK", 22: "KCCcK", 23: "KCcCK", 24: "KcCcK", 25: "KCCcK", 26: "KCcCK", 27: "KcCcK", 28: ".KccK", 29: ".KK" },
    ],
    hombro: [12, 20], caderas: [[9, 28], [13, 28]], pies: [[9, 39], [14, 39]],
    brazo: { luz: "#86CFA0", base: "#5FB383", sombra: "#3F8A5E", mano: pal.S, manoLuz: pal.S },
    pierna: { luz: "#3A3A48", base: "#24212B", sombra: "#15121A", bota: "#1A1020", botaSombra: "#0E0A12" },
    manos: { guardia: [19, 24], impulso: [10, 27], golpe: [21, 21], choque: [22, 21], sigue: [21, 22], sube: [20, 16], alto: [23, 11] },
    arma: (px, p) => { if (!["golpe", "choque", "sigue"].includes(p.fase)) escoba(px, p.mano[0], p.mano[1], p.fase === "impulso"); },
    /* Al embestir, la escoba va pegada al costado, por detrás del cuerpo: las pajas no tapan el pecho. */
    atras: (px, p) => { if (["golpe", "choque", "sigue"].includes(p.fase)) escoba(px, p.mano[0] - 5, p.mano[1], true); },
    proyectil: (g, x, y, p) => {
      if (p.fase !== "golpe" && p.fase !== "choque") return;
      const k = p.fase === "golpe" ? p.k : 1, cx = Math.round(x + HD_OX + 36 + k * 30), cy = y + HD_OY + 21;
      for (let i = 1; i <= 4; i++) { g.fillStyle = i % 2 ? "#A7F3D0" : "#5EEAD4"; g.fillRect(cx - i * 4, cy + (i % 2 ? -1 : 1), 2, 1); }
      g.fillStyle = HDK; g.fillRect(cx - 3, cy - 3, 7, 7); g.fillStyle = "#5EEAD4"; g.fillRect(cx - 2, cy - 2, 5, 5); g.fillStyle = "#A7F3D0"; g.fillRect(cx - 1, cy - 1, 3, 3); g.fillStyle = "#FFFFFF"; g.fillRect(cx, cy, 1, 1);
    },
    choque: [74, 21],
  };
})();
HEROES_HD.malala = HD_MALALA;

/* ======================= MALÍA ======================= */
const HD_MALIA = (() => {
  const pal = {
    H: "#ECEEF4", h: "#B4BACA", W: "#F4F2EC", w: "#CFCBC0", S: "#EBB2A6", s: "#C7867A", z: "#F5CABF", E: "#2F8F5A", p: "#C9707A",
    B: "#CDB898", b: "#A8946F", D: "#8A5A2A", d: "#64401C", N: "#24212B", n: "#3A3644", Y: "#C9A24B",
  };
  const cucharon = (px, hx, hy, ux, uy) => {
    const L = 15, n = Math.hypot(ux, uy); ux /= n; uy /= n;
    const pts = [], tx = hx + ux * L, ty = hy + uy * L;
    hdLinea(hx - ux * 3, hy - uy * 3, tx, ty, (x, y) => { pts.push([x, y, "#C68A4E"], [x + Math.round(-uy), y + Math.round(ux), "#8A5A2A"]); });
    const cx = Math.round(hx + ux * (L + 3)), cy = Math.round(hy + uy * (L + 3));
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = (dx / 4.2) ** 2 + (dy / 3.6) ** 2; if (d <= 1) pts.push([cx + dx, cy + dy, d > 0.55 ? (dx + dy < 0 ? "#E2B07A" : "#C68A4E") : "#7A4A22"]); }
    hdContorno(px, pts);
    px(cx - 2, cy - 2, "#F2C893");
  };
  return {
    id: "malia", nombre: "Malía", pal,
    cuerpo: [
      "..........KKKK", ".........KHHHHK", ".........KHhHHK", "........KKWKWKWKK",
      ".......KWWWWWWWWWK", "......KHHHHHHHHHHHK", ".....KHHhHHHHHHHHHK", ".....KHhHHHHHHHHHHK",
      "...KKKHhHHHKzSSSSHK", "..KSSKhHHHKSSSSSSSK", "...KSSKhHKSSSSSKESK", "....KKHhHKSSSSSKKSK",
      ".....KHhKsSSSSSSSK", ".....KHhKsSSSSppK", "......KKKKssSSSK", ".........KKBBKK",
      "........KBBWWWWK", ".......KBBBWWWWWK", "......KBbBBWWwWWK", "......KBbBBWWWWWK",
      "......KBbBBWWWWWK", "......KDDDDDDDDDDK", "......KDdDDDDDDDK", "......KNNWWWWWWWWK",
      "......KNNWWWwWWWWK", ".....KNNNWWWWWWWWWK", ".....KNNNWWWWWwWWWK", ".....KNNNNWWWWWWWWWK",
    ],
    falda: { 28: "....KNNNNWWWWWWWWWK", 29: "....KNNNNNWWWWWWWWWK", 30: "...KNNNNNNWWWWWWWWNK", 31: "...KNNNNNNNNNNNNNNNK", 32: "..KNNNNNNNNNNNNNNNNK", 33: "..KYNNNYNNNNYNNNNYNK", 34: "...KKKKKKKKKKKKKKKKK" },
    /* Las tiras del delantal flamean atrás. */
    capa: [
      { 21: "....KWK", 22: "..KWWK", 23: ".KWwK", 24: "KWK" },
      { 21: "....KWK", 22: "...KWWK", 23: "..KWwK", 24: "..KWK" },
      { 21: "....KWK", 22: "..KWWWK", 23: "KWwK", 24: ".KK" },
    ],
    hombro: [11, 18], caderas: [[10, 28], [14, 28]], pies: [[10, 39], [15, 39]],
    brazo: { luz: "#E2D2B4", base: pal.B, sombra: pal.b, mano: pal.S, manoLuz: pal.z },
    pierna: { luz: "#3A3A48", base: "#24212B", sombra: "#15121A", bota: "#1A1020", botaSombra: "#0E0A12" },
    manos: { guardia: [16, 24], impulso: [8, 24], golpe: [22, 20], choque: [23, 20], sigue: [22, 21], sube: [20, 16], alto: [23, 11] },
    arma: (px, p) => {
      const dir = { guardia: [0.45, -0.9], vuelve: [0.45, -0.9], impulso: [-0.75, -0.65], golpe: [1, -0.05], choque: [1, 0.05], sigue: [1, 0.2], sube: [0.2, -1], alto: [0.05, -1] }[p.fase] || [0.45, -0.9];
      cucharon(px, p.mano[0], p.mano[1], dir[0], dir[1]);
    },
    choque: [50, 19],
  };
})();
HEROES_HD.malia = HD_MALIA;

/* ======================= KENNY ======================= */
const HD_KENNY = (() => {
  const pal = {
    H: "#3B2618", h: "#22150C", i: "#5A3C26", S: "#D6A27C", s: "#AE7655", D: "#6B4426", F: "#22222E", Q: "#7DD3FC", W: "#FFFFFF", Y: "#D9A13B",
    T: "#1C8C85", t: "#12645F", C: "#C0622B", c: "#8A421B", R: "#E07F48", J: "#7A4E2C", j: "#5A3618", G: "#5E8F4E", B: "#4A2E22",
  };
  /* Laúd frente al pecho: caja de pera, boca, mástil y clavijero. */
  const laud = (px, cx, cy) => {
    const pts = [];
    for (let dy = -5; dy <= 5; dy++) for (let dx = -6; dx <= 6; dx++) { const d = (dx / 6.3) ** 2 + (dy / 5.2) ** 2; if (d <= 1) pts.push([cx + dx, cy + dy, dx + dy < -5 ? "#E8B27A" : d > 0.7 ? "#8A5228" : "#C98A4A"]); }
    hdLinea(cx + 4, cy - 4, cx + 11, cy - 11, (x, y) => pts.push([x, y, "#7A4A22"], [x + 1, y, "#5A3416"]));
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) pts.push([cx + 11 + i, cy - 13 + j, "#3A2418"]);
    hdContorno(px, pts);
    px(cx - 1, cy, "#2A1608"); px(cx, cy, "#2A1608"); px(cx - 1, cy + 1, "#2A1608"); px(cx, cy + 1, "#2A1608");
    hdLinea(cx - 4, cy + 2, cx + 11, cy - 11, (x, y) => { if ((x + y) % 2 === 0) px(x, y, "#F4E7C8"); });
    px(cx + 12, cy - 14, "#E5E7EB"); px(cx + 14, cy - 12, "#E5E7EB");
  };
  const centro = {};
  return {
    id: "kenny", nombre: "Kenny", pal,
    cuerpo: [
      ".........................", "...........KKKKKK", ".........KKHHHHHHKK", "........KHHhHHHHHHHK",
      ".......KHHhHHHHHHHHHK", ".......KHhHHHHHHHHHHHK", "......KHHhHHHHKKSSSHHK", "......KHhHHHHKSSSSSSSK",
      "......KHhHHHKSSSSSSSSK", "......KHhHHKSFFFFFQFFK", "......KHHhHKSSSSFFFFFK", "......KHhHHKsSSSSSSSSK",
      "......KHhHKDDSSSSSSDDK", ".......KhHKDDDDDKKDDK", ".......KKKDDDDDDDDK", "..........KKDDDDDK",
      "........KKTTTTTTTK", ".......KTTTTtTTTTTK", ".......KTTKTTTTTTTK", "........KJJJJGGJJJJK",
      "........KJJJGGGJJJJK", "........KJjJGGGJJJJK", "........KJjJGGGJjJJK", "........KBBBBBYBBBBK",
      "........KJjGGGGGJJJK", "........KJjGGGGGJJJK", "........KjjGGGGGjjJK", "........KKjjjjjjjjjK",
    ],
    /* La cola con su amarra dorada se balancea. */
    pelo: [
      { 7: ".....KYK", 8: "....KYYK", 9: "...KHhK", 10: "...KHhK", 11: "..KHhK", 12: "..KhHK", 13: "..KHhK", 14: "...KhK", 15: "...KK" },
      { 7: ".....KYK", 8: "....KYYK", 9: "....KHhK", 10: "...KHhK", 11: "...KHhK", 12: "..KhHK", 13: "..KhHK", 14: "..KHK", 15: "..KK" },
    ],
    capa: [
      { 16: "......KK", 17: ".....KRCK", 18: "....KRCCK", 19: "....KRCcK", 20: "...KRCcCK", 21: "...KRCCcK", 22: "..KRCcCCK", 23: "..KRCCcCK", 24: ".KRCcCCcK", 25: ".KRCCcCCK", 26: "KRCcCCcCK", 27: "KCcCCcCK.", 28: "KccCcCK..", 29: ".KKcK....", 30: "..KK....." },
      { 16: "......KK", 17: ".....KRCK", 18: "....KRCCK", 19: "...KRCCcK", 20: "...KRCcCK", 21: "..KRCCcCK", 22: "..KRCcCCK", 23: ".KRCCcCCK", 24: ".KRCcCCcK", 25: "KRCCcCCK.", 26: "KCcCCcCK.", 27: "KccCcK...", 28: ".KKK....." },
      { 16: "......KK", 17: ".....KRCK", 18: ".....KRCK", 19: "....KRCcK", 20: "....KRCcK", 21: "...KRCCcK", 22: "...KRCcCK", 23: "..KRCCcCK", 24: "..KRCcCCK", 25: ".KRCCcCcK", 26: ".KRCcCCcK", 27: "KRCcCcCK.", 28: "KCcCCcK..", 29: "KccK.....", 30: ".KK......" },
    ],
    hombro: [13, 19], caderas: [[11, 28], [16, 28]], pies: [[11, 39], [18, 39]],
    brazo: { luz: "#9A6A40", base: pal.J, sombra: pal.j, mano: pal.S, manoLuz: "#E8B892" },
    pierna: { luz: "#8A6446", base: "#6B4A30", sombra: "#4A3020", bota: "#3A2418", botaSombra: "#24160E" },
    manos: { guardia: [15, 25], impulso: [14, 23], golpe: [17, 23], choque: [16, 25], sigue: [15, 24], sube: [16, 23], alto: [15, 25] },
    armaDetras: (px, p) => { const [cx, cy] = centro[p.fase] || [17, 24]; laud(px, cx, cy); },
    proyectil: (g, x, y, p) => {
      if (p.fase !== "golpe" && p.fase !== "choque") return;
      const k = p.fase === "golpe" ? p.k : 1;
      const nota = (nx, ny, col) => { g.fillStyle = HDK; g.fillRect(nx - 1, ny - 7, 6, 10); g.fillStyle = col; g.fillRect(nx, ny, 3, 2); g.fillRect(nx + 2, ny - 6, 1, 7); g.fillRect(nx + 3, ny - 6, 1, 2); };
      nota(Math.round(x + HD_OX + 34 + k * 28), y + HD_OY + 20, "#FBBF24");
      nota(Math.round(x + HD_OX + 26 + k * 28), y + HD_OY + 15, "#F472B6");
    },
    choque: [72, 18],
  };
})();
HEROES_HD.kenny = HD_KENNY;

/* ======================= TIVÁN ======================= */
const HD_TIVAN = (() => {
  const pal = {
    H: "#C4C8D2", h: "#868C9C", I: "#E6E9F0", E: "#5A3A22", G: "#C9A24B", Q: "#9BD8F0", S: "#C99470", s: "#9E6B4B",
    O: "#6E6A3A", o: "#4C4826", P: "#8E8A52", W: "#EEF0F2", B: "#5A3A22", V: "#4ADE80", D: "#4A2E22", U: "#7A5232",
  };
  const frasco = (px, cx, cy) => {
    const pts = [];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= 5) pts.push([cx + dx, cy + dy, dx + dy < -1 ? "#BBF7D0" : dy > 0 ? "#16A34A" : "#4ADE80"]);
    pts.push([cx, cy - 3, "#D9E8E0"], [cx, cy - 4, "#D9E8E0"], [cx, cy - 5, "#8A5A2A"]);
    hdContorno(px, pts);
  };
  const humo = (g, x, y, f) => {
    const r = [4, 7, 9, 10][f] ?? 0; if (!r) return;
    const cols = ["#4ADE80", "#86EFAC", "#9CA3AF", "#6B7280"];
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const d = (dx * dx) / (r * r) + (dy * dy) / ((r * 0.8) ** 2); if (d > 1 || (f === 3 && (dx + dy) % 2)) continue; g.fillStyle = cols[(Math.abs(dx * 7 + dy * 3) + (d > 0.6 ? 2 : 0)) % 4]; g.fillRect(x + dx, y + dy - f, 1, 1); }
  };
  return {
    id: "tivan", nombre: "Tiván", pal,
    cuerpo: [
      "........K...K...K", ".......KHK.KHK.KHK", "......KHhHKHhHKHhHK", ".....KHhHIHHHIHHHHHK",
      "......KHhHHHHHHHHHHHK", ".....KHhHHHHKKKKKKKKK", "......KhHEEEKGQGKGQGKK", ".......KhHHHKKKKKKKKKK",
      ".......KHhHHKSSSSSSSK", "......KKHhHKSSSSSSKSK", ".....KSSKhHKSSSSSSKSK", "......KKKhKsSSSSSSSSK",
      ".........KKsSSSSSSKK", "..........KKssSSSK", "........KOOKKKKKOK", ".......KOOOOKWWKOOK",
      "......KOOoOOKWWKOOOK", "......KOOoOBVBVBVBOOK", "......KOoOOOBBBBBBOOOK", "......KOoOOOOOOOOOOOK",
      "......KOoOKDDDDGDDDDK", "......KOoOKUUOOOUUOOK", "......KOoOKOOOOOOOOOK", "......KOoOKOOOOOOOOOK",
      "......KOoOOKOOOOOOOOK", "......KOoOOKOOOOOOOOOK", "......KOoOOOKOOOOOOOOK", "......KOoOOOKOOOOOOOOK",
    ],
    falda: { 28: "......KOoOOOK....KOOOK", 29: ".....KOoOOOK......KOOK", 30: ".....KOoOOK........KK", 31: "....KOoOOK", 32: "....KooOK", 33: "....KKK" },
    /* Los mechones canosos se agitan. */
    pelo: [ { 0: "........K...K...K", 1: ".......KHK.KHK.KHK" }, { 0: ".......K...K...K", 1: "......KHK.KHK.KHK.." } ],
    capa: [
      { 26: "....KOK", 27: "...KOoK", 28: "..KOoK", 29: ".KOoK", 30: ".KoK" },
      { 26: "....KOK", 27: "...KOoK", 28: "...KOoK", 29: "..KOoK", 30: "..KoK" },
      { 26: "....KOK", 27: "..KOOoK", 28: ".KOoK", 29: "KOoK", 30: "KK" },
    ],
    hombro: [13, 19], caderas: [[11, 28], [16, 28]], pies: [[11, 39], [18, 39]],
    brazo: { luz: "#FFFFFF", base: pal.W, sombra: "#C2C6CE", mano: pal.U, manoLuz: "#9A7252" },
    pierna: { luz: "#7A5A44", base: "#5A3A28", sombra: "#3E2618", bota: "#221A20", botaSombra: "#120E12" },
    manos: { guardia: [17, 24], impulso: [7, 26], golpe: [24, 16], choque: [24, 19], sigue: [22, 22], sube: [22, 16], alto: [25, 11] },
    arma: (px, p) => {
      if (p.fase === "golpe" || p.fase === "choque" || p.fase === "sigue") return;   // ya la lanzó
      frasco(px, p.mano[0] + 1, p.mano[1] - 4);
      if (Math.floor(p.t / 250) % 2) { px(p.mano[0] + 2, p.mano[1] - 11, "#86EFAC"); px(p.mano[0] + 1, p.mano[1] - 12, "#86EFAC"); } else px(p.mano[0] + 3, p.mano[1] - 12, "#86EFAC");
    },
    proyectil: (g, x, y, p) => {
      if (p.fase === "golpe") {
        const cx = Math.round(x + HD_OX + 30 + p.k * 34), cy = Math.round(y + HD_OY + 14 - Math.sin(Math.PI * p.k) * 12);
        g.fillStyle = HDK; g.fillRect(cx - 3, cy - 3, 7, 8); g.fillStyle = "#4ADE80"; g.fillRect(cx - 2, cy, 5, 4); g.fillStyle = "#D9E8E0"; g.fillRect(cx, cy - 2, 1, 2); g.fillStyle = "#8A5A2A"; g.fillRect(cx, cy - 3, 1, 1);
      }
      if (p.fase === "choque") humo(g, x + 72, y + HD_OY + 22, Math.floor(p.k * 4));
    },
    choque: [72, 22],
  };
})();
HEROES_HD.tivan = HD_TIVAN;

/* ======================= PATROCLUS ======================= */
const HD_PATROCLUS = (() => {
  const pal = {
    H: "#1A1518", h: "#3A3036", S: "#9A6440", s: "#74472B", z: "#B27A52", G: "#3F6B3A", g: "#2A4A27", V: "#5A8A50", F: "#E9E4DA", f: "#BDB5A6",
    N: "#F4E9C8", Z: "#2DD4BF", L: "#6E5134", l: "#4E3824", B: "#3A2418", Y: "#C9A24B", T: "#4F4A33",
  };
  const LOBO = [".K...K....", "KgK.KgK...", "KGgKGGK...", "KGGGGGGKK.", "KGGGGKGGGK", "KgGGGGGGGK", "KgGGWWWWKK", ".KKKKKKK.."];
  const plo = { K: HDK, G: "#8E96A3", g: "#5E6673", W: "#E5E7EB" };
  const lobo = (px, cx, cy) => LOBO.forEach((f, y) => [...f].forEach((k, x) => { if (plo[k]) px(cx - 4 + x, cy - 4 + y, plo[k]); }));
  const banderin = (px, bx, by, t) => {
    const ola = Math.floor(t / 200) % 2;
    for (let i = 0; i < 5; i++) { const largo = 8 - i - (ola && i > 1 ? 1 : 0); px(bx - 1, by + i, HDK); for (let x = 0; x < largo; x++) px(bx + x, by + i, i === 2 ? "#3F6B3A" : "#FBBF24"); px(bx + largo, by + i, HDK); }
    for (let x = -1; x <= 8; x++) { px(bx + x, by - 1, HDK); }
  };
  const borde = (px, hx, hy, horizontal, t) => {
    const pts = [];
    if (horizontal) {
      for (let x = hx - 10; x <= hx + 15; x++) pts.push([x, hy, (x % 5 === 0) ? "#6E4824" : "#9A6A3A"], [x, hy + 1, "#6E4824"]);
      hdContorno(px, pts); banderin(px, hx + 6, hy + 3, t); lobo(px, hx + 19, hy);
    } else {
      for (let y = hy - 18; y <= hy + 8; y++) pts.push([hx + 1, y, (y % 5 === 0) ? "#6E4824" : "#9A6A3A"], [hx + 2, y, "#6E4824"]);
      hdContorno(px, pts); banderin(px, hx + 4, hy - 15, t); lobo(px, hx + 2, hy - 22);
    }
  };
  return {
    id: "patroclus", nombre: "Patroclus", pal,
    cuerpo: [
      "", "", "", ".........KKKKKKK", ".......KKHHHHHHHKK", "......KHHHHHHHHHHHK", "......KHhHHHHHHHHHK", ".....KHhHHHHHHHHHHK",
      ".....KHhHHHHSSSSSSK", ".....KHhHHKSSSSSSSK", ".....KHHHKSSSSSSKSK", ".....KKSKSSSSSSSSSK", "......KSSKsSSSSSSSK", "......KKsKsSSSSSSK",
      "...KGGGGGKKssSSSK", "..KGGgGFFFNSSSNK", "..KFfFFFKLKNZNKLK", "..KGFfFKLLLKZKLLLK", "..KGgFKLLLLlLLLLLK", "...KKKKLLLLLLLlLLK",
      "......KBBBBYBBBBBK", "......KLLLLLLLLLLK", "......KTTTTTKTTTTK", "......KTTTTTTTTTTK", "......KTTTTTTTTTK", "......KTTTTTTTTK",
      "......KTTTTTTTK", "......KKTTTTTTK",
    ],
    capa: [
      { 17: "..KK", 18: ".KVGK", 19: ".KVGK", 20: "KVGgK", 21: "KVgGK", 22: "KVGgK", 23: "KGgGK", 24: "KgGgK", 25: "KGgK.", 26: "KgK..", 27: ".K..." },
      { 17: "..KK", 18: ".KVGK", 19: "KVGgK", 20: "KVgGK", 21: "KVGgK", 22: "KGgGK", 23: "KgGK.", 24: "KGgK.", 25: ".KK.." },
      { 17: "..KK", 18: ".KVGK", 19: ".KVGK", 20: ".KVgK", 21: "KVGgK", 22: "KVgGK", 23: "KGgGK", 24: "KgGgK", 25: "KGgGK", 26: "KgGK.", 27: ".KK.." },
    ],
    hombro: [12, 19], caderas: [[10, 28], [15, 28]], pies: [[10, 39], [17, 39]],
    brazo: { luz: "#FFFFFF", base: "#E7E2D6", sombra: "#BDB5A6", mano: pal.S, manoLuz: pal.z },
    pierna: { luz: "#6A6448", base: "#4F4A33", sombra: "#36321F", bota: "#3A2A1E", botaSombra: "#241A12" },
    manos: { guardia: [21, 24], impulso: [13, 23], golpe: [21, 22], choque: [23, 22], sigue: [22, 23], sube: [22, 16], alto: [24, 12] },
    arma: (px, p) => borde(px, p.mano[0], p.mano[1], p.fase === "golpe" || p.fase === "choque" || p.fase === "sigue", p.t),
    choque: [57, 22],
  };
})();
HEROES_HD.patroclus = HD_PATROCLUS;

/* ======================= UCHIS ======================= */
const HD_UCHIS = (() => {
  const pal = {
    H: "#7A4A2C", h: "#4E2E1A", S: "#F6DCCB", s: "#D7B09C", L: "#D9667A", G: "#E0B040", E: "#3B82F6",
    R: "#D8402E", r: "#9E2A1E", V: "#F06A52", C: "#F2E8D0", c: "#CFC3A6", T: "#2F8F8A", Y: "#E0B040", B: "#8A5A30",
  };
  /* Dos cuchillas en abanico: hoja plateada y mango café. */
  const cuchilla = (px, x, y, dx) => {
    const pts = [[x, y, "#6E4424"], [x + dx, y - 1, "#6E4424"], [x + dx * 2, y - 2, "#C9A24B"]];
    for (let i = 3; i <= 6; i++) pts.push([x + dx * i, y - i, i === 6 ? "#FFFFFF" : "#D9DEE6"], [x + dx * i + 1, y - i, "#9AA3B0"]);
    hdContorno(px, pts);
  };
  /* La capa es la misma silueta que la de Latte, en rojo. */
  const roja = (f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.replace(/C/g, "R").replace(/c/g, "r")]));
  return {
    id: "uchis", nombre: "Uchis", pal,
    cuerpo: [
      "..........KKKKKKK", "........KKHHHHHHHKK", ".......KHHhHHHHHHHHK", "......KHhHHHHHHHHHHHK",
      "......KHhHHHHHHHHHHHK", ".....KHhHHHHGGGGGEGGK", ".....KHhHHHKSSSSSSSHK", ".....KHhHHKSSSSSSSSSK",
      ".....KHhHHKSSSSSSKSSK", ".....KHhHHKSSSSSSKSK", "....KHhHHKsSSSSSSSSK", "....KHhHHKsSSSSSLSK",
      "....KHhHHHKsSSSSSK", "....KHhHHHHKKssSK", "....KHhHHHKRCCKK", "....KHhHHKRRCCCCK",
      "....KHhHKRRCCCTCCK", "....KHhHKRCCCTYTCCK", "....KHhHKRCCTYTYTCK", "....KHhKRrCCCTYTCCK",
      ".....KhKRrCCCCTCCCK", ".....KKKRrKBBBBGBBK", "........KrCCTYTYTCK", "........KrCTYTTTYTCK",
      "........KrCCTTYTTCCK", "........KrCCCTTTCCCK", "........KrCCCCTCCCCK", "........KKCCCCCCCCK",
    ],
    falda: { 28: "........KCTYTCCTYTCK", 29: ".........KKKKKKKKKK" },
    pelo: [ { 21: "....KhK", 22: "....KK" }, { 21: "...KhK.", 22: "...KK.." } ],
    capa: HD_LATTE.capa.map(roja),
    hombro: [13, 19], caderas: [[11, 28], [16, 28]], pies: [[11, 39], [18, 39]],
    brazo: { luz: "#FFFDF4", base: pal.C, sombra: pal.c, mano: "#9A6A3A", manoLuz: "#B88A5A" },
    pierna: { luz: "#7A4A36", base: "#5A3426", sombra: "#3E2218", bota: "#A0503A", botaSombra: "#6E3424" },
    manos: { guardia: [18, 24], impulso: [8, 24], golpe: [26, 20], choque: [27, 21], sigue: [25, 22], sube: [22, 16], alto: [25, 11] },
    arma: (px, p) => {
      if (p.fase === "golpe" || p.fase === "choque" || p.fase === "sigue") return;   // ya las lanzó
      const [hx, hy] = p.mano;
      cuchilla(px, hx, hy - 1, 1); cuchilla(px, hx - 1, hy - 1, 0);
    },
    /* Las dos cuchillas vuelan girando, una detrás de la otra. */
    proyectil: (g, x, y, p) => {
      if (p.fase !== "golpe" && p.fase !== "choque") return;
      const avance = p.fase === "golpe" ? p.k : 1;
      [[0, -1], [-7, 3]].forEach(([atras, dy], i) => {
        const cx = Math.round(x + HD_OX + 30 + atras + avance * 18), cy = y + HD_OY + 18 + dy, gira = Math.floor((p.t + i * 60) / 60) % 2;
        g.fillStyle = HDK;
        if (gira) { g.fillRect(cx - 1, cy - 1, 8, 3); g.fillStyle = "#D9DEE6"; g.fillRect(cx + 2, cy, 4, 1); g.fillStyle = "#6E4424"; g.fillRect(cx, cy, 2, 1); }
        else { g.fillRect(cx + 1, cy - 3, 3, 8); g.fillStyle = "#D9DEE6"; g.fillRect(cx + 2, cy - 2, 1, 4); g.fillStyle = "#6E4424"; g.fillRect(cx + 2, cy + 2, 1, 2); }
      });
    },
    choque: [56, 22],
  };
})();
HEROES_HD.uchis = HD_UCHIS;

/* ======================= JANET ======================= */
const HD_JANET = (() => {
  const pal = {
    H: "#C9A577", h: "#9A7A50", S: "#F0D2BC", s: "#CFA88F", D: "#8A6640", W: "#EDEAE0", Q: "#6B4430",
    G: "#6B7A3A", g: "#4C5728", L: "#3F5A3A", l: "#2C4029", B: "#3A2418", Y: "#C9A24B",
  };
  /* Arco vertical que se curva hacia adelante; con flecha montada si todavía no dispara. */
  const arco = (px, hx, hy, flecha, tenso) => {
    const pts = [];
    for (let dy = -10; dy <= 10; dy++) {
      const bx = hx + 1 + Math.round(3 * Math.cos((dy / 10) * Math.PI / 2));
      pts.push([bx, hy + dy, Math.abs(dy) < 2 ? "#3A2418" : dy < 0 ? "#B07A44" : "#8A5A30"]);
    }
    hdContorno(px, pts);
    const cuerdaX = (dy) => hx + 1 - (tenso ? Math.round(4 * (1 - Math.abs(dy) / 10)) : 0);
    for (let dy = -9; dy <= 9; dy++) px(cuerdaX(dy), hy + dy, "#EDEAE0");
    if (flecha) {
      const x0 = cuerdaX(0);
      for (let x = x0; x <= hx + 8; x++) px(x, hy, "#B07A44");
      px(hx + 9, hy, "#D9DEE6"); px(hx + 8, hy - 1, "#D9DEE6"); px(hx + 8, hy + 1, "#D9DEE6"); px(hx + 10, hy, HDK);
      px(x0, hy - 1, "#4ADE80"); px(x0 + 1, hy - 1, "#4ADE80"); px(x0, hy + 1, "#4ADE80"); px(x0 + 1, hy + 1, "#4ADE80");
    }
  };
  return {
    id: "janet", nombre: "Janet", pal,
    cuerpo: [
      "..........KKKKKK", "........KKHHHHHHKK", ".......KHHhHHHHHHHK", "......KHhHHHHHHHHHHK",
      "......KHhHHHHHHHHHHHK", ".....KHhHHHHHHHHHHHHK", ".....KHhHKKHHHHHHHHHK", ".....KHhKSSKHHSSSSSHK",
      ".....KHhHKSSKSSSSSSSK", ".....KHhHHKKSSSSSKSSK", "..KK.KHhHHKSSSSSSKSK", ".KWWKKHhHKDSSSSSSSSK",
      ".KWQKKHhHKDDSSSSDDDK", "..KQKKHhHHKDDDDDDDK", "..KQKKHhHHHKKDDDKK", "..KQKKhHHKGGLKKK",
      "..KQKKhHKGGLlLGGK", "..KQKKhKGGLlLlLGGK", "..KQKKKGGlLlLlLGGK", "..KQKKGGGLlLlLlGGK",
      "...KQKGGGlLlLlLGGK", "...KQKGGKBBBBYBBBK", "...KQKGgGLlLlLGGGK", "....KKGgGGLlLGGGgK",
      "......KgGGGGGGGGgK", "......KggGGGKGGGgK", "......KggggK.KgggK", "......KKKKK...KKK",
    ],
    /* Las puntas del pelo largo se mecen sobre la espalda. */
    pelo: [ { 15: "......KhHK", 16: "......KhK" }, { 15: ".....KhHK.", 16: ".....KhK.." } ],
    hombro: [13, 19], caderas: [[11, 28], [16, 28]], pies: [[11, 39], [18, 39]],
    brazo: { luz: "#5E7A55", base: pal.L, sombra: pal.l, mano: pal.S, manoLuz: "#FFE6D4" },
    pierna: { luz: "#66664F", base: "#4A4A3A", sombra: "#323226", bota: "#7C8594", botaSombra: "#565E6B" },
    manos: { guardia: [18, 23], impulso: [21, 20], golpe: [24, 20], choque: [24, 20], sigue: [23, 21], sube: [22, 16], alto: [25, 12] },
    arma: (px, p) => {
      const [hx, hy] = p.mano, disparo = p.fase === "golpe" || p.fase === "choque" || p.fase === "sigue";
      arco(px, hx, hy, !disparo, p.fase === "impulso");
    },
    /* La flecha cruza la pantalla en línea recta. */
    proyectil: (g, x, y, p) => {
      if (p.fase !== "golpe") return;
      const cx = Math.round(x + HD_OX + 34 + p.k * 34), cy = y + HD_OY + 20;
      g.fillStyle = HDK; g.fillRect(cx - 1, cy - 1, 12, 3);
      g.fillStyle = "#B07A44"; g.fillRect(cx + 2, cy, 7, 1); g.fillStyle = "#4ADE80"; g.fillRect(cx, cy - 1, 2, 3); g.fillStyle = "#D9DEE6"; g.fillRect(cx + 9, cy - 1, 1, 3); g.fillRect(cx + 10, cy, 1, 1);
    },
    choque: [72, 20],
  };
})();
HEROES_HD.janet = HD_JANET;

/* Línea gruesa de un punto a otro según una dirección (para hojas, mangos). */
const hdRumbo = (fase, tabla) => tabla[fase] || tabla.guardia;

/* ======================= CUPE ======================= */
const HD_CUPE = (() => {
  const pal = {
    W: "#F6F4EE", v: "#E9E3D6", w: "#D6CFC0", O: "#F2C230", R: "#D7263D", Z: "#FFFFFF", L: "#E8E4F0",
    G: "#8E939C", g: "#5F646E", Y: "#C9A24B", B: "#7A5230", D: "#24212B", N: "#2A1E22",
  };
  const DIR = { guardia: [0.5, -0.87], impulso: [1, -0.15], golpe: [1, 0], choque: [1, 0], sigue: [1, 0.05], sube: [0.3, -1], alto: [0.3, -1] };
  /* Florete: cazoleta dorada en la mano y hoja finita. */
  const florete = (px, hx, hy, d) => {
    const L = Math.hypot(d[0], d[1]), ux = d[0] / L, uy = d[1] / L, pts = [];
    for (let i = 2; i <= 17; i++) pts.push([Math.round(hx + 1 + ux * i), Math.round(hy + uy * i), i === 17 ? "#FFFFFF" : "#D9DEE6"]);
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if (i * i + j * j <= 4) pts.push([Math.round(hx + 1 + ux * 2) + i, Math.round(hy + uy * 2) + j, i + j < 0 ? "#F2D27A" : "#C9A24B"]);
    hdContorno(px, pts);
  };
  return {
    id: "cupe", nombre: "Cupe", pal,
    cuerpo: [
      "...........O...O...O", "...........OO.OOO.OO", "...........OROOROORO", "........KKKOOOOOOOOOKKK",
      "......KKWWKKKKKKKKKKKWWKK", ".....KWWWWWWWWWWWWWWWWWWK", "....KWWvWWWWWWWWWWWWWWvWWK", "....KWWWWWWWWWWWWWWWWWWWWK",
      "...KwKWWWWWWWWWWWWWWWWWWKwK", "..KwwKWWWWWWWKKWWWWKKWWWWKwwK", "..KwwKWWWWWWWKKWWWWKKWWWWKwwK", "..KwwKWWWWWWWWWWWKKWWWWWWKwwK",
      "..KwwKWWWWWWWWWWKWWKWWWWWKwwK", "..KwwKWWWWWWWWWWWWWWWWWWWKwwK", "..KwwKKWWWWWWWWWWWWWWWWWKKwwK", "...KwwKKKWWWWWWWWWWWWWKKKwwK",
      "....KKK..KGGKZZZZZKGGK..KKK", "........KGGYKZLZLZKYGGK", "........KGgYKBZZZBKYGGK", "........KGgYKBYBYBKYgGK",
      "........KGgYKBBYBBKYgGK", "........KGgYKBYBYBKYgGK", "........KGgYKDDDDDKYgGK", "........KGgYKDDDDDKYgGK",
      "........KGgYKDDKDDKYgGK", "........KGgYYKDKDKYYgGK", "........KKKKKDDKDDKKKKK", ".............KDDKDDK",
    ],
    /* Los faldones de la levita se asoman y se mecen a los lados. */
    capa: [
      { 22: ".......KGK", 23: "......KGgK", 24: "......KGgK", 25: ".....KGgYK", 26: ".....KGgYK", 27: ".....KKKKK" },
      { 22: ".......KGK", 23: ".......KGgK", 24: "......KGgK", 25: "......KGgYK", 26: "......KGgYK", 27: "......KKKKK" },
      { 22: ".......KGK", 23: "......KGgK", 24: ".....KGgK", 25: "....KGgYK", 26: "....KGgYK", 27: "....KKKKK" },
    ],
    hombro: [21, 19], caderas: [[13, 28], [17, 28]], pies: [[13, 39], [18, 39]],
    brazo: { luz: "#B4B9C2", base: pal.G, sombra: pal.g, mano: pal.W, manoLuz: pal.Z, codo: pal.Y },
    pierna: { luz: "#FFFFFF", base: pal.W, sombra: pal.w, bota: pal.D, botaSombra: "#141218" },
    manos: { guardia: [24, 24], impulso: [23, 25], golpe: [27, 21], choque: [28, 21], sigue: [27, 22], sube: [25, 16], alto: [28, 13] },
    arma: (px, p) => florete(px, p.mano[0], p.mano[1], hdRumbo(p.fase, DIR)),
    choque: [56, 24],
  };
})();
HEROES_HD.cupe = HD_CUPE;

/* ======================= JULY ======================= */
const HD_JULY = (() => {
  const pal = {
    S: "#D9A27A", s: "#A8714C", Z: "#F2CDA8", W: "#F2F2F2", w: "#C8C8D0", A: "#7A4A2A", a: "#5A341C", Y: "#E8B830", B: "#8E2A20", G: "#C9A24B",
  };
  const DIR = { guardia: [0.45, 0.9], impulso: [-0.7, -0.7], golpe: [1, 0.15], choque: [1, 0.45], sigue: [0.9, 0.55], sube: [0.1, -1], alto: [0.05, -1] };
  /* Martillo de forja: mango de madera y una cabeza de hierro grande. */
  const martillo = (px, hx, hy, d) => {
    const L = Math.hypot(d[0], d[1]), ux = d[0] / L, uy = d[1] / L, nx = -uy, ny = ux, pts = [];
    for (let i = -3; i <= 10; i++) for (let k = 0; k < 2; k++) pts.push([Math.round(hx + 1 + ux * i + nx * k), Math.round(hy + uy * i + ny * k), k ? "#6E4824" : "#9A6A3A"]);
    for (let i = 9; i <= 14; i++) for (let k = -5; k <= 5; k++) pts.push([Math.round(hx + 1 + ux * i + nx * k), Math.round(hy + uy * i + ny * k), i === 9 ? "#5E6673" : k < -3 ? "#D9DEE6" : k > 3 ? "#5E6673" : "#9AA3B0"]);
    hdContorno(px, pts);
  };
  return {
    id: "july", nombre: "July", pal,
    cuerpo: [
      ".........KKKKKKK", ".......KKSZZSSSSKK", "......KSZZSSSSSSSSK", "......KSZSSSSSSSSSSK",
      "......KSSSSSSSSSSSSK", "......KSSSSSSSSSSSSSK", "......KSSSSSSSWWWWSK", ".....KSKSSSSSSSKSSSK",
      ".....KsKSSSSSSSKSSSSK", "......KSSSSSSSSSSSSSSK", "......KSSWWWSSSSSSSSK", "......KSWWWWWWWWWWWWK",
      "......KWWwWWWWWKKWWWK", "......KWWWWWWWWWWWWWK", "......KWWwWWWWWWwWWK", ".....KSKWWWWWWWWWWK",
      "....KSSSKWWwWWWWWK", "....KSsSSKWWWWWWKAK", "....KSsSSAKWWWWKAAAK", "....KSsSSAAKKKKAAAAK",
      "....KSsSSAAAAAAAAAAK", "....KSsSYYYYYYYYYYYK", "....KSsSKBBBBGBBBBBK", "....KSSSKAAAAAAAAAAK",
      "....KKSSKAaAAAAAAAAK", "....KSSSKAaAAAAAAAK", ".....KKKKAaAAAAAAAK", ".........KAaAAAAAAK",
    ],
    /* El delantal de cuero tapa los muslos y se balancea un poco. */
    falda: { 28: ".........KAaAAAAAK", 29: ".........KAaAAAAK", 30: "..........KKKKKK" },
    pelo: [ { 14: "......KWWwWWWWWWwWWK", 15: ".....KSKWWWWWWWWWWK" }, { 14: "......KWWwWWWWWWwWWWK", 15: ".....KSKWWWWWWWWWWWK" } ],
    hombro: [13, 19], caderas: [[11, 28], [16, 28]], pies: [[11, 39], [18, 39]], brazoGrueso: 4,
    brazo: { luz: pal.Z, base: pal.S, sombra: pal.s, mano: "#3A2A20", manoLuz: "#5A4A40" },
    pierna: { luz: "#7A7E8A", base: "#5A5E6A", sombra: "#3E414A", bota: "#A9B2BF", botaSombra: "#7C8594" },
    manos: { guardia: [19, 23], impulso: [7, 20], golpe: [24, 21], choque: [25, 23], sigue: [23, 24], sube: [22, 16], alto: [25, 11] },
    arma: (px, p) => martillo(px, p.mano[0], p.mano[1], hdRumbo(p.fase, DIR)),
    choque: [48, 30],
  };
})();
HEROES_HD.july = HD_JULY;

/* Personajes que saltan al atacar (Uzu): suben durante el impulso y caen en el golpe. */
const hdPoseBase = hdPose;
hdPose = function (c, anim, t) {
  const p = hdPoseBase(c, anim, t);
  if (c.salta && p.fase === "impulso") p.bob = -Math.round(Math.sin(p.k * Math.PI / 2) * 9);
  if (c.salta && p.fase === "golpe") p.bob = -Math.round(Math.cos(p.k * Math.PI / 2) * 9);
  return c.ajustePose ? c.ajustePose(p) : p;   // cada personaje puede retocar su pose (Edith flota al celebrar)
};

/* ======================= EDITH ======================= */
const HD_EDITH = (() => {
  const pal = {
    H: "#1E1A22", h: "#4A4256", S: "#F0D6C8", s: "#C9A898", L: "#9B2D5A", P: "#4E2A6E", p: "#341A4C", C: "#E8DFC4",
    B: "#2A1C30", Y: "#B8902A",
  };
  /* Grimorio abierto que flota delante de ella, de frente. */
  const grimorio = (px, cx, cy, brillo) => {
    const pts = [];
    for (let x = -5; x <= 5; x++) for (let y = -4; y <= 3; y++) {
      const tapa = Math.abs(x) === 5 || y === 3, lomo = x === 0;
      pts.push([cx + x, cy + y + (Math.abs(x) > 2 && y === -4 ? 1 : 0), lomo ? "#341A4C" : tapa ? "#6E3C96" : (y + x) % 3 === 0 && y > -3 && y < 2 ? "#B9AE92" : "#F4EEDC"]);
    }
    hdContorno(px, pts);
    px(cx - 3, cy - 1, "#9B2D5A"); px(cx + 3, cy - 1, "#9B2D5A");
    if (brillo) { px(cx, cy - 7, "#E9D5FF"); px(cx - 2, cy - 6, "#C4A7FF"); px(cx + 2, cy - 6, "#C4A7FF"); }
  };
  /* Hombrera de cráneo sobre el hombro de adelante. */
  const craneo = (px, sx, sy) => {
    const pts = [];
    for (let x = -2; x <= 2; x++) for (let y = -3; y <= 1; y++) if (!(Math.abs(x) === 2 && y === -3)) pts.push([sx + x, sy + y, y === -3 ? "#FFFBEA" : "#E9E1C8"]);
    hdContorno(px, pts); px(sx - 1, sy - 1, HDK); px(sx + 1, sy - 1, HDK); px(sx, sy + 1, "#B9AE92");
  };
  const rayo = (g, x0, y0, x1, y1, t) => {
    const n = 8, pts = [];
    for (let i = 0; i <= n; i++) pts.push([Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n + (i % n ? ((i * 7 + Math.floor(t / 60)) % 5) - 2 : 0))]);
    [[3, HDK], [2, "#7C3AED"], [1, "#F5F3FF"]].forEach(([gr, col]) => {
      g.fillStyle = col;
      for (let i = 0; i < n; i++) hdLinea(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], (x, y) => g.fillRect(x - (gr >> 1), y - (gr >> 1), gr, gr));
    });
  };
  return {
    id: "edith", nombre: "Edith", pal,
    cuerpo: [
      "..........KKKKKK", "........KKHhHHhHKK", ".......KHhHHhHHhHHK", "......KHHhHHHhHHHhHK",
      "......KhHHHhHHHHHHHK", ".....KHHhHHHHHHHHHHHK", ".....KhHHHhHHKSSSSHHK", "....KHHhHHHHKSSSSSSHK",
      "....KhHHhHHKSSSSSSSSK", "....KHHhHHHKSSSSSSKSK", "...KhHHhHHKSSSSSSSKSK", "...KHHhHHHKsSSSSSSSSK",
      "...KhHHhHHKsSSSSSLSK", "...KHHhHHHHKssSSSSK", "...KhHHhHHHHKKsSKK", "...KHHhHHHKPPKKK",
      "...KhHHhHKPPPPPPK", "...KHHhHKPPCPPPPCK", "...KhHHKPPPCPPPPCPK", "...KHhHKPPPPCPPPCPK",
      "...KhHHKPpPPCPPPCPK", "...KHhKPPpPPCBBBCBK", "....KKKPPpPPPCPCPPK", ".......KPPpPPPPCPPPK",
      ".......KPpPPPPPCPPPK", "......KPPpPPPPPCPPPPK", "......KPpPPPPPPCPPPPK", ".....KPPpPPPPPPCPPPPPK",
    ],
    falda: {
      28: ".....KPpPPPPPPPCPPPPPK", 29: "....KPPpPPPPPPPCPPPPPPK", 30: "....KPpPPPPPPPPCPPPPPPK", 31: "....KPpPPPPPPPPPCPPPPPK",
      32: "...KPPpPPPPPPPPPCPPPPPK", 33: "...KPpPPPPPPPPPPPCPPPPPK", 34: "...KYYYYYYYYYYYYYYYYYYYK", 35: "....KKKKKKKKKKKKKKKKKKKK",
    },
    /* Los rulos de la punta del pelo se mecen. */
    pelo: [ { 22: "...KhK", 23: "..KHhK", 24: "..KhK", 25: "...K" }, { 22: "...KhK", 23: "...KHhK", 24: "...KhK", 25: "....K" } ],
    hombro: [13, 19], caderas: [[11, 28], [16, 28]], pies: [[11, 39], [18, 39]],
    brazo: { luz: "#6E4A8E", base: pal.P, sombra: pal.p, mano: "#3A3A48", manoLuz: "#5A5A6A" },
    pierna: { luz: "#4A3A50", base: pal.B, sombra: "#1A1020", bota: "#1A1020", botaSombra: "#0E0812" },
    manos: { guardia: [18, 23], impulso: [15, 19], golpe: [21, 18], choque: [21, 18], sigue: [20, 20], sube: [22, 16], alto: [24, 13] },
    arma: (px, p) => {
      craneo(px, 13, 18);
      const lanza = p.fase === "impulso" || p.fase === "golpe" || p.fase === "choque";
      const flota = Math.round(Math.sin(p.t / 300) * 1.5);
      grimorio(px, 28, (p.fase === "alto" ? 4 : lanza ? 10 : 13) + flota, lanza || Math.floor(p.t / 400) % 2);
    },
    /* El rayo sale del grimorio y llega hasta el rival. */
    proyectil: (g, x, y, p) => {
      if (p.fase !== "golpe" && p.fase !== "choque") return;
      const x0 = x + HD_OX + 30, y0 = y + HD_OY + 12, x1 = x0 + (p.fase === "golpe" ? p.k : 1) * 36;
      rayo(g, x0, y0, x1, y + HD_OY + 22, p.t);
    },
    choque: [74, 22],
  };
})();
HEROES_HD.edith = HD_EDITH;

/* ======================= UZU ======================= */
const HD_UZU = (() => {
  const pal = {
    G: "#6FA544", g: "#4A7A2C", Z: "#8FC064", B: "#6B4A2A", b: "#8A6438", M: "#B8C0CC", R: "#E04848", W: "#E8E4D8",
    V: "#D6CFBC", v: "#8E8570", T: "#7A5232", t: "#5A3A22", Y: "#C9A24B",
  };
  const DIR = { guardia: [0.6, -0.8], impulso: [-0.3, -1], golpe: [1, 0.2], choque: [1, 0.5], sigue: [0.8, 0.6], sube: [0.1, -1], alto: [0.05, -1] };
  /* Hacha de hueso: mango con nudos y una hoja de piedra oscura con el filo hacia adelante. */
  const hacha = (px, hx, hy, d) => {
    const L = Math.hypot(d[0], d[1]), ux = d[0] / L, uy = d[1] / L, nx = -uy, ny = ux, pts = [];
    const at = (i, k, col) => pts.push([Math.round(hx + 1 + ux * i + nx * k), Math.round(hy + uy * i + ny * k), col]);
    for (let i = -3; i <= 12; i++) for (let k = 0; k < 2; k++) at(i, k, k ? "#B8B2A2" : "#E8E4D8");
    [-3, 12].forEach((i) => { at(i, -1, "#E8E4D8"); at(i, 2, "#B8B2A2"); });
    for (let i = 6; i <= 13; i++) { const ancho = 6 - Math.round(Math.abs(i - 9.5) * 1.1); for (let k = 2; k <= 2 + ancho; k++) at(i, k, k === 2 + ancho ? "#9AA3B0" : (i + k) % 3 ? "#3E4048" : "#2A2C33"); }
    hdContorno(px, pts);
  };
  return {
    id: "uzu", nombre: "Uzu", pal,
    cuerpo: [
      "", "", "", "", "", "", "", "",
      "............K...K...K", "...........KMK.KMK.KMK", "..........KBBBBBBBBBBBK", ".........KBBbBBBBBBBBBBK",
      "..KK....KBBbBBBBBBBBBBBK....KK", ".KGgKK..KBBBBBBBBBBBBBBK..KKgGK", ".KGGgGKKGGGGGGGGGGGGGGGKKGgGGK", "..KGGgGKGGRRKGGGGKRRGGGKGgGGK",
      "...KKGgKGGRRKGGGGKRRGGGKgGKK", ".....KKKGGGGGGGgGGGGGGGKKK", "........KGKWKWKWKWKWKGK", ".........KGGKKKKKKKKGGK",
      "..........KKGGGGGGGKK", "........KGKTTTTTTTTTK", ".......KGGKTtTTTTTtTK", ".......KGgKTTTtTTTTTK",
      ".......KVvKBBBBYBBBBK", ".......KvVKTTtTTTtTTK", ".......KGGKtTKTTKTtTK", "........KK.KTK.KTK.K",
    ],
    /* Las orejas enormes se agitan un poco. */
    pelo: [ { 12: "..KK.........................KK" }, { 12: ".KK...........................KK" } ],
    hombro: [21, 22], caderas: [[13, 28], [17, 28]], pies: [[13, 39], [18, 39]], salta: true, brazoAtras: (p) => p.fase === "impulso",
    brazo: { luz: pal.Z, base: pal.G, sombra: pal.g, mano: pal.g, manoLuz: pal.G, codo: pal.V },
    pierna: { luz: pal.V, base: pal.G, sombra: pal.g, bota: pal.g, botaSombra: "#2E5418", rodilla: pal.V },
    manos: { guardia: [23, 25], impulso: [16, 12], golpe: [26, 22], choque: [27, 24], sigue: [25, 25], sube: [22, 18], alto: [21, 12] },
    arma: (px, p) => hacha(px, p.mano[0], p.mano[1], hdRumbo(p.fase, DIR)),
    choque: [48, 30],
  };
})();
HEROES_HD.uzu = HD_UZU;

/* ======================= XITIN ======================= */
const HD_XITIN = (() => {
  const pal = {
    H: "#F4E7B8", h: "#C9B47A", Z: "#FFFBEA", p: "#C9707A", S: "#F2D6C4", s: "#CFA88F", R: "#4A3A5A", L: "#6B3F22", l: "#4E2C16",
    F: "#E6E1D6", f: "#B0A898", B: "#3A2418", O: "#D8DEE8", T: "#5A3A28", t: "#40281A",
  };
  /* El oso: la grilla de hoy, estirada en el torso para que quede más alto que ella. */
  const BASE = [
    "...............KK...........", "..............KBbK.KK.......", ".............KBBBBKbBK......", "............KBBBBBBBBKK.....",
    "...........KBBBBBBBKBBBKK...", "..........KBBBBBBBBBBBMMMMK.", ".........KBBBBBBBBBBBMMMMKK.", "........KBBBBBBBBBBBKWKWKK..",
    ".......KBBBBBBBBBBBBKRRRK...", "......KBBBBBBBBBBBBBKWKWK...", ".....KBBbBBBBBBBBBBBMMMK....", "....KBBbBBBBBBBBBBBBMMK.....",
    "....KBbBBBBBBBBBBBBBKK......", "...KBbBBBBBBBBBBBBBBMK......", "...KBbBBBBBBBBBBBBBMMK......", "...KBbBBBBBBbBBBBBBMMK......",
    "..KBbBBBBBBBBBBBBBBMMK......", "..KBbBBBBBBBBBBBBBMMMK......", "..KBbBBBBbBBBBBBBBMMMK......", "..KBbBBBBBBBBBBBBBMMMK......",
    "..KBbBBBBBBBBBBBBBMMK.......", "..KBBbBBBBBBBBbBBBMMK.......", "..KBBbBBBBBBBBBBBBBK........", "..KBBBbBBBBBBBBBBBBK........",
    "...KBBBBBBBBBBBBBBK.........", "...KBBBBBBBBBBBBBBK.........", "...KBBBBBKKKKKKBBBBK........", "...KBBBBK....KBBBBK.........",
    "...KBBBBK....KBBBBK.........", "...KBBBBK....KBBBBK.........", "...KBBBBK....KBBBBK.........", "...KBBBBK....KBBBBK.........",
    "...KBBBBBK...KBBBBBK........", "...KBBBBBBK..KBBBBBBK.......", "...KbWbWbWK..KbWbWbWK.......", "...KKKKKKKK..KKKKKKKK.......",
  ];
  const filas = BASE.flatMap((f, i) => (i >= 14 && i <= 28 && i % 2 === 0 ? [f, f] : [f]));
  const OSO = {
    id: "oso", pal: { B: "#6B4426", b: "#4A2E18", M: "#A57A4E", W: "#F2EEE0", R: "#7A2A3A" },
    cuerpo: filas, top: 40 - filas.length, sinPiernas: true, brazoGrueso: 5,
    hombro: [15, 3], caderas: [[0, 0], [0, 0]], pies: [[0, 0], [0, 0]],
    brazo: { luz: "#8A5E38", base: "#6B4426", sombra: "#4A2E18", mano: "#4A2E18", manoLuz: "#6B4426" },
    brazoAtras: (p) => p.fase === "impulso",
    manos: { impulso: [5, -7], golpe: [22, 8], choque: [25, 20], sigue: [24, 24], guardia: [22, 14] },
    /* Garras blancas en la zarpa. */
    arma: (px, p) => { const [hx, hy] = p.mano; [-1, 1, 3].forEach((d) => { px(hx + 3, hy + d, "#F2EEE0"); px(hx + 4, hy + d + 1, "#F2EEE0"); }); },
  };
  /* Nube esponjosa: varias bolas que crecen, con borde gris y brillo arriba. */
  const puf = (g, cx, cy, f) => {
    const e = [0.5, 0.85, 1][f]; if (!e) return;
    const bolas = [[0, 0, 7], [-7, 3, 5], [7, 3, 5], [-4, -6, 5], [5, -5, 5], [0, 7, 5], [-9, -2, 4], [9, -2, 4]].map(([a, b, r]) => [cx + a * e, cy + b * e, r * e]);
    const dentro = (x, y, m) => bolas.some(([a, b, r]) => (x - a) ** 2 + (y - b) ** 2 <= (r + m) ** 2);
    for (let y = cy - 16; y <= cy + 16; y++) for (let x = cx - 18; x <= cx + 18; x++) {
      if (dentro(x, y, 0)) { g.fillStyle = dentro(x, y + 2, 0) ? (dentro(x - 2, y - 2, 0) ? "#F4F1EA" : "#FFFFFF") : "#C9C2B4"; g.fillRect(x, y, 1, 1); }
      else if (dentro(x, y, 1)) { g.fillStyle = "#8E8676"; g.fillRect(x, y, 1, 1); }
    }
  };
  const OSO_FASES = ["impulso", "golpe", "choque", "sigue"];
  return {
    id: "xitin", nombre: "Xitin", pal,
    cuerpo: [
      "..........KKKKKK", "........KKHHZHHHKK", ".......KHHhHHZHHHHK", "......KHHhHHHHHHHHHK",
      "......KHhHHHHHHHHHHHK", ".....KHhHHHHHHHHHHHHK", ".....KHhHHHHHHKKKKSHK", ".....KHhHHHHHKSSSSSSK",
      "....KHhHHKKHKSSSSSSSK", "...KKHhHKSSKSSSSSRKSK", "..KSSKhHHKSKSSSSSRKSK", "...KSSKhHKSSSSSSSSSSK",
      "....KKHhHKsSSSSSSSSK", "....KHhHHKsSSSSSpSK", "....KHhHHHKssSSSSK", "...KFFFFHhHKKKKK",
      "..KFfFFFFFFFFFFFK", ".KFfFFfFFFFfFFFFFK", "..KFFFFKLLLLLLLFK", "...KHhKLLlLLLLLLK",
      "...KHhKLLLLlLLLLK", "...KhHKFfFfFfFfFK", "...KHhKSSSSsSSSSK", "...KhHKSSSSSSsSSK",
      "....KKKOBOBOBOBOK", "......KTTTTTTTTTK", "......KTTTTKTTTTK", "......KTtTTKTTtTK",
    ],
    /* La punta de la trenza se mece. */
    pelo: [ { 24: "...KHK", 25: "...KhK", 26: "...KZK", 27: "....K" }, { 24: "..KHK.", 25: "..KhK.", 26: "..KZK.", 27: "...K.." } ],
    hombro: [13, 19], caderas: [[11, 28], [16, 28]], pies: [[11, 39], [18, 39]],
    brazo: { luz: "#FFF0E4", base: pal.S, sombra: pal.s, mano: pal.S, manoLuz: "#FFF0E4" },
    pierna: { luz: "#7A5238", base: pal.T, sombra: pal.t, bota: pal.F, botaSombra: pal.f },
    manos: { guardia: [18, 23], impulso: [15, 20], golpe: [22, 20], choque: [22, 20], sigue: [21, 22], sube: [22, 16], alto: [25, 11] },
    forma: (p) => (OSO_FASES.includes(p.fase) ? OSO : null),
    /* Maná verde que late en la mano. */
    arma: (px, p) => {
      const [hx, hy] = p.mano, late = 2.5 + Math.sin(p.t / 220) * 1;
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.hypot(dx, dy); if (d <= late) px(hx + 1 + dx, hy - 3 + dy, d < 1.2 ? "#DCFCE7" : d < late - 1 ? "rgba(74,222,128,.75)" : "rgba(74,222,128,.35)"); }
      const sube = Math.floor(p.t / 120) % 6;
      px(hx + 2, hy - 7 - sube, "#86EFAC"); if (sube > 2) px(hx - 1, hy - 5 - sube, "#4ADE80");
    },
    /* ¡Puf!: nube al transformarse y al volver; zarpazo al dar. */
    proyectil: (g, x, y, p) => {
      const cx = x + HD_OX + 14, cy = y + HD_OY + 22, T = p.t % 2400;
      if (p.fase === "impulso" && p.k < 0.6) puf(g, cx, cy, Math.floor(p.k * 5));
      if (p.fase === "vuelve" && T < 1580) puf(g, cx, cy, 2 - Math.floor((T - 1400) / 60));
      if (p.fase === "choque" || p.fase === "sigue") {
        const n = p.fase === "choque" ? Math.min(3, Math.floor(p.k * 6)) : 3;
        for (let i = 0; i < n; i++) for (let j = 0; j < 9; j++) { g.fillStyle = j > 6 ? "#FFFFFF" : "#F2EEE0"; g.fillRect(x + 52 + i * 3 + j, y + HD_OY + 14 + j, 1, 1); }
      }
    },
    choque: [46, 26],
  };
})();
HEROES_HD.xitin = HD_XITIN;

/* ================= PRUEBA DE ÁNGULO: TRES CUARTOS =================
   El cuerpo gira unos 45° hacia el rival: se ven los dos ojos (el de atrás más cerca del borde),
   el pecho casi completo y el brazo de atrás colgando a un lado. El brazo que ataca nace en el
   hombro del lado del rival, así sale hacia adelante sin cruzar la cara ni el pecho. */
const HD_LATTE34 = {
  ...HD_LATTE, nombre: "Latte",
  pal: { ...HD_LATTE.pal, g: "#3E6E78", q: "#5E8E98" },
  cuerpo: [
    "............KKKKKKK", "............KtTTTTK", "............KtTTTuK", "............KtTTTuK",
    "............KtTTWWK", "............KYYYWYK", "............KyyyyyK", ".........KKKKTTTTTKKKK",
    "........KtTTTTTTTTTTTuK", "........KHiHHHiHHHHhK", ".......KHiHhHHSHSSSSSK", "........KHiHhSSSSSSSSK",
    ".......KHhHhSSESSSSESK", "........KhHhSSESSsSESK", ".........KhHSSSSSssSSK", ".........KhXXSXXXXXXSK",
    "..........KXXXXSSXXXK", "...........KXXXXXXXK", "..........KJJJJKLLLKJJK", "..........KJJJJKLLLKJJK",
    "..........KjJJJKLLLKJJK", "..........KjJJJJKLKJJJK", "..........KjJJJJKLKJJJK", "..........KjJJJJJKJJJJK",
    "..........KjBBBBBBGBBBK", "..........KjJJJJJJJJJJK", "..........KjjJJJJJJJJJK", "..........KKjjjjjjjjjjK",
  ],
  hombro: [20, 19], caderas: [[13, 28], [18, 28]], pies: [[13, 39], [19, 39]],
  manos: { guardia: [25, 27], impulso: [4, 22], golpe: [28, 20], choque: [29, 21], sigue: [27, 22], sube: [24, 16], alto: [27, 11] },
  brazoAtras: (p) => p.fase === "impulso",   // toma impulso por detrás de la espalda
  brazoCerca: { hombro: [11, 19] }, brazoGrueso: 2,
};

const HD_CUPE34 = {
  ...HD_CUPE, nombre: "Cupe", bajar: 4,
  pierna: { ...HD_CUPE.pierna, anchoAdelante: 3 },   // la pierna derecha (la de adelante) más delgada
  cuerpo: [
    "............O...O...O", "............OO.OOO.OO", "............OROOROORO", ".........KKKOOOOOOOOOKKK",
    ".......KKWWKKKKKKKKKKKWWKK", "......KWWWWWWWWWWWWWWWWWWK", ".....KWWvWWWWWWWWWWWWWWWWWK", ".....KWWWWWWWWWWWWWWWWWWWWK",
    "...KKwKWWWWWWWWWWWWWWWWWWWK", "..KwwwKWWWWWWWWKKWWWWKKWWWKK", "..KwwwKWWWWWWWWKKWWWWKKWWWKwK", "..KwwwKWWWWWWWWWWWWWKKWWWWWK",
    "..KwwwKWWWWWWWWWWWWKWWKWWWWWK", "..KwwwKWWWWWWWWWWWWWWWWWWWKwK", "..KwwwKKWWWWWWWWWWWWWWWWWKKwwK", "...KwwwKKKWWWWWWWWWWWWWKKKwwK",
    ".....KKK.KGGGGKZZZKGGK...KKK", "........KGGGGYKZLZKYGK", "........KGgGGYKBZBKYGK", "........KGgGGYKBYBKYGK",
    "........KGgGGYKBBBKYGK", "........KGgGGYKBYBKYGK", "........KGgGGYKDDDKYGK", "........KGgGGYKDDDKYGK",
    "........KGgGYYKDKDKYGK", "........KKKKKKKDKDKKKK", ".............KDDKDDK", ".........KK..KDDKDDK",
  ],
  hombro: [21, 19], caderas: [[15, 28], [18, 28]], pies: [[14, 39], [19, 39]], brazoCerca: { hombro: [10, 19] }, brazoGrueso: 2,
  manos: { guardia: [24, 24], impulso: [23, 25], golpe: [28, 21], choque: [29, 21], sigue: [28, 22], sube: [25, 16], alto: [28, 13] },
};

/* Cara de Cupe simétrica como el diseño publicado: la de frente, 1 px hacia el rival. */
HD_CUPE34.cuerpo = HD_CUPE34.cuerpo.map((f, i) => (i <= 15 ? "." + HD_CUPE.cuerpo[i] : f));
const HEROES_34 = [[HD_LATTE, HD_LATTE34], [HD_CUPE, HD_CUPE34]];

/* Jelic en tres cuartos: visera con los dos ojos, hombrera y brazo de atrás a la izquierda, la U del pecho corrida hacia el rival. */
const HD_JELIC34 = {
  ...HD_JELIC,
  cuerpo: [
    "...............................", "...............................", "............KKKKKK.............", "...........KLLLMMMKK...........",
    "..........KLLMMMMMMMK..........", ".........KLMMMMMMMMMMK.........", ".........KLMMMMMMMMMMMK........", "........KLMMMMMMMMMMMMMK.......",
    "........KLMMMmmmmmmmmMMK.......", "........KMMMmKKKKKKKKKmK.......", "........KMMmKzSSSSSSSKmK.......", "........KMMmKSSKSSSKSKmK.......",
    "........KMMmKSSKSSSKSKmK.......", "........KMmmKsSSSSsSSKmK.......", "........KMmmKsSWWWWWSKmK.......", "........KmmmKssSwWWwSKK........",
    ".........KmmKKssSSSSKK.........", "..........KKKdddddKKK..........", "..........KdMMMMMMMMMMK", "..........KLMMMMMMMMMMK",
    "..........KMLQAAAAAAQMK", "..........KMLQRAAARAQMK", "..........KMLQRAAARAQMK", "..........KMLQRRRRRAQMK",
    "..........KMMQAAAAAAAMK", "..........KBBBBBBYBBBBK", "...........KRaRaRaRaRaK", "...........KaRaRaRaRaRK",
  ],
  hombro: [21, 19], caderas: [[13, 28], [18, 28]], pies: [[13, 39], [19, 39]],
  manos: { guardia: [25, 27], impulso: [18, 25], golpe: [26, 23], choque: [28, 23], sigue: [27, 24], sube: [24, 16], alto: [27, 11] },
  choque: [38, 20],
  brazoCerca: { hombro: [11, 19] }, brazoGrueso: 2,
};
/* Agattita en tres cuartos: el ojo de atrás más angosto y la nariz dentro del hocico, no en el borde. */
const HD_AGATTITA34 = { ...HD_AGATTITA, bajar: 4,
  brazoCerca: { hombro: [12, 19] }, brazoGrueso: 2,
  pierna: { ...HD_AGATTITA.pierna, anchoAdelante: 3 },   // la pierna derecha (la de adelante) más delgada
  /* Cara simétrica como el diseño publicado: ojos grandes con brillo, hocico al centro con la nariz,
     boquita en ω y mechones iguales en las dos mejillas. Corrida 1 px hacia el rival. */
  cuerpo: HD_AGATTITA.cuerpo.map((f, i) => ({
    8: "......KZFFFFKKFFFFFKKFFFFK", 9: "......KZFFFFKWFFFFFKWFFFFK", 10: ".....KFZFFFFKKFFFFFKKFFFFFK",
    11: "...KFfFZFFfFWWWWNNWWWWFfFFfFK", 12: "....KFfFZFFFWWWKWWKWWWFFfFFK", 13: "......KFZFFFWWWWWWWWWWFFFK",
    14: "........KKFFFWWWWWWWWFFKK", 15: "..........KKKKKKKKKKKKK",
    20: "............KWWWWWWKK", 21: "............KWWwWWWK", 22: "............KFWWWWFK", 23: "............KBBBBBBK", 24: "............KBbBBbBK",
  }[i] || f)),
  /* Cola atigrada, gruesa y esponjosa: sube desde la cadera pegada al costado y la punta se mece. */
  capa: [
    { 13: ".....KK", 14: "....KFFK", 15: "...KFfFFK", 16: "...KFFfFK", 17: "...KfFFK", 18: "...KFfFK", 19: "...KFFfK", 20: "....KfFFK", 21: "....KFfFK", 22: ".....KFFfK", 23: ".....KfFFFK", 24: "......KFfFFK", 25: ".......KKFFK" },
    { 13: "....KK", 14: "...KFFK", 15: "..KFfFFK", 16: "..KFFfFK", 17: "...KfFFK", 18: "...KFfFK", 19: "...KFFfK", 20: "....KfFFK", 21: "....KFfFK", 22: ".....KFFfK", 23: ".....KfFFFK", 24: "......KFfFFK", 25: ".......KKFFK" },
    { 13: "......KK", 14: ".....KFFK", 15: "....KFfFFK", 16: "....KFFfFK", 17: "...KfFFFK", 18: "...KFfFK", 19: "...KFFfK", 20: "....KfFFK", 21: "....KFfFK", 22: ".....KFFfK", 23: ".....KfFFFK", 24: "......KFfFFK", 25: ".......KKFFK" },
  ],
};
HEROES_34.unshift([HD_JELIC, HD_JELIC34], [HD_AGATTITA, HD_AGATTITA34]);

/* Malala en tres cuartos: el flequillo le tapa los ojos (nadie se los ha visto), la cara corrida hacia el rival
   con pelo a los dos lados, y el broche de la blusa hacia el lado del rival. */
/* La gata calico de Malala, sentada a sus pies: cara blanca con una oreja naranja y otra oscura,
   manchas naranja y café en el cuerpo, la cola que se mece y un parpadeo de vez en cuando. */
const gataCalico = (px, x0, y0, t, celebra) => {
  if (celebra) { y0 -= Math.floor(t / 210) % 2 ? 3 : 0; }   // salta de alegría con Malala
  const pal = { K: HDK, W: "#F4F1EA", w: "#D9D2C4", O: "#E08A3C", D: "#4A3628", P: "#E39A86", E: "#3A5A2A" };
  const parpadea = Math.floor(t / 150) % 20 === 0;
  const filas = [
    ".K...K.", "KOK.KDK", "KOOWWDK", parpadea ? "KWKKKWK" : "KWEWEWK", "KWWPWWK", ".KWWWK.",
    "KDWWWOK", "KDDWWOK", "KDWWWwK", ".KKKKK.",
  ];
  filas.forEach((f, y) => [...f].forEach((k, x) => { if (pal[k]) px(x0 + x, y0 + y, pal[k]); }));
  if (celebra) {   // cola bien arriba y un corazoncito
    [[-1, 8, "K"], [-1, 7, "D"], [-2, 6, "K"], [-1, 6, "D"], [-1, 5, "O"], [-2, 5, "K"], [-1, 4, "O"], [-2, 4, "K"], [-1, 3, "K"]].forEach(([x, y, k]) => px(x0 + x, y0 + y, pal[k]));
    if (Math.floor(t / 420) % 2) [[1, -3], [3, -3], [0, -2], [1, -2], [2, -2], [3, -2], [4, -2], [1, -1], [2, -1], [3, -1], [2, 0]].forEach(([x, y]) => px(x0 + x, y0 + y - 1, "#F472B6"));
    return;
  }
  const mece = Math.floor(t / 300) % 2;   // la cola sube por el costado y la punta se mece
  [[-1, 8, "K"], [-1, 7, "D"], [-2, 7, "K"], [-1, 6, "D"], [-2, 6, "K"], [mece ? -1 : 0, 5, "O"], [mece ? -2 : -1, 5, "K"], [mece ? -1 : 0, 4, "K"]].forEach(([x, y, k]) => px(x0 + x, y0 + y, pal[k]));
};
const HD_MALALA34 = { ...HD_MALALA,
  /* Sin la capita crema: el pelo negro largo le cae por la espalda y las puntas se mecen. */
  capa: [
    { 21: "...KLK", 22: "...KLlK", 23: "...KLLK", 24: "....KlK", 25: "....KK" },
    { 21: "...KLK", 22: "..KLlK", 23: "..KLLK", 24: "...KlK", 25: "...KK" },
    { 21: "...KLK", 22: "...KLlK", 23: "....KLLK", 24: ".....KlK", 25: ".....KK" },
  ], brazoCerca: { hombro: [7, 20] }, brazoGrueso: 2,
  cuerpo: HD_MALALA.cuerpo.map((f, i) => ({
    11: "....KLLLLLLLLLLLLK", 12: "....KLLLlLLLLlLLLK", 13: "....KLLlLLLlLLLlLK", 14: "....KLlLLSLSSLSLLK",
    15: "....KLlLKSSSSSSSLK", 16: "....KLlLKKsSSpSKLK", 17: "....KLLKKDDDDDKKLK", 18: "...KLKYYYYYYYYYK", 19: "..KLLKYYYYYYEYYK", 20: "..KLlLKYYYYYYYK", 21: "...KLKQQQQQQQK",
  }[i] || f)),
  hombro: [14, 20],
  manos: { guardia: [21, 24], impulso: [10, 27], golpe: [23, 21], choque: [24, 21], sigue: [23, 22], sube: [22, 16], alto: [25, 11] },
  arma: (px, p) => {
    if (!["impulso", "golpe", "choque", "sigue"].includes(p.fase)) HD_MALALA.arma(px, p);
    const baja = (p.bob || 0) + (p.agacha || 0), inc = p.inclina || 0;   // la gata se queda quieta en el suelo
    gataCalico((x, y, c) => px(x - inc, y - baja, c), p.enPodio ? -1 : -8, 30, p.t, p.fase === "sube" || p.fase === "alto");
  },
  atras: (px, p) => { if (["impulso", "golpe", "choque", "sigue"].includes(p.fase)) HD_MALALA.atras(px, { ...p, fase: "golpe" }); },
};

/* Malía en tres cuartos: los dos ojos verdes con mejillas rosadas, la nariz entre los ojos, la oreja de elfo
   del lado de cerca y la cara redondeada; el delantal ya mira hacia el rival. */
const HD_MALIA34 = { ...HD_MALIA, brazoCerca: { hombro: [9, 18] }, brazoGrueso: 2,
  cuerpo: HD_MALIA.cuerpo.map((f, i) => ({
    5: "......KHHHHHHHHHHHK", 6: ".....KHHhHHHHHHHHHK", 7: ".....KHhHHHHHHHHHHHK", 8: "....KKHhHHKzSSSSSSHK",
    9: "...KSKhHHKSSSSSSSSHK", 10: "....KSKhHKSSESSSESK", 11: "....KKHhHKSpSSSSpSK", 12: ".....KHhKsSSSSsSSK",
    13: ".....KHhKsSSSppSK", 14: "......KKKKssSSKK",
    /* Peto del delantal al centro y hombro de blusa a cada lado, para que el brazo derecho nazca de un hombro. */
    16: "........KBBBWWWBK", 17: ".......KBBBBWWWWBK", 18: "......KBbBBBWWwWBBK", 19: "......KBbBBBWWWWBBK",
    20: "......KBbBBBWWWWBBK", 21: "......KDDDDDDDDDDDK", 22: "......KDdDDDDDDDDDK",
  }[i] || f)),
  hombro: [17, 18],
  manos: { guardia: [20, 23], impulso: [8, 24], golpe: [24, 20], choque: [25, 20], sigue: [24, 21], sube: [22, 16], alto: [25, 11] },
  choque: [52, 19], manoEncima: true, brazoAtras: (p) => p.fase === "impulso",
  arma: (px, p) => HD_MALIA.arma(px, p.fase === "guardia" || p.fase === "vuelve" ? { ...p, fase: "sube" } : p),
};
HEROES_34.push([HD_MALALA, HD_MALALA34], [HD_MALIA, HD_MALIA34]);

/* Kenny en tres cuartos: lentes oscuros con los dos cristales, nariz entre ellos, barba pareja y cara redondeada.
   Al celebrar, la mano de cerca rasguea el laúd en vez de levantarse. */
/* Laúd tomado como se toca mirando al rival: la caja junto a la cadera de cerca, la mano izquierda rasguea,
   y el mango apunta al rival, pisado por la mano derecha. */
const laudKenny = (px, cx, cy) => {
  const pts = [];
  for (let dy = -5; dy <= 5; dy++) for (let dx = -6; dx <= 6; dx++) { const d = (dx / 6.3) ** 2 + (dy / 5.2) ** 2; if (d <= 1) pts.push([cx + dx, cy + dy, dx + dy < -5 ? "#E8B27A" : d > 0.7 ? "#8A5228" : "#C98A4A"]); }
  hdLinea(cx + 5, cy - 3, cx + 15, cy - 9, (x, y) => pts.push([x, y, "#E0A868"], [x, y + 1, "#A86A34"]));
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) pts.push([cx + 16 + i, cy - 11 + j, "#3A2418"]);
  hdContorno(px, pts);
  px(cx, cy, "#2A1608"); px(cx + 1, cy, "#2A1608"); px(cx, cy + 1, "#2A1608"); px(cx + 1, cy + 1, "#2A1608");
  hdLinea(cx - 4, cy + 1, cx + 15, cy - 9, (x, y) => { if ((x + y) % 2 === 0) px(x, y, "#FFF4DC"); });
  px(cx + 19, cy - 11, "#E5E7EB"); px(cx + 18, cy - 12, "#E5E7EB");
};
/* Al celebrar, el laúd cuelga vertical de la mano izquierda: clavijero arriba, caja abajo. */
const laudColgado = (px, hx, hy) => {
  const pts = [];
  for (let y = hy - 1; y <= hy + 2; y++) pts.push([hx, y, "#E0A868"], [hx + 1, y, "#A86A34"]);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) pts.push([hx - 1 + i, hy - 4 + j, "#3A2418"]);
  const cy = hy + 7;
  for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) { const d = (dx / 4.6) ** 2 + (dy / 5.2) ** 2; if (d <= 1) pts.push([hx + dx, cy + dy, dx + dy < -5 ? "#E8B27A" : d > 0.7 ? "#8A5228" : "#C98A4A"]); }
  hdContorno(px, pts);
  px(hx, cy, "#2A1608"); px(hx + 1, cy, "#2A1608"); px(hx, cy + 1, "#2A1608"); px(hx + 1, cy + 1, "#2A1608");
};
const celebraKenny = (p) => p.fase === "sube" || p.fase === "alto";
const RASGUEO_KENNY = { guardia: [[3, 6], [-2, 5]], vuelve: [[3, 6], [-2, 5]], impulso: [[2, 4], [-2, 4]], golpe: [[4, 8], [-2, 6]], choque: [[3, 7], [-2, 5]], sigue: [[3, 6], [-2, 5]], sube: [[-1, 4], [-3, 2]], alto: [[-1, 4], [-3, 2]] };
const HD_KENNY34 = { ...HD_KENNY, brazoGrueso: 2,
  brazoCerca: { hombro: [9, 19], poses: RASGUEO_KENNY, encima: true },   // la mano de cerca rasguea la caja; al celebrar sostiene el laúd colgado   // la mano de cerca pisa las cuerdas en el mango
  armaDetras: (px, p) => (celebraKenny(p) ? laudColgado(px, 8, 23) : laudKenny(px, 11, 26)),
  arma: undefined,
  manos: { guardia: [24, 19], impulso: [23, 19], golpe: [24, 19], choque: [24, 19], sigue: [24, 19], sube: [22, 16], alto: [25, 11] },   // la derecha pisa el mango
  cuerpo: HD_KENNY.cuerpo.map((f, i) => ({
    6: "......KHHhHHHHHHHHHHHK", 7: "......KHhHHHKSSSSSSSSK", 8: "......KHhHHKSSSSSSSSSK",
    9: "......KHhHHKSFQFFFFQFK", 10: "......KHHhHKSFFFSSFFFK", 11: "......KHhHHKsSSSSsSSSK",
    12: "......KHhHKDDSDDDDSDDK", 13: ".......KhHKDDDDSSDDDK", 14: ".......KKKKDDDDDDDDK", 15: "...........KKDDDDKK",
  }[i] || f)),
  hombro: [18, 19],
};

/* Tiván en tres cuartos: los dos ojos bajo las antiparras, la nariz entre ellos, la oreja del lado de cerca
   y el mentón redondeado; toma impulso por detrás del cuerpo. */
const HD_TIVAN34 = { ...HD_TIVAN, brazoGrueso: 2, brazoCerca: { hombro: [9, 19] },
  cuerpo: HD_TIVAN.cuerpo.map((f, i) => ({
    9: "......KKHhHKSSKSSSKSK", 10: "......KSKhHKSSKSSSKSK", 11: "......KKKhKsSSSSsSSSK",
    12: ".........KKsSSSssSSK", 13: "..........KKssSSSK",
  }[i] || f)),
  hombro: [19, 19], brazoAtras: (p) => p.fase === "impulso",
  manos: { guardia: [21, 24], impulso: [5, 24], golpe: [26, 16], choque: [26, 19], sigue: [24, 22], sube: [22, 16], alto: [25, 11] },
};
HEROES_34.push([HD_KENNY, HD_KENNY34], [HD_TIVAN, HD_TIVAN34]);

/* Patroclus en tres cuartos: los dos ojos, una sombra muy suave de nariz, boca pequeña y mentón redondeado;
   el collar con la piedra turquesa corrido hacia el rival. Toma impulso con el bordón por detrás. */
const HD_PATROCLUS34 = { ...HD_PATROCLUS,
  /* Sin capa: una pañoleta verde de scout amarrada al cuello, con la punta colgando hacia atrás. */
  capa: [
    { 15: "....KGGK", 16: "...KGGgK", 17: "...KGgK", 18: "....KgK", 19: ".....K" },
    { 15: "....KGGK", 16: "..KGGgK", 17: "..KGgK", 18: "...KgK", 19: "....K" },
    { 15: "....KGGK", 16: "...KGGgK", 17: "....KGgK", 18: ".....KgK", 19: "......K" },
  ], brazoGrueso: 2, brazoCerca: { hombro: [9, 19] }, manoEncima: true,
  cuerpo: HD_PATROCLUS.cuerpo.map((f, i) => ({
    10: ".....KHHHKSSKSSSKSK", 11: ".....KKSKSSSKSSSKSK", 12: "......KSSKsSSSSsSSK", 13: "......KKsKsSSssSSK",
    14: ".........KKsSSSK", 15: "......KGGgGGGGGGGK", 16: "......KGgLLKNZNKLK", 17: "......KgKLLLLKZKLLK",
    18: "......KLLLLlLLLLLK",
    19: "......KLLLLLLLlLLK",
    /* La parte baja de la túnica llega hasta la cadera derecha: la pierna nace del cuerpo sin corte. */
    24: "......KTTTTTTTTTTK", 25: "......KTTTTTTTTTTK", 26: "......KTTTTTTTTTTK", 27: "......KKKKKKKKKKKK",   // borde de la cintura de lado a lado
  }[i] || f)),
  hombro: [16, 19], brazoAtras: (p) => p.fase === "impulso",
  manos: { guardia: [23, 24], impulso: [12, 23], golpe: [23, 22], choque: [25, 22], sigue: [24, 23], sube: [22, 16], alto: [24, 12] },
  /* Al tomar impulso, el bordón va horizontal hacia atrás, listo para embestir (no vertical tras la cabeza). */
  arma: (px, p) => {
    HD_PATROCLUS.arma(px, p.fase === "impulso" ? { ...p, fase: "golpe" } : p);
    /* Arito de plata, pequeño y sutil, en el lóbulo de la oreja de cerca. */
    [[7, 12, "#E5E7EB"], [7, 13, "#9AA3B0"]].forEach(([x, y, c]) => px(x, y, c));
  },
};

/* Uchis en tres cuartos: cara con la curva suave (pómulo apenas marcado y mandíbula que se cierra de a poco),
   una daga en cada mano; lanza primero la de la derecha y enseguida la de la izquierda. */
const dagaUchis = (px, x, y) => {
  const pts = [[x, y, "#6E4424"], [x, y - 1, "#6E4424"], [x - 1, y - 2, "#C9A24B"], [x, y - 2, "#C9A24B"], [x + 1, y - 2, "#C9A24B"]];
  for (let i = 3; i <= 6; i++) pts.push([x, y - i, "#D9DEE6"], [x + 1, y - i, "#9AA3B0"]);
  pts.push([x, y - 7, "#D9DEE6"], [x, y - 8, "#FFFFFF"]);   // la hoja se angosta y termina en punta
  hdContorno(px, pts);
};
/* Daga en vuelo, con contorno y punta: horizontal o vertical según el giro. */
const dagaVuelo = (g, cx, cy, horizontal) => {
  const pts = [[0, 0, "#6E4424"], [1, 0, "#6E4424"], [2, -1, "#C9A24B"], [2, 0, "#C9A24B"], [2, 1, "#C9A24B"], [3, 0, "#D9DEE6"], [4, 0, "#D9DEE6"], [5, 0, "#D9DEE6"], [6, 0, "#FFFFFF"]];
  const pos = pts.map(([a, b, c]) => (horizontal ? [cx + a, cy + b, c] : [cx + b, cy - a, c]));
  const llenos = new Set(pos.map(([x, y]) => x + "," + y));
  g.fillStyle = HDK;
  pos.forEach(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { if (!llenos.has(x + dx + "," + (y + dy))) g.fillRect(x + dx, y + dy, 1, 1); }));
  pos.forEach(([x, y, c]) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); });
};
const MANO_IZQ_UCHIS = {   // la mano izquierda: tranquila, se prepara al golpe de la derecha y lanza cruzando hacia adelante
  guardia: [[-1, 7], [-3, 4]], vuelve: [[-1, 7], [-3, 4]], impulso: [[-1, 7], [-3, 4]], golpe: [[-4, 3], [-5, 7]],
  choque: [[13, 2], [5, 5]], sigue: [[11, 4], [4, 6]], sube: [[-5, -2], [-4, 2]], alto: [[-6, -9], [-5, -3]],
};
const HD_UCHIS34 = { ...HD_UCHIS, brazoGrueso: 2, brazoCerca: { hombro: [9, 18], poses: MANO_IZQ_UCHIS },
  cuerpo: HD_UCHIS.cuerpo.map((f, i) => ({
    6: ".....KHhHHHKSSSSSSSSK", 7: ".....KHhHHKSSSSSSSSSK", 8: ".....KHhHHKSSKSSSKSSK", 9: ".....KHhHHKSSKSSSKSSK", 10: "....KHhHHKsSSSSSsSSSK", 11: "....KHhHHKsSSSSLLSSSK", 12: "....KHhHHHKsSSSSSSSK", 13: "....KHhHHHHKKssSSSK", 14: "....KHhHHHKRCCKKKK",
  }[i] || f)),
  hombro: [18, 18], brazoAtras: (p) => p.fase === "impulso",
  /* Codo a mano: la mano derecha a la misma altura que la izquierda; al lanzar, el brazo se estira casi recto. */
  codos: { guardia: [20, 22], golpe: [22, 19], choque: [22, 20], sigue: [21, 21], sube: [21, 18], alto: [23, 15] },
  manos: { guardia: [21, 25], impulso: [6, 24], golpe: [26, 20], choque: [25, 22], sigue: [23, 23], sube: [22, 16], alto: [25, 11] },
  arma: (px, p) => {
    const lanzo1 = ["golpe", "choque", "sigue"].includes(p.fase), lanzo2 = ["choque", "sigue"].includes(p.fase);
    if (!lanzo1) dagaUchis(px, p.mano[0] + 1, p.mano[1] - 1);
    if (!lanzo2) { const [o] = MANO_IZQ_UCHIS[p.fase] || MANO_IZQ_UCHIS.guardia; dagaUchis(px, 9 + o[0], 18 + o[1] - 1); }
  },
  /* Primero vuela la daga de la derecha; la de la izquierda sale un instante después. */
  proyectil: (g, x, y, p) => {
    const daga = (cx, cy, i) => dagaVuelo(g, cx, cy, Math.floor((p.t + i * 60) / 60) % 2 === 1);
    if (p.fase === "golpe") daga(Math.round(x + HD_OX + 32 + p.k * 16), y + HD_OY + 17, 0);
    if (p.fase === "choque") { daga(x + HD_OX + 48, y + HD_OY + 17, 0); daga(Math.round(x + HD_OX + 30 + p.k * 16), y + HD_OY + 21, 1); }
  },
};
HEROES_34.push([HD_PATROCLUS, HD_PATROCLUS34], [HD_UCHIS, HD_UCHIS34]);

/* Janet en tres cuartos: los dos ojos, la nariz entre ellos, barba pareja (patillas, bigote y mentón), sin pómulo.
   Sostiene el arco con la derecha y la mano de cerca tensa la cuerda al tomar impulso. */
const HD_JANET34 = { ...HD_JANET, brazoGrueso: 2,
  brazoCerca: { hombro: [9, 19], poses: { impulso: [[9, 1], [3, 4]], golpe: [[5, 2], [1, 5]] } },
  cuerpo: HD_JANET.cuerpo.map((f, i) => ({
    6: ".....KHhHHHHHHHHHHHHK", 7: ".....KHSKHHHHHSSSSSSK", 8: ".....KHSSKHHKSSSSSSSK", 9: ".....KHsSKKSSKSSSKSSK", 10: "..KK.KHhHHKSSKSSSKSSK", 11: ".KWWKKHhHKDSSSSSsSSSK",
    12: ".KWQKKHhHKDDSSDDDDDDK", 13: "..KQKKHhHHKDDDDSSDDK", 14: "..KQKKHhHHHKDDDDDDK", 15: "..KQKKhHHKGGLKKKKK",
  }[i] || f)),
  hombro: [17, 19],
  /* Codo abajo al sostener el arco en guardia (no levantado). */
  codos: { guardia: [18, 23] },
  /* Faldón cerrado al medio y borde de la cintura: sin hueco entre las piernas. */
  /* Piernas más delgadas y 1 px más a la izquierda. */
  pierna: { ...HD_JANET.pierna, ancho: 3 },
  caderas: [[10, 28], [15, 28]],
  pies: [[10, 39], [17, 39]],
  manos: { guardia: [21, 23], impulso: [23, 20], golpe: [26, 20], choque: [26, 20], sigue: [25, 21], sube: [22, 16], alto: [25, 12] },
};

/* July en tres cuartos: cejas blancas sobre los dos ojos, la nariz entre ellos, bigote y barba parejos,
   la oreja pegada a la cabeza. El brazo de atrás sale del cuerpo y se dibuja como el otro. */
/* Martillazo de July: el martillo da una vuelta completa y continua. Desde la guardia va hacia atrás,
   sube por detrás del hombro, pasa por encima de la cabeza, cae con fuerza hacia adelante y sigue un poco. */
const anguloJuly = (p) => {
  if (!["impulso", "golpe", "choque", "sigue"].includes(p.fase)) return null;
  const T = p.t % 2400, K = [[500, 70], [760, 225], [830, 270], [900, 380], [1000, 400], [1150, 410], [1400, 430]];
  for (let n = 1; n < K.length; n++) if (T <= K[n][0]) { const [t0, a0] = K[n - 1], [t1, a1] = K[n]; return ((a0 + (a1 - a0) * Math.max(0, (T - t0) / (t1 - t0))) * Math.PI) / 180; }
  return (430 * Math.PI) / 180;
};
const martilloJuly = (px, hx, hy, ux, uy) => {
  const nx = -uy, ny = ux, pts = [];
  for (let i = -3; i <= 10; i++) for (let k = 0; k < 2; k++) pts.push([Math.round(hx + 1 + ux * i + nx * k), Math.round(hy + uy * i + ny * k), k ? "#6E4824" : "#9A6A3A"]);
  for (let i = 9; i <= 14; i++) for (let k = -5; k <= 5; k++) pts.push([Math.round(hx + 1 + ux * i + nx * k), Math.round(hy + uy * i + ny * k), i === 9 ? "#5E6673" : k < -3 ? "#D9DEE6" : k > 3 ? "#5E6673" : "#9AA3B0"]);
  hdContorno(px, pts);
};
const HD_JULY34 = { ...HD_JULY, pal: { ...HD_JULY.pal, P: "#5A5E6A", M: "#A9B2BF", m: "#7C8594", h: "#9A6A3A", l: "#94603A" }, brazoGrueso: 2, brazoCerca: { hombro: [8, 18] }, manoEncima: true,
  pelo: null,   // la barba ya no es larga: sin las filas que se mecían
  /* Cabeza calva redondeada con barba corta; torso ancho de herrero: hombros y costados del pecho desnudos,
     peto de cuero con tiras que suben al cuello, faja amarilla, cinturón rojo y falda del delantal. */
  cuerpo: HD_JULY.cuerpo.map((f, i) => ({
      0: ".........KKKKKK", 1: ".......KKSZZSSSKK", 2: "......KSZZSSSSSSSK", 3: ".....KSZSSSSSSSSSSK", 4: ".....KSSSSSSSSSSSSK", 5: ".....KSSSSSSSSSSSSSK", 6: ".....KSSSSWWWSWWWSSK", 7: "....KSKSSSSKSSSKSSSK", 8: "....KsKSSSSKSSSKSSSK", 9: ".....KSSSSSSSSsSSSSK", 10: ".....KSSSSSWWWWWSSSK", 11: ".....KSSSWWWKKWWWSSK", 12: "......KSSWWWWWWWSSK", 13: ".......KKSWWWWWSKK", 14: "..........KASSAK",
      14: "..........KSSSSK", 15: "........KKAASSAAKK", 16: "......KSSSSaGAAAAGaK", 17: "......KSSSSaAAAAAAaK", 18: "......KsSSSalAAAAAaK", 19: "......KsSSalAAAAAAaK", 20: "......KsSaAlAAAaaAaK", 21: "......KsaAAlAAAaAaaK", 22: "......KBBBBBBBGBBBBK", 23: "......KPMMMlAAAAmmaK", 24: "......KPahAlAAAAmAmK", 25: "......KPahAlAaaAmAmK", 26: "......KPahAlAAAAAAaK", 27: "......KPaAAlAAAAAAaK",
  }[i] || f)),
  /* Delantal de herrero: peto angosto en el pecho que se abre en la cintura y cubre todo el estómago (se amarra atrás), hasta las rodillas.
     En tres cuartos: el frente corrido hacia el rival, el costado de cerca más oscuro donde da la vuelta.
     Cinturón rojo con hebilla y herramientas colgando: un martillo pequeño a la izquierda y tenazas a la derecha. */
  falda: { 28: "......KPaAAlAAAAAAaK", 29: "......KPaAAlAAAAAAaK", 30: "......KPaAAlAAaAAAaK", 31: "........KalAAAAAAAaK", 32: "........KalAAAAAAAaK", 33: "........KaaaaaaaaaaK", 34: "........KKKKKKKKKKKK" },
  hombro: [18, 18],
  /* El codo acompaña el giro del martillo, siempre del mismo lado y con el brazo casi estirado. */
  codoDinamico: (p) => { const a = anguloJuly(p); return a === null ? null : [18 + Math.round(Math.cos(a - 0.3) * 3.8), 18 + Math.round(Math.sin(a - 0.3) * 3.8)]; },
  manoDinamica: (p) => { const a = anguloJuly(p); return a === null ? p.mano : [18 + Math.round(Math.cos(a) * 7), 18 + Math.round(Math.sin(a) * 7)]; },
  brazoAtras: (p) => { const a = anguloJuly(p); if (a === null) return false; const d = ((a * 180) / Math.PI) % 360; return d > 140 && d < 305; },   // por detrás de la cabeza hasta que empieza a caer
  arma: (px, p) => { const a = anguloJuly(p); if (a === null) HD_JULY.arma(px, p); else martilloJuly(px, p.mano[0], p.mano[1], Math.cos(a), Math.sin(a)); },
  choque: [47, 26],
  manos: { guardia: [21, 24], impulso: [7, 20], golpe: [26, 21], choque: [27, 23], sigue: [25, 24], sube: [22, 15], alto: [25, 10] },
};
HD_JANET34.cuerpo = HD_JANET34.cuerpo.map((f, i) => (i === 26 ? "......KggggggggggK" : i === 27 ? "......KKKKKKKKKKKK" : f));
HEROES_34.push([HD_JANET, HD_JANET34], [HD_JULY, HD_JULY34]);

/* Edith en tres cuartos: los dos ojos, la nariz entre ellos, los labios debajo, sin mechones junto a la mejilla.
   La hombrera de cráneo pasa al hombro del lado del rival. */
const HD_EDITH34 = { ...HD_EDITH, brazoGrueso: 2, brazoCerca: { hombro: [9, 19] },
  cuerpo: HD_EDITH.cuerpo.map((f, i) => ({
    6: ".....KhHHHhHHKSSSSSSK", 7: "....KHHhHHHHKSSSSSSSK", 9: "....KHHhHHHKSSKSSSKSK", 10: "...KhHHhHHKSSSKSSSKSK",
    11: "...KHHhHHHKsSSSSsSSSK", 12: "...KhHHhHHKsSSSLLSSK",
  }[i] || f)),
  hombro: [17, 19],
  manos: { guardia: [21, 23], impulso: [19, 19], golpe: [23, 18], choque: [23, 18], sigue: [22, 20], sube: [22, 16], alto: [24, 13] },
  /* Hombreras de hueso: dos puntas blancas curvas en cada hombro (reemplazan al cráneo). El grimorio no cambia. */
  arma: (px, p) => {
    HD_EDITH.arma((a, b, c) => { if (!(a >= 10 && a <= 16 && b >= 14 && b <= 20)) px(a, b, c); }, p);   // sin el cráneo
    [[9, 18, -1], [17, 18, 1]].forEach(([sx, sy, d]) => {
      const pts = [];
      for (let i = -1; i <= 1; i++) pts.push([sx + i, sy, "#3A3A48"]);   // base oscura de la hombrera
      [[0, -1], [0, -2], [d, -3]].forEach(([x, y]) => pts.push([sx - d + x, sy + y, y === -1 ? "#C9BFA6" : "#F4EEDC"]));
      [[0, -1], [d, -2], [2 * d, -3]].forEach(([x, y]) => pts.push([sx + d + x, sy + y, y === -1 ? "#C9BFA6" : "#F4EEDC"]));
      hdContorno(px, pts);
    });
  },
};

/* Uzu en tres cuartos: cara de goblin simétrica corrida 1 px hacia el rival (como Agattita y Cupe),
   sin el brazo de atrás en la grilla: ahora se dibuja como el otro. */
/* Hachazo de Uzu: de arriba hacia abajo, sin vuelta completa. Sube el hacha por delante al saltar,
   la lleva detrás de la cabeza y la baja con fuerza hacia adelante; el codo acompaña el movimiento. */
const hachaUzu = (px, hx, hy, d) => {
    const L = Math.hypot(d[0], d[1]), ux = d[0] / L, uy = d[1] / L, nx = -uy, ny = ux, pts = [];
    const at = (i, k, col) => pts.push([Math.round(hx + 1 + ux * i + nx * k), Math.round(hy + uy * i + ny * k), col]);
    for (let i = -3; i <= 12; i++) for (let k = 0; k < 2; k++) at(i, k, k ? "#B8B2A2" : "#E8E4D8");
    [-3, 12].forEach((i) => { at(i, -1, "#E8E4D8"); at(i, 2, "#B8B2A2"); });
    for (let i = 6; i <= 13; i++) { const ancho = 6 - Math.round(Math.abs(i - 9.5) * 1.1); for (let k = 2; k <= 2 + ancho; k++) at(i, k, k === 2 + ancho ? "#9AA3B0" : (i + k) % 3 ? "#3E4048" : "#2A2C33"); }
    hdContorno(px, pts);
  };
const anguloUzu = (p) => {
  if (!["impulso", "golpe", "choque", "sigue"].includes(p.fase)) return null;
  const T = p.t % 2400, K = [[500, 80], [640, -20], [760, -110], [830, -60], [900, 30], [1000, 50], [1150, 55], [1400, 80]];
  for (let n = 1; n < K.length; n++) if (T <= K[n][0]) { const [t0, a0] = K[n - 1], [t1, a1] = K[n]; return ((a0 + (a1 - a0) * Math.max(0, (T - t0) / (t1 - t0))) * Math.PI) / 180; }
  return (80 * Math.PI) / 180;
};
const HD_UZU34 = { ...HD_UZU, brazoGrueso: 2, brazoCerca: { hombro: [11, 22] },
  manos: { ...HD_UZU.manos, guardia: [22, 28] },   // la mano justo bajo el hombro: el hacha pesa
  /* Codo en cada fase: apenas flectado en guardia; sube alto al tomar impulso y baja con el hachazo. */
  codos: { guardia: [23, 25], impulso: [23, 16], golpe: [25, 18], choque: [25, 20], sigue: [24, 22], sube: [24, 20], alto: [23, 17] },
  pierna: { ...HD_UZU.pierna, ancho: 3 },   // piernas más delgadas
  /* Asoman solo unos dedos sobre el mango: se ve que lo agarra sin tapar el hacha. */
  arma: (px, p) => {
    const a = anguloUzu(p);
    if (a === null) HD_UZU.arma(px, p); else hachaUzu(px, p.mano[0], p.mano[1], [Math.cos(a), Math.sin(a)]);
    const [hx, hy] = p.mano;   // asoman solo unos dedos sobre el mango
    hdContorno(px, [[hx - 1, hy, HD_UZU.pal.G], [hx - 1, hy + 1, HD_UZU.pal.g], [hx, hy + 1, HD_UZU.pal.g]]);
  },
  manoDinamica: (p) => { const a = anguloUzu(p); return a === null ? p.mano : [21 + Math.round(Math.cos(a) * 6), 22 + Math.round(Math.sin(a) * 6)]; },
  codoDinamico: (p) => { const a = anguloUzu(p); if (a === null) return null; const d = p.fase === "impulso" ? 0.35 : -0.35; return [21 + Math.round(Math.cos(a + d) * 3.4), 22 + Math.round(Math.sin(a + d) * 3.4)]; },
  brazoAtras: (p) => { const a = anguloUzu(p); return a !== null && (a * 180) / Math.PI < -70; },   // detrás de la cabeza en lo alto
  cuerpo: HD_UZU.cuerpo.map((f, i) => (i >= 8 && i <= 20 ? "." + f : i >= 21 && i <= 26 ? "..........K" + f.slice(11) : i === 27 ? "..........." + f.slice(11) : f)),
  pelo: [ { 12: "..KK" + ".".repeat(26) + "KK" }, { 12: ".KK" + ".".repeat(28) + "KK" } ],   // puntas de las orejas a la misma distancia
};

/* Xitin en tres cuartos: los dos ojos, la pintura de guerra bajo el ojo de cerca, la nariz entre los ojos,
   la oreja de elfo atrás en el pelo y sin pómulo. El oso no cambia. */
const HD_XITIN34 = { ...HD_XITIN, brazoGrueso: 2, brazoCerca: { hombro: [8, 18] },
  cuerpo: HD_XITIN.cuerpo.map((f, i) => ({
    6: ".....KHhHHHHHHHKSSSSK", 7: ".....KHhHHHHHKSSSSSSK", 8: "....KHhHHHHHKSSSSSSSK", 9: "....KHhHHHHKSSKSSSKSK", 10: "...KSKhHHHHKSSKSSSKSK", 11: "....KHhHHHHKRSSSSsSSK", 12: "....KKHhHHKsRSSSSSSK", 13: "....KHhHHKsSSSSppSK", 14: "....KHhHHHKssSSSSK",
  }[i] || f)),
  hombro: [16, 18], caderas: [[9, 28], [14, 28]], pies: [[9, 39], [15, 39]],   // piernas centradas bajo el torso
  codos: { guardia: [17, 22] },   // codo abajo en guardia, como el brazo de cerca
  manos: { ...HD_XITIN.manos, guardia: [20, 24], sube: [22, 16], alto: [25, 11] },
};
HD_XITIN34.forma = (p) => (["impulso", "golpe", "choque", "sigue"].includes(p.fase) ? OSO34 : null);
HD_XITIN34.arma = (px, p) => {
  const [sx, sy] = HD_XITIN34.brazoCerca.hombro, [[ox, oy]] = { sube: [[-5, -2]], alto: [[-6, -9]] }[p.fase] || [[-1, 7]];
  manaXitin(px, HD_XITIN34.hombro[0], HD_XITIN34.hombro[1], p.mano[0], p.mano[1], p.t);   // mano derecha
  manaXitin(px, sx, sy, sx + ox, sy + oy, p.t + 300);                                       // mano izquierda
};

/* Oso de Xitin en tres cuartos: de pie, los dos ojos, el hocico hacia el rival y el pecho claro.
   Ataca con las dos garras: las levanta a los lados de la cabeza y las baja juntas hacia adelante. */
const OSO34 = {
  id: "oso", pal: { B: "#6B4426", b: "#4A2E18", M: "#A57A4E", W: "#F2EEE0", R: "#5A1E2A", P: "#C9707A" },
  cuerpo: [
    "..........KK.......KK",
    ".........KBbK.....KbBK",
    ".........KbBKKKKKKKBbK",
    "........KBBBBBBBBBBBBBK",
    ".......KBBBBBBBBBBBBBBBK",
    ".......KBBBBKBBBBBKBBBBK",
    "......KBBBBBKBBBBBKBBBBK",
    "......KBBBBBBBMMMMMMBBBK",
    "......KBBBBBBMMMKKMMMBBK",
    "......KBBBBBBMMKWRWKMMBK",
    ".......KBBBBBMKRRPRRKMBK",
    ".......KBBBBBBMKKKKKMBK",
    "........KBBBBBBMMMMMBK",
    "......KKBBBBBBBBBBBBBBKK",
    ".....KBBBBBBBBBBBBBBBBBBK",
    "....KBBBBBBBBBBBBBBBBBBBBK",
    "....KBbBBBBBBBMMMMMBBBBBBK",
    "....KBbBBBBBBMMMMMMMBBBBBK",
    "....KBbBBBBBBMMMMMMMBBBBBK",
    "....KBbBBBBBBMMMMMMMBBBBBK",
    "....KBbBBBBBMMMMMMMMMBBBBK",
    "....KBbBBBBBMMMMMMMMMBBBBK",
    "....KBbBBBBBMMMMMMMMMBBBBK",
    "....KBbBBBBBMMMMMMMMMBBBBK",
    "....KBbBBBBBMMMMMMMMMBBBBK",
    "....KBbBBBBBBMMMMMMMBBBBBK",
    "....KBbBBBBBBMMMMMMMBBBBBK",
    "....KBbBBBBBBMMMMMMMBBBBBK",
    "....KBbBBBBBBBMMMMMBBBBBBK",
    "....KBBbBBBBBBBBBBBBBBBBBK",
    ".....KBbBBBBBBBBBBBBBBBBK",
    ".....KBBbBBBBBBBBBBBBBBBK",
    "......KBBBBBBBBBBBBBBBBK",
    "......KBBBBBBBKKBBBBBBBK",
    "......KBBBBBBK..KBBBBBBK",
    "......KBBBBBBK..KBBBBBBK",
    "......KBBBBBMBK.KBBBBBMBK",
    "......KBBBBBMBK.KBBBBBMBK",
    ".......KBBBBBK...KBBBBBK",
    ".......KBbBBBK...KBbBBBK",
    ".......KBBBBBK...KBBBBBK",
    "......KBBBBBBBK.KBBBBBBBK",
    "......KbWbWbWbK.KbWbWbWbK",
    "......KKKKKKKKK.KKKKKKKKK",
  ],
  sinPiernas: true, brazoGrueso: 5, caderas: [[0, 0], [0, 0]], pies: [[0, 0], [0, 0]],
  brazo: { luz: "#8A5E38", base: "#6B4426", sombra: "#4A2E18", mano: "#4A2E18", manoLuz: "#6B4426" },
  hombro: [22, 11],
  manos: { impulso: [26, -3], golpe: [29, 14], choque: [31, 20], sigue: [28, 24], guardia: [26, 14] },
  brazoCerca: { hombro: [7, 11], poses: { impulso: [[-4, -13], [-5, -6]], golpe: [[13, 1], [5, 5]], choque: [[17, 7], [7, 8]], sigue: [[15, 11], [6, 9]] } },
  /* Garras blancas en las dos zarpas. */
  arma: (px, p) => {
    const cerca = OSO34.brazoCerca.poses[p.fase] || [[0, 0]], manos = [p.mano, [7 + cerca[0][0], 11 + cerca[0][1]]];
    manos.forEach(([hx, hy]) => [-1, 1, 3].forEach((d) => { px(hx + 3, hy + d, "#F2EEE0"); px(hx + 4, hy + d + 1, "#F2EEE0"); }));
  },
};
OSO34.top = 40 - OSO34.cuerpo.length;

/* Maná que nace de la palma de cada mano, siguiendo la dirección de la mano. */
const manaXitin = (px, sx, sy, hx, hy, t) => {
  const L = Math.hypot(hx - sx, hy - sy) || 1, cx = hx + ((hx - sx) / L) * 2.5, cy = hy + ((hy - sy) / L) * 2.5, late = 2.3 + Math.sin(t / 220) * 0.8;
  for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.hypot(dx, dy); if (d <= late) px(Math.round(cx + dx), Math.round(cy + dy), d < 1.2 ? "#DCFCE7" : d < late - 1 ? "rgba(74,222,128,.75)" : "rgba(74,222,128,.35)"); }
  const sube = Math.floor(t / 120) % 6;
  px(Math.round(cx), Math.round(cy) - 4 - sube, "#86EFAC"); if (sube > 2) px(Math.round(cx) - 2, Math.round(cy) - 2 - sube, "#4ADE80");
};
HEROES_34.push([HD_EDITH, HD_EDITH34], [HD_UZU, HD_UZU34], [HD_XITIN, HD_XITIN34]);

/* Tonos de piel intercambiados entre Jelic y Patroclus (pedido de la profe). */
{
  const piel = (pal) => ({ z: pal.z, S: pal.S, s: pal.s });
  const deJelic = piel(HD_JELIC.pal), dePatroclus = piel(HD_PATROCLUS.pal);
  Object.assign(HD_JELIC.pal, dePatroclus);
  Object.assign(HD_PATROCLUS.pal, deJelic);
  HD_PATROCLUS.brazo.mano = deJelic.S; HD_PATROCLUS.brazo.manoLuz = deJelic.z;
}

/* ===== Propuestas de paleta (solo para comparar, imagen fija) ===== */
const conPaleta = (c, pal, extra = {}) => ({ ...c, pal: { ...c.pal, ...pal }, ...extra });
const HEROES_PALETA = [
  ["Patroclus", HD_PATROCLUS34, conPaleta(HD_PATROCLUS34, { L: "#8A5A36", l: "#6A4026", T: "#4A5A78", G: "#3F8F4A", g: "#2A6A34" },
    { pierna: { ...HD_PATROCLUS34.pierna, luz: "#6A7A98", base: "#4A5A78", sombra: "#33405A" } }),
   "Chaleco de cuero más cálido, pantalón azul grisáceo y pañoleta verde scout."],
  ["Janet", HD_JANET34, conPaleta(HD_JANET34, { G: "#5FA83E", g: "#3E7A2A", L: "#C2622E", l: "#8E3E1C" },
    { brazo: { ...HD_JANET34.brazo, luz: "#7FC25A", base: "#5FA83E", sombra: "#3E7A2A" },
      pierna: { ...HD_JANET34.pierna, luz: "#8A6446", base: "#6B4A30", sombra: "#4A3020", bota: "#3A2418", botaSombra: "#24160E" } }),
   "Armadura verde hoja con hojas de otoño en el pecho y pantalón café."],
  ["Uzu", HD_UZU34, conPaleta(HD_UZU34, { B: "#5E636E", b: "#8A909C" },
    { pierna: { ...HD_UZU34.pierna, luz: "#8A6438", base: "#6B4A2A", sombra: "#4A321C" } }),
   "Pantalón de cuero café y casco de fierro; la piel verde y los ojos rojos quedan igual."],
  ["Xitin", HD_XITIN34, conPaleta(HD_XITIN34, { F: "#8E8A86", f: "#5E5A58", L: "#4A2C1A", l: "#2E1A0E", R: "#14B8A6", O: "#2DD4BF" }),
   "Piel de lobo gris, cuero oscuro y acentos turquesa que conectan con su maná."],
  ["Kenny (opcional)", HD_KENNY34, conPaleta(HD_KENNY34, { J: "#7A2E3A", j: "#561E28" },
    { brazo: { ...HD_KENNY34.brazo, luz: "#9A4A56", base: "#7A2E3A", sombra: "#561E28" } }),
   "Chaqueta burdeos para que resalte la capa naranja."],
  ["Tiván (opcional)", HD_TIVAN34, conPaleta(HD_TIVAN34, { O: "#B08A2E", o: "#80621C", P: "#D0AA4A" }),
   "Abrigo mostaza de alquimista para salir del grupo verde."],
];

/* Paletas aprobadas por la profe (2026-10-11): Patroclus, Janet, Uzu, Kenny y Tiván. Xitin se rediseña aparte. */
HEROES_PALETA.filter(([nombre]) => !nombre.startsWith("Xitin")).forEach(([, actual, nueva]) => {
  actual.pal = nueva.pal;
  if (nueva.brazo !== actual.brazo) actual.brazo = nueva.brazo;
  if (nueva.pierna !== actual.pierna) actual.pierna = nueva.pierna;
});
HEROES_PALETA.length = 0;   // ya no hay nada que comparar

/* Xitin rediseñada (propuesta, imagen fija): capucha de piel de oso con orejitas, manto corto de piel en los hombros,
   vestido largo azul petróleo con borde en puntas, faja oscura con ribetes dorados y medallón, guantes largos oscuros. */
const HD_XITIN_NUEVA = { ...HD_XITIN34,
  pal: { ...HD_XITIN34.pal, U: "#7A4E2C", u: "#553418", D: "#2F5F6E", d: "#1E4250", X: "#2A2236", G: "#C9A24B", Y: "#F2CF6B" },
  cuerpo: HD_XITIN34.cuerpo.map((f, i) => ({
    0: ".......KKK....KKK",
    1: "......KUuUK..KUuUK",
    2: "......KUUUKKKKUUUK",
    3: "......KUUUUUUUUUUUK",
    4: ".....KUUuUUUUUUUUUUK",
    5: ".....KUuUUUUUUUUUUUK",
    6: ".....KUuUUUUUHHHHHUK",
    7: ".....KUuUUUUHKSSSSSSK",
    8: "....KUuUUUUHKSSSSSSSK",
    9: "....KUuUUUHKSSKSSSKSK",
    10: "....KUuUUUHKSSKSSSKSK",
    11: "....KUuUUUHKRSSSSsSSK",
    12: "....KUuUUHKsRSSSSSSK",
    13: "....KUuUHKsSSSSppSK",
    14: "....KUuUHHKssSSSSK",
    15: "........KKSSSSSSKK",
    16: "......KKUUUUUUUUUUKK",
    17: "......KUuUUUDDDUUUUK",
    18: "......KuKUKDDDDKUKuK",
    19: "......KDDdDDDDDDDDK",
    20: "......KDdDDDDDDDDDK",
    21: "......KXGXXXXXGXXXK",
    22: "......KXXXXXXXXXXXK",
    23: "......KDdDDDYDDDDDK",
    24: "......KDdDDDGDDDDDK",
    25: ".....KDdDDDDDDDDDDK",
    26: ".....KDdDDDDDDDDDDK",
    27: ".....KDdDDDDDDDDDDK",
  }[i] || f)),
  falda: { 28: "....KDdDDDDDDDDDDDK", 29: "....KDdDDDDDDDDDDDK", 30: "....KDdDDDDDDDDDDDK", 31: "...KDdDDDDDDDDDDDDK", 32: "...KDdDDDDDDDDDDDDK", 33: "...KGGGGKGGGGKGGGGK", 34: "...KDKKDKKDDKKDKKDK", 35: "...KK..KK..KK..KK" },
  /* La trenza platinada sale de la capucha y cae por delante del hombro; la punta se mece. */
  pelo: [ { 15: "........KHK", 16: "........KhK", 17: "........KHK", 18: "........KhK", 19: "........KHK", 20: "........KZK", 21: ".........K" },
          { 15: "........KHK", 16: "........KhK", 17: "........KHK", 18: ".......KhK", 19: ".......KHK", 20: ".......KZK", 21: "........K" } ],
  brazo: { luz: "#5A4E66", base: "#3A3046", sombra: "#2A2236", mano: "#3A3046", manoLuz: "#5A4E66" },
  pierna: { ...HD_XITIN34.pierna, luz: "#3A3046", base: "#2A2236", sombra: "#1A1420", bota: "#2A2230", botaSombra: "#14101A" },
};
HEROES_PALETA.push(["Xitin · capucha de oso", HD_XITIN34, HD_XITIN_NUEVA, "Capucha de piel de oso con orejitas, vestido largo azul petróleo, faja con ribetes dorados y medallón, guantes largos."]);

/* Xitin rediseñada, segunda propuesta (inspirada en la foto de la profe): cola de caballo alta platinada bien visible,
   top negro corto con borde de piel, cinturón café, calzas negras, botas de armadura plateadas, garras plateadas en las manos
   y una hombrera con cabeza de oso en el hombro de cerca, con la piel cayendo por la espalda. */
const hombreraOso = (px, x0, y0) => {
  const pal = { K: HDK, U: "#7A4E2C", u: "#553418", M: "#A57A4E" };
  [".KK.KK.", "KUUKUUK", "KUKUKUK", "KUUMMMK", ".KUUMKK", "..KKKK."].forEach((f, y) => [...f].forEach((k, x) => { if (pal[k]) px(x0 + x, y0 + y, pal[k]); }));
};
const HD_XITIN_NUEVA2 = { ...HD_XITIN34,
  pal: { ...HD_XITIN34.pal, N: "#24212B", n: "#3A3646", F: "#E6E1D6", B: "#6B4426", G: "#C9A24B", P: "#24212B", q: "#3A3646", U: "#7A4E2C", u: "#553418" },
  cuerpo: HD_XITIN34.cuerpo.map((f, i) => ({ 15: ".........KKSSSKK", 16: ".......KSSSSSSSSSK", 17: ".......KSNNNNNNNSK", 18: ".......KNNNNNNNNNK", 19: ".......KNnNNNNNNNK", 20: ".......KFFFFFFFFFK", 21: ".......KSSSSsSSSSK", 22: ".......KSSSSSSsSSK", 23: ".......KBBBBGBBBBK", 24: ".......KPPPPPPPPPK", 25: ".......KPPPPPPPPPK", 26: ".......KPPPPKPPPPK", 27: ".......KPqPPKPPqPK" })[i] || f),
  pelo: null,
  capa: [ { 2: "....KK", 3: "...KHHK", 4: "..KHZHK", 5: "..KHhHK", 6: ".KHhHK", 7: ".KHhHK", 8: "KHhHK", 9: "KHhHK", 10: "KHhK", 11: "KHhK", 12: "KhHK", 13: "KHhK", 14: "KhHK", 15: "KHhK", 16: ".KhHK", 17: ".KHhKUK", 18: ".KhKUuUK", 19: "..KHKuUK", 20: "..KKuUUK", 21: "..KUuUUK", 22: "..KuUuUK", 23: "...KUuK", 24: "...KuUK", 25: "....KK" }, { 2: "....KK", 3: "...KHHK", 4: "..KHZHK", 5: "..KHhHK", 6: ".KHhHK", 7: ".KHhHK", 8: "KHhHK", 9: "KHhHK", 10: "KHhK", 11: "KHhK", 12: "KhHK", 13: "KHhK", 14: "KhHK", 15: "KHhK", 16: "..KhHK", 17: "..KHhKK", 18: "..KhKuUK", 19: "..KKHKK", 20: "..KKKUUK", 21: ".KUuUUK", 22: ".KuUuUK", 23: "..KUuK", 24: "..KuUK", 25: "...KK" }, { 2: "....KK", 3: "...KHHK", 4: "..KHZHK", 5: "..KHhHK", 6: ".KHhHK", 7: ".KHhHK", 8: "KHhHK", 9: "KHhHK", 10: "KHhK", 11: "KHhK", 12: "KhHK", 13: "KHhK", 14: "KhHK", 15: "KHhK", 16: "..KhHK", 17: "..KHhKK", 18: "..KhKuUK", 19: "...KHKUK", 20: "..KKKUUK", 21: "..KUuUUK", 22: "..KuUuUK", 23: "...KUuK", 24: "...KuUK", 25: "....KK" } ],   // cola de caballo larga por delante del manto de piel
  brazo: { luz: "#FFF0E4", base: "#F2D6C4", sombra: "#CFA88F", mano: "#B8C0CC", manoLuz: "#E5E7EB" },
  pierna: { ...HD_XITIN34.pierna, luz: "#3A3646", base: "#24212B", sombra: "#14121A", bota: "#A9B2BF", botaSombra: "#7C8594" },
  arma: (px, p) => { HD_XITIN34.arma(px, p); if (!p.sinHombrera) hombreraOso(px, 5, 15); },   // la pierde solo cuando la flecha de Janet se la lleva (p.sinHombrera)
};
HEROES_PALETA.length = 0;
HEROES_PALETA.push(["Xitin · segunda propuesta", HD_XITIN34, HD_XITIN_NUEVA2, "Cola de caballo alta, top negro corto, calzas negras, botas de armadura, garras plateadas y hombrera con cabeza de oso."]);

/* Xitin aprobada (2026-10-11): la segunda propuesta, con piernas más delgadas, reemplaza a la anterior. */
HD_XITIN_NUEVA2.pierna = { ...HD_XITIN_NUEVA2.pierna, ancho: 3 };
HEROES_34.forEach((par) => { if (par[1] === HD_XITIN34) par[1] = HD_XITIN_NUEVA2; });
HEROES_PALETA.length = 0;

/* Vestidos con vuelo al moverse (Malala, Malía, Edith). */
[HD_MALALA34, HD_MALIA34, HD_EDITH34].forEach((c) => { c.faldaVuelo = true; });

/* Vestidos en campana: en la cintura no cambian; hacia abajo se van ensanchando hasta 2 px más a la derecha
   y 1 px menos a la izquierda en el borde de abajo (pedido de la profe). */
{
  const ajustar = (t, der, izq) => {
    const ini = t.indexOf("K"), fin = t.lastIndexOf("K");
    if (ini < 0 || fin - ini < 4) return t;
    if (der > 0) t = t.slice(0, fin) + t[fin - 1].repeat(der) + t.slice(fin);
    if (izq > 0) t = t.slice(0, ini) + ".".repeat(izq) + "K" + t.slice(ini + izq + 1);
    return t;
  };
  [[HD_MALALA34, [24, 25, 26, 27]], [HD_MALIA34, [23, 24, 25, 26, 27]], [HD_EDITH34, [23, 24, 25, 26, 27]]].forEach(([c, filas]) => {
    const faldaFilas = Object.keys(c.falda).map(Number).sort((a, b) => a - b), todas = [...filas, ...faldaFilas], n = todas.length;
    const paso = (f) => { const k = todas.indexOf(f) + 1; return [Math.round((2 * k) / n), Math.round((1 * k) / n)]; };
    c.cuerpo = c.cuerpo.map((f, i) => (filas.includes(i) ? ajustar(f, ...paso(i)) : f));
    c.falda = Object.fromEntries(faldaFilas.map((k) => [k, ajustar(c.falda[k], ...paso(k))]));
  });
}

/* Edith: el rayo principal se ramifica en rayos más finos que parpadean. */
HD_EDITH34.proyectil = (g, x, y, p) => {
  HD_EDITH.proyectil(g, x, y, p);
  if (p.fase !== "golpe" && p.fase !== "choque") return;
  const prog = p.fase === "golpe" ? p.k : 1, x0 = x + HD_OX + 30, y0 = y + HD_OY + 12, x1 = x0 + 36, y1 = y + HD_OY + 22;
  const parpadeo = Math.floor(p.t / 60);
  const rama = (u, dir, largo, semilla) => {
    if (u > prog) return;
    let bx = Math.round(x0 + (x1 - x0) * u), by = Math.round(y0 + (y1 - y0) * u);
    const pts = [[bx, by]];
    for (let i = 1; i <= 3; i++) { bx += Math.round(largo / 3); by += dir * (2 + ((i + semilla + parpadeo) % 2)); pts.push([bx, by]); }
    [[2, HDK], [1, "#A78BFA"]].forEach(([gr, col]) => { g.fillStyle = col; for (let i = 0; i < pts.length - 1; i++) hdLinea(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], (a, b) => g.fillRect(a - (gr >> 1), b - (gr >> 1), gr, gr)); });
  };
  if (parpadeo % 3 !== 2) { rama(0.3, -1, 7, 0); rama(0.55, 1, 8, 1); rama(0.78, -1, 6, 2); }
  else { rama(0.4, 1, 7, 1); rama(0.68, -1, 8, 0); }
};

/* Agattita: brotes mágicos (inspirados en la imagen de la profe). Una fila de brotes nace del suelo uno tras otro,
   desde ella hasta el rival: tallo verde que brilla, hoja de helecho enrollada arriba y resplandor en la base.
   Junto al rival crece uno grande que se enrosca, y suben chispitas verdes. */
HD_AGATTITA34.proyectil = (g, x, y, p) => {
  if (!["golpe", "choque", "sigue"].includes(p.fase)) return;
  const prog = p.fase === "golpe" ? p.k * 0.85 : p.fase === "choque" ? 0.85 + p.k * 0.15 : 1;
  const suelo = y + HD_OY + 39, N = 5;
  const px = (a, b, c) => { g.fillStyle = c; g.fillRect(Math.round(a), Math.round(b), 1, 1); };
  const brote = (bx, alto, lado, grande) => {
    // resplandor en la base
    for (let dx = -3; dx <= 3; dx++) { g.fillStyle = Math.abs(dx) < 2 ? "rgba(134,239,172,.55)" : "rgba(134,239,172,.25)"; g.fillRect(bx + dx, suelo - 1, 1, 2); }
    // tallo con contorno, un poco curvo
    const pts = [];
    for (let i = 0; i < alto; i++) pts.push([bx + Math.round(Math.sin(i / 4) * lado), suelo - 1 - i]);
    pts.forEach(([a, b]) => { g.fillStyle = HDK; g.fillRect(a - 1, b, 3, 1); });
    pts.forEach(([a, b], i) => { px(a, b, i % 3 ? "#4ADE80" : "#22C55E"); if (grande) px(a + 1, b, "#16A34A"); });
    const [tx, ty] = pts[pts.length - 1] || [bx, suelo];
    // hoja de helecho enrollada en la punta
    const curl = grande ? [[1, -1], [2, -1], [3, 0], [3, 1], [2, 2], [1, 1], [2, 0]] : [[1, -1], [2, 0], [1, 1]];
    curl.forEach(([a, b]) => { g.fillStyle = HDK; g.fillRect(tx + a * lado - 1, ty + b - 1, 3, 3); });
    curl.forEach(([a, b]) => px(tx + a * lado, ty + b, "#86EFAC"));
    // hojitas a los lados
    if (alto > 4) [[-2, Math.floor(alto / 2)], [2, Math.floor(alto / 3)]].forEach(([a, h]) => { const [sx, sy] = pts[h]; px(sx + a, sy, "#22C55E"); px(sx + a / 2, sy, "#4ADE80"); });
    px(tx, ty, "#DCFCE7");
  };
  for (let i = 0; i < N; i++) {
    const inicio = i / N; if (prog <= inicio) break;
    const crece = Math.min(1, (prog - inicio) * N * 1.4), grande = i === N - 1;
    const bx = Math.round(x + HD_OX + 30 + i * 8), alto = Math.round((grande ? 19 : 8 + (i % 2) * 4) * crece);
    if (alto > 0) brote(bx, alto, i % 2 ? 1 : -1, grande);
  }
  // chispitas que suben
  for (let i = 0; i < 7; i++) { const sx = x + HD_OX + 30 + ((i * 13) % 40), sy = suelo - 3 - ((p.t / 40 + i * 7) % 18); if (sx < x + HD_OX + 30 + prog * 40) px(sx, sy, i % 2 ? "#86EFAC" : "#DCFCE7"); }
};
HD_AGATTITA34.choque = [70, 22];

/* Carga antes de atacar: un resplandor que crece y chispas que se juntan hacia el punto de poder. */
const hdCarga = (px, cx, cy, k, luz, base, t) => {
  const r = 1.5 + k * 4;
  for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
    const d = Math.hypot(dx, dy);
    if (d <= r) px(cx + dx, cy + dy, d < r * 0.4 ? "#FFFFFF" : d < r * 0.75 ? luz : base);
  }
  for (let i = 0; i < 5; i++) {
    const ang = i * 1.256 + t / 180, dist = 3 + (1 - k) * 9;
    px(Math.round(cx + Math.cos(ang) * dist), Math.round(cy + Math.sin(ang) * dist), luz);
  }
};

/* Edith: el grimorio se carga de energía morada antes del rayo. */
{
  const armaEdith = HD_EDITH34.arma;
  HD_EDITH34.arma = (px, p) => {
    armaEdith(px, p);
    if (p.fase === "impulso") hdCarga(px, 28, 10 + Math.round(Math.sin(p.t / 300) * 1.5), p.k, "#C4B5FD", "rgba(124,58,237,.45)", p.t);
  };
}

/* Agattita: en la punta del bastón crece una esfera verde antes de que broten las plantas. */
{
  const armaAgattita = HD_AGATTITA34.arma;
  HD_AGATTITA34.arma = (px, p) => {
    armaAgattita(px, p);
    if (p.fase === "impulso") hdCarga(px, p.mano[0] + 4, p.mano[1] - 16, p.k, "#86EFAC", "rgba(34,197,94,.45)", p.t);
  };
}

/* Xitin: primero carga el maná en las dos manos (todavía humana) y recién después hace ¡puf! y se vuelve oso. */
{
  const armaXitin = HD_XITIN_NUEVA2.arma, proyXitin = HD_XITIN_NUEVA2.proyectil;
  HD_XITIN_NUEVA2.forma = (p) => (["golpe", "choque", "sigue"].includes(p.fase) ? OSO34 : null);
  HD_XITIN_NUEVA2.arma = (px, p) => {
    armaXitin(px, p);
    if (p.fase === "impulso") {
      const [sx, sy] = HD_XITIN_NUEVA2.brazoCerca.hombro;
      hdCarga(px, p.mano[0] + 2, p.mano[1] + 1, p.k, "#86EFAC", "rgba(74,222,128,.45)", p.t);
      hdCarga(px, sx - 1, sy + 9, p.k, "#86EFAC", "rgba(74,222,128,.45)", p.t + 200);
    }
  };
  HD_XITIN_NUEVA2.proyectil = (g, x, y, p) => {
    // ¡puf! al final de la carga y al empezar el ataque; el resto (zarpazo, volver) igual que antes
    if (p.fase === "impulso") { if (p.k > 0.55) proyXitin(g, x, y, { ...p, k: ((p.k - 0.55) / 0.45) * 0.4 }); return; }
    if (p.fase === "golpe" && p.k < 0.4) proyXitin(g, x, y, { ...p, fase: "impulso", k: 0.4 + p.k * 0.5 });
    proyXitin(g, x, y, p);
  };
}

/* July: al pegar, el martillo gigante levanta una lluvia de chispas que saltan y caen. */
HD_JULY34.proyectil = (g, x, y, p) => {
  if (p.fase !== "choque" && !(p.fase === "golpe" && p.k > 0.85)) return;
  const a = anguloJuly(p); if (a === null) return;
  const baja = (p.bob || 0) + (p.agacha || 0), inc = p.inclina || 0;
  const hx = 18 + Math.round(Math.cos(a) * 7), hy = 18 + Math.round(Math.sin(a) * 7);
  const cx = x + HD_OX + inc + hx + 1 + Math.cos(a) * 12, cy = y + HD_OY + baja + hy + Math.sin(a) * 12;
  const k = p.fase === "choque" ? p.k : 0;
  if (k < 0.25) {   // destello al contacto
    const r = 5 - k * 12; g.fillStyle = "#FFFFFF"; g.fillRect(Math.round(cx - r), Math.round(cy), Math.round(2 * r + 1), 1); g.fillRect(Math.round(cx), Math.round(cy - r), 1, Math.round(2 * r + 1));
    g.fillStyle = "#FDE68A"; g.fillRect(Math.round(cx - 1), Math.round(cy - 1), 3, 3);
  }
  const cols = ["#FFFFFF", "#FDE68A", "#FBBF24", "#F97316"];
  for (let i = 0; i < 28; i++) {
    const ang = -Math.PI * 1.05 + (i / 27) * Math.PI * 1.1 + ((i * 37) % 10 - 5) / 25, vel = 12 + ((i * 53) % 13);
    const sx = cx + Math.cos(ang) * vel * (0.35 + k * 1.1), sy = cy + Math.sin(ang) * vel * (0.35 + k * 1.1) + k * k * 14;
    if (k > 0.75 && i % 3 === 0) continue;   // algunas se apagan antes
    g.fillStyle = cols[(i + Math.floor(k * 4)) % 4];
    g.fillRect(Math.round(sx), Math.round(sy), i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
  }
};

/* Latte: naipes cargados de energía magenta, como Gambito. Brillan y chisporrotean al tomar impulso,
   vuelan encendidos con estela y estallan en chispas rosadas al llegar. */
{
  const armaLatte = HD_LATTE34.arma, proyLatte = HD_LATTE34.proyectil;
  const brillo = (px, cx, cy, r, t, fuerza) => {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r - 2; dx <= r + 2; dx++) {
      const d = Math.hypot(dx / 1.3, dy); if (d > r) continue;
      px(cx + dx, cy + dy, d < r * 0.5 ? `rgba(253,224,240,${0.35 + fuerza * 0.3})` : `rgba(244,114,182,${0.2 + fuerza * 0.25})`);
    }
    for (let i = 0; i < 6; i++) { const ang = i * 1.05 + t / 70, dd = r + 1 + ((i + Math.floor(t / 60)) % 2); px(Math.round(cx + Math.cos(ang) * dd * 1.3), Math.round(cy + Math.sin(ang) * dd), i % 2 ? "#F9A8D4" : "#FFFFFF"); }
  };
  HD_LATTE34.arma = (px, p) => {
    if (p.fase === "impulso") brillo(px, p.mano[0] + 1, p.mano[1] - 6, 4 + Math.round(p.k * 2), p.t, p.k);   // detrás de los naipes
    armaLatte(px, p);
    if (p.fase === "impulso" || p.fase === "guardia") {
      const k = p.fase === "impulso" ? p.k : 0.15 + 0.1 * Math.sin(p.t / 200);   // en guardia, un brillo suave constante
      for (let y = -9; y <= -3; y++) for (let x = -4; x <= 7; x++) if ((x + y + Math.floor(p.t / 90)) % 7 === 0) px(p.mano[0] + x, p.mano[1] + y, `rgba(249,168,212,${0.4 + k * 0.5})`);
    }
  };
  HD_LATTE34.proyectil = (g, x, y, p) => {
    if (p.fase !== "golpe" && p.fase !== "choque") return;
    const avance = p.fase === "golpe" ? p.k : 1;
    [[0, -1], [-6, 3]].forEach(([atras, dy], i) => {
      const cx = Math.round(x + HD_OX + 30 + atras + avance * 18), cy = y + HD_OY + 18 + dy;
      for (let s = 1; s <= 4; s++) { g.fillStyle = `rgba(244,114,182,${0.5 - s * 0.1})`; g.fillRect(cx - s * 3, cy + 1, 3, 2); }   // estela
      g.fillStyle = "rgba(244,114,182,.5)"; g.fillRect(cx - 2, cy - 2, 10, 8); g.fillStyle = "rgba(253,224,240,.45)"; g.fillRect(cx - 1, cy - 1, 8, 6);   // halo
      if (p.fase === "choque" && i === 0) {   // estallido rosado
        const r = 2 + p.k * 7;
        for (let n = 0; n < 12; n++) { const a = n * 0.524; g.fillStyle = n % 2 ? "#F9A8D4" : "#FFFFFF"; g.fillRect(Math.round(cx + 3 + Math.cos(a) * r), Math.round(cy + 2 + Math.sin(a) * r), 1, 1); }
        if (p.k < 0.4) { g.fillStyle = "#FDF4FF"; g.fillRect(cx + 1, cy, 5, 4); }
      }
    });
    proyLatte(g, x, y, p);
  };
}

/* Malala: el hechizo de la escoba es una estela de estrellitas verde agua que avanza ondulando
   y estalla en estrellas y humo verde al llegar. */
const estrellita = (g, cx, cy, r, c) => { g.fillStyle = c; g.fillRect(cx - r, cy, 2 * r + 1, 1); g.fillRect(cx, cy - r, 1, 2 * r + 1); g.fillStyle = "#FFFFFF"; g.fillRect(cx, cy, 1, 1); };
HD_MALALA34.proyectil = (g, x, y, p) => {
  if (p.fase !== "golpe" && p.fase !== "choque") return;
  const x0 = x + HD_OX + 32, y0 = y + HD_OY + 20, pos = (k) => [Math.round(x0 + k * 38), Math.round(y0 + Math.sin(k * Math.PI * 3) * 3)];
  if (p.fase === "golpe") {
    for (let j = 5; j >= 1; j--) { const k = p.k - j * 0.07; if (k < 0) continue; const [cx, cy] = pos(k); estrellita(g, cx, cy, j > 3 ? 0 : 1, j % 2 ? "#5EEAD4" : "#A7F3D0"); }
    const [cx, cy] = pos(p.k);
    g.fillStyle = "rgba(94,234,212,.4)"; g.fillRect(cx - 3, cy - 3, 7, 7);
    estrellita(g, cx, cy, 3, "#99F6E4");
  } else {
    const [cx, cy] = pos(1), r = 2 + p.k * 9;
    g.fillStyle = `rgba(74,222,128,${0.45 - p.k * 0.35})`;
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) if (Math.hypot(dx, dy) < 3 + p.k * 4) g.fillRect(cx + dx, cy + dy - Math.round(p.k * 3), 1, 1);
    for (let n = 0; n < 8; n++) { const a = n * 0.785 + 0.3; estrellita(g, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), n % 2 ? 1 : 0, n % 2 ? "#5EEAD4" : "#FDE68A"); }
  }
};
HD_MALALA34.choque = [72, 20];

/* Al ganar Malala, el rival no se desarma: se convierte en sapo (vista previa; se integra en la escena de Kachai). */
const sapoMalala = (g, x0, y0, t) => {
  const pal = { K: HDK, G: "#4ADE80", g: "#16A34A", Y: "#FDE68A", W: "#FFFFFF", P: "#F472B6" };
  const parpadea = Math.floor(t / 150) % 18 === 0;
  [".KK...KK.", "KWWK.KWWK", parpadea ? "KKKKGKKKK" : "KWKGGGKWK", "KGGGGGGGGK", "KGGPPPPGGK", "KgGGGGGGgK", "KgGYYYYGgK", ".KgKKKKgK.", "KgK....KgK"].forEach((f, y) => [...f].forEach((k, x) => { if (pal[k]) { g.fillStyle = pal[k]; g.fillRect(x0 + x, y0 + y, 1, 1); } }));
};

/* Latte al ganar: lanza sus naipes hacia arriba y estallan como fuegos artificiales. */
{
  const armaL = HD_LATTE34.arma, proyL = HD_LATTE34.proyectil;
  HD_LATTE34.arma = (px, p) => { if (p.fase === "sube" || p.fase === "alto") return; armaL(px, p); };   // los naipes ya van por el aire
  HD_LATTE34.proyectil = (g, x, y, p) => {
    if (p.fase !== "sube" && p.fase !== "alto") return proyL(g, x, y, p);
    const T = p.t % 2600, hx = x + HD_OX + 25, hy = y + HD_OY + 11;
    const naipes = [[0, 2, "#F472B6"], [9, -1, "#FBBF24"], [17, 1, "#FFFFFF"]];
    naipes.forEach(([dx, dy, col], i) => {
      const sale = 450 + i * 90, estalla = sale + 380;
      if (T < sale) return;
      const ex = hx + dx, ey = y + 3 + dy;
      if (T < estalla) {   // el naipe sube girando
        const k = (T - sale) / (estalla - sale), cx = Math.round(hx + dx * k), cy = Math.round(hy + (ey - hy) * k), gira = Math.floor(T / 70) % 2;
        g.fillStyle = HDK; g.fillRect(cx - 2, cy - 2, gira ? 6 : 4, gira ? 4 : 6);
        g.fillStyle = "#F8F5EE"; g.fillRect(cx - 1, cy - 1, gira ? 4 : 2, gira ? 2 : 4);
        g.fillStyle = "rgba(244,114,182,.6)"; g.fillRect(cx - 1, cy + 3, 2, 3);   // estela rosada
        return;
      }
      const k = Math.min(1, (T - estalla) / 900);   // el estallido se abre y las chispas caen
      if (k >= 1) return;
      for (let n = 0; n < 14; n++) {
        const a = (n / 14) * Math.PI * 2, r = 2 + k * 11;
        const sx = Math.round(ex + Math.cos(a) * r), sy = Math.round(ey + Math.sin(a) * r + k * k * 6);
        g.fillStyle = k > 0.7 && n % 2 ? "rgba(255,255,255,.5)" : n % 3 === 0 ? "#FFFFFF" : col;
        g.fillRect(sx, sy, 1, 1);
        if (k < 0.5) { g.fillStyle = col; g.fillRect(Math.round(ex + Math.cos(a) * r * 0.6), Math.round(ey + Math.sin(a) * r * 0.6), 1, 1); }
      }
      if (k < 0.15) { g.fillStyle = "#FFFFFF"; g.fillRect(ex - 1, ey - 1, 3, 3); }
    });
  };
}

/* Al ganar Janet: su flecha atraviesa el arma del rival y la deja clavada en el borde derecho de la pantalla
   (vista previa; se integra en la escena de victoria de Kachai). */
const flechaJanet = (g, x0, y0, largo) => {
  g.fillStyle = HDK; g.fillRect(x0 - 1, y0 - 1, largo + 3, 3);
  g.fillStyle = "#B07A44"; g.fillRect(x0 + 2, y0, largo - 4, 1);
  g.fillStyle = "#4ADE80"; g.fillRect(x0, y0 - 1, 2, 3);
  g.fillStyle = "#D9DEE6"; g.fillRect(x0 + largo - 2, y0 - 1, 1, 3); g.fillRect(x0 + largo - 1, y0, 1, 1);
};

/* Al ganar Jelic: el rival queda mareado con pajaritos y estrellitas girando sobre la cabeza (para la escena de Kachai). */
const pajaritos = (g, cx, cy, t) => {   // modo groggy: estrellas amarillas girando sobre la cabeza
  const forma = [[0, -2], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [1, 1], [-2, 2], [2, 2]];   // estrella de cinco puntas
  for (let i = 0; i < 4; i++) {
    const a = t / 260 + (i * Math.PI) / 2, x = Math.round(cx + Math.cos(a) * 8), y = Math.round(cy + Math.sin(a) * 2.5);
    const chica = Math.sin(a) < 0;   // las de atrás se ven un poco más chicas
    const pts = chica ? [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]] : forma;
    pts.forEach(([dx, dy]) => { g.fillStyle = HDK; g.fillRect(x + dx - 1, y + dy - 1, 3, 3); });
    pts.forEach(([dx, dy]) => { g.fillStyle = dx === 0 && dy === 0 ? "#FFFFFF" : "#FDE047"; g.fillRect(x + dx, y + dy, 1, 1); });
  }
};

/* Al ganar Agattita: el rival queda atrapado por enredaderas y le brota una flor de la cabeza (para la escena de Kachai).
   cx: centro del rival; arriba/abajo: alto del cuerpo envuelto; prog 0..1 cuánto subieron las enredaderas. */
const enredaRival = (g, cx, arriba, abajo, prog) => {
  const alto = Math.round((abajo - arriba) * prog);
  for (let v = 0; v < 2; v++) {
    const pts = [];
    for (let i = 0; i <= alto; i++) pts.push([Math.round(cx + Math.sin(i / 3.2 + v * Math.PI) * 9), abajo - i]);
    pts.forEach(([xx, yy]) => { g.fillStyle = "#14532D"; g.fillRect(xx - 1, yy - 1, 4, 3); });
    pts.forEach(([xx, yy], i) => { g.fillStyle = i % 4 ? "#22C55E" : "#4ADE80"; g.fillRect(xx, yy, 2, 1); });
    pts.forEach(([xx, yy], i) => { if (i % 6 === 3) { const lx = xx + (v ? -3 : 3); g.fillStyle = "#14532D"; g.fillRect(lx - 1, yy - 2, 4, 3); g.fillStyle = "#86EFAC"; g.fillRect(lx, yy - 1, 2, 1); } });   // hojitas
  }
};
/* Flor rosada con centro amarillo que brota de la cabeza, con su tallito. */
const florCabeza = (g, x, y) => {
  g.fillStyle = "#14532D"; g.fillRect(x - 1, y + 3, 3, 5); g.fillStyle = "#22C55E"; g.fillRect(x, y + 3, 1, 5); g.fillRect(x + 1, y + 5, 2, 1);
  const petalos = [[0, -3], [-3, 0], [3, 0], [0, 3], [-2, -2], [2, -2], [-2, 2], [2, 2]];
  petalos.forEach(([a, b]) => { g.fillStyle = HDK; g.fillRect(x + a - 1, y + b - 1, 3, 3); });
  petalos.forEach(([a, b], n) => { g.fillStyle = n < 4 ? "#F472B6" : "#F9A8D4"; g.fillRect(x + a, y + b, 1, 1); g.fillRect(x + Math.round(a / 2), y + Math.round(b / 2), 1, 1); });
  g.fillStyle = "#FDE047"; g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = "#FEF9C3"; g.fillRect(x, y - 1, 1, 1);
};

/* Agattita al ganar: brotan flores de colores a su alrededor, una tras otra, y se mecen. */
{
  const proyA = HD_AGATTITA34.proyectil;
  const COLORES = [["#F472B6", "#FBCFE8"], ["#FDE047", "#FEF9C3"], ["#A78BFA", "#DDD6FE"], ["#FB923C", "#FED7AA"], ["#60A5FA", "#BFDBFE"], ["#F87171", "#FECACA"], ["#FFFFFF", "#E5E7EB"]];
  const SITIOS = [[-3, 7], [3, 5], [9, 3], [27, 4], [33, 6], [39, 8], [45, 5]];   // x respecto del cuerpo, alto del tallo
  HD_AGATTITA34.proyectil = (g, x, y, p) => {
    if (p.fase !== "sube" && p.fase !== "alto") return proyA(g, x, y, p);
    const T = p.t % 2600, suelo = y + HD_OY + 39;
    (p.enPodio ? [[1, 6], [6, 4], [24, 4], [29, 6]] : SITIOS).forEach(([sx, alto], i) => {
      const k = Math.min(1, Math.max(0, (T - 400 - i * 90) / 320)); if (k <= 0) return;
      const mece = Math.round(Math.sin(p.t / 300 + i) * (k >= 1 ? 1 : 0));
      const bx = x + HD_OX + sx, h = Math.max(1, Math.round(alto * k)), tx = bx + mece, ty = suelo - 1 - h;
      for (let n = 0; n < h; n++) { g.fillStyle = "#14532D"; g.fillRect(bx - 1 + (n === h - 1 ? mece : 0), suelo - 1 - n, 3, 1); }
      for (let n = 0; n < h; n++) { g.fillStyle = "#22C55E"; g.fillRect(bx + (n === h - 1 ? mece : 0), suelo - 1 - n, 1, 1); }
      if (h > 3) { g.fillStyle = "#4ADE80"; g.fillRect(bx + (i % 2 ? 1 : -2), suelo - 3, 2, 1); }   // hojita
      if (k < 0.5) return;   // primero el tallo, después se abre la flor
      const [c1, c2] = COLORES[i % COLORES.length], abre = k < 0.8 ? 1 : 2;
      const pet = abre === 1 ? [[0, -1], [-1, 0], [1, 0], [0, 1]] : [[0, -2], [-2, 0], [2, 0], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1]];
      pet.forEach(([a, b]) => { g.fillStyle = HDK; g.fillRect(tx + a - 1, ty + b - 1, 3, 3); });
      pet.forEach(([a, b], n) => { g.fillStyle = n < 4 ? c1 : c2; g.fillRect(tx + a, ty + b, 1, 1); if (abre === 2 && n < 4) g.fillRect(tx + a / 2, ty + b / 2, 1, 1); });
      g.fillStyle = i % 2 ? "#FDE047" : "#FFFFFF"; g.fillRect(tx, ty, 1, 1);
    });
  };
}

/* Uchis al ganar: lanza las dos dagas al aire, giran y caen clavadas de punta en el suelo, una a cada lado. */
{
  const armaU = HD_UCHIS34.arma, proyU = HD_UCHIS34.proyectil;
  const clavada = (g, x, suelo) => {   // daga vertical con la punta enterrada
    const pts = [[0, -9, "#6E4424"], [0, -8, "#6E4424"], [-1, -7, "#C9A24B"], [0, -7, "#C9A24B"], [1, -7, "#C9A24B"], [0, -6, "#FFFFFF"], [0, -5, "#D9DEE6"], [0, -4, "#D9DEE6"], [0, -3, "#D9DEE6"], [0, -2, "#9AA3B0"], [1, -6, "#9AA3B0"], [1, -5, "#9AA3B0"], [1, -4, "#9AA3B0"]];
    const llenos = new Set(pts.map(([a, b]) => a + "," + b));
    g.fillStyle = HDK; pts.forEach(([a, b]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { if (!llenos.has(a + dx + "," + (b + dy)) && b + dy < 0) g.fillRect(x + a + dx, suelo + b + dy, 1, 1); }));
    pts.forEach(([a, b, c]) => { g.fillStyle = c; g.fillRect(x + a, suelo + b, 1, 1); });
    g.fillStyle = "rgba(60,40,20,.5)"; g.fillRect(x - 1, suelo - 1, 3, 1);   // tierra removida
  };
  HD_UCHIS34.arma = (px, p) => { if ((p.fase === "sube" || p.fase === "alto") && p.t % 2600 >= 450) return; armaU(px, p); };
  HD_UCHIS34.proyectil = (g, x, y, p) => {
    if (p.fase !== "sube" && p.fase !== "alto") return proyU(g, x, y, p);
    const T = p.t % 2600, suelo = y + HD_OY + 39 + 1;
    [[x + HD_OX + 3, y + HD_OY + 9, x + HD_OX + (p.enPodio ? 1 : -5)], [x + HD_OX + 25, y + HD_OY + 11, x + HD_OX + (p.enPodio ? 29 : 35)]].forEach(([sx, sy, ex], i) => {
      const sale = 450 + i * 60, cae = sale + 750;
      if (T < sale) return;
      if (T >= cae) { clavada(g, ex, suelo); return; }
      const k = (T - sale) / (cae - sale), cx = Math.round(sx + (ex - sx) * k), cy = Math.round(sy + (suelo - 6 - sy) * k - Math.sin(Math.PI * k) * 22);
      if (k > 0.85) { clavada(g, cx, Math.round(cy + 6)); return; }   // al final cae ya de punta
      dagaVuelo(g, cx - 3, cy, Math.floor(T / 70) % 2 === 1);
    });
  };
}

/* Agattita al celebrar: la punta del bastón brilla y suelta chispitas que caen hacia las flores (de ahí brotan). */
{
  const armaA = HD_AGATTITA34.arma;
  HD_AGATTITA34.arma = (px, p) => {
    armaA(px, p);
    if (p.fase !== "sube" && p.fase !== "alto") return;
    const cx = p.mano[0] + 4, cy = p.mano[1] - 16, pulso = 0.6 + 0.4 * Math.sin(p.t / 150);
    hdCarga(px, cx, cy, pulso, "#86EFAC", "rgba(74,222,128,.45)", p.t);
    for (let i = 0; i < 6; i++) {   // chispitas que bajan del bastón hacia el suelo, a los dos lados
      const k = ((p.t / 900 + i / 6) % 1), lado = i % 2 ? 1 : -1;
      px(Math.round(cx + lado * (4 + k * 18) * (0.5 + (i % 3) * 0.25)), Math.round(cy + k * 34), i % 3 ? "#86EFAC" : "#FFFFFF");
    }
  };
}

/* Edith al celebrar: flota en el aire y el grimorio lanza rayitos y chispas por todas partes. */
HD_EDITH34.ajustePose = (p) => {
  if (p.fase !== "sube" && p.fase !== "alto") return p;
  const sube = p.fase === "sube" ? 3 : 6;
  return { ...p, agacha: 0, bob: -sube - Math.round(Math.sin(p.t / 300) * 1.5) };
};
{
  const proyE = HD_EDITH34.proyectil;
  HD_EDITH34.proyectil = (g, x, y, p) => {
    if (p.fase !== "sube" && p.fase !== "alto") return proyE(g, x, y, p);
    const bx = x + HD_OX + 28, by = y + HD_OY + (p.fase === "alto" ? 4 : 13) + (p.bob || 0) + (p.agacha || 0), f = Math.floor(p.t / 90);   // desde donde está el libro
    for (let i = 0; i < 6; i++) {   // rayitos en zigzag hacia todos lados, cambian cada pocos cuadros
      if ((i + f) % 3 === 0) continue;
      const ang = -2.8 + i * 0.55 + ((f % 5) - 2) * 0.08, largo = 9 + ((i * 7 + f) % 6);   // solo hacia arriba y a los lados, lejos de su cara
      let px0 = bx, py0 = by;
      for (let s = 1; s <= 3; s++) {
        const px1 = Math.round(bx + Math.cos(ang) * largo * s / 3 + ((s + i + f) % 2 ? 2 : -2) * Math.sin(ang)), py1 = Math.round(by + Math.sin(ang) * largo * s / 3 - ((s + i + f) % 2 ? 2 : -2) * Math.cos(ang));
        [[2, "#7C3AED"], [1, "#F5F3FF"]].forEach(([gr, col]) => { g.fillStyle = col; hdLinea(px0, py0, px1, py1, (a, b) => g.fillRect(a - (gr >> 1), b - (gr >> 1), gr, gr)); });
        px0 = px1; py0 = py1;
      }
    }
    for (let i = 0; i < 10; i++) {   // chispas de celebración por doquier
      const sx = x + 4 + ((i * 23 + f * 3) % 70), sy = y + 2 + ((i * 17 + f * 2) % 40);
      g.fillStyle = i % 3 === 0 ? "#FFFFFF" : i % 3 === 1 ? "#C4B5FD" : "#F0ABFC";
      g.fillRect(sx, sy, 1, 1); if (i % 4 === 0) { g.fillRect(sx - 1, sy, 3, 1); g.fillRect(sx, sy - 1, 1, 3); }
    }
  };
}

/* Jelic: la capa pegada a la espalda (el torso en tres cuartos empieza más a la derecha que el de perfil). */
HD_JELIC34.capa = HD_JELIC.capa.map((fr) => Object.fromEntries(Object.entries(fr).map(([k, v]) => [k, ".." + v])));

/* Jelic: brazos de armadura un poco más gruesos, con hombreras proporcionadas. */
HD_JELIC34.brazoGrueso = 3;

/* Agattita: agarra el bastón con la mano encima del palo y más cerca del cuerpo (como Malala con la escoba). */
HD_AGATTITA34.manoEncima = true;
HD_AGATTITA34.manos = { guardia: [24, 25], impulso: [24, 18], golpe: [24, 9], choque: [24, 8], sigue: [24, 10], sube: [24, 14], alto: [24, 6] };

/* Uzu en tres cuartos de verdad: oreja de cerca grande y la de atrás más chica, ojo de atrás angosto,
   nariz de goblin asomando hacia el rival y la sonrisa de dientes corrida hacia ese lado. */
HD_UZU34.cuerpo = HD_UZU34.cuerpo.map((f, i) => ({ 10: "...........KBBBBBBBBBK", 11: "..........KBBbBBBBBBBBK", 12: "..KK....KBBbBBBBBBBBBBBK...KK", 13: ".KGgKK..KBBBBBBBBBBBBBBK..KGgK", 14: ".KGGgGKKGGGGGGGGGGGGGGGKKGGgK", 15: "..KGGgGKGGGRRKGGGGRKGGGKKGgK", 16: "...KKGgKGGGRRKGGGGRKGGGGK", 17: ".....KKKGGGGGGGGGGgGGGGGK", 18: "........KGGKWKWKWKWKWKGK", 19: ".........KGGGKKKKKKKKGGK", 20: "..........KKGGGGGGGGKK" }[i] || f));
HD_UZU34.pelo = [ { 12: "..KK" + ".".repeat(23) + "KK" }, { 12: ".KK" + ".".repeat(25) + "KK" } ];   // las dos orejas se mecen; la de atrás más delgada   // la oreja de atrás también se mece, más corta

/* Uzu: púas centradas sobre la cúpula redondeada del casco. */
HD_UZU34.cuerpo = HD_UZU34.cuerpo.map((f, i) => (i === 8 ? ".............K..K..K" : i === 9 ? "............KMKKMKKMK" : f));

/* Personaje en tres cuartos por id. */
const HD_POR_ID = Object.fromEntries(HEROES_34.map(([base, tc]) => [base.id, tc]));
const HD_BASE_POR_ID = Object.fromEntries(HEROES_34.map(([base]) => [base.id, base]));
export { HDK, HD_OX, HD_OY, hdDibujar, hdPose, hdLinea, hdContorno, HD_POR_ID, HD_BASE_POR_ID, hombreraOso, sapoMalala, flechaJanet, pajaritos, enredaRival, florCabeza, estrellita }
