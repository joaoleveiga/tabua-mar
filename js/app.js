// Main application logic for tide prediction website

// DOM elements
const locationSelect = document.getElementById("location");
const dateInput = document.getElementById("date");
const resultsDiv = document.getElementById("results");
const tideForm = document.getElementById("tide-form");
const langSelect = document.getElementById("language");

// Initialize the app
async function init() {
  // Initialize translations first
  await initTranslations();
  
  // Update page translations
  updatePageTranslations();
  
  // Set up language picker
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', async (e) => {
      await setLanguage(e.target.value);
      updatePageTranslations();
      // Re-display results if they exist
      if (locationSelect.value && dateInput.value) {
        calculateAndDisplayTides();
      }
    });
  }

  // Populate location dropdown
  for (const key in LOCATIONS) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = LOCATIONS[key].name;
    locationSelect.appendChild(option);
  }

  // Set default date to today or August 1, 2026
  const today = new Date();
  const aug1 = new Date("2026-08-01");
  const defaultDate = today >= aug1 ? today : aug1;
  const formattedDate = defaultDate.toISOString().split('T')[0];
  dateInput.value = formattedDate;
  dateInput.min = "2026-08-01";

  // Add event listeners
  locationSelect.addEventListener("change", calculateAndDisplayTides);
  dateInput.addEventListener("change", calculateAndDisplayTides);

  // Allow form submission via Enter key
  tideForm.addEventListener("submit", function(e) {
    e.preventDefault();
    calculateAndDisplayTides();
  });

  // Calculate initial tides
  calculateAndDisplayTides();
}

// Calculate and display tides for selected location and date
function calculateAndDisplayTides() {
  const locationKey = locationSelect.value;
  const dateStr = dateInput.value;
  
  if (!locationKey || !dateStr) {
    resultsDiv.innerHTML = `<p>${translate('please_select')}</p>`;
    resultsDiv.setAttribute('aria-busy', 'false');
    return;
  }

  // Set aria-busy to true while calculating
  resultsDiv.setAttribute('aria-busy', 'true');

  const location = LOCATIONS[locationKey];
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Create UTC date at midnight of the selected day
  // For Portugal local time (UTC+1), midnight local = 23:00 UTC previous day
  // But we pass this as the base, and calculateTideHeight will add hours in UTC
  // To get local hour H, we need UTC hour H-1
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

  const tidePoints = getAllTidePoints(location, date);
  
  if (!tidePoints || (tidePoints.highs.length === 0 && tidePoints.lows.length === 0)) {
    resultsDiv.innerHTML = `<p>${translate('error')}</p>`;
    resultsDiv.setAttribute('aria-busy', 'false');
    return;
  }

  // Display results
  displayResults(location, dateStr, tidePoints, date);
  resultsDiv.setAttribute('aria-busy', 'false');
}

// Display tide results
function displayResults(location, dateStr, tidePoints, date) {
  const formattedDate = formatDate(dateStr);
  
  // Combine and sort all tides by time
  const allTides = [];
  tidePoints.highs.forEach((tide) => {
    allTides.push({
      type: translate('high'),
      time: tide.time,
      height: tide.height,
      sortTime: tide.time
    });
  });
  tidePoints.lows.forEach((tide) => {
    allTides.push({
      type: translate('low'),
      time: tide.time,
      height: tide.height,
      sortTime: tide.time
    });
  });
  
  // Sort by time ascending
  allTides.sort((a, b) => {
    const [aH, aM] = a.sortTime.split(':').map(Number);
    const [bH, bM] = b.sortTime.split(':').map(Number);
    return (aH * 60 + aM) - (bH * 60 + bM);
  });
  
  // Build table rows
  const tableRows = allTides.map(tide => `
    <tr>
      <td class="tide-type">${tide.type}</td>
      <td class="tide-time">${tide.time}</td>
      <td class="tide-height">${tide.height} m</td>
    </tr>
  `).join('');
  
  // Get moon phase for the selected date
  const moonPhase = getMoonPhase(date);
  const moonPhaseLabel = translate('moon_phase');
  
  const title = translate('tide_predictions', { location: location.name });
  const dateLabel = translate('date_display');
  
  resultsDiv.innerHTML = `
    <h2>${title}</h2>
    <p class="date-display">${dateLabel}: ${formattedDate}</p>
    <div class="tide-table-container" role="region" aria-label="Tide prediction results">
      <table class="tide-table">
        <thead>
          <tr>
            <th scope="col" data-i18n="tide">Tide</th>
            <th scope="col" data-i18n="hour">Hour</th>
            <th scope="col" data-i18n="height">Height</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
    <p class="moon-phase">${moonPhase.emoji} ${moonPhaseLabel}: ${moonPhase.name}</p>
  `;
  
  // Update table header translations
  const tableHeaders = resultsDiv.querySelectorAll('th[data-i18n]');
  tableHeaders.forEach(header => {
    const key = header.getAttribute('data-i18n');
    if (key) {
      header.textContent = translate(key);
    }
  });
}

// Format date as DD/MM/YYYY
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

// Calculate moon phase for a given date
// Returns object with phase name and emoji
function getMoonPhase(date) {
  // Calculate days since known new moon (2000-01-06 18:14 UTC)
  const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
  const diffTime = date.getTime() - knownNewMoon.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  // Moon synodic period (new moon to new moon) ~29.530588 days
  const synodicPeriod = 29.530588;
  const moonAge = (diffDays % synodicPeriod + synodicPeriod) % synodicPeriod;
  
  // Determine phase based on moon age
  const phaseNames = {
    pt_PT: [
      'Lua Nova', 'Lua Crescente', 'Quarto Crescente', 'Lua Gibosa Crescente',
      'Lua Cheia', 'Lua Gibosa Minguante', 'Quarto Minguante', 'Lua Minguante'
    ],
    en_GB: [
      'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
      'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'
    ]
  };
  
  const phaseEmojis = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
  
  // Phase boundaries (in days)
  const boundaries = [0, 3.691, 7.382, 11.074, 14.765, 18.457, 22.148, 25.840, 29.530588];
  
  let phaseIndex = 0;
  for (let i = 0; i < boundaries.length - 1; i++) {
    if (moonAge >= boundaries[i] && moonAge < boundaries[i + 1]) {
      phaseIndex = i;
      break;
    }
  }
  
  const lang = currentLang || 'pt_PT';
  const phases = phaseNames[lang] || phaseNames['pt_PT'];
  const phaseName = phases[phaseIndex] || phases[0];
  const emoji = phaseEmojis[phaseIndex] || '🌑';
  
  return {
    name: phaseName,
    emoji: emoji,
    age: moonAge,
    phaseIndex: phaseIndex
  };
}

// Initialize when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
