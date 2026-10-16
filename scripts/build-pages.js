#!/usr/bin/env node
// Generates static i18n and per-region pages from js/data.js + js/tide.js,
// pre-rendering the next 14 days of tide tables per region for crawlers.
// Also regenerates sitemap.xml with hreflang alternates. Zero dependencies.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const outDir = process.env.TABUA_OUTPUT_DIR || root;
const SITE = 'https://joaoleveiga.github.io/tabua-mar';

const src = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(root, 'js/tide.js'), 'utf8') + '\n' +
  ';globalThis.LOCATIONS = LOCATIONS; globalThis.getAllTidePoints = getAllTidePoints;';
eval(src);

const T = {
  pt_PT: JSON.parse(fs.readFileSync(path.join(root, 'js/translations/pt_PT.json'), 'utf8')),
  en_GB: JSON.parse(fs.readFileSync(path.join(root, 'js/translations/en_GB.json'), 'utf8'))
};

const LANGS = [
  { key: 'pt_PT', code: 'pt-PT', dir: '', pages: 'mares', homeTitle: T.pt_PT.home_title },
  { key: 'en_GB', code: 'en-GB', dir: 'en', pages: 'tides', homeTitle: T.en_GB.home_title }
];

const SLUGS = {
  norte: 'norte', centro: 'centro', lisboa: 'lisboa', alentejo: 'alentejo',
  algarve: 'algarve', madeira: 'madeira', acores: 'acores'
};

const escapeHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pad = n => String(n).padStart(2, '0');

// Language switch: always "PT | EN", current language highlighted and disabled.
function langSwitch(lang, ptUrl, enUrl) {
  const ptActive = lang.key === 'pt_PT';
  const ptLink = ptActive
    ? '<span class="lang-active" aria-current="true">PT</span>'
    : `<a hreflang="pt-PT" href="${ptUrl}">PT</a>`;
  const enLink = ptActive
    ? `<a hreflang="en-GB" href="${enUrl}">EN</a>`
    : '<span class="lang-active" aria-current="true">EN</span>';
  return `<p class="lang-switch">${ptLink} <span class="lang-sep">|</span> ${enLink}</p>`;
}

// Localized display label for a region ("Marés do Norte" / "Norte Tides").
function regionDisplay(langKey, regionKey, t) {
  const table = T[langKey].region_display;
  return (table && table[regionKey]) || regionKey;
}
const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function forecastStart() {
  const today = new Date();
  const aug1 = new Date(Date.UTC(2026, 7, 1));
  return today >= aug1 ? today : aug1;
}

function buildDays(location, start, count) {
  const days = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + i));
    const [y, m, day] = dateKey(d).split('-').map(Number);
    const { highs, lows } = getAllTidePoints(location, y, m, day);
    days.push({ date: dateKey(d), highs, lows });
  }
  return days;
}

function tideRows(days, t) {
  return days.map(day => {
    const events = [
      ...day.highs.map(e => ({ type: t('high'), ...e })),
      ...day.lows.map(e => ({ type: t('low'), ...e }))
    ].sort((a, b) => a.time.localeCompare(b.time));
    const [y, m, d] = day.date.split('-');
    const rows = events.length ? events.map(e => `          <tr><td>${escapeHtml(e.type)}</td><td>${e.time}</td><td>${e.height} m</td></tr>`).join('\n') : '';
    return `      <h3>${d}/${m}/${y}</h3>
      <table class="tide-table">
        <thead><tr><th scope="col">${escapeHtml(t('tide'))}</th><th scope="col">${escapeHtml(t('hour'))}</th><th scope="col">${escapeHtml(t('height'))}</th></tr></thead>
        <tbody>
${rows}
        </tbody>
      </table>`;
  }).join('\n');
}

