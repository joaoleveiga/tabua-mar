// Main application logic for tide prediction website

// DOM elements
const locationSelect = document.getElementById("location");
const dateInput = document.getElementById("date");
const resultsDiv = document.getElementById("results");
const tideForm = document.getElementById("tide-form");

// Initialize the app
function init() {
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
    resultsDiv.innerHTML = "<p>Please select a location and date.</p>";
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
    resultsDiv.innerHTML = "<p>Error calculating tides.</p>";
    resultsDiv.setAttribute('aria-busy', 'false');
    return;
  }

  // Display results
  displayResults(location, dateStr, tidePoints);
  resultsDiv.setAttribute('aria-busy', 'false');
}

// Display tide results
function displayResults(location, dateStr, tidePoints) {
  const formattedDate = formatDate(dateStr);
  
  // Build HTML for all high tides
  const highTidesHtml = tidePoints.highs.map((tide, index) => `
    <div class="tide-card high-tide" role="region" aria-label="High tide ${index + 1} information">
      <h3>High Tide ${tidePoints.highs.length > 1 ? index + 1 : ''}</h3>
      <p class="time">Time: <span>${tide.time}</span></p>
      <p class="height">Height: <span>${tide.height} m</span></p>
    </div>
  `).join('');
  
  // Build HTML for all low tides
  const lowTidesHtml = tidePoints.lows.map((tide, index) => `
    <div class="tide-card low-tide" role="region" aria-label="Low tide ${index + 1} information">
      <h3>Low Tide ${tidePoints.lows.length > 1 ? index + 1 : ''}</h3>
      <p class="time">Time: <span>${tide.time}</span></p>
      <p class="height">Height: <span>${tide.height} m</span></p>
    </div>
  `).join('');
  
  resultsDiv.innerHTML = `
    <h2>Tide Predictions for ${location.name}</h2>
    <p class="date-display">Date: ${formattedDate}</p>
    <div class="tide-summary" role="region" aria-label="Tide prediction results">
      ${highTidesHtml}
      ${lowTidesHtml}
    </div>
  `;
}

// Format date as DD/MM/YYYY
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

// Initialize when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
