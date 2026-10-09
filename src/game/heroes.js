/* ============================================================================
   PERSONAJES DE KACHAI (pixel art estilo SNES)
   ----------------------------------------------------------------------------
   Diez personajes que cada alumno elige al entrar. Aparecen en su celular en los
   duelos del ranking y en el podio. Todo se dibuja en canvas desde estas
   grillas: no hay imágenes que descargar.

   Reglas de la profesora (9-oct-2026):
     · nada de violencia: ganar es DESARMAR. El arma del rival vuela y queda
       clavada atrás; el rival se queda de pie con la mano arriba.
     · en el podio, quien gana celebra y el resto aplaude.
   Diseñados uno a uno con ella en https://claude.ai/artifact/WamiieSm4U8CyJ1dktJWC4
   ========================================================================== */
/* ======================= PERSONAJES =======================
   Cada uno: 24 × 30, mirando a la derecha. K = contorno. El brazo de adelante
   y el arma se dibujan aparte, según la pose. */
const K = "#1A1020";
const T = [
{ id: "latte", nombre: "Latte", clase: "Trickster", desc: "Chistera de mago con un naipe en la cinta, chaqueta color café con leche y una baraja que nunca se le acaba. Lanza los naipes de dos en dos.", frase: "Catch me if you can!",
  arma: "naipes", brazo: "J", mano: "R",
  guardia: { mano: [15, 21], dir: [0, -1] },
  pal: { T: "#24212C", t: "#3E3A4C", Y: "#C0263A", H: "#2A1F1C", h: "#4A3A34", C: "#2F4A3A", c: "#1C2E24", V: "#5C8A68", Q: "#24392D", q: "#15231B", S: "#D9A27A", s: "#A8714C", X: "#45393F", W: "#F4F1E8",
         J: "#B9804A", j: "#85562E", L: "#EAD7B7", B: "#4A2E22", G: "#D4AF4F", P: "#3B4660", b: "#2A2230", R: "#3E6E78" },
  grid: [
  "......KKKKKKK...........",
  "......KTtTTTK...........",
  "......KTtTTTK...........",
  "......KTtTWYK...........",
  "......KYYYWWK...........",
  "...KKKKTTTTTKKKK........",
  "..KTTTTTTTTTTTTTK.......",
  "...KHHHHHHHHHHHK........",
  "..KHHhHHKSSSSSSK........",
  "..KHhHHKSSSSSKWSK.......",
  "..KHhHKSSSSSSKKSK.......",
  "...KhHKXSSSSSSSSK.......",
  "...KKHKXXSSSXXXK........",
  "....KKKKXXXXXXK.........",
  "...KKKKKLLKKKK..........",
  ".KQQKKKLLLLLJK..........",
  "KQQqKJJJLLLJJJK.........",
  "KQqQKJJJJLJJJJJK........",
  "KQqQKjJBJLJJJJJK........",
  "KQqQKjJJBJJJJJJK........",
  "KQqQKjBBBGBBBBBK........",
  "KQqQKKjJJJJJBJJK........",
  "KQqQKjJJJJjKJJjK........",
  "KQqQKjjjjjK.KjjK........",
  "KqQQKKPPPK..KPPK........",
  ".KqQQKPPPK..KPPK........",
  ".KqqqKbbbK..KbbK........",
  "..KKKKbbbK..KbbbK.......",
  "....KbbbbbK.KbbbbK......",
  ".....KKKKK...KKKKK......"] },

{ id: "agattita", nombre: "Agattita", clase: "Druida", desc: "Gata atigrada de ojos enormes. Levanta su bastón en espiral y del suelo brotan enredaderas con espinas.", frase: "Purr-fect answer!",
  arma: "baculo", espiral: true, raices: true, poses: { ataque: { mano: [16, 14], dir: [0, -1] } }, brazo: "A", mano: "W", orbe: "#4ADE80",
  pal: { F: "#8C7B6A", f: "#4F4236", Z: "#B5A592", W: "#F6F0E6", w: "#D9CDBB", I: "#E7A9A0", N: "#E39A86",
         O: "#D8DEE8", M: "#34D399", G: "#2F6B45", H: "#1E4A2F", A: "#8FA6AE", a: "#62777F", B: "#7A4A2A", b: "#55331C", T: "#2F6B45" },
  grid: [
  "....KK.........KK.......",
  "....KIK.......KIFK......",
  "....KIFK.....KFIFK......",
  "...KFIfFKKKKKFfIFK......",
  "...KFFFOOOOOOOFFFK......",
  "..KFfFFFFOMOFFFFfFK.....",
  "..KFFfFFfFFFfFFfFFK.....",
  ".KFZFFfFFFfFFFfFFFFK....",
  ".KFZFFFFFFFFFFFFFFFK....",
  ".KFZFFFKKFFFFKKFFFFK....",
  "KFFZFFFKWFFFFKWFFFFFK...",
  "KFZFFFFKKFFFFKKFFFFFK...",
  "KFZFfFWWWWNNWWWWFfFK....",
  ".KFFFWWWWKWWKWWWFFK.....",
  "..KFFFWWWWWWWWWFFK......",
  "KK.KKFFWWWWWWFFKK.......",
  "KFK.KGGGGGGGGGGK........",
  "KfK.KGHGGGMGGGHGK.......",
  "KFKKAKHGGGGGGGHGK.......",
  "KfKAAKKWWWWWWKKK........",
  "KFKaAKFWwWWwWFK.........",
  "KfFKaKFFWWWWWFK.........",
  ".KFfKKBBBBBBBBBK........",
  "..KFKTBbBBBBBBbBK.......",
  "...KKTTTTWWWWTTTTK......",
  "....KTTFWWWWFTTK........",
  ".....KFFWWWFFFK.........",
  ".....KFfK..KfFK.........",
  "....KWWWWK.KWWWWK.......",
  ".....KKKK...KKKK........"] },

{ id: "malala", nombre: "Malala", clase: "Bruja", desc: "Pelo oscuro, sombrero gigante con borlas y vestido cuadrillé verde y blanco, como el delantal de las tías del jardín. Nadie le ha visto los ojos.", frase: "Hands up, everybody!",
  arma: "baculo", escoba: true, brazo: "V", mano: "S", orbe: "#A7F3D0",
  pal: { H: "#1F4D3A", h: "#12301F", Y: "#D9A13B", L: "#3A2A30", l: "#5E4A56", S: "#F4D3BE", s: "#D4A58C", D: "#1F4D3A",
         C: "#E9E2CF", c: "#C4B999", E: "#14B8A6", V: "#5FB383", b: "#1A1020",
         Q: (x, y) => { const i = (x >> 1) & 1, j = (y >> 1) & 1; return i && j ? "#2E8B57" : i || j ? "#86CFA0" : "#F4F8F2"; } },
  grid: [
  "...................KK...",
  "..............KKKKHHK...",
  ".............KHHHHKK....",
  "............KHHhK.......",
  "...........KHHhK........",
  "..........KHHHhK........",
  ".........KHHHHhK........",
  "........KHHYYYYK........",
  "...KKKKKHHHHHHHHKKKKK...",
  "..KhhhhhhhhhhhhhhhhhhK..",
  "...KYKKYKKYKKYKKYKKYK...",
  "...Y.KLLLLLLLLLLK.Y..Y..",
  "....KLLLlLLLLLLLLK......",
  "....KLLlLLLLLLLLLK......",
  "....KLlLLLlLLlLLLK......",
  "....KLlLKSSSSSSSK.......",
  "....KLlLKSSSKKSK........",
  "....KLLKKDDDDDKK........",
  "...KCKYYYYYYYYYK........",
  "..KCCKYYYYYYYYYK........",
  "..KCCCKYYYEYYYK.........",
  "..KCcCKQQQQQQQK.........",
  "..KCcCKQQQQQQQQK........",
  ".KCCcKYDYDYDYDYK........",
  ".KCcCKQQQQQQQQQQK.......",
  "KCCcKQQQQQQQQQQQK.......",
  "KCcCKQQQQQQQQQQQQK......",
  "KccKQQQQQQQQQQQQQK......",
  ".KKKKKbbKKKKKbbKKK......",
  ".....KKK.....KKK........"] },

{ id: "malia", nombre: "Malía", clase: "Chef", desc: "Elfa de moño blanco y delantal impecable. Pelea con un cucharón gigante de madera y nunca se le quema nada.", frase: "Dinner is served!",
  arma: "cucharon", brazo: "B", mano: "S",
  pal: { H: "#E8EAF0", h: "#AEB5C6", W: "#F2F0EA", w: "#CFCBC0", B: "#CDB898", b: "#A8946F", S: "#EBB2A6", s: "#C7867A",
         N: "#24212B", n: "#3A3644", D: "#8A5A2A", Y: "#C9A24B", E: "#2F6B45" },
  grid: [
  "........................",
  "......KKKK..............",
  ".....KHHHHK.............",
  ".....KHhHHK.............",
  "....KKWKWKWKK...........",
  "...KWWWWWWWWWK..........",
  "...KHHHHHHHHHHK.........",
  "..KHHhHHHHHHHHHK........",
  "..KHhHHHHHHHHHHK........",
  "KKKHhHHKSSSSSHHK........",
  "KSSKhHKSSSSSSSHK........",
  ".KSSKHKSSSSSKESK........",
  "..KSSKKSSSSSKKSK........",
  "...KKHKsSSSSSSSK........",
  "....KHKsSSSSKKSK........",
  ".....KKKssSSSSK.........",
  "......KBBKKKKK..........",
  "....KBBBWWWWWBK.........",
  "...KBBbKWWWWWWBK........",
  "...KBBbKWWwWWWBK........",
  "...KBbBKWWWWWWWBK.......",
  "....KKKDDDDDDDDDK.......",
  "....KNKWWDDDDDWWK.......",
  "....KNKWWWWWWWWWK.......",
  "...KNNKWWWwWWWWWWK......",
  "...KNNKWWWWWWWWWWK......",
  "..KNNNKWWWWWwWWWWWK.....",
  "..KNNNNKWWWWWWWWWNK.....",
  ".KNYNNNNYNNNNYNNNNNK....",
  "..KKKKKKKKKKKKKKKKK....."] },

{ id: "kenny", nombre: "Kenny", clase: "Bardo", desc: "Pelo largo amarrado en una cola, barba, lentes de sol y bufanda turquesa. Toca el laúd tan fuerte que sus notas musicales desarman a cualquiera.", frase: "Sing it with me!",
  arma: "laud", brazo: "J", mano: "S",
  poses: { guardia: { mano: [12, 22], dir: [0, -1] }, ataque: { mano: [12, 21], dir: [0, -1] }, alzada: { mano: [19, 15], dir: [0, -1] } },
  pal: { F: "#22222E", W: "#FFFFFF", Q: "#7DD3FC", H: "#3B2618", h: "#22150C", S: "#D6A27C", s: "#AE7655", D: "#6B4426", T: "#1C8C85", t: "#12645F", C: "#C0622B", c: "#8A421B",
         J: "#7A4E2C", G: "#5E8F4E", B: "#4A2E22", Y: "#C9A24B", P: "#6B4A30", b: "#3A2418" },
  grid: [
  "........................",
  "......KKKKKK............",
  "....KKHHHHHHKK..........",
  "...KHHhHHHHHHHK.........",
  "..KHHhHHHHHHHHHK........",
  "..KHhHHHHHHHHHHHK.......",
  ".KHHhHHHKKSSSHHHK.......",
  ".KHhHHHKSSSSSSSHK.......",
  "KYKhHHKSSSSSSSSSK.......",
  "KHKKHKSFFFFFWFFK........",
  "KhK.KKSSSSSFFQFK........",
  ".KhK.KsSSSSSSSSK........",
  "..KhKKDDSSSSSSDK........",
  "...KKDDDDDKKDDK.........",
  "....KDDDDDDDDK..........",
  "....KKDDDDDDK...........",
  "..KKCCTTTTTTTK..........",
  ".KCCTTTTtTTTTTK.........",
  ".KCCKTTTTTTTTTK.........",
  "KCCcKJJJJGGJJJK.........",
  "KCcCKJJJGGGJJJK.........",
  "KCcCKBBBBBYBBBK.........",
  "KCcCKJJGGGGGJJK.........",
  "KCcCKJJGGGGGJJK.........",
  "KCcCKKPPPK.KPPK.........",
  "KccCCKPPPK.KPPK.........",
  ".KccKKbbbK.KbbK.........",
  "..KK.KbbbK.KbbbK........",
  "....KbbbbbK.KbbbbK......",
  ".....KKKKK...KKKKK......"] },

{ id: "tivan", nombre: "Tiván", clase: "Alquimista", desc: "Pelo canoso alborotado, antiparras de bronce en la frente, lentes de lectura, cuello alto, abrigo largo y una bandolera llena de frascos. Lanza pociones que estallan en humo verde.", frase: "Don't drink that!",
  arma: "pocion", brazo: "W", mano: "U",
  pal: { H: "#C4C8D2", h: "#868C9C", E: "#5A3A22", Q: "#9BD8F0", S: "#C99470", s: "#9E6B4B", O: "#6E6A3A", o: "#4C4826", W: "#EEF0F2", B: "#5A3A22",
         V: "#4ADE80", Z: "#E6F6FF", F: "#15121A", D: "#4A2E22", G: "#C9A24B", U: "#7A5232", P: "#5A3A28", b: "#221A20" },
  grid: [
  "...K...K...K............",
  "..KHK.KHK.KHK...........",
  ".KHhHKHhHKHhHK..........",
  "KHhHHHHHHHHHHHK.........",
  ".KHhHHHHHHHHHHHK........",
  "KHhHHHHKKKKKKKKKK.......",
  ".KhHEEEKGQGKGQGKK.......",
  "..KhHHHKKKKKKKKKK.......",
  "..KHhHHHKSSSSSSSHK......",
  ".KKHhHHKsFFFFFFFK.......",
  "..KKhHHKsSSSFZZFK.......",
  "...KKhKsSSSSFFFFK.......",
  "....KKKsSSSSSKKSK.......",
  "....KOOKssSSSSSK........",
  "...KOOOOKKssKKOK........",
  "...KOOoOOKWWKOOOK.......",
  "..KOOoOBVBVBVBOOK.......",
  "..KOoOOOBBBBBBOOOK......",
  "..KOoOOOOOOOOOOOOK......",
  "..KOoOKDDDDGDDDDK.......",
  "..KOoOKUUOOOUUOOK.......",
  "..KOoOKOOOKPPKOOOK......",
  "..KOoOKOOKPPPPKOOK......",
  ".KOOoOKOOKPPPKOOOK......",
  ".KOoOOKOOKPPKKOOOOK.....",
  "KOOoOKOOOKPPKKOOOOK.....",
  "KOoOKOOOOKbbKKOOOOOK....",
  "KoooKKKKKKbbKKKoooOK....",
  "....KbbGbbK.KbbGbbK.....",
  ".....KKKKK...KKKKK......"] },

{ id: "patroclus", nombre: "Patroclus", clase: "Scout", desc: "Moreno, pelo corto negro y un collar con piedra turquesa. La capucha verde con borde de piel le cae sobre los hombros. Camina con un bordón de madera con una cabeza de lobo tallada y el banderín de su patrulla.", frase: "Always be prepared!",
  arma: "totem", brazo: "W", mano: "S",
  pal: { G: "#3F6B3A", g: "#2A4A27", H: "#1A1518", h: "#3A3036", S: "#9A6440", s: "#74472B", N: "#F4E9C8", Z: "#2DD4BF", F: "#E9E4DA", f: "#BDB5A6", L: "#6E5134", l: "#4E3824",
         W: "#E7E2D6", B: "#3A2418", Y: "#C9A24B", T: "#4F4A33", b: "#3A2A1E" },
  grid: [
  "........................",
  "........................",
  "........................",
  ".......KKKKKKK..........",
  ".....KKHHHHHHHKK........",
  "....KHHHHHHHHHHHK.......",
  "....KHhHHHHHHHHHK.......",
  "...KHhHHHHHHHHHHK.......",
  "...KHhHHHHSSSSSSK.......",
  "...KHhHHKSSSSSSSK.......",
  "...KHHHKSSSSSSKSK.......",
  "...KKSKSSSSSSSKSK.......",
  "....KSSKsSSSSSSSK.......",
  "....KKsKsSSSSSKKK.......",
  ".KGGGGGKKssSSK..........",
  "KGGgGFFFNSSSNK..........",
  "KFfFFFKLKNZNKLK.........",
  "KGFfFKLLLKZKLLLK........",
  "KGgFKLLLLlLLLLLK........",
  "KGgGKLLLLLLLlLLK........",
  "KGgGKBBBBYBBBBBK........",
  "KGgGKLLLLLLLLLLK........",
  "KGgGKTTTTTKTTTTK........",
  "KGgGKTTTTK.KTTTK........",
  "KggGKTTTK..KTTTK........",
  ".KgGKTTTK..KTTTK........",
  ".KggKFFFK..KFFFK........",
  "..KKKbbbK..KbbbK........",
  "....KbbbbbK.KbbbbbK.....",
  ".....KKKKK...KKKKK......"] },

{ id: "uchis", nombre: "Uchis", clase: "Pícara", desc: "Pelo castaño largo, diadema dorada y capa roja sobre una túnica con rombos turquesa y dorados. Lanza cuchillas antes de que termines de leer la pregunta.", frase: "Too slow!",
  arma: "cuchillas", brazo: "C", mano: "U",
  guardia: { mano: [15, 21], dir: [0.3, -0.95] },
  pal: { H: "#7A4A2C", h: "#4E2E1A", S: "#F6DCCB", s: "#D7B09C", L: "#D9667A", G: "#E0B040", E: "#3B82F6",
         R: "#D8402E", r: "#9E2A1E", C: "#F2E8D0", T: "#2F8F8A", Y: "#E0B040", B: "#8A5A30", U: "#9A6A3A", P: "#5A3426", b: "#A0503A" },
  grid: [
  "........................",
  "........KKKKK...........",
  "......KKHHHHHKK.........",
  ".....KHHhHHHHHHK........",
  "....KHhHHHHHHHHHK.......",
  "...KHhHHHHHHHHHHHK......",
  "...KHhHHHHHHGGEGGK......",
  "..KHhHHHHHKKHHHHHK......",
  "..KHhHHHHKSSSSSHHK......",
  "..KHhHHHKSSSSSSSHK......",
  ".KHhHHHKSSSSSKKSK.......",
  ".KHhHHKSSSSSSKSSK.......",
  ".KHhHHKsSSSSSSSK........",
  ".KHhHHKsSSSSLSK.........",
  ".KHhHHHKssSSSK..........",
  ".KHhHHHHKRRKKK..........",
  ".KHhKRRRRCCCCK..........",
  ".KHhKRRCCCTTCCK.........",
  ".KHhKRrCCCTYTCCK........",
  "..KhKRrCCTYTYTCK........",
  "...KKRrKBBBBBBBK........",
  "...KRRrCCTYTYTCCK.......",
  "..KRRrCCCTTYTTCCK.......",
  "..KRrrKCCTTTTTCCK.......",
  "..KRrRKKPPKKPPKK........",
  "...KrRKPPPK.KPPK........",
  "...KKKKPPK..KPPK........",
  ".....KbbbK..KbbbK.......",
  "....KbbbbbK.KbbbbbK.....",
  ".....KKKKK...KKKKK......"] },

{ id: "janet", nombre: "Janet", clase: "Elfo", desc: "Pelo largo castaño claro, barba y armadura de escamas como hojas. Dispara flechas desde lejos y casi nunca falla.", frase: "Right on target!",
  arma: "arco", brazo: "L", mano: "S",
  pal: { H: "#C9A577", h: "#9A7A50", S: "#F0D2BC", s: "#CFA88F", D: "#8A6640", W: "#EDEAE0", Q: "#6B4430", G: "#6B7A3A", g: "#4C5728",
         L: "#3F5A3A", l: "#2C4029", B: "#3A2418", Y: "#C9A24B", T: "#4A4A3A", M: "#A9B2BF", m: "#7C8594" },
  grid: [
  "........................",
  "........KKKKK...........",
  "......KKHHHHHKK.........",
  ".....KHHhHHHHHHK........",
  "....KHhHHHHHHHHHK.......",
  "...KHhHHHHHHHHHHHK......",
  "...KHhHHHHHHHHHHHK......",
  "..KHhHHHHHHKKHHHHK......",
  "KKKHhHHHHKSSSSSHHK......",
  "KSSKhHHHKSSSSSSSHK......",
  ".KSSKhHKSSSSSKSSK.......",
  "..KKHhHKSSSSSKSSK.......",
  "..KHhHHKDSSSSSSSK.......",
  ".KWKhHHKDDSSSDDK........",
  ".KWKhHHHKDDDDDK.........",
  ".KQKhHHKKKDDKK..........",
  ".KQKhKGGGLLLGGK.........",
  ".KQKKGLlLlLlGGGK........",
  ".KQKGGlLlLlLGGGK........",
  ".KQKGGGLlLlGGGGK........",
  "..KKGGKBBBYBBBBK........",
  "...KGgGGGGGGGGGK........",
  "...KGgGGGGKGGGgK........",
  "....KggggK.KgggK........",
  ".....KTTTK..KTTK........",
  ".....KMMMK..KMMK........",
  ".....KMmMK..KMmK........",
  ".....KMMMK..KMMMK.......",
  "....KMMMMMK.KMMMMK......",
  ".....KKKKK...KKKKK......"] },

{ id: "jelic", nombre: "Jelic", clase: "Paladín", desc: "Armadura completa, penacho rojo y los colores azul y rojo de la U. No usa espada: embiste con su escudo.", frase: "Hold the line!",
  arma: "escudo", brazo: "M", mano: "M",
  guardia: { mano: [16, 20], dir: [0, -1] },
  pal: { R: "#D7263D", r: "#9B1428", M: "#9AA3B2", m: "#646C7C", L: "#D9DEE8", A: "#1E3FAE", a: "#13297A",
         S: "#A8714C", s: "#7E5236", W: "#E5E7EB", B: "#2A2440", O: "#E5E7EB" },
  grid: [
  "....RRRR................",
  "...RRrRRRR..............",
  "..Rr.RRKKKKK............",
  ".Rr..KMMMMMMKK..........",
  ".r..KMMLMMMMMMK.........",
  "...KMMLMMMMMMMMK........",
  "...KMLMMMMMMMMMK........",
  "...KMMMMMKKKKKMMK.......",
  "...KMMMMKSSSSSKMK.......",
  "...KMmMKSSSSKSSKK.......",
  "...KMmMKSSSSKSSK........",
  "...KMmMKSSSWWWSK........",
  "...KMmMKsSSSSSK.........",
  "....KMmMKKssKK..........",
  "...KKKMMMMMMK...........",
  ".KAKMMMLAAAMMMK.........",
  "KAAKMMLAARAAMMMK........",
  "KAaKMMAARRRAAMMK........",
  "KAaKMMAAARAAAMMK........",
  "KAaKMMAAAAAAAMMK........",
  "KAaKKBBBBOBBBBBK........",
  "KAaKKRARARARARK.........",
  "KAaKKARARARARAK.........",
  "KAaK.KMMMK.KMMK.........",
  "KaaK.KMMMK.KMMK.........",
  ".KaK.KMLMK.KMLMK........",
  ".KK..KMMMK.KMMMK........",
  ".....KmmmK.KmmmK........",
  "....KmmmmmKKmmmmmK......",
  ".....KKKKK..KKKKKK......"] },
];

