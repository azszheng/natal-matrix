// Test script — run with: node --experimental-vm-modules scripts/test-hd.mjs
// (from the NatalChart directory, after pnpm install)
// Uses require() for sweph and reimplements the core logic inline to debug.

import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const swephModule = require('sweph');
const sw = swephModule.default ?? swephModule.sweph ?? swephModule;
const c  = swephModule.constants ?? sw;

const SEFLG_SPEED  = c.SEFLG_SPEED  ?? 256;
const SEFLG_SWIEPH = c.SEFLG_SWIEPH ?? 2;

sw.set_ephe_path(path.join(__dirname, '..', 'public', 'ephemeris'));

function julday(utcIso) {
  const d = new Date(utcIso);
  return sw.julday(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(),
    d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600, 1);
}

function calcBody(bodySwId, jd) {
  const r = sw.calc_ut(jd, bodySwId, SEFLG_SPEED | SEFLG_SWIEPH);
  return { lon: ((r.data[0] % 360) + 360) % 360, speed: r.data[3] };
}

// Amy: Oct 26 1986 1:15 AM UTC+8 = Oct 25 1986 17:15 UTC
const BIRTH_UTC = '1986-10-25T17:15:00Z';
const birthJD = julday(BIRTH_UTC);
console.log('Birth JD:', birthJD.toFixed(6));

// SE body IDs (from sweph constants)
const SE_SUN  = c.SE_SUN  ?? 0;
const SE_MOON = c.SE_MOON ?? 1;
const SE_MERCURY = c.SE_MERCURY ?? 2;
const SE_VENUS   = c.SE_VENUS   ?? 3;
const SE_MARS    = c.SE_MARS    ?? 4;
const SE_JUPITER = c.SE_JUPITER ?? 5;
const SE_SATURN  = c.SE_SATURN  ?? 6;
const SE_URANUS  = c.SE_URANUS  ?? 7;
const SE_NEPTUNE = c.SE_NEPTUNE ?? 8;
const SE_PLUTO   = c.SE_PLUTO   ?? 9;
const SE_TRUE_NODE = c.SE_TRUE_NODE ?? 11;

const birthSun = calcBody(SE_SUN, birthJD);
console.log('Birth Sun lon:', birthSun.lon.toFixed(6), '°');

// Design = 88.736° solar arc before birth
const targetLon = ((birthSun.lon - 88.736) + 360) % 360;
console.log('Target design sun lon (88.736° before):', targetLon.toFixed(6), '°');

let designJD = birthJD - 89.3;
for (let i = 0; i < 100; i++) {
  const r = sw.calc_ut(designJD, SE_SUN, SEFLG_SPEED | SEFLG_SWIEPH);
  const cur = ((r.data[0] % 360) + 360) % 360;
  const speed = r.data[3] > 0.01 ? r.data[3] : 0.9856;
  let diff = targetLon - cur;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  if (Math.abs(diff) < 0.00001) break;
  designJD += diff / speed;
}
const designSun = calcBody(SE_SUN, designJD);
console.log('Design JD:', designJD.toFixed(6));
console.log('Design Sun lon:', designSun.lon.toFixed(6), '°');

// Gate sequence
const GATE_SEQUENCE = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42,  3,
  27, 24,  2, 23,  8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33,  7,  4, 29, 59, 40, 64, 47,  6, 46, 18, 48, 57, 32, 50,
  28, 44,  1, 43, 14, 34,  9,  5, 26, 11, 10, 58, 38, 54, 61, 60,
];
const DEG_PER_GATE = 360 / 64; // 5.625°
const DEG_PER_LINE = DEG_PER_GATE / 6; // 0.9375°

function lonToGateLine(lon, start) {
  const normalized = ((lon % 360) + 360) % 360;
  const shifted    = ((normalized - start) + 360) % 360;
  const gateIndex  = Math.floor(shifted / DEG_PER_GATE);
  const withinGate = shifted - gateIndex * DEG_PER_GATE;
  const line       = Math.min(Math.floor(withinGate / DEG_PER_LINE) + 1, 6);
  return { gate: GATE_SEQUENCE[gateIndex], line, gateIndex, shifted: shifted.toFixed(4) };
}

// Test with different MANDALA_START values
console.log('\n--- Testing MANDALA_START values ---');
for (const start of [268.30, 269.25, 270.00]) {
  const pSun = lonToGateLine(birthSun.lon, start);
  const dSun = lonToGateLine(designSun.lon, start);
  console.log(`MANDALA_START=${start}: pSun=Gate ${pSun.gate}.${pSun.line}  dSun=Gate ${dSun.gate}.${dSun.line}  → Profile ${pSun.line}/${dSun.line}`);
}

// With current value (268.30), show all planet activations
console.log('\n--- Personality activations (birth, MANDALA_START=268.30) ---');
const BODIES = {
  sun: SE_SUN, moon: SE_MOON, mercury: SE_MERCURY, venus: SE_VENUS,
  mars: SE_MARS, jupiter: SE_JUPITER, saturn: SE_SATURN,
  uranus: SE_URANUS, neptune: SE_NEPTUNE, pluto: SE_PLUTO,
  northNode: SE_TRUE_NODE,
};

