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
  
  // Combine and sort all tides by time
  const allTides = [];
  tidePoints.highs.forEach((tide) => {
    allTides.push({
      type: 'High',
      time: tide.time,
      height: tide.height,
      sortTime: tide.time
    });
  });
  tidePoints.lows.forEach((tide) => {
    allTides.push({
      type: 'Low',
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
  
  resultsDiv.innerHTML = `
    <h2>Tide Predictions for ${location.name}</h2>
    <p class="date-display">Date: ${formattedDate}</p>
    <div class="tide-table-container" role="region" aria-label="Tide prediction results">
      <table class="tide-table">
        <thead>
          <tr>
            <th scope="col">Tide</th>
            <th scope="col">Hour</th>
            <th scope="col">Height</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
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