/* ======================= DIBUJO ======================= */
const SW = 44, SH = 40, OX = 4, OY = 8;   // lienzo de cada sprite; el cuerpo empieza en (OX, OY)
const HOMBRO = [10, 18];
const POSE = {                              // mano y dirección del arma, en coordenadas del cuerpo
  guardia: { mano: [14, 22], dir: [0.45, -0.9] },
  ataque:  { mano: [18, 19], dir: [1, -0.04] },
  alzada:  { mano: [16, 14], dir: [0.06, -1] },
  rendido: { mano: [15, 10], dir: null },    // desarmado: manos arriba
  aplauso1: { mano: [18, 16], mano2: [13, 20], dir: null },
  aplauso2: { mano: [16, 18], mano2: [15, 19], dir: null },
};
/* La segunda mano del trickster (sale de la capa, más abajo). */
const MANO2 = { guardia: { mano: [12, 24], dir: [0.92, 0.38] }, ataque: { mano: [16, 25], dir: [1, 0.22] }, alzada: { mano: [12, 24], dir: [0.92, 0.38] } };
const HOMBRO2 = [7, 18];
const LARGO = { micro: 6, cucharon: 15, espada: 15, espadon: 17, sable: 15, daga: 8, hacha: 16, kukri: 9 };
const ACERO = "#DCE3EE";

