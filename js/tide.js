// Harmonic tide prediction engine
// Uses open-source harmonic method with M2, S2, K1, O1 constituents

/**
 * Convert degrees to radians
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * Get hours since epoch for a given date (in UTC)
 */
function getHoursSinceEpoch(date) {
  // date is already in UTC
  const diffMs = date.getTime() - EPOCH.getTime();
  return diffMs / (1000 * 60 * 60); // Convert to hours
}

/**
 * Calculate tide height at a specific time for a location
 * @param {Object} location - Location data from LOCATIONS
 * @param {Date} date - Date object (UTC, at midnight of the day)
 * @param {number} hour - Hour of day (0-23, local Portugal time which is UTC+1)
 * @param {number} minute - Minute of hour (0-59)
 * @returns {number} Tide height in meters
 */
function calculateTideHeight(location, date, hour, minute = 0) {
  // Create a copy of the date
  const timeDate = new Date(date);
  // For local hour H (Portugal UTC+1), we need UTC hour H-1
  // So we set UTC hours to (hour - 1) to account for the timezone
  timeDate.setUTCHours(hour - TIMEZONE_OFFSET_HOURS, minute, 0, 0);

  const hoursSinceEpoch = getHoursSinceEpoch(timeDate);

  let height = location.z0; // Start with mean sea level offset

  // Add contribution from each constituent
  for (const constituent of ["m2", "s2", "k1", "o1"]) {
    const amp = location[constituent].amplitude;
    const phase = location[constituent].phase;
    const angularSpeed = CONSTITUENTS[constituent].angularSpeed;

    // Total angle in degrees: omega*t + phase
    const angle = (angularSpeed * hoursSinceEpoch + phase) % 360;

    // Convert to radians and calculate cosine
    height += amp * Math.cos(degToRad(angle));
  }

  return height;
}

/**
 * Calculate tide heights for an entire day at 10-minute intervals
 * @param {Object} location - Location data from LOCATIONS
 * @param {Date} date - Date object (UTC, at midnight of the day)
 * @returns {Array} Array of {hour, minute, height} objects
 */
function getDailyTidePoints(location, date) {
  const points = [];
  
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 10) {
      const height = calculateTideHeight(location, date, hour, minute);
      points.push({
        hour: hour,
        minute: minute,
        height: height
      });
    }
  }
  
  return points;
}

/**
 * Find high and low tides for a given day
 * @param {Object} location - Location data from LOCATIONS
 * @param {Date} date - Date object (UTC, at midnight of the day)
 * @returns {Object} { high: {time, height}, low: {time, height} }
 */
function getDailyExtremes(location, date) {
  const points = getDailyTidePoints(location, date);
  
  if (points.length === 0) {
    return null;
  }
  
  let high = points[0];
  let low = points[0];
  
  for (const point of points) {
    if (point.height > high.height) {
      high = point;
    }
    if (point.height < low.height) {
      low = point;
    }
  }
  
  return {
    high: {
      time: formatTime(high.hour, high.minute),
      height: high.height.toFixed(2)
    },
    low: {
      time: formatTime(low.hour, low.minute),
      height: low.height.toFixed(2)
    }
  };
}

/**
 * Format time as HH:MM
 */
function formatTime(hour, minute) {
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  return `${h}:${m}`;
}