const pActivations = {};
for (const [name, seId] of Object.entries(BODIES)) {
  const r = sw.calc_ut(birthJD, seId, SEFLG_SPEED | SEFLG_SWIEPH);
  let lon = ((r.data[0] % 360) + 360) % 360;
  if (name === 'southNode') lon = (lon + 180) % 360;
  const gl = lonToGateLine(lon, 268.30);
  pActivations[name] = gl;
  console.log(`  ${name.padEnd(12)}: lon=${lon.toFixed(3)}°  Gate ${gl.gate}.${gl.line}`);
}
// Earth = opposite sun
const earthLon = (birthSun.lon + 180) % 360;
const earthGL  = lonToGateLine(earthLon, 268.30);
console.log(`  earth       : lon=${earthLon.toFixed(3)}°  Gate ${earthGL.gate}.${earthGL.line}`);
// South Node
const nnR = sw.calc_ut(birthJD, SE_TRUE_NODE, SEFLG_SPEED | SEFLG_SWIEPH);
const snLon = (((nnR.data[0] % 360) + 360) % 360 + 180) % 360;
const snGL  = lonToGateLine(snLon, 268.30);
console.log(`  southNode   : lon=${snLon.toFixed(3)}°  Gate ${snGL.gate}.${snGL.line}`);

console.log('\n--- Design activations (design JD, MANDALA_START=268.30) ---');
const dActivations = {};
for (const [name, seId] of Object.entries(BODIES)) {
  const r = sw.calc_ut(designJD, seId, SEFLG_SPEED | SEFLG_SWIEPH);
  let lon = ((r.data[0] % 360) + 360) % 360;
  const gl = lonToGateLine(lon, 268.30);
  dActivations[name] = gl;
  console.log(`  ${name.padEnd(12)}: lon=${lon.toFixed(3)}°  Gate ${gl.gate}.${gl.line}`);
}
const dEarthLon = (designSun.lon + 180) % 360;
const dEarthGL  = lonToGateLine(dEarthLon, 268.30);
console.log(`  earth       : lon=${dEarthLon.toFixed(3)}°  Gate ${dEarthGL.gate}.${dEarthGL.line}`);
const dNNR = sw.calc_ut(designJD, SE_TRUE_NODE, SEFLG_SPEED | SEFLG_SWIEPH);
const dSNLon = (((dNNR.data[0] % 360) + 360) % 360 + 180) % 360;
const dSNGL  = lonToGateLine(dSNLon, 268.30);
console.log(`  southNode   : lon=${dSNLon.toFixed(3)}°  Gate ${dSNGL.gate}.${dSNGL.line}`);

// All defined gates → channels
const CHANNELS = [
  [64,47],[61,24],[63,4],[17,62],[43,23],[11,56],[16,48],[20,57],
  [33,13],[8,1],[31,7],[20,10],[12,22],[35,36],[45,21],[34,20],
  [5,15],[14,2],[29,46],[34,10],[27,50],[34,57],[59,6],[9,52],
  [3,60],[42,53],[26,44],[51,25],[40,37],[28,38],[32,54],[18,58],
  [49,19],[55,39],[30,41],
];

const allGatesSet = new Set([
  lonToGateLine(birthSun.lon, 268.30).gate,
  earthGL.gate,
  lonToGateLine(((nnR.data[0]%360)+360)%360, 268.30).gate,
  snGL.gate,
]);
// Add all other planets' gates for personality
for (const [name, seId] of Object.entries(BODIES)) {
  if (name === 'northNode') continue;
  const r = sw.calc_ut(birthJD, seId, SEFLG_SPEED | SEFLG_SWIEPH);
  const lon = ((r.data[0] % 360) + 360) % 360;
  allGatesSet.add(lonToGateLine(lon, 268.30).gate);
}
// South node personality
allGatesSet.add(snGL.gate);
// Design planets
for (const [name, seId] of Object.entries(BODIES)) {
  const r = sw.calc_ut(designJD, seId, SEFLG_SPEED | SEFLG_SWIEPH);
  const lon = ((r.data[0] % 360) + 360) % 360;
  allGatesSet.add(lonToGateLine(lon, 268.30).gate);
}
allGatesSet.add(dEarthGL.gate);
allGatesSet.add(dSNGL.gate);

console.log('\n--- Defined gates ---');
console.log([...allGatesSet].sort((a,b)=>a-b).join(', '));

console.log('\n--- Active channels ---');
const activeChannels = CHANNELS.filter(([a, b]) => allGatesSet.has(a) && allGatesSet.has(b));
for (const [a, b] of activeChannels) console.log(`  ${a}-${b}`);

// Check Solar Plexus gates
const SP_GATES = [36, 22, 37, 55, 30, 49, 6];
const sacral_GATES = [34, 5, 14, 29, 59, 9, 3, 42, 27];
const spDefined = activeChannels.some(([a,b]) => SP_GATES.includes(a) || SP_GATES.includes(b));
console.log('\nSolar Plexus center involved in any channel?', spDefined);

const sacralDefined = activeChannels.some(([a,b]) => sacral_GATES.includes(a) || sacral_GATES.includes(b));
console.log('Sacral center involved in any channel?', sacralDefined);