function line(x0, y0, x1, y1, fn) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
  for (;;) { fn(x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
const norm = ([x, y]) => { const n = Math.hypot(x, y); return [x / n, y / n]; };
const tipoArma = (c) => (c.arma === "kukris" ? "kukri" : c.arma);

/* Punta del arma en la pose de ataque (coordenadas del cuerpo): ahí choca o sale el disparo. */
function punta(c) {
  const { mano: [hx, hy], dir } = POSE.ataque; const [ux, uy] = norm(dir); const a = tipoArma(c);
  if (a in LARGO) return [hx + ux * LARGO[a], hy + uy * LARGO[a]];
  if (a === "baculo") return [hx + 12, hy - 1];
  if (a === "arco") return [hx + 5, hy];
  if (a === "pocion") return [hx + 2, hy - 3];
  if (a === "naipes") return [hx + 3, hy - 2];
  if (a === "laud") return [hx - 1, hy - 3];
  if (a === "escudo") return [hx + 8, hy - 2];
  if (a === "cuchillas") return [hx + 3, hy];
  if (a === "totem") return [hx + 16, hy];
  return [hx + 3, hy + 1];                                    // puño y cohete
}
const DISPARA = { laud: true, cuchillas: true, naipes: true, pocion: true, micro: true, baculo: true, arco: true, cohete: true };
const TIENE_ARMA = (c) => c.arma !== "puno" && c.arma !== "cohete";

/* Dibuja un arma con la mano en (hx, hy) apuntando a (ux, uy). `d` trae los pinceles. */
function arma(d, tipo, c, P, hx, hy, ux, uy, pose) {
  const { px, blk, contorno } = d;
  if (tipo === "laud") {
    if (pose === "rendido") return;
    const cx = 13, cy = 21, MADERA = "#C98A4A", OSCURA = "#7A4A22";
    const caja = (fn) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -5; dx <= 5; dx++) if ((dx / 5.2) ** 2 + (dy / 4.2) ** 2 <= 1) fn(cx + dx, cy + dy, dx, dy); };
    const [n0x, n0y, n1x, n1y] = [cx + 3, cy - 3, cx + 9, cy - 9];
    line(n0x, n0y, n1x, n1y, (x, y) => blk(x - 1, y - 1, 4, 4, K));
    blk(n1x - 1, n1y - 2, 4, 4, K);
    caja((x, y) => contorno(x, y));
    line(n0x, n0y, n1x, n1y, (x, y) => blk(x, y, 2, 2, OSCURA));
    blk(n1x, n1y - 1, 2, 2, "#3A2418"); px(n1x + 1, n1y - 2, "#E5E7EB");
    caja((x, y, dx, dy) => px(x, y, dx + dy < -4 ? "#E2B07A" : (dx / 5.2) ** 2 + (dy / 4.2) ** 2 > 0.7 ? OSCURA : MADERA));
    blk(cx - 1, cy - 1, 2, 2, "#2A1608");
    line(cx - 3, cy + 2, n1x, n1y, (x, y) => { if ((x + y) % 2 === 0) px(x, y, "#F4E7C8"); });
    return;
  }
  if (tipo === "escudo") {
    if (pose === "rendido") return;
    const cx = pose === "ataque" ? hx + 3 : hx + 2, top = pose === "alzada" ? hy - 11 : hy - 8, H = 14;
    const media = (i) => (i < 8 ? 4 : Math.max(0, Math.round(4 * (H - 1 - i) / 6)));
    for (let i = 0; i < H; i++) { const w = media(i); blk(cx - w - 1, top + i - 1, 2 * w + 3, 3, K); }
    for (let i = 0; i < H; i++) { const w = media(i); blk(cx - w, top + i, 2 * w + 1, 1, "#E5E7EB"); if (w > 1 && i > 0 && i < H - 2) blk(cx - w + 1, top + i, 2 * w - 1, 1, "#1E3FAE"); }
    for (let i = 2; i <= 6; i++) { px(cx - 2, top + i, "#D7263D"); px(cx + 2, top + i, "#D7263D"); }   // la U
    blk(cx - 1, top + 7, 3, 1, "#D7263D"); px(cx - 2, top + 7, "#9B1428"); px(cx + 2, top + 7, "#9B1428");
    px(cx - 3, top + 1, "#5B7BE0"); px(cx - 3, top + 2, "#5B7BE0");
    return;
  }
  if (tipo === "cuchillas") {
    if (pose === "ataque") return;
    return arma(d, "daga", c, P, hx, hy, ux, uy, pose);
  }
  if (tipo === "totem") {
    const MADERA = "#9A6A3A", OSCURA = "#6E4824";
    const LOBO = [            // cabeza de lobo tallada, mirando a la derecha
      ".K...K....",
      "KgK.KgK...",
      "KGgKGGK...",
      "KGGGGGGKK.",
      "KGGGGKGGGK",
      "KgGGGGGGGK",
      "KgGGWWWWKK",
      ".KKKKKKK..",
    ];
    const pinta = { K, G: "#8E96A3", g: "#5E6673", W: "#E5E7EB" };
    const cabeza = (cx, cy) => LOBO.forEach((fila, y) => [...fila].forEach((k, x) => { if (pinta[k]) px(cx - 4 + x, cy - 4 + y, pinta[k]); }));
    const banderin = (bx, by, abajo) => {    // triángulo de la patrulla
      for (let i = 0; i < 5; i++) {
        const largo = 7 - i, y = abajo ? by + i : by + i;
        blk(bx - 1, y - 1, largo + 2, 3, K);
      }
      for (let i = 0; i < 5; i++) { const largo = 7 - i; blk(bx, by + i, largo, 1, i === 2 ? "#3F6B3A" : "#FBBF24"); }
    };
    if (pose === "ataque") {
      const y = hy, x0 = hx - 8, x1 = hx + 13;
      line(x0, y, x1, y, (x, yy) => contorno(x, yy));
      banderin(x1 - 7, y + 2, true);
      line(x0, y, x1, y, (x, yy) => px(x, yy, (x % 5 === 0) ? OSCURA : MADERA));
      cabeza(x1 + 3, y);
    } else {
      const x = hx + 2, y0 = hy + (pose === "alzada" ? 10 : 7), y1 = hy - (pose === "alzada" ? 13 : 18);
      line(x, y0, x, y1, (xx, y) => contorno(xx, y));
      banderin(x + 2, y1 + 3, false);
      line(x, y0, x, y1, (xx, y) => px(xx, y, (y % 5 === 0) ? OSCURA : MADERA));
      cabeza(x, y1 - 3);
    }
    return;
  }
  if (tipo === "naipes") {
    if (pose === "ataque") return;
    // tres cartas en abanico, cada una con su borde para que se lean separadas
    const cartas = [[hx - 3, hy - 6], [hx, hy - 8], [hx + 3, hy - 6]];
    cartas.forEach(([x, y], i) => {
      blk(x - 1, y - 1, 5, 7, K); blk(x, y, 3, 5, "#F8F5EE");
      const tinta = i === 1 ? "#1A1020" : "#D7263D";
      px(x + 1, y + 2, tinta); px(x, y, tinta); px(x + 2, y + 4, "#C9C2B2");
    });
    return;
  }
    if (tipo === "pocion") {
      if (pose === "ataque") return;
      const cx = hx + 1, cy = hy - 3;
      blk(cx - 2, cy - 1, 5, 5, K); blk(cx - 1, cy - 4, 3, 4, K);
      blk(cx - 1, cy, 3, 3, "#4ADE80"); px(cx - 1, cy, "#BBF7D0"); px(cx + 1, cy + 2, "#16A34A");
      px(cx, cy - 1, "#D9E8E0"); px(cx, cy - 2, "#D9E8E0"); px(cx, cy - 3, "#8A5A2A");
      px(cx + 2, cy - 6, "#86EFAC"); px(cx + 1, cy - 7, "#86EFAC");
      return;
    }
  if (tipo in LARGO) {
    const L = LARGO[tipo], tx = hx + ux * L, ty = hy + uy * L, bx = hx - ux * 2, by = hy - uy * 2;
    if (tipo === "kukri") {
      // hoja curva con panza: 2 px de ancho, 3 cerca de la punta, y se dobla hacia abajo
      const pts = [];
      for (let t = 1; t <= L; t++) {
        const b = Math.round(1.4 * Math.sin(Math.PI * t / (L + 2)));
        const ancho = t === L ? 1 : t >= L - 4 ? 3 : 2;
        for (let w = 0; w < ancho; w++) pts.push([Math.round(hx + ux * t - uy * (b + w)), Math.round(hy + uy * t + ux * (b + w)), t, w]);
      }
      line(bx, by, hx, hy, (x, y) => contorno(x, y));
      pts.forEach(([x, y]) => contorno(x, y));
      line(bx, by, hx, hy, (x, y) => px(x, y, "#5A3A28"));
      pts.forEach(([x, y, t, w]) => px(x, y, w === 0 ? (t % 3 === 0 ? "#FFFFFF" : "#E6ECF4") : "#A9B4C6"));
      const gx = Math.round(hx + ux), gy = Math.round(hy + uy);
      blk(gx - 1, gy - 1, 3, 3, K); px(gx, gy, P.G || "#D4AF4F");
      return;
    }
    if (tipo === "micro") {
      // micrófono de mano: mango oscuro y cabeza de rejilla plateada
      const mx = Math.round(hx + ux * 4), my = Math.round(hy + uy * 4);
      line(hx - ux, hy - uy, mx, my, (x, y) => contorno(x, y));
      blk(mx - 2, my - 3, 5, 7, K); blk(mx - 3, my - 2, 7, 5, K);
      line(hx - ux, hy - uy, mx, my, (x, y) => px(x, y, "#2A2A35"));
      blk(mx - 1, my - 2, 3, 5, "#C9D1DE"); blk(mx - 2, my - 1, 5, 3, "#C9D1DE");
      px(mx, my, "#8A94A6"); px(mx + 1, my + 1, "#8A94A6"); px(mx - 1, my + 1, "#8A94A6"); px(mx - 1, my - 1, "#FFFFFF");
      return;
    }
    if (tipo === "cucharon") {
      // mango largo de madera y una cuchara honda en la punta
      const cx = Math.round(hx + ux * (L + 1)), cy = Math.round(hy + uy * (L + 1));
      const taza = (fn) => { for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if ((dx / 3.1) ** 2 + (dy / 2.6) ** 2 <= 1) fn(cx + dx, cy + dy, dx, dy); };
      line(bx, by, tx, ty, (x, y) => contorno(x, y));
      taza((x, y) => contorno(x, y));
      line(bx, by, tx, ty, (x, y) => px(x, y, "#C68A4E"));
      line(hx + ux * 2, hy + uy * 2, tx, ty, (x, y) => { if ((x + y) % 4 === 0) px(x, y, "#E2B07A"); });
      taza((x, y, dx, dy) => px(x, y, (dx / 3.1) ** 2 + (dy / 2.6) ** 2 > 0.45 ? "#C68A4E" : "#7A4A22"));
      px(cx - 1, cy - 1, "#E2B07A");
      return;
    }
    line(bx, by, tx, ty, (x, y) => contorno(x, y));
    if (tipo === "hacha") {
      const hoja = (fn) => { for (let t = L - 6; t <= L; t++) for (let s = 1; s <= 5 - Math.abs(t - (L - 3)) * 0.8; s++) fn(Math.round(hx + ux * t + uy * s), Math.round(hy + uy * t - ux * s), s); };
      hoja((x, y) => contorno(x, y));
      line(bx, by, tx, ty, (x, y) => px(x, y, "#7A5232"));
      hoja((x, y, s) => px(x, y, s > 3 ? "#FFFFFF" : ACERO));
      return;
    }
    line(bx, by, hx, hy, (x, y) => px(x, y, tipo === "sable" ? P.G : "#6B4430"));
    line(hx, hy, tx, ty, (x, y) => px(x, y, ACERO));
    line(hx + ux * 3, hy + uy * 3, tx, ty, (x, y) => { if ((x + y) % 3 === 0) px(x, y, "#FFFFFF"); });
    const gx = hx + ux, gy = hy + uy, w = tipo === "daga" ? 1 : 2;
    line(gx - uy * w, gy + ux * w, gx + uy * w, gy - ux * w, (x, y) => contorno(x, y));
    line(gx - uy * w, gy + ux * w, gx + uy * w, gy - ux * w, (x, y) => px(x, y, "#FBBF24"));
    if (tipo === "espadon") line(hx + ux * 4, hy + uy * 4, tx, ty, (x, y) => px(x, y, "#B9C3D3"));
  }
  if (tipo === "baculo") {
    let a, b;
    if (pose === "ataque" && !c.raices) { a = [hx - 6, hy + 1]; b = [hx + 11, hy - 1]; }
    else if (c.escoba) { a = [hx + 1, hy + 3]; b = [hx + 1, hy - 15]; }
    else { a = [hx + 1, hy + 7]; b = [hx + 1, hy - 14]; }
    if (c.escoba) {
      const [ax, ay] = [Math.round(a[0]), Math.round(a[1])], PAJA = "#E0B04A", ATADO = "#9A3B2A";
      line(...a, ...b, (x, y) => contorno(x, y));
      if (pose === "ataque") { blk(ax - 6, ay - 3, 7, 7, K); blk(ax - 5, ay - 2, 5, 5, PAJA); blk(ax - 1, ay - 2, 1, 5, ATADO); px(ax - 5, ay - 2, "#F6D27A"); px(ax - 4, ay + 1, "#B8862E"); }
      else { blk(ax - 3, ay - 1, 7, 7, K); blk(ax - 2, ay, 5, 5, PAJA); blk(ax - 2, ay, 5, 1, ATADO); px(ax - 1, ay + 3, "#B8862E"); px(ax + 1, ay + 4, "#F6D27A"); }
      line(...a, ...b, (x, y) => px(x, y, "#7A5232"));
      const [ox, oy] = [Math.round(b[0]), Math.round(b[1])];
      px(ox, oy, "#FFFFFF"); px(ox - 1, oy, c.orbe); px(ox + 1, oy, c.orbe); px(ox, oy - 1, c.orbe); px(ox, oy + 1, c.orbe);
      return;
    }
    line(...a, ...b, (x, y) => contorno(x, y));
    line(...a, ...b, (x, y) => px(x, y, "#7A5232"));
    const [ox, oy] = [Math.round(b[0]), Math.round(b[1])];
    if (c.espiral) { blk(ox - 2, oy - 4, 5, 5, K); blk(ox - 1, oy - 3, 3, 3, "#7A5232"); px(ox, oy - 2, K); px(ox + 1, oy - 1, "#7A5232"); px(ox - 2, oy - 2, c.orbe); }
    else if (c.luna) { blk(ox - 2, oy - 3, 5, 5, K); blk(ox - 1, oy - 2, 3, 3, c.orbe); blk(ox, oy - 2, 2, 2, K); px(ox + 1, oy - 1, c.orbe); }
    else { blk(ox - 2, oy - 2, 5, 5, K); blk(ox - 1, oy - 1, 3, 3, c.orbe); px(ox - 1, oy - 1, "#FFFFFF"); }
  }
  if (tipo === "arco") {
    const bx = hx + 2;
    for (let dy = -8; dy <= 8; dy++) contorno(bx + Math.round(3 * (1 - (dy / 8) ** 2)), hy + dy);
    for (let dy = -8; dy <= 8; dy++) px(bx + Math.round(3 * (1 - (dy / 8) ** 2)), hy + dy, "#8A5A32");
    const tirado = pose === "ataque" ? -3 : 0;
    line(bx, hy - 8, bx + tirado, hy, (x, y) => px(x, y, "#E8ECF5"));
    line(bx + tirado, hy, bx, hy + 8, (x, y) => px(x, y, "#E8ECF5"));
    if (pose === "ataque") { line(bx - 3, hy, bx + 5, hy, (x, y) => px(x, y, "#C9A26B")); px(bx + 6, hy, ACERO); }
  }
}
function pinceles(g, ox, oy) {
  const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x + ox, y + oy, 1, 1); };
  const blk = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x + ox, y + oy, w, h); };
  return { px, blk, contorno: (x, y, r = 1) => blk(x - r, y - r, 2 * r + 1, 2 * r + 1, K) };
}

