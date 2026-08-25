// Main application logic for tide prediction website

// DOM elements
const locationSelect = document.getElementById("location");
const dateInput = document.getElementById("date");
const resultsDiv = document.getElementById("results");
const tideTableBody = document.getElementById("tide-table-body");

// Initialize the app
function init() {
  // Populate location dropdown
  for (const key in LOCATIONS) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = LOCATIONS[key].name;
    locationSelect.appendChild(option);
  }

  // Set default date to August 1, 2026
  dateInput.value = "2026-08-01";
  dateInput.min = "2026-08-01";

  // Add event listeners
  locationSelect.addEventListener("change", calculateAndDisplayTides);
  dateInput.addEventListener("change", calculateAndDisplayTides);

  // Calculate initial tides
  calculateAndDisplayTides();
}

// Calculate and display tides for selected location and date
function calculateAndDisplayTides() {
  const locationKey = locationSelect.value;
  const dateStr = dateInput.value;
  
  if (!locationKey || !dateStr) {
    resultsDiv.innerHTML = "<p>Please select a location and date.</p>";
    return;
  }

  const location = LOCATIONS[locationKey];
  const date = new Date(dateStr + "T00:00:00");
  
  // Adjust for Portugal timezone (WEST = UTC+1 for August)
  date.setHours(date.getHours() + TIMEZONE_OFFSET_HOURS);

  const extremes = getDailyExtremes(location, date);
  
  if (!extremes) {
    resultsDiv.innerHTML = "<p>Error calculating tides.</p>";
    return;
  }

  // Display results
  displayResults(location, dateStr, extremes);
}

// Display tide results
function displayResults(location, dateStr, extremes) {
  const formattedDate = formatDate(dateStr);
  
  resultsDiv.innerHTML = `
    <h2>Tide Predictions for ${location.name}</h2>
    <p class="date-display">Date: ${formattedDate}</p>
    <div class="tide-summary">
      <div class="tide-card high-tide">
        <h3>High Tide</h3>
        <p class="time">Time: <span>${extremes.high.time}</span></p>
        <p class="height">Height: <span>${extremes.high.height} m</span></p>
      </div>
      <div class="tide-card low-tide">
        <h3>Low Tide</h3>
        <p class="time">Time: <span>${extremes.low.time}</span></p>
        <p class="height">Height: <span>${extremes.low.height} m</span></p>
      </div>
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