function regionPage(lang, key, location, days, otherLocs) {
  const t = k => T[lang.key][k] || k;
  const dirPrefix = lang.dir ? `${lang.dir}/` : '';
  const selfUrl = `${SITE}/${dirPrefix}${lang.pages}/${SLUGS[key]}/`;
  const alt = LANGS.find(l => l.key !== lang.key);
  const altUrl = `${SITE}/${alt.dir ? alt.dir + '/' : ''}${alt.pages}/${SLUGS[key]}/`;
  const otherLinks = otherLocs.map(o => {
    const oPrefix = lang.dir ? `${lang.dir}/` : '';
    return `<li><a href="/tabua-mar/${oPrefix}${lang.pages}/${SLUGS[o.key]}/">${escapeHtml(t('tides_of'))} ${escapeHtml(regionDisplay(lang.key, o.key, t))}</a></li>`;
  }).join('\n');
  return `<!DOCTYPE html>
<html lang="${lang.code}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(t('region_title').replace('{region}', regionDisplay(lang.key, key, t)).replace('{port}', location.referencePort))}</title>
    <meta name="description" content="${escapeHtml(t('region_meta_description').replace('{region}', regionDisplay(lang.key, key, t)).replace('{port}', location.referencePort))}">
    <link rel="canonical" href="${selfUrl}">
    <link rel="alternate" hreflang="${lang.code}" href="${selfUrl}">
    <link rel="alternate" hreflang="${alt.code}" href="${altUrl}">
    <link rel="alternate" hreflang="x-default" href="${selfUrl}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(t('region_title').replace('{region}', regionDisplay(lang.key, key, t)).replace('{port}', location.referencePort))}">
    <meta property="og:description" content="${escapeHtml(t('region_meta_description').replace('{region}', regionDisplay(lang.key, key, t)).replace('{port}', location.referencePort))}">
    <meta property="og:url" content="${selfUrl}">
    <link rel="stylesheet" href="/tabua-mar/css/style.css">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": ${JSON.stringify(t('region_title').replace('{region}', regionDisplay(lang.key, key, t)).replace('{port}', location.referencePort))},
      "url": "${selfUrl}",
      "inLanguage": "${lang.code}"
    }
    </script>
</head>
<body data-location="${key}">
    <a href="#main-content" class="skip-link">${escapeHtml(t('skip_link'))}</a>
    <div class="container">
        <header>
            ${langSwitch(lang, `${SITE}/mares/${SLUGS[key]}/`, `${SITE}/en/tides/${SLUGS[key]}/`)}
            <p class="back-link"><a href="/tabua-mar/${lang.dir ? lang.dir + '/' : ''}">${escapeHtml(t('back_home'))}</a></p>
            <h1>${escapeHtml(t('region_h1').replace('{region}', regionDisplay(lang.key, key, t)))} <span class="ref-port">(${escapeHtml(t('region_ref_port'))}: ${escapeHtml(location.referencePort)})</span></h1>
            <p class="intro">${escapeHtml(t('region_intro').replace('{region}', regionDisplay(lang.key, key, t)).replace('{port}', location.referencePort))}</p>
        </header>
        <main id="main-content">
            <section id="forecast" aria-labelledby="forecast-title">
                <h2 id="forecast-title">${escapeHtml(t('forecast_title').replace('{date}', days[0].date))}</h2>
${tideRows(days, t)}
            </section>
            <section id="tool" aria-labelledby="tool-title">
                <h2 id="tool-title">${escapeHtml(t('region_tool_title'))}</h2>
                <form id="tide-form" aria-label="${escapeHtml(t('location_label'))}">
                    <fieldset class="controls">
                        <div class="control-group">
                            <label for="location">${escapeHtml(t('location_label'))}</label>
                            <select id="location" aria-required="true">
                                <option value="">${escapeHtml(t('select_location'))}</option>
                            </select>
                        </div>
                        <div class="control-group">
                            <label for="date">${escapeHtml(t('date_label'))}</label>
                            <input type="date" id="date" min="2026-08-01" aria-required="true">
                        </div>
                    </fieldset>
                </form>
                <section id="results" aria-live="polite" aria-busy="false"></section>
            </section>
            <section id="other-regions" aria-labelledby="other-regions-title">
                <h2 id="other-regions-title">${escapeHtml(t('other_regions_title'))}</h2>
                <ul class="regions-list">
${otherLinks}
                </ul>
            </section>
        </main>
        <footer>
            <p>${escapeHtml(t('predictions_note'))}</p>
            <p><a href="/tabua-mar/privacy.html">${escapeHtml(t('privacy_policy'))}</a> | ${escapeHtml(t('gplv3'))}</p>
        </footer>
    </div>
    <script src="/tabua-mar/js/data.js"></script>
    <script src="/tabua-mar/js/tide.js"></script>
    <script src="/tabua-mar/js/translations.js"></script>
    <script src="/tabua-mar/js/app.js"></script>
</body>
</html>
`;
}