const cache = new Map();
function sprite(c, pose, { alt = false, sinMano = false } = {}) {
  const key = [c.id, pose, alt, sinMano].join("|");
  if (cache.has(key)) return cache.get(key);
  const cv = document.createElement("canvas"); cv.width = SW; cv.height = SH;
  const g = cv.getContext("2d");
  const P = { ...c.pal };
  if (alt) for (const k of Object.keys(P)) if (k !== "S" && k !== "s") { const v = P[k]; P[k] = typeof v === "function" ? (x, y) => tono(v(x, y)) : tono(v); }
  const d = pinceles(g, OX, OY), { px, blk } = d;
  c.grid.forEach((row, y) => [...row].forEach((k, x) => { if (k === "K") px(x, y, K); else if (P[k]) px(x, y, typeof P[k] === "function" ? P[k](x, y) : P[k]); }));

  const p = POSE[pose];
  if (p) {
    const pp = (c.poses && c.poses[pose]) || (pose === "guardia" && c.guardia) || p;
    if (p.mano2) { const [ax, ay] = p.mano2; blk(ax - 1, ay - 1, 4, 4, K); blk(ax, ay, 2, 2, P[c.mano]); }   // la otra mano, detrás
    const [hx, hy] = pp.mano;
    if (pp.dir) {
      const [ux, uy] = norm(pp.dir);
      if (c.arma === "kukris" && MANO2[pose]) {             // brazo de atrás, con su cuchillo
        const { mano: [h2x, h2y], dir: d2 } = MANO2[pose], [vx, vy] = norm(d2);
        line(...HOMBRO2, h2x, h2y, (x, y) => blk(x - 1, y - 1, 4, 4, K));
        line(...HOMBRO2, h2x, h2y, (x, y) => blk(x, y, 2, 2, P.j || P[c.brazo]));
        arma(d, "kukri", c, P, h2x, h2y, vx, vy, pose);
        blk(h2x - 1, h2y - 1, 4, 4, K); blk(h2x, h2y, 2, 2, P[c.mano]);
      }
      if (c.arma === "laud") arma(d, "laud", c, P, hx, hy, 0, -1, pose);
      else if (c.arma !== "pocion" && c.arma !== "naipes" && c.arma !== "escudo") arma(d, tipoArma(c), c, P, hx, hy, ux, uy, pose);
    }
    // ---- brazo y mano ----
    line(...HOMBRO, hx, hy, (x, y) => blk(x - 1, y - 1, 4, 4, K));
    line(...HOMBRO, hx, hy, (x, y) => blk(x, y, 2, 2, P[c.brazo]));
    if (!sinMano) {
      const s = c.arma === "puno" || c.arma === "cohete" ? 3 : 2;
      blk(hx - 1, hy - 1, s + 2, s + 2, K); blk(hx, hy, s, s, P[c.mano]);
      if (c.arma === "cohete") px(hx + 1, hy + 1, "#FFFFFF");
    }
    if ((c.arma === "pocion" || c.arma === "naipes" || c.arma === "escudo") && pp.dir) arma(d, c.arma, c, P, hx, hy, 0, -1, pose);   // el frasco va en la mano, delante
  }
  cache.set(key, cv);
  return cv;
}
/* El arma sola, para cuando sale volando (horizontal, centrada). */
const sueltas = new Map();
function armaSuelta(c) {
  const tipo = tipoArma(c), key = c.id; if (sueltas.has(key)) return sueltas.get(key);
  const cv = document.createElement("canvas"); cv.width = 28; cv.height = 28;
  const d = pinceles(cv.getContext("2d"), 0, 0);
  if (tipo === "arco") arma(d, tipo, c, c.pal, 10, 14, 1, 0, "guardia");
  else if (tipo === "escudo") arma(d, tipo, c, c.pal, 12, 20, 0, -1, "guardia");
  else if (tipo === "laud") arma({ ...d, px: (x, y, col) => d.px(x - 1, y - 7, col), blk: (x, y, w, h, col) => d.blk(x - 1, y - 7, w, h, col), contorno: (x, y, r = 1) => d.blk(x - 1 - r, y - 7 - r, 2 * r + 1, 2 * r + 1, K) }, tipo, c, c.pal, 0, 0, 0, -1, "guardia");
  else if (tipo === "cuchillas") arma(d, "daga", c, c.pal, 10, 14, 1, 0, "ataque");
  else if (tipo === "totem") arma(d, tipo, c, c.pal, 7, 14, 1, 0, "ataque");
  else if (tipo === "pocion" || tipo === "naipes") arma(d, tipo, c, c.pal, 13, 18, 0, -1, "guardia");
  else if (tipo === "baculo") arma(d, tipo, c, c.pal, 9, 14, 1, 0, "ataque");
  else { const L = LARGO[tipo] || 10; arma(d, tipo, c, c.pal, 14 - Math.round(L / 2), 14, 1, 0, "ataque"); }
  sueltas.set(key, cv); return cv;
}
/* Otro tono, para cuando los dos rivales eligieron el mismo personaje. */
function tono(hex) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;   // solo #rrggbb
  return `rgb(${b},${r},${g})`;
}

