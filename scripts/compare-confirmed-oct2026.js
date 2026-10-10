#!/usr/bin/env node
// Compares the site's harmonic predictions (js/tide.js, lisboa region) against
// confirmed October 2026 reference data (data/confirmed-tides-lisboa-2026-10.json).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8') + '\n' +
            fs.readFileSync(path.join(root, 'js/tide.js'), 'utf8') + '\n;globalThis.LOCATIONS = LOCATIONS; globalThis.getAllTidePoints = getAllTidePoints;\n';
eval(src);

const confirmed = JSON.parse(fs.readFileSync(path.join(root, 'data/confirmed-tides-lisboa-2026-10.json'), 'utf8'));

const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const wrapDiff = (a, b) => { let d = a - b; if (d > 720) d -= 1440; if (d < -720) d += 1440; return d; };

let timeDiffs = [], heightDiffs = [], rows = [];
let matched = 0, missed = 0;

for (const day of confirmed.days) {
  const [y, m, d] = day.date.split('-').map(Number);
  const { highs, lows } = getAllTidePoints(LOCATIONS.lisboa, new Date(Date.UTC(y, m - 1, d)));
  const siteEvents = [
    ...highs.map(e => ({ type: 'high', time: e.time, height: parseFloat(e.height) })),
    ...lows.map(e => ({ type: 'low', time: e.time, height: parseFloat(e.height) }))
  ].sort((a, b) => toMin(a.time) - toMin(b.time));

  for (const ref of day.events) {
    const refMin = toMin(ref.time);
    let best = null, bestD = Infinity;
    for (const s of siteEvents) {
      if (s.type !== ref.type) continue;
      const dm = wrapDiff(toMin(s.time), refMin);
      if (Math.abs(dm) < Math.abs(bestD)) { bestD = dm; best = s; }
    }
    if (best && Math.abs(bestD) <= 300) {
      matched++;
      timeDiffs.push(bestD);
      heightDiffs.push(best.height - ref.height);
      rows.push(`${day.date} ${ref.type.padEnd(4)} ref ${ref.time} ${ref.height.toFixed(1)}m | site ${best.time} ${best.height.toFixed(2)}m | dt ${bestD >= 0 ? '+' : ''}${bestD}min dh ${(best.height - ref.height >= 0 ? '+' : '')}${(best.height - ref.height).toFixed(2)}m`);
    } else {
      missed++;
      rows.push(`${day.date} ${ref.type.padEnd(4)} ref ${ref.time} ${ref.height.toFixed(1)}m | NO MATCH`);
    }
  }
}

const stats = (arr) => {
  const n = arr.length;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const sorted = [...arr].sort((a, b) => a - b);
  const q = p => sorted[Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))))];
  return { n, mean, min: sorted[0], max: sorted[n - 1], p50: q(0.5), p95: q(0.95), p05: q(0.05) };
};

console.log(rows.join('\n'));
console.log('\n===== SUMMARY (lisboa region vs confirmed Oct 2026) =====');
const ts = stats(timeDiffs), hs = stats(heightDiffs);
const m = v => (v >= 0 ? '+' : '') + v.toFixed(1);
console.log(`events matched: ${matched}, unmatched: ${missed}`);
console.log(`time error (min): mean ${m(ts.mean)}, median ${m(ts.p50)}, p05 ${m(ts.p05)}, p95 ${m(ts.p95)}, range [${m(ts.min)}, ${m(ts.max)}]`);
console.log(`height error (m): mean ${m(hs.mean)}, median ${m(hs.p50)}, p05 ${m(hs.p05)}, p95 ${m(hs.p95)}, range [${m(hs.min)}, ${m(hs.max)}]`);
const within30 = timeDiffs.filter(d => Math.abs(d) <= 30).length;
const within60 = timeDiffs.filter(d => Math.abs(d) <= 60).length;
console.log(`time within ±30min: ${within30}/${ts.n} (${(100 * within30 / ts.n).toFixed(0)}%), within ±60min: ${within60}/${ts.n} (${(100 * within60 / ts.n).toFixed(0)}%)`);
