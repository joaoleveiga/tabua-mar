// Harmonic tide prediction engine
// Uses open-source harmonic method with M2, S2, K1, O1 constituents

/**
 * Convert degrees to radians
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * Get hours since epoch for a given date (in Portugal local time)
 */
function getHoursSinceEpoch(date) {
  // Convert to UTC first, then apply timezone offset
  const utcDate = new Date(date.getTime() - TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000);
  const diffMs = utcDate.getTime() - EPOCH.getTime();
  return diffMs / (1000 * 60 * 60); // Convert to hours
}

/**
 * Calculate the astronomical equilibrium argument for a constituent
 * Simplified version for client-side calculation
 */
function getAstronomicalArgument(constituent, hoursSinceEpoch) {
  // For simplicity, we use a basic approximation
  // In a full implementation, this would use NOAA's X0, V0+u, etc.
  const period = CONSTITUENTS[constituent].period;
  const angularSpeed = CONSTITUENTS[constituent].angularSpeed;
  
  // Basic approximation: V(t) = (360/period) * t mod 360
  return (angularSpeed * hoursSinceEpoch) % 360;
}

/**
 * Calculate tide height at a specific time for a location
 * @param {Object} location - Location data from LOCATIONS
 * @param {Date} date - Date object (local Portugal time)
 * @param {number} hour - Hour of day (0-23, local time)
 * @param {number} minute - Minute of hour (0-59)
 * @returns {number} Tide height in meters
 */
function calculateTideHeight(location, date, hour, minute = 0) {
  // Create a new date with the specified time
  const timeDate = new Date(date);
  timeDate.setHours(hour, minute, 0, 0);
  
  const hoursSinceEpoch = getHoursSinceEpoch(timeDate);
  
  let height = location.z0; // Start with mean sea level offset
  
  // Add contribution from each constituent
  for (const constituent of ["m2", "s2", "k1", "o1"]) {
    const amp = location[constituent].amplitude;
    const phase = location[constituent].phase;
    const angularSpeed = CONSTITUENTS[constituent].angularSpeed;
    
    // V(t) - astronomical equilibrium argument
    const V = getAstronomicalArgument(constituent, hoursSinceEpoch);
    
    // Total angle in degrees
    const angle = (angularSpeed * hoursSinceEpoch + phase - V) % 360;
    
    // Convert to radians and calculate cosine
    height += amp * Math.cos(degToRad(angle));
  }
  
  return height;
}

/**
 * Calculate tide heights for an entire day at 10-minute intervals
 * @param {Object} location - Location data from LOCATIONS
 * @param {Date} date - Date object (local Portugal time)
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
 * @param {Date} date - Date object (local Portugal time)
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