/* ======================= ESCENARIO ======================= */
const W = 112, SUELO = 62, Y0 = SUELO - (OY + 29);
/* Selva del árbol gigante (inspirada en la portada de Secret of Mana). Se pinta una vez
   en un lienzo aparte; en cada cuadro solo se copia y se agregan los ibis que vuelan. */
let FONDO = null;
function pintarFondo() {
  const c = document.createElement("canvas"); c.width = W; c.height = 76;
  const g = c.getContext("2d");
  let semilla = 7; const rnd = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
  const p = (x, y, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
  // fondo de selva, de oscuro a menos oscuro
  ["#16301C", "#1B3A20", "#204424", "#264E28", "#2C582C"].forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * 11, W, 11); });
  // follaje lejano en puntitos
  for (let i = 0; i < 700; i++) { const x = rnd() * W, y = rnd() * 55; p(x, y, ["#3E6A30", "#5A8A3A", "#7FA84A", "#A8C25A"][Math.floor(rnd() * 4 * (1 - y / 80))]); }
  // el árbol gigante: tronco cubierto de musgo que se ensancha en raíces
  for (let y = 0; y < 56; y++) {
    const ancho = 13 + Math.max(0, y - 28) * 1.5, cx = 56 + Math.sin(y / 7) * 2;
    for (let x = Math.round(cx - ancho); x <= Math.round(cx + ancho); x++) { const k = (x * 3 + y * 7) % 11; p(x, y, k < 2 ? "#3E6428" : k < 4 ? "#86A848" : "#5E8A3A"); }
  }
  for (let i = 0; i < 14; i++) { const x = 45 + rnd() * 22, y0 = rnd() * 20, L = 20 + rnd() * 20; for (let y = y0; y < y0 + L; y++) p(x + Math.sin(y / 5), y, "#3A5E26"); }
  for (let i = 0; i < 140; i++) { const y = rnd() * 56, a = 13 + Math.max(0, y - 28) * 1.5; p(56 + (rnd() * 2 - 1) * a, y, "#C2D66A"); }
  // musgo que cuelga desde arriba
  for (let i = 0; i < 24; i++) { const x = rnd() * W, L = 5 + rnd() * 20; for (let y = 0; y < L; y++) p(x, y, y % 3 ? "#8DB04A" : "#B5CC5E"); }
  // rosetas turquesa a la izquierda
  const roseta = (cx, cy, r) => { for (let a = 0; a < 16; a++) { const an = a / 16 * Math.PI * 2; for (let k = 2; k <= r; k++) p(cx + Math.cos(an) * k, cy + Math.sin(an) * k * 0.8, k === r ? "#7AD0B8" : "#3FA08A"); } p(cx, cy, "#2A7A68"); };
  roseta(14, 20, 6); roseta(23, 30, 5); roseta(8, 34, 5);
  // palmera en abanico a la derecha
  for (let a = 0; a < 15; a++) { const an = Math.PI * (1.05 + a / 14 * 0.9); for (let k = 4; k < 30; k++) p(97 + Math.cos(an) * k, 50 + Math.sin(an) * k, k % 4 ? "#4E8A3E" : "#6FAE52"); }
  for (let y = 46; y < 56; y++) p(97, y, "#3A5E26");
  // la selva queda un poco más oscura, para que resalten los que pelean
  g.fillStyle = "rgba(8, 20, 10, .32)"; g.fillRect(0, 0, W, 53);
  // agua quieta detrás de los que pelean
  g.fillStyle = "#1E4448"; g.fillRect(0, 53, W, 4);
  for (let x = 0; x < W; x += 5) p(x + (x % 3), 54, "#3E7478");
  // suelo de musgo
  g.fillStyle = "#3E7A34"; g.fillRect(0, 57, W, 19);
  for (let i = 0; i < 170; i++) p(rnd() * W, 57 + rnd() * 19, rnd() < 0.5 ? "#5FA046" : "#2E5E28");
  for (let x = 0; x < W; x += 2) { const h = 1 + Math.floor(rnd() * 3); for (let y = 0; y < h; y++) p(x, 57 - y, "#6FB04E"); }
  // estanque al frente, con flores rosadas
  g.fillStyle = "#1F3F45"; g.fillRect(0, 70, W, 6);
  for (let x = 2; x < W; x += 7) p(x + (x % 4), 71, "#3E7478");
  for (let i = 0; i < 9; i++) { const x = rnd() * W; p(x, 72, "#F28C8C"); p(x + 1, 72, "#4E8A3E"); }
  // helechos en las esquinas de adelante
  const helecho = (bx, by, s) => { for (let b = 0; b < 5; b++) { const an = -Math.PI / 2 + s * (b * 0.32 - 0.5); for (let k = 0; k < 13 - b; k++) { const x = bx + Math.cos(an) * k, y = by + Math.sin(an) * k; p(x, y, "#5FAE4A"); if (k % 2) p(x + s, y, "#3E8A3A"); } } };
  helecho(3, 76, 1); helecho(109, 76, -1);
  return c;
}
function aves(g) {
  const t = performance.now() / 1000;
  [0, 1].forEach((i) => {
    const x = Math.round(((t * 9 + i * 55) % (W + 24)) - 12), y = Math.round(9 + i * 8 + Math.sin(t * 2 + i) * 2), ala = Math.floor(t * 6 + i * 3) % 2;
    g.fillStyle = "#F06A4A"; g.fillRect(x, y, 4, 1); g.fillRect(x + 4, y - 1, 1, 1);
    g.fillStyle = "#2A1A1A"; g.fillRect(x + 5, y - 1, 2, 1);
    g.fillStyle = "#FF9A7A";
    if (ala) { g.fillRect(x + 1, y - 1, 2, 1); g.fillRect(x, y - 2, 2, 1); } else { g.fillRect(x + 1, y + 1, 2, 1); g.fillRect(x, y + 2, 2, 1); }
    g.fillStyle = "#F06A4A"; g.fillRect(x - 1, y, 1, 1);
  });
}
function fondo(g) {
  if (!FONDO) FONDO = pintarFondo();
  g.drawImage(FONDO, 0, 0);
  aves(g);
}
const sombra = (g, cx, dy = 0) => { g.fillStyle = "rgba(10,25,12,.45)"; g.fillRect(cx - 7, SUELO + dy + 1, 14, 2); g.fillRect(cx - 5, SUELO + dy + 3, 10, 1); };
function chispa(g, x, y, f, col = "#FBBF24") {
  const r = [2, 4, 6, 4][f] ?? 0; if (!r) return;
  g.fillStyle = "#FFFFFF"; g.fillRect(x - r, y, r * 2 + 1, 1); g.fillRect(x, y - r, 1, r * 2 + 1);
  g.fillStyle = col; const d = Math.max(1, r - 2);
  for (let i = 1; i <= d; i++) [[-i, -i], [i, -i], [-i, i], [i, i]].forEach(([a, b]) => g.fillRect(x + a, y + b, 1, 1));
  g.fillStyle = "#FFF7D6"; g.fillRect(x - 1, y - 1, 3, 3);
}
/* Disparos: flecha, orbe, luz o puño cohete. sentido = 1 hacia la derecha, -1 hacia la izquierda. */
function disparo(g, c, x, y, sentido) {
  x = Math.round(x); y = Math.round(y);
  if (c.arma === "arco") { g.fillStyle = K; g.fillRect(Math.min(x, x - 8 * sentido) - 1, y - 1, 11, 3); g.fillStyle = "#C9A26B"; g.fillRect(Math.min(x, x - 8 * sentido), y, 9, 1);
    g.fillStyle = ACERO; g.fillRect(x, y, 1, 1); g.fillStyle = "#E8ECF5"; g.fillRect(x - 8 * sentido, y - 1, 1, 3); }
  else if (c.arma === "cuchillas") {
    const gira = Math.floor(x / 3) % 2 === 0;
    [[0, -3], [5, 0], [10, 3]].forEach(([atras, dy], i) => {
      const kx = x - sentido * atras, ky = y + dy, g2 = i % 2 ? !gira : gira;
      if (g2) { g.fillStyle = K; g.fillRect(kx - 3, ky - 1, 7, 3); g.fillStyle = "#DCE3EE"; g.fillRect(kx - 2 * sentido - (sentido < 0 ? 0 : 0), ky, 4, 1);
        g.fillStyle = "#FFFFFF"; g.fillRect(kx + sentido * 2, ky, 1, 1); g.fillStyle = "#6B4430"; g.fillRect(kx - sentido * 3, ky, 1, 1); }
      else { g.fillStyle = K; g.fillRect(kx - 1, ky - 3, 3, 7); g.fillStyle = "#DCE3EE"; g.fillRect(kx, ky - 2, 1, 4); g.fillStyle = "#6B4430"; g.fillRect(kx, ky + 2, 1, 1); }
    });
  }
  else if (c.arma === "naipes") {
    const carta = (cx, cy, gira) => { const [w, h] = gira ? [5, 3] : [3, 5];
      g.fillStyle = K; g.fillRect(cx - 1, cy - 1, w + 2, h + 2); g.fillStyle = "#F8F5EE"; g.fillRect(cx, cy, w, h); g.fillStyle = "#D7263D"; g.fillRect(cx + (w >> 1), cy + (h >> 1), 1, 1); };
    const gira = Math.floor(x / 3) % 2 === 0;
    carta(x - 2, y - 2, gira); carta(x - sentido * 7 - 2, y + 2, !gira);
  }
  else if (c.arma === "pocion") {
    g.fillStyle = K; g.fillRect(x - 2, y - 2, 5, 6); g.fillStyle = "#4ADE80"; g.fillRect(x - 1, y, 3, 3);
    g.fillStyle = "#D9E8E0"; g.fillRect(x, y - 1, 1, 1); g.fillStyle = "#8A5A2A"; g.fillRect(x, y - 2, 1, 1);
    g.fillStyle = "#86EFAC"; g.fillRect(x - sentido * 4, y - 1, 1, 1); g.fillRect(x - sentido * 7, y, 1, 1);
  }
  else if (c.arma === "laud") {
    // dos notas musicales que viajan juntas
    const nota = (nx, ny, col) => { g.fillStyle = K; g.fillRect(nx - 1, ny - 6, 5, 9); g.fillStyle = col; g.fillRect(nx, ny, 2, 2); g.fillRect(nx + 1, ny - 5, 1, 6); g.fillRect(nx + 2, ny - 5, 1, 2); };
    nota(x - 1, y + 2, "#FBBF24"); nota(x - sentido * 6 - 1, y - 1, "#F472B6");
  }
  else if (c.arma === "baculo") { g.fillStyle = c.orbe; for (let i = 1; i <= 3; i++) g.fillRect(x - sentido * i * 3, y, 1, 1);
    g.fillStyle = K; g.fillRect(x - 2, y - 2, 5, 5); g.fillStyle = c.orbe; g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = "#FFFFFF"; g.fillRect(x, y, 1, 1); }
  else if (c.arma === "cohete") { g.fillStyle = "#F97316"; g.fillRect(x - sentido * 5, y, 3, 1); g.fillStyle = "#FBBF24"; g.fillRect(x - sentido * 4, y - 1, 1, 3);
    g.fillStyle = K; g.fillRect(x - 2, y - 2, 5, 5); g.fillStyle = c.pal.M; g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = "#FFFFFF"; g.fillRect(x, y - 1, 1, 1); }
}
/* Nube de humo verde de la poción al estallar (f = 0..3). */
function humo(g, x, y, f) {
  const r = [3, 5, 7, 8][f] ?? 0; if (!r) return;
  const cols = ["#4ADE80", "#86EFAC", "#9CA3AF", "#6B7280"];
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const d = (dx * dx) / (r * r) + (dy * dy) / ((r * 0.8) ** 2);
    if (d > 1 || (f === 3 && (dx + dy) % 2)) continue;
    g.fillStyle = cols[(Math.abs(dx * 7 + dy * 3) + (d > 0.6 ? 2 : 0)) % 4];
    g.fillRect(x + dx, y + dy - f, 1, 1);
  }
}
/* Enredaderas: salen del suelo junto a Agattita y avanzan ondulando hasta (x1, yTop),
   con espinas, zarcillos enroscados y la punta en espiral. prog = cuánto han crecido (0..1). */
