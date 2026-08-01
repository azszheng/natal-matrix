// Exact replica of the humandesign.ts logic with current constants
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const swephModule = require('sweph');
const sw = swephModule.default ?? swephModule.sweph ?? swephModule;
const c  = swephModule.constants ?? sw;
const SEFLG = (c.SEFLG_SPEED ?? 256) | (c.SEFLG_SWIEPH ?? 2);
sw.set_ephe_path(path.join(__dirname, '..', 'public', 'ephemeris'));

// ── Constants matching current humandesign.ts ─────────────────────────────────
const MANDALA_START = 274.0;   // as fixed
const DESIGN_OFFSET = 88.0;   // as fixed

const GATE_SEQ = [
  41,19,13,49,30,55,37,63,22,36,25,17,21,51,42, 3,
  27,24, 2,23, 8,20,16,35,45,12,15,52,39,53,62,56,
  31,33, 7, 4,29,59,40,64,47, 6,46,18,48,57,32,50,
  28,44, 1,43,14,34, 9, 5,26,11,10,58,38,54,61,60,
];
const GPG = 360/64, LPG = GPG/6;

function lonToGL(lonVal) {
  const normalized = ((lonVal % 360) + 360) % 360;
  const shifted    = ((normalized - MANDALA_START) + 360) % 360;
  const gateIndex  = Math.floor(shifted / GPG);
  const withinGate = shifted - gateIndex * GPG;
  const line       = Math.min(Math.floor(withinGate / LPG) + 1, 6);
  return { gate: GATE_SEQ[gateIndex], line };
}

function rawLon(seId, jd) {
  const r = sw.calc_ut(jd, seId, SEFLG);
  return ((r.data[0] % 360) + 360) % 360;
}

function julday(utc) {
  const d = new Date(utc);
  return sw.julday(d.getUTCFullYear(), d.getUTCMonth()+1, d.getUTCDate(),
    d.getUTCHours() + d.getUTCMinutes()/60 + d.getUTCSeconds()/3600, 1);
}

