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

const SE = { sun:0, moon:1, mercury:2, venus:3, mars:4, jupiter:5, saturn:6, uranus:7, neptune:8, pluto:9, trueNode:11 };

function lon(seId, jd) {
  const r = sw.calc_ut(jd, seId, SEFLG);
  return ((r.data[0] % 360) + 360) % 360;
}
function julday(utc) {
  const d = new Date(utc);
  return sw.julday(d.getUTCFullYear(), d.getUTCMonth()+1, d.getUTCDate(),
    d.getUTCHours() + d.getUTCMinutes()/60 + d.getUTCSeconds()/3600, 1);
}

const BIRTH_UTC = '1986-10-25T17:15:00Z';
const birthJD = julday(BIRTH_UTC);
const birthSunLon = lon(SE.sun, birthJD);

// Amy: known correct = 6/3 profile, Sacral authority
// Iterate over offsets and MANDALA_STARTs to find valid combinations

const GATE_SEQ = [
  41,19,13,49,30,55,37,63,22,36,25,17,21,51,42, 3,
  27,24, 2,23, 8,20,16,35,45,12,15,52,39,53,62,56,
  31,33, 7, 4,29,59,40,64,47, 6,46,18,48,57,32,50,
  28,44, 1,43,14,34, 9, 5,26,11,10,58,38,54,61,60,
];
const GPG = 360/64, LPG = GPG/6;

function gl(lonVal, start) {
  const sh = ((lonVal - start) % 360 + 360) % 360;
  const gi = Math.floor(sh / GPG);
  const wg = sh - gi * GPG;
  return { gate: GATE_SEQ[gi], line: Math.min(Math.floor(wg/LPG)+1, 6) };
}

const CENTER_GATES = {
  head:[64,61,63], ajna:[47,24,4,17,43,11], throat:[62,23,56,35,12,45,33,8,31,20,16],
  g:[1,13,25,46,2,15,10,7], heart:[21,40,26,51],
  sacral:[34,5,14,29,59,9,3,42,27], spleen:[48,57,44,50,32,28,18],
  solarPlexus:[36,22,37,55,30,49,6], root:[53,60,52,19,39,41,38,54,58],
};
const GATE_CENTER = new Map();
for (const [c, gates] of Object.entries(CENTER_GATES))
  for (const g of gates) GATE_CENTER.set(g, c);

const CHANNELS = [
  [64,47],[61,24],[63,4],[17,62],[43,23],[11,56],[16,48],[20,57],
  [33,13],[8,1],[31,7],[20,10],[12,22],[35,36],[45,21],[34,20],
  [5,15],[14,2],[29,46],[34,10],[27,50],[34,57],[59,6],[9,52],
  [3,60],[42,53],[26,44],[51,25],[40,37],[28,38],[32,54],[18,58],
  [49,19],[55,39],[30,41],
];

function analyze(startDeg, offsetDeg) {
  const targetLon = ((birthSunLon - offsetDeg) + 360) % 360;
  let jd = birthJD - (offsetDeg / 0.9856) - 1;
  for (let i = 0; i < 80; i++) {
    const r = sw.calc_ut(jd, SE.sun, SEFLG);
    const cur = ((r.data[0]%360)+360)%360;
    const spd = r.data[3] > 0.01 ? r.data[3] : 0.9856;
    let diff = targetLon - cur;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (Math.abs(diff) < 0.000001) break;
    jd += diff / spd;
  }
  const designJD = jd;

  // Collect all gates from both personality and design activations
  const gates = new Set();
  for (const [name, seId] of Object.entries(SE)) {
    const pLon = lon(seId, birthJD);
    gates.add(gl(pLon, startDeg).gate);
    if (name === 'trueNode') gates.add(gl((pLon+180)%360, startDeg).gate);
    const dLon = lon(seId, designJD);
    gates.add(gl(dLon, startDeg).gate);
    if (name === 'trueNode') gates.add(gl((dLon+180)%360, startDeg).gate);
  }
  // Earth = opposite sun
  const pEarthLon = (birthSunLon + 180) % 360;
  const dSunLon = lon(SE.sun, designJD);
  const dEarthLon = (dSunLon + 180) % 360;
  gates.add(gl(pEarthLon, startDeg).gate);
  gates.add(gl(dEarthLon, startDeg).gate);

  const channels = CHANNELS.filter(([a,b]) => gates.has(a) && gates.has(b));
  const defined = new Set();
  for (const [a,b] of channels) {
    const ca = GATE_CENTER.get(a), cb = GATE_CENTER.get(b);
    if (ca) defined.add(ca);
    if (cb) defined.add(cb);
  }

  const pSun = gl(birthSunLon, startDeg);
  const dSun = gl(dSunLon, startDeg);
  const profile = `${pSun.line}/${dSun.line}`;
  const authority = !defined.size ? 'Lunar' : defined.has('solarPlexus') ? 'Emotional' :
    defined.has('sacral') ? 'Sacral' : defined.has('spleen') ? 'Splenic' : 'Other';

  return { profile, authority, pSun, dSun, defined: [...defined], channels: channels.map(([a,b])=>`${a}-${b}`) };
}

console.log('Searching for profile=6/3 + Sacral authority...\n');
const hits = [];
for (let offset = 87.5; offset <= 89.5; offset += 0.25) {
  for (let start = 265; start <= 275; start += 0.1) {
    const r = analyze(+start.toFixed(1), offset);
    if (r.profile === '6/3' && r.authority === 'Sacral') {
      hits.push({ start: +start.toFixed(1), offset, ...r });
    }
  }
}

if (hits.length === 0) {
  console.log('No exact match found. Showing closest results:');
  // Show all 6/3 profiles regardless of authority
  for (let offset = 87.5; offset <= 89.5; offset += 0.5) {
    for (let start = 265; start <= 275; start += 0.25) {
      const r = analyze(+start.toFixed(2), offset);
      if (r.profile === '6/3') {
        console.log(`START=${start.toFixed(2)} offset=${offset}° → profile=${r.profile} auth=${r.authority} channels=[${r.channels.join(',')}]`);
      }
    }
  }
} else {
  console.log(`Found ${hits.length} valid combinations:`);
  for (const h of hits.slice(0, 20)) {
    console.log(`START=${h.start} offset=${h.offset}° → profile=${h.profile} auth=${h.authority} pSun=G${h.pSun.gate}.${h.pSun.line} dSun=G${h.dSun.gate}.${h.dSun.line} channels=[${h.channels.join(',')}]`);
  }
}