function ramas(g, x0, x1, prog, sentido, yTop) {
  const OLIVA = "#6B7A3A", MUSGO = "#8A9A4E", OSCURO = "#3F4A22";
  const punto = (t, fase, amp) => [x0 + (x1 - x0) * t, SUELO + (yTop - SUELO) * Math.sin(t * Math.PI / 2) + Math.sin(t * Math.PI * 3 + fase) * amp * Math.sin(t * Math.PI) - Math.sin(t * Math.PI) * 10];
  const tallo = (fase, amp, grueso, hasta) => {
    const pts = []; for (let i = 0; i <= 60 * hasta; i++) pts.push(punto(i / 60, fase, amp).map(Math.round));
    pts.forEach(([x, y]) => { g.fillStyle = K; g.fillRect(x - 1, y - 1, grueso + 2, grueso + 2); });
    pts.forEach(([x, y], i) => { g.fillStyle = i % 5 === 0 ? MUSGO : OLIVA; g.fillRect(x, y, grueso, grueso); });
    pts.forEach(([x, y], i) => { if (i % 6 === 3) { g.fillStyle = OSCURO; g.fillRect(x + (i % 12 ? -1 : grueso), y - 1, 1, 1); } });   // espinas
    return pts;
  };
  const curl = (cx, cy, r, gira) => {          // zarcillo enroscado
    for (let k = 0; k <= 20; k++) { const an = gira * k / 20 * Math.PI * 1.6; const rr = r * (1 - k / 28);
      const x = Math.round(cx + Math.cos(an) * rr * sentido), y = Math.round(cy + Math.sin(an) * rr);
      g.fillStyle = K; g.fillRect(x - 1, y - 1, 3, 3); }
    for (let k = 0; k <= 20; k++) { const an = gira * k / 20 * Math.PI * 1.6; const rr = r * (1 - k / 28);
      g.fillStyle = OLIVA; g.fillRect(Math.round(cx + Math.cos(an) * rr * sentido), Math.round(cy + Math.sin(an) * rr), 1, 1); }
  };
  if (prog <= 0) return;
  tallo(2.2, 3, 1, Math.min(1, prog * 0.85));                // enredadera fina, por detrás
  const pts = tallo(0, 5, 2, prog);                          // la principal
  if (prog > 0.4) { const [x, y] = pts[Math.round(pts.length * 0.4)]; curl(x, y - 4, 3, 1); }
  if (prog > 0.7) { const [x, y] = pts[Math.round(pts.length * 0.68)]; curl(x + sentido * 2, y + 4, 2.5, -1); }
  const [tx, ty] = pts[pts.length - 1]; curl(tx + sentido * 2, ty - 2, 3, 1);   // punta en espiral
  g.fillStyle = "#5E4029"; g.fillRect(Math.round(x0) - 2, SUELO, 2, 1); g.fillRect(Math.round(x0) + 2, SUELO, 2, 1);
}
function poner(g, spr, x, y, espejo) {
  g.save();
  if (espejo) { g.translate(x + SW, y); g.scale(-1, 1); g.drawImage(spr, 0, 0); } else g.drawImage(spr, x, y);
  g.restore();
}
const lerp = (a, b, k) => a + (b - a) * Math.max(0, Math.min(1, k));
const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const BASE = 2;

