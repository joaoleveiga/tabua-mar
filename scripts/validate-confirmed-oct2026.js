#!/usr/bin/env node
// Validates the production engine (js/tide.js + js/data.js) against the
// confirmed October 2026 reference tables in data/confirmed-tides-*.json.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(root, 'js/tide.js'), 'utf8') +
  '\n;globalThis.LOCATIONS = LOCATIONS; globalThis.CONSTITUENTS = CONSTITUENTS; globalThis.getAllTidePoints = getAllTidePoints;';
eval(src);

const REGION_PORTS = {
  norte: 'leixoes',
  centro: 'aveiro',
  lisboa: 'lisboa',
  alentejo: 'sines',
  algarve: 'faro',
  madeira: 'funchal',
  acores: 'ponta-delgada'
};

const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const wrapDiff = (a, b) => { let d = a - b; if (d > 720) d -= 1440; if (d < -720) d += 1440; return d; };
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;

let grandTime = [], grandHeight = [];
for (const [region, slug] of Object.entries(REGION_PORTS)) {
  const file = path.join(root, 'data', `confirmed-tides-${slug}-2026-10.json`);
  const confirmed = JSON.parse(fs.readFileSync(file, 'utf8'));
  const location = LOCATIONS[region];
  const tErrs = [], hErrs = [];
  let unmatched = 0;

  for (const day of confirmed.days) {
    const [y, m, d] = day.date.split('-').map(Number);
    const { highs, lows } = getAllTidePoints(location, y, m, d);
    const predicted = [
      ...highs.map(e => ({ type: 'high', time: e.time, height: parseFloat(e.height) })),
      ...lows.map(e => ({ type: 'low', time: e.time, height: parseFloat(e.height) }))
    ];

    for (const ref of day.events) {
      const refMin = toMin(ref.time);
      let best = null, bestD = Infinity;
      for (const p of predicted) {
        if (p.type !== ref.type) continue;
        const dm = wrapDiff(toMin(p.time), refMin);
        if (Math.abs(dm) < Math.abs(bestD)) { bestD = dm; best = p; }
      }
      if (best && Math.abs(bestD) <= 120) {
        tErrs.push(bestD);
        hErrs.push(best.height - ref.height);
      } else {
        unmatched++;
      }
    }
  }
  grandTime.push(...tErrs); grandHeight.push(...hErrs);
  const absT = tErrs.map(Math.abs), absH = hErrs.map(Math.abs);
  console.log(
    region.padEnd(9),
    'n=' + String(tErrs.length).padStart(3),
    'time mean|err|=' + mean(absT).toFixed(1) + 'min max=' + Math.max(...absT) + 'min',
    'height mean|err|=' + mean(absH).toFixed(3) + 'm max=' + Math.max(...absH).toFixed(3) + 'm',
    'unmatched=' + unmatched
  );
}

const absT = grandTime.map(Math.abs), absH = grandHeight.map(Math.abs);
const within30 = absT.filter(t => t <= 30).length;
const within60 = absT.filter(t => t <= 60).length;
console.log('---');
console.log('ALL events=' + grandTime.length,
  'time mean|err|=' + mean(absT).toFixed(1) + 'min max=' + Math.max(...absT) + 'min',
  'height mean|err|=' + mean(absH).toFixed(3) + 'm max=' + Math.max(...absH).toFixed(3) + 'm');
console.log('within ±30min: ' + within30 + '/' + grandTime.length + ' (' + (100 * within30 / grandTime.length).toFixed(0) + '%)',
  'within ±60min: ' + within60 + '/' + grandTime.length + ' (' + (100 * within60 / grandTime.length).toFixed(0) + '%)');
