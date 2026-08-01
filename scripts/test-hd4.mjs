// Test specific parameter combinations to find the right one
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

const GATE_SEQ = [
  41,19,13,49,30,55,37,63,22,36,25,17,21,51,42, 3,
  27,24, 2,23, 8,20,16,35,45,12,15,52,39,53,62,56,
  31,33, 7, 4,29,59,40,64,47, 6,46,18,48,57,32,50,
  28,44, 1,43,14,34, 9, 5,26,11,10,58,38,54,61,60,
];
const GPG = 360/64, LPG = GPG/6;

function lonToGL(lonVal, START) {
  const normalized = ((lonVal % 360) + 360) % 360;
  const shifted    = ((normalized - START) + 360) % 360;
  const gateIndex  = Math.floor(shifted / GPG);
  const withinGate = shifted - gateIndex * GPG;
  const line       = Math.min(Math.floor(withinGate / LPG) + 1, 6);
  return { gate: GATE_SEQ[gateIndex], line, shifted, gateIndex, withinGate };
}

function rawLon(seId, jd) {
  const r = sw.calc_ut(jd, seId, SEFLG);
  return { lon: ((r.data[0] % 360) + 360) % 360, speed: r.data[3] };
}

function julday(utc) {
  const d = new Date(utc);
  return sw.julday(d.getUTCFullYear(), d.getUTCMonth()+1, d.getUTCDate(),
    d.getUTCHours() + d.getUTCMinutes()/60 + d.getUTCSeconds()/3600, 1);
}

const SE = { sun:0, moon:1, mercury:2, venus:3, mars:4, jupiter:5, saturn:6, uranus:7, neptune:8, pluto:9, trueNode:11 };
const HD_ORDER = ['sun','earth','northNode','southNode','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];

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
for (const [center, gates] of Object.entries(CENTER_GATES))
  for (const g of gates) GATE_CENTER.set(g, center);

const BIRTH_UTC = '1986-10-25T17:15:00Z';
const birthJD = julday(BIRTH_UTC);

function analyze(START, OFFSET) {
  const { lon: birthSunLon } = rawLon(SE.sun, birthJD);
  const targetLon = ((birthSunLon - OFFSET) + 360) % 360;
  let designJD = birthJD - 89.3;
  for (let i = 0; i < 80; i++) {
    const { lon: cur, speed } = rawLon(SE.sun, designJD);
    let diff = targetLon - cur;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (Math.abs(diff) < 0.000001) break;
    designJD += diff / (speed > 0.01 ? speed : 0.9856);
  }

  function activations(jd) {
    const sunLon       = rawLon(SE.sun,      jd).lon;
    const moonLon      = rawLon(SE.moon,     jd).lon;
    const mercLon      = rawLon(SE.mercury,  jd).lon;
    const venLon       = rawLon(SE.venus,    jd).lon;
    const marLon       = rawLon(SE.mars,     jd).lon;
    const jupLon       = rawLon(SE.jupiter,  jd).lon;
    const satLon       = rawLon(SE.saturn,   jd).lon;
    const urLon        = rawLon(SE.uranus,   jd).lon;
    const nepLon       = rawLon(SE.neptune,  jd).lon;
    const pluLon       = rawLon(SE.pluto,    jd).lon;
    const nnLon        = rawLon(SE.trueNode, jd).lon;
    const lonMap = {
      sun: sunLon, earth: (sunLon+180)%360, northNode: nnLon, southNode: (nnLon+180)%360,
      moon: moonLon, mercury: mercLon, venus: venLon, mars: marLon,
      jupiter: jupLon, saturn: satLon, uranus: urLon, neptune: nepLon, pluto: pluLon,
    };
    return HD_ORDER.map(planet => {
      const lon = lonMap[planet];
      const gl = lonToGL(lon, START);
      return { planet, longitude: lon, gate: gl.gate, line: gl.line };
    });
  }

  const personality = activations(birthJD);
  const design = activations(designJD);

  const pSun = personality.find(a=>a.planet==='sun');
  const dSun = design.find(a=>a.planet==='sun');
  const dMoon = design.find(a=>a.planet==='moon');

  const allGates = new Set([...personality.map(a=>a.gate), ...design.map(a=>a.gate)]);
  const activeChannels = CHANNELS.filter(([a,b]) => allGates.has(a) && allGates.has(b));
  const definedCenters = new Set();
  for (const [a,b] of activeChannels) {
    const ca = GATE_CENTER.get(a), cb = GATE_CENTER.get(b);
    if (ca) definedCenters.add(ca);
    if (cb) definedCenters.add(cb);
  }

  // BFS for definition
  const unvisited = new Set(definedCenters);
  let components = 0;
  while (unvisited.size > 0) {
    components++;
    const start = unvisited.values().next().value;
    const queue = [start]; unvisited.delete(start);
    while (queue.length > 0) {
      const cur = queue.shift();
      for (const [a,b] of activeChannels) {
        const ca = GATE_CENTER.get(a), cb = GATE_CENTER.get(b);
        if (ca===cur && cb && unvisited.has(cb)) { queue.push(cb); unvisited.delete(cb); }
        if (cb===cur && ca && unvisited.has(ca)) { queue.push(ca); unvisited.delete(ca); }
      }
    }
  }
  const defLabel = ['None','Single','Split','Triple Split','Quadruple Split'][Math.min(components, 4)];

  const hasSP = definedCenters.has('solarPlexus');
  const hasSacral = definedCenters.has('sacral');
  const auth = !definedCenters.size ? 'Lunar' : hasSP ? 'Emotional' : hasSacral ? 'Sacral' : 'Other';

  return {
    profile: `${pSun.line}/${dSun.line}`,
    auth,
    definition: defLabel,
    components,
    channels: activeChannels.map(([a,b])=>`${a}-${b}`),
    centers: [...definedCenters],
    pSunGate: `G${pSun.gate}.${pSun.line}`,
    dSunGate: `G${dSun.gate}.${dSun.line}`,
    dMoonGate: `G${dMoon.gate}.${dMoon.line}`,
    dSunLon: rawLon(SE.sun, designJD).lon,
    personality: personality.map(a=>`${a.planet.padEnd(11)}: G${a.gate}.${a.line}`),
    design: design.map(a=>`${a.planet.padEnd(11)}: G${a.gate}.${a.line}`),
  };
}

// Test the combinations that interest us
const tests = [
  { START: 274.0, OFFSET: 88.0,   label: 'Current (6/2 but 8-1 etc active)' },
  { START: 274.0, OFFSET: 87.5,   label: 'Fix profile: 87.5° offset' },
  { START: 274.0, OFFSET: 87.75,  label: 'Fix profile: 87.75° offset' },
  { START: 273.9, OFFSET: 87.5,   label: 'test-hd2 claimed Split' },
];

for (const { START, OFFSET, label } of tests) {
  const r = analyze(START, OFFSET);
  console.log(`\n=== ${label} ===`);
  console.log(`START=${START}, OFFSET=${OFFSET}°`);
  console.log(`Profile: ${r.profile}  Auth: ${r.auth}  Definition: ${r.definition} (${r.components} components)`);
  console.log(`pSun=${r.pSunGate}  dSun=${r.dSunGate}  dMoon=${r.dMoonGate}`);
  console.log(`Channels: ${r.channels.join(', ')}`);
  console.log(`Centers: ${r.centers.join(', ')}`);
  console.log('\nPersonality activations:');
  r.personality.forEach(a => console.log('  ' + a));
  console.log('Design activations:');
  r.design.forEach(a => console.log('  ' + a));
}