/* Cuánto avanza cada uno para chocar en el centro (o disparar desde cerca). */
function alcance(c, objetivo) {
  if (DISPARA[c.arma]) return 4;
  return objetivo - BASE - OX - punta(c)[0];
}

function escenaDuelo(g, t, yo, rival, { conFondo = true, dy = 0, dx = 0 } = {}) {
  const y0 = Y0 + dy;
  const Tm = t % 3600, alt = yo.id === rival.id;
  const seg = (a, b) => (Tm - a) / (b - a);
  const Da = Math.max(4, alcance(yo, W / 2) - dx), Db = Math.max(4, alcance(rival, W / 2) - dx);
  let k = 0, pose = "guardia", f = -1, shake = false, vuelo = -1;
  if (Tm < 700) k = 0;
  else if (Tm < 950) { k = seg(700, 950); pose = "ataque"; vuelo = k; }
  else if (Tm < 1250) { k = 1; pose = "ataque"; f = Math.floor(seg(950, 1250) * 4); shake = Tm < 1100; }
  else if (Tm < 1500) k = lerp(1, 0.3, seg(1250, 1500));
  else if (Tm < 1750) { k = lerp(0.3, 1, seg(1500, 1750)); pose = "ataque"; vuelo = seg(1500, 1750); }
  else if (Tm < 2050) { k = 1; pose = "ataque"; f = Math.floor(seg(1750, 2050) * 4); shake = Tm < 1900; }
  else if (Tm < 2400) k = lerp(1, 0, seg(2050, 2400));
  if (reduce) { k = 1; pose = "ataque"; f = 2; shake = false; vuelo = -1; }
  const bob = pose === "guardia" && Math.floor(Tm / 350) % 2 ? 1 : 0;
  g.save(); g.translate(shake ? (Math.floor(Tm / 40) % 2 ? 1 : -1) : 0, 0); if (conFondo) fondo(g);
  const xa = Math.round(BASE + dx + Da * k), xb = Math.round(W - BASE - dx - SW - Db * k);
  sombra(g, xa + OX + 10, dy); sombra(g, xb + SW - OX - 10, dy);
  const sinA = yo.arma === "cohete" && (vuelo >= 0 || f >= 0), sinB = rival.arma === "cohete" && (vuelo >= 0 || f >= 0);
  poner(g, sprite(yo, pose, { sinMano: sinA }), xa, y0 + bob, false);
  poner(g, sprite(rival, pose, { alt, sinMano: sinB }), xb, y0 + bob, true);
  const [px, py] = punta(yo), [qx, qy] = punta(rival);
  if (vuelo >= 0) {
    const arco = (c) => (c.arma === "pocion" ? Math.sin(Math.PI * vuelo) * 14 : 0);
    if (DISPARA[yo.arma] && !yo.raices) disparo(g, yo, lerp(xa + OX + px, W / 2 - 1, vuelo), y0 + OY + py - arco(yo), 1);
    if (DISPARA[rival.arma] && !rival.raices) disparo(g, rival, lerp(xb + SW - 1 - OX - qx, W / 2 + 1, vuelo), y0 + OY + qy - arco(rival), -1);
  }
  const brota = f >= 0 ? 1 : vuelo;
  if (brota >= 0 && yo.raices) ramas(g, xa + OX + 16, W / 2, brota, 1, y0 + OY + py);
  if (brota >= 0 && rival.raices) ramas(g, xb + SW - 1 - OX - 16, W / 2, brota, -1, y0 + OY + qy);
  if (f >= 0 && (yo.arma === "pocion" || rival.arma === "pocion")) humo(g, W / 2, y0 + OY + py, f);
  if (f >= 0) chispa(g, W / 2, y0 + OY + py, f, yo.orbe || rival.orbe || "#FBBF24");
  if ((yo.arma === "naipes" || rival.arma === "naipes") && f >= 1) chispa(g, W / 2 + 1, y0 + OY + py + 5, f - 1);   // el segundo cuchillo
  g.restore();
}

/* Ganar = desarmar. El arma del rival sale volando y queda clavada atrás;
   el rival se queda de pie, con las manos arriba. Nadie cae ni se lastima. */