function homePage(lang) {
  const t = k => T[lang.key][k] || k;
  const selfUrl = `${SITE}/${lang.dir ? lang.dir + '/' : ''}`;
  const alt = LANGS.find(l => l.key !== lang.key);
  const altUrl = `${SITE}/${alt.dir ? alt.dir + '/' : ''}`;
  return `<!DOCTYPE html>
<html lang="${lang.code}" data-lang="${lang.key}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(lang.homeTitle)}</title>
    <meta name="description" content="${escapeHtml(t('meta_description'))}">
    <link rel="canonical" href="${selfUrl}">
    <link rel="alternate" hreflang="${lang.code}" href="${selfUrl}">
    <link rel="alternate" hreflang="${alt.code}" href="${altUrl}">
    <link rel="alternate" hreflang="x-default" href="${SITE}/">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(lang.homeTitle)}">
    <meta property="og:description" content="${escapeHtml(t('meta_description'))}">
    <meta property="og:url" content="${selfUrl}">
    <meta name="twitter:card" content="summary">
    <link rel="stylesheet" href="${lang.dir ? '../' : ''}css/style.css">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": ${JSON.stringify(t('title'))},
      "url": "${selfUrl}",
      "applicationCategory": "ScienceApplication",
      "operatingSystem": "Any",
      "inLanguage": "${lang.code}",
      "description": ${JSON.stringify(t('meta_description'))},
      "isAccessibleForFree": true
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": ${JSON.stringify(t('faq_q1'))},
          "acceptedAnswer": { "@type": "Answer", "text": ${JSON.stringify(t('faq_a1'))} }
        },
        {
          "@type": "Question",
          "name": ${JSON.stringify(t('faq_q2'))},
          "acceptedAnswer": { "@type": "Answer", "text": ${JSON.stringify(t('faq_a2'))} }
        },
        {
          "@type": "Question",
          "name": ${JSON.stringify(t('faq_q3'))},
          "acceptedAnswer": { "@type": "Answer", "text": ${JSON.stringify(t('faq_a3'))} }
        }
      ]
    }
    </script>
</head>
<body>
    <a href="#main-content" class="skip-link">${escapeHtml(t('skip_link'))}</a>
    <div class="container">
        <header>
            ${langSwitch(lang, `${SITE}/`, `${SITE}/en/`)}
            <h1><span class="wave-emoji" aria-label="Wave">🌊</span> ${escapeHtml(t('title'))} - ${escapeHtml(t('subtitle'))}</h1>
        </header>
        <main id="main-content">
            <form id="tide-form" aria-label="${escapeHtml(t('location_label'))}">
                <fieldset class="controls">
                    <div class="control-group">
                        <label for="location">${escapeHtml(t('location_label'))}</label>
                        <select id="location" aria-required="true">
                            <option value="">${escapeHtml(t('select_location'))}</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label for="date">${escapeHtml(t('date_label'))}</label>
                        <input type="date" id="date" min="2026-08-01" aria-required="true">
                    </div>
                </fieldset>
            </form>
            <section id="results" aria-live="polite" aria-busy="false">
                <p>${escapeHtml(t('select_prompt'))}</p>
            </section>
            <section id="intro" aria-labelledby="intro-title">
                <h2 id="intro-title">${escapeHtml(t('intro_title'))}</h2>
                <p class="intro">${escapeHtml(t('intro_text'))}</p>
            </section>
            <section id="regions" aria-labelledby="regions-title">
                <h2 id="regions-title">${escapeHtml(t('regions_title'))}</h2>
                <p>${escapeHtml(t('regions_intro'))}</p>
                <ul class="regions-list">
${Object.entries(LOCATIONS).map(([key, loc]) => {
  const p = `${lang.pages}/${SLUGS[key]}/`;
  return `                    <li><a href="${p}">${escapeHtml(t('tides_of'))} ${escapeHtml(regionDisplay(lang.key, key, t))}</a> — ${escapeHtml(t('region_ref_port'))}: ${escapeHtml(loc.referencePort)}</li>`;
}).join('\n')}
                </ul>
            </section>
            <section id="how-it-works" class="info-section" aria-labelledby="how-it-works-title">
                <h2 id="how-it-works-title">${escapeHtml(t('how_it_works_title'))}</h2>
                <p>${escapeHtml(t('how_it_works_text'))}</p>
            </section>
            <section id="faq" class="info-section" aria-labelledby="faq-title">
                <h2 id="faq-title">${escapeHtml(t('faq_title'))}</h2>
                <h3>${escapeHtml(t('faq_q1'))}</h3>
                <p>${escapeHtml(t('faq_a1'))}</p>
                <h3>${escapeHtml(t('faq_q2'))}</h3>
                <p>${escapeHtml(t('faq_a2'))}</p>
                <h3>${escapeHtml(t('faq_q3'))}</h3>
                <p>${escapeHtml(t('faq_a3'))}</p>
            </section>
        </main>
        <footer>
            <p>${escapeHtml(t('predictions_note'))}</p>
            <p><a href="${lang.dir ? '../' : ''}privacy.html">${escapeHtml(t('privacy_policy'))}</a> | ${escapeHtml(t('gplv3'))}</p>
        </footer>
    </div>
    <script src="${lang.dir ? '../' : ''}js/data.js"></script>
    <script src="${lang.dir ? '../' : ''}js/tide.js"></script>
    <script src="${lang.dir ? '../' : ''}js/translations.js"></script>
    <script src="${lang.dir ? '../' : ''}js/app.js"></script>
</body>
</html>
`;
}