const SE = { sun:0, moon:1, mercury:2, venus:3, mars:4, jupiter:5, saturn:6, uranus:7, neptune:8, pluto:9, trueNode:11 };
const HD_ORDER = ['sun','earth','northNode','southNode','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];

function computeActivations(jd) {
  const sunLon       = rawLon(SE.sun,      jd);
  const moonLon      = rawLon(SE.moon,     jd);
  const mercLon      = rawLon(SE.mercury,  jd);
  const venLon       = rawLon(SE.venus,    jd);
  const marLon       = rawLon(SE.mars,     jd);
  const jupLon       = rawLon(SE.jupiter,  jd);
  const satLon       = rawLon(SE.saturn,   jd);
  const urLon        = rawLon(SE.uranus,   jd);
  const nepLon       = rawLon(SE.neptune,  jd);
  const pluLon       = rawLon(SE.pluto,    jd);
  const nnLon        = rawLon(SE.trueNode, jd);

  const lonMap = {
    sun:       sunLon,
    earth:     (sunLon + 180) % 360,
    northNode: nnLon,
    southNode: (nnLon + 180) % 360,
    moon:      moonLon,
    mercury:   mercLon,
    venus:     venLon,
    mars:      marLon,
    jupiter:   jupLon,
    saturn:    satLon,
    uranus:    urLon,
    neptune:   nepLon,
    pluto:     pluLon,
  };

  return HD_ORDER.map(planet => {
    const lon = lonMap[planet];
    const { gate, line } = lonToGL(lon);
    return { planet, longitude: lon, gate, line };
  });
}

const BIRTH_UTC = '1986-10-25T17:15:00Z';
const birthJD = julday(BIRTH_UTC);

// Find design JD (88.0° before birth sun)
const birthSunLon = rawLon(SE.sun, birthJD);
const targetLon = ((birthSunLon - DESIGN_OFFSET) + 360) % 360;
let designJD = birthJD - 89.3;
for (let i = 0; i < 50; i++) {
  const r = sw.calc_ut(designJD, SE.sun, SEFLG);
  const cur = ((r.data[0] % 360) + 360) % 360;
  const speed = r.data[3] > 0.01 ? r.data[3] : 0.9856;
  let diff = targetLon - cur;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  if (Math.abs(diff) < 0.000001) break;
  designJD += diff / speed;
}

const personality = computeActivations(birthJD);
const design      = computeActivations(designJD);

const pSun   = personality.find(a => a.planet === 'sun');
const dSun   = design.find(a => a.planet === 'sun');
const pEarth = personality.find(a => a.planet === 'earth');
const dEarth = design.find(a => a.planet === 'earth');

console.log('MANDALA_START:', MANDALA_START, '  offset:', DESIGN_OFFSET);
console.log('Birth Sun lon:', birthSunLon.toFixed(4), '°');
console.log('Design Sun lon:', rawLon(SE.sun, designJD).toFixed(4), '°');
console.log('');
console.log('Personality (Conscious):');
personality.forEach(a => console.log(`  ${a.planet.padEnd(12)}: Gate ${a.gate}.${a.line}`));
console.log('');
console.log('Design (Unconscious):');
design.forEach(a => console.log(`  ${a.planet.padEnd(12)}: Gate ${a.gate}.${a.line}`));
console.log('');
console.log(`Profile: ${pSun.line}/${dSun.line}`);
console.log(`Cross: [${pSun.gate}, ${pEarth.gate}, ${dSun.gate}, ${dEarth.gate}]`);

// Channels
const CHANNELS = [
  [64,47],[61,24],[63,4],[17,62],[43,23],[11,56],[16,48],[20,57],
  [33,13],[8,1],[31,7],[20,10],[12,22],[35,36],[45,21],[34,20],
  [5,15],[14,2],[29,46],[34,10],[27,50],[34,57],[59,6],[9,52],
  [3,60],[42,53],[26,44],[51,25],[40,37],[28,38],[32,54],[18,58],
  [49,19],[55,39],[30,41],
];
const CENTER_GATES = {
  head:[64,61,63], ajna:[47,24,4,17,43,11], throat:[62,23,56,35,12,45,33,8,31,20,16],
  g:[1,13,25,46,2,15,10,7], heart:[21,40,26,51],
  sacral:[34,5,14,29,59,9,3,42,27], spleen:[48,57,44,50,32,28,18],
  solarPlexus:[36,22,37,55,30,49,6], root:[53,60,52,19,39,41,38,54,58],
};
const GATE_CENTER = new Map();
for (const [c, gates] of Object.entries(CENTER_GATES))
  for (const g of gates) GATE_CENTER.set(g, c);

const allGates = new Set([...personality.map(a=>a.gate), ...design.map(a=>a.gate)]);
console.log('\nAll defined gates:', [...allGates].sort((a,b)=>a-b).join(', '));

const activeChannels = CHANNELS.filter(([a,b]) => allGates.has(a) && allGates.has(b));
console.log('Active channels:', activeChannels.map(([a,b])=>`${a}-${b}`).join(', '));

const definedCenters = new Set();
for (const [a,b] of activeChannels) {
  const ca = GATE_CENTER.get(a), cb = GATE_CENTER.get(b);
  if (ca) definedCenters.add(ca);
  if (cb) definedCenters.add(cb);
}
console.log('Defined centers:', [...definedCenters].join(', '));

// Definition (connectivity check)
const unvisited = new Set(definedCenters);
let components = 0;
while (unvisited.size > 0) {
  components++;
  const start = unvisited.values().next().value;
  const queue = [start];
  unvisited.delete(start);
  while (queue.length > 0) {
    const cur = queue.shift();
    for (const [a,b] of activeChannels) {
      const ca = GATE_CENTER.get(a), cb = GATE_CENTER.get(b);
      if (ca === cur && cb && unvisited.has(cb)) { queue.push(cb); unvisited.delete(cb); }
      if (cb === cur && ca && unvisited.has(ca)) { queue.push(ca); unvisited.delete(ca); }
    }
  }
}
const defLabel = components === 1 ? 'Single' : components === 2 ? 'Split' : components === 3 ? 'Triple Split' : 'Quadruple Split';
console.log(`Definition: ${defLabel} (${components} components)`);

// Authority
const hasSP = definedCenters.has('solarPlexus');
const hasSacral = definedCenters.has('sacral');
const hasSpleen = definedCenters.has('spleen');
console.log('Authority:', !definedCenters.size ? 'Lunar' : hasSP ? 'Emotional' : hasSacral ? 'Sacral' : hasSpleen ? 'Splenic' : 'Other');

// Type
const hasSacralCenter = definedCenters.has('sacral');
const hasThroat = definedCenters.has('throat');
console.log('Type hint: Sacral defined=', hasSacralCenter, ' Throat defined=', hasThroat);