function escenaGana(g, Tm, yo, rival, { conFondo = true, dy = 0, dx = 0 } = {}) {
  const y0 = Y0 + dy;
  if (reduce) Tm = 2600;
  const alt = yo.id === rival.id, seg = (a, b) => (Tm - a) / (b - a);
  const rx = W - BASE - dx - SW;
  const espejoX = (bx) => rx + SW - 1 - OX - bx;            // columna del cuerpo → x en escena (el rival mira a la izquierda)
  const [mx, my] = POSE.guardia.mano;
  const manoR = [espejoX(mx), y0 + OY + my];                 // donde el rival tiene el arma
  const objetivo = manoR[0] - 1;
  const D = Math.max(4, alcance(yo, objetivo) - dx), [px, py] = punta(yo);
  let k = 0, pose = "guardia", rPose = "guardia", f = -1, shake = false, vuelo = -1, vuela = -1;
  if (Tm < 600) {}
  else if (Tm < 850) { k = seg(600, 850); pose = "ataque"; vuelo = k; }
  else if (Tm < 1050) { k = 1; pose = "ataque"; f = Math.floor(seg(850, 1050) * 4); shake = true; }
  else if (Tm < 1500) { k = 1; pose = "ataque"; rPose = "rendido"; vuela = seg(1050, 1650); }
  else if (Tm < 1900) { k = lerp(1, 0, seg(1500, 1900)); rPose = "rendido"; vuela = seg(1050, 1650); }
  else { pose = "alzada"; rPose = "rendido"; vuela = 1; }
  const bob = Tm >= 1900 && Math.floor(Tm / 300) % 2 ? 1 : 0;
  g.save(); g.translate(shake ? (Math.floor(Tm / 40) % 2 ? 1 : -1) : 0, 0); if (conFondo) fondo(g);
  const xa = Math.round(BASE + dx + D * k);
  sombra(g, xa + OX + 10, dy); sombra(g, rx + SW - OX - 10, dy);
  poner(g, sprite(rival, rPose, { alt }), rx, y0, true);
  if (rPose === "rendido") {
    // gota de sudor y, al principio, un «!»
    const cx = espejoX(7), cy = y0 + OY + 3;
    g.fillStyle = K; g.fillRect(cx - 1, cy, 3, 4); g.fillStyle = "#7DD3FC"; g.fillRect(cx, cy + 1, 1, 2);
    if (Tm < 1700) { const ex = espejoX(11), ey = y0 + OY - 9; g.fillStyle = K; g.fillRect(ex - 1, ey - 1, 3, 8); g.fillStyle = "#FBBF24"; g.fillRect(ex, ey, 1, 4); g.fillRect(ex, ey + 5, 1, 1); }
    // el arma (o las dos) vuela en arco y queda clavada detrás
    if (TIENE_ARMA(rival)) {
      const piezas = [0];
      piezas.forEach((i) => {
        const q = Math.max(0, Math.min(1, vuela - i * 0.12));
        const fx = Math.min(W - 8, manoR[0] + 18 + i * 6), fy = SUELO - 4 + dy;
        const x = lerp(manoR[0], fx, q), y = lerp(manoR[1], fy, q) - Math.sin(Math.PI * q) * 22;
        const giro = q < 1 ? q * Math.PI * 4 : Math.PI * 0.62;  // gira en el aire; al final, clavada en diagonal
        g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(giro); g.drawImage(armaSuelta(rival), -14, -14); g.restore();
      });
    }
  }
  poner(g, sprite(yo, pose, { sinMano: yo.arma === "cohete" && vuelo >= 0 }), xa, y0 - bob, false);
  if (yo.raices && (vuelo >= 0 || f >= 0)) ramas(g, xa + OX + 16, objetivo, f >= 0 ? 1 : vuelo, 1, y0 + OY + py);
  if (vuelo >= 0 && DISPARA[yo.arma] && !yo.raices) disparo(g, yo, lerp(xa + OX + px, objetivo, vuelo), y0 + OY + py - (yo.arma === "pocion" ? Math.sin(Math.PI * vuelo) * 14 : 0), 1);
  if (f >= 0 && yo.arma === "pocion") humo(g, objetivo, y0 + OY + py, f);
  if (f >= 0) chispa(g, objetivo, y0 + OY + py, f, yo.orbe || "#FBBF24");
  if (yo.arma === "naipes" && f >= 1) chispa(g, objetivo + 1, y0 + OY + py + 5, f - 1);
  if (Tm >= 1900) {
    const s = Math.floor(Tm / 200) % 3; g.fillStyle = "#FBBF24";
    [[xa + 12, y0 + 4], [xa + 26, y0 + 8], [xa + 6, y0 + 12]].forEach(([x, y], i) => { if (i !== s) { g.fillRect(x, y, 1, 3); g.fillRect(x - 1, y + 1, 3, 1); } });
  }
  g.restore();
}

/* Modo equipos: dos contra dos. La pareja de atrás pelea un poco más arriba y
   un poco desfasada; la de adelante, igual que en el duelo de uno contra uno. */
const ATRAS = -8, ADENTRO = 16
function escenaDuelo2(g, t, [a1, a2], [b1, b2]) {
  fondo(g)
  escenaDuelo(g, t + 220, a2, b2, { conFondo: false, dy: ATRAS, dx: ADENTRO })
  escenaDuelo(g, t, a1, b1, { conFondo: false })
}
function escenaGana2(g, t, [a1, a2], [b1, b2]) {
  fondo(g)
  escenaGana(g, Math.max(0, t - 160), a2, b2, { conFondo: false, dy: ATRAS, dx: ADENTRO })
  escenaGana(g, t, a1, b1, { conFondo: false })
}

/* ======================= PODIO ======================= */
const COLOR_PUESTO = [null, ["#FBBF24", "#FDE68A", "#B7791F"], ["#CBD5E1", "#F1F5F9", "#7C8594"], ["#D08A4E", "#F0B98A", "#8A5530"]];
const DIGITO = { 1: [".#.", "##.", ".#.", ".#.", "###"], 2: ["##.", "..#", ".#.", "#..", "###"], 3: ["##.", "..#", ".#.", "..#", "##."] };

/* Confeti que cae, con semilla fija para que cada pieza tenga su color y su ritmo. */
function confeti(g, t) {
  const cols = ["#F472B6", "#FBBF24", "#60A5FA", "#4ADE80", "#F97316", "#FFFFFF"];
  for (let i = 0; i < 26; i++) {
    const vel = 14 + (i * 37) % 13, x = (i * 53 + Math.sin(t / 400 + i) * 4) % W, y = ((t / 1000) * vel + i * 17) % 80 - 4;
    g.fillStyle = cols[i % cols.length]; g.fillRect(Math.round(x), Math.round(y), (i + Math.floor(t / 150)) % 2 ? 2 : 1, 1);
  }
}

/* Quien quedó en el podio: salta al salir su nombre, levanta el arma y cae confeti. */
function escenaPodio(g, t, c, puesto) {
  const Tm = reduce ? 2000 : t % 4200;
  fondo(g);
  const alto = [0, 17, 13, 10][puesto], [col, luz, sombra] = COLOR_PUESTO[puesto];
  const bx = W / 2 - 14, by = SUELO + 4 - alto;
  g.fillStyle = K; g.fillRect(bx - 1, by - 1, 30, alto + 2);
  g.fillStyle = col; g.fillRect(bx, by, 28, alto); g.fillStyle = luz; g.fillRect(bx, by, 28, 2); g.fillStyle = sombra; g.fillRect(bx, by + alto - 2, 28, 2);
  DIGITO[puesto].forEach((fila, y) => [...fila].forEach((k, x) => { if (k === "#") { g.fillStyle = K; g.fillRect(bx + 13 + x, by + Math.floor((alto - 5) / 2) + y, 1, 1); } }));
  const salto = Tm > 300 && Tm < 800 ? Math.sin(Math.PI * (Tm - 300) / 500) * 12 : 0;
  const pose = Tm < 300 ? "guardia" : "alzada";
  const bob = Tm > 900 && Math.floor(Tm / 300) % 2 ? 1 : 0;
  const x = Math.round(W / 2 - OX - 10), y = Math.round(by - OY - 30 - salto - bob);
  g.fillStyle = "rgba(10,25,12,.45)"; g.fillRect(W / 2 - 7, by - 1, 14, 1);
  poner(g, sprite(c, pose), x, y, false);
  if (Tm > 300) {
    confeti(g, t);
    const s = Math.floor(Tm / 160) % 4; g.fillStyle = "#FDE68A";
    [[x + 6, y + 6], [x + 30, y + 4], [x + 2, y + 18], [x + 34, y + 16]].forEach(([sx, sy], i) => { if (i !== s) { g.fillRect(sx, sy, 1, 3); g.fillRect(sx - 1, sy + 1, 3, 1); } });
  }
}

/* Quien no quedó en el podio: aplaude y da saltitos. */
function escenaAplauso(g, t, c) {
  const Tm = reduce ? 0 : t;
  fondo(g);
  const junta = Math.floor(Tm / 180) % 2 === 1;
  const salto = Math.floor(Tm / 360) % 4 === 1 ? 2 : 0;
  const x = Math.round(W / 2 - OX - 10), y = Y0 - salto;
  sombra(g, W / 2);
  poner(g, sprite(c, junta ? "aplauso2" : "aplauso1"), x, y, false);
  if (junta) {   // rayitas del aplauso
    const hx = x + OX + 17, hy = y + OY + 17; g.fillStyle = "#FFFFFF";
    g.fillRect(hx + 3, hy - 3, 1, 2); g.fillRect(hx + 4, hy, 2, 1); g.fillRect(hx + 3, hy + 3, 1, 2); g.fillRect(hx - 1, hy - 4, 1, 2);
  }
}


export { T as HEROES, sprite, escenaDuelo, escenaGana, escenaDuelo2, escenaGana2, escenaPodio, escenaAplauso, OX, OY }
export const heroOf = (id) => T.find((c) => c.id === id) || null
/* Para quien todavía no eligió: uno fijo según su id, así no cambia entre pantallas. */
export function heroFor(id, chosen) {
  const h = heroOf(chosen); if (h) return h
  let n = 0; for (const ch of String(id || '')) n = (n * 31 + ch.charCodeAt(0)) >>> 0
  return T[n % T.length]
}