function sitemap(urls) {
  const entries = urls.map(u => {
    const alts = u.alts.map(a =>
      `    <xhtml:link rel="alternate" hreflang="${a.code}" href="${a.href}"/>`).join('\n');
    return `  <url>
${alts}
    <loc>${u.loc}</loc>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`;
}

const start = forecastStart();
const urls = [];
const ptHome = { loc: `${SITE}/`, freq: 'weekly', priority: '1.0' };
const enHome = { loc: `${SITE}/en/`, freq: 'weekly', priority: '0.9' };
ptHome.alts = [{ code: 'pt-PT', href: ptHome.loc }, { code: 'en-GB', href: enHome.loc }, { code: 'x-default', href: ptHome.loc }];
enHome.alts = ptHome.alts;
urls.push(ptHome, enHome);

fs.writeFileSync(path.join(outDir, 'index.html'), homePage(LANGS[0]));
fs.mkdirSync(path.join(outDir, 'en'), { recursive: true });
fs.writeFileSync(path.join(outDir, 'en/index.html'), homePage(LANGS[1]));

for (const lang of LANGS) {
  for (const [key, location] of Object.entries(LOCATIONS)) {
    const days = buildDays(location, start, 14);
    const dirPrefix = lang.dir ? `${lang.dir}/` : '';
    const pageDir = path.join(outDir, dirPrefix, lang.pages, SLUGS[key]);
    fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(path.join(pageDir, 'index.html'),
      regionPage(lang, key, location, days, Object.entries(LOCATIONS).map(([k, l]) => ({ key: k, name: l.name }))));
    const alt = LANGS.find(l => l.key !== lang.key);
    const selfLoc = `${SITE}/${dirPrefix}${lang.pages}/${SLUGS[key]}/`;
    const altLoc = `${SITE}/${alt.dir ? alt.dir + '/' : ''}${alt.pages}/${SLUGS[key]}/`;
    urls.push({
      loc: selfLoc, freq: 'weekly', priority: '0.8',
      alts: [{ code: lang.code, href: selfLoc }, { code: alt.code, href: altLoc }, { code: 'x-default', href: selfLoc }]
    });
  }
}

urls.push({ loc: `${SITE}/privacy.html`, freq: 'yearly', priority: '0.3', alts: [] });
fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap(urls));
console.log(`Generated ${urls.length} sitemap entries; forecast starts ${start.toISOString().slice(0, 10)}`);
