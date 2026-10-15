#!/usr/bin/env node
// Test suite for the static site: translations, generated pages, links,
// structured data and the build script itself. Zero dependencies.
// Run: node scripts/test.js  (builds pages into a temp dir first)

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const SITE = 'https://joaoleveiga.github.io/tabua-mar';
const REGIONS = ['norte', 'centro', 'lisboa', 'alentejo', 'algarve', 'madeira', 'acores'];

let passed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`  ${name}\n    ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

// ---------- 1. Translation dictionaries ----------
const pt = JSON.parse(fs.readFileSync(path.join(root, 'js/translations/pt_PT.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(root, 'js/translations/en_GB.json'), 'utf8'));

test('both languages have identical keys', () => {
  const pk = Object.keys(pt).sort();
  const ek = Object.keys(en).sort();
  const onlyPt = pk.filter(k => !ek.includes(k));
  const onlyEn = ek.filter(k => !pk.includes(k));
  assert(onlyPt.length === 0 && onlyEn.length === 0,
    `key mismatch — only in pt: ${onlyPt.join(', ')}; only in en: ${onlyEn.join(', ')}`);
});

const I18N_KEYS = [
  'title', 'subtitle', 'location_label', 'date_label', 'select_location',
  'tide_predictions', 'tide', 'hour', 'height', 'high', 'low',
  'predictions_note', 'select_prompt', 'error', 'please_select', 'skip_link',
  'privacy_policy', 'gplv3', 'moon_phase', 'meta_description', 'intro_title',
  'intro_text', 'regions_title', 'regions_intro', 'region_ref_port',
  'how_it_works_title', 'how_it_works_text', 'faq_title',
  'faq_q1', 'faq_a1', 'faq_q2', 'faq_a2', 'faq_q3', 'faq_a3',
  'home_title', 'other_language', 'tides_of', 'other_regions_title',
  'region_title', 'region_meta_description', 'region_h1', 'region_intro',
  'forecast_title', 'region_tool_title', 'back_home'
];

for (const key of I18N_KEYS) {
  test(`pt_PT has non-empty "${key}"`, () => {
    assert(typeof pt[key] === 'string' && pt[key].trim().length > 0, `missing or empty`);
  });
  test(`en_GB has non-empty "${key}"`, () => {
    assert(typeof en[key] === 'string' && en[key].trim().length > 0, `missing or empty`);
  });
}

test('region_display tables cover all 7 regions in both languages', () => {
  for (const dict of [pt, en]) {
    assert(dict.region_display && typeof dict.region_display === 'object', 'region_display missing');
    for (const r of REGIONS) {
      assert(dict.region_display[r] && dict.region_display[r].trim().length > 0,
        `region_display.${r} missing or empty`);
    }
  }
});

// ---------- 2. Generated pages ----------
const buildDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'tabua-mar-test-'));
execFileSync('node', [path.join(root, 'scripts/build-pages.js')], {
  env: { ...process.env, TABUA_OUTPUT_DIR: buildDir },
  stdio: 'pipe'
});

const read = p => fs.readFileSync(path.join(buildDir, p), 'utf8');

test('build script honours TABUA_OUTPUT_DIR', () => {
  assert(fs.existsSync(path.join(buildDir, 'index.html')), 'index.html not written to temp dir');
});

const pages = [
  'index.html', 'en/index.html', 'sitemap.xml',
  ...REGIONS.map(r => `mares/${r}/index.html`),
  ...REGIONS.map(r => `en/tides/${r}/index.html`)
];

for (const page of pages) {
  test(`generated: ${page}`, () => {
    assert(fs.existsSync(path.join(buildDir, page)), 'file not generated');
  });
}

// Region page content checks
for (const r of REGIONS) {
  test(`pt region page ${r}: title, lang, canonical, tables`, () => {
    const html = read(`mares/${r}/index.html`);
    assert(html.startsWith('<!DOCTYPE html>'), 'no doctype');
    assert(/<html lang="pt-PT"/.test(html), 'wrong html lang');
    assert(html.includes(`rel="canonical" href="${SITE}/mares/${r}/"`), 'missing/incorrect canonical');
    assert(html.includes(`rel="alternate" hreflang="en-GB" href="${SITE}/en/tides/${r}/"`), 'missing en hreflang');
    const tables = (html.match(/<table class="tide-table">/g) || []).length;
    assert(tables === 14, `expected 14 forecast tables, found ${tables}`);
    assert(/<tr><td>Preia-mar<\/td>/.test(html), 'no Preia-mar rows in forecast');
    assert(/<tr><td>Baixa-mar<\/td>/.test(html), 'no Baixa-mar rows in forecast');
    assert(!html.includes('tide_predictions</h2>'), 'raw translation key leaked into static HTML');
    assert(html.includes('data-location="' + r + '"'), 'missing data-location preset');
  });

  test(`en region page ${r}: title, lang, canonical, tables`, () => {
    const html = read(`en/tides/${r}/index.html`);
    assert(/<html lang="en-GB"/.test(html), 'wrong html lang');
    assert(html.includes(`rel="canonical" href="${SITE}/en/tides/${r}/"`), 'missing/incorrect canonical');
    assert(/<tr><td>High<\/td>/.test(html), 'no High rows in forecast');
    assert(!/\{region\}|\{port\}|\{date\}/.test(html), 'unreplaced template placeholder');
  });
}

// Home page checks
test('pt home: lang, intro section after results, no raw keys', () => {
  const html = read('index.html');
  assert(/<html lang="pt-PT" data-lang="pt_PT">/.test(html), 'missing lang attributes');
  const resultsIdx = html.indexOf('id="results"');
  const introIdx = html.indexOf('id="intro"');
  assert(resultsIdx !== -1 && introIdx !== -1 && introIdx > resultsIdx, 'intro section must come after results');
  assert(html.includes('Sobre este site'), 'intro title not localized');
  for (const key of ['tide_predictions', 'regions_title', 'faq_title']) {
    assert(!html.includes(`>${key}<`), `raw key "${key}" leaked`);
  }
});

test('en home: lang, links to pt home', () => {
  const html = read('en/index.html');
  assert(/<html lang="en-GB" data-lang="en_GB">/.test(html), 'missing lang attributes');
  assert(html.includes('hreflang="pt-PT" href="https://joaoleveiga.github.io/tabua-mar/"'), 'missing pt hreflang link');
});

test('no language <select> on any generated page', () => {
  const all = ['index.html', 'en/index.html',
    ...REGIONS.map(r => `mares/${r}/index.html`),
    ...REGIONS.map(r => `en/tides/${r}/index.html`)];
  for (const p of all) {
    assert(!read(p).includes('id="language"'), `${p} still has a language select`);
  }
});

// Internal links resolve to generated pages or repo source assets
function resolveLink(href, fromPage) {
  if (/^https?:/.test(href)) {
    if (!href.startsWith(SITE + '/')) return null; // external
    href = href.slice(SITE.length); // site-absolute -> treat as root-relative
  }
  const pageDir = path.dirname(path.join(buildDir, fromPage));
  let rel = href.replace(/^\/tabua-mar\//, '').replace(/^\//, '');
  let target;
  if (href.startsWith('/')) {
    target = rel.endsWith('/') ? path.join(buildDir, rel, 'index.html') : path.join(buildDir, rel);
    if (!fs.existsSync(target)) target = rel.endsWith('/') ? path.join(root, rel, 'index.html') : path.join(root, rel);
  } else {
    target = path.resolve(pageDir, rel.endsWith('/') ? rel + 'index.html' : rel);
    if (!fs.existsSync(target)) {
      target = path.resolve(path.join(root, path.dirname(fromPage)), rel.endsWith('/') ? rel + 'index.html' : rel);
    }
  }
  if (!fs.existsSync(target) && !rel.endsWith('.html')) target = path.join(root, rel);
  return target;
}

for (const page of ['index.html', 'en/index.html',
  ...REGIONS.map(r => `mares/${r}/index.html`),
  ...REGIONS.map(r => `en/tides/${r}/index.html`)]) {
  test(`all links on ${page} resolve`, () => {
    const html = read(page);
    const links = [...html.matchAll(/href="([^"#]+)"/g)].map(m => m[1]);
    assert(links.length >= 5, `too few links: ${links.length}`);
    for (const l of links) {
      const target = resolveLink(l, page);
      assert(target !== null, `cannot resolve external link: ${l}`);
      assert(fs.existsSync(target), `broken link: ${l}`);
    }
  });
}

// JSON-LD parses on every page
test('JSON-LD parses on all generated pages', () => {
  const all = ['index.html', 'en/index.html',
    ...REGIONS.map(r => `mares/${r}/index.html`),
    ...REGIONS.map(r => `en/tides/${r}/index.html`)];
  for (const p of all) {
    const html = read(p);
    const blocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
    assert(blocks.length >= 1, `${p}: no JSON-LD`);
    for (const b of blocks) {
      JSON.parse(b.replace(/<\/?script[^>]*>/g, ''));
    }
  }
});

// Sitemap
test('sitemap lists 17 URLs with hreflang pairs, all valid XML', () => {
  const xml = read('sitemap.xml');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert(locs.length === 17, `expected 17 URLs, found ${locs.length}`);
  assert(locs.includes(`${SITE}/`), 'missing pt home');
  assert(locs.includes(`${SITE}/en/`), 'missing en home');
  for (const r of REGIONS) {
    assert(locs.includes(`${SITE}/mares/${r}/`), `missing /mares/${r}/`);
    assert(locs.includes(`${SITE}/en/tides/${r}/`), `missing /en/tides/${r}/`);
  }
  assert(!/[<>&](?!amp;|lt;|gt;|#)/.test(xml.replace(/<[^>]+>/g, '')), 'unescaped entity');
});

// Tide engine sanity inside generated pages
test('forecast tables contain plausible heights and times', () => {
  const html = read('mares/lisboa/index.html');
  const heights = [...html.matchAll(/<td>(\d+\.\d\d) m<\/td>/g)].map(m => parseFloat(m[1]));
  assert(heights.length >= 50, `too few tide rows: ${heights.length} (expected >=50 for 14 days)`);
  for (const h of heights) {
    assert(h > -1 && h < 7, `implausible height: ${h}`);
  }
  const times = [...html.matchAll(/<td>(\d{2}:\d{2})<\/td>/g)].map(m => m[1]);
  for (const t of times) {
    const [hh, mm] = t.split(':').map(Number);
    assert(hh <= 23 && mm <= 59, `invalid time: ${t}`);
  }
});

// ---------- 3. Report ----------
console.log(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) {
  console.log('FAILURES:');
  failures.forEach(f => console.log(f));
  process.exit(1);
}
fs.rmSync(buildDir, { recursive: true, force: true });
