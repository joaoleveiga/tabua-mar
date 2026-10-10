// Harmonic tide prediction engine.
// Uses the harmonic method with M2, S2, N2, K2, K1 and O1 constituents:
//   h(t) = Z0 + sum [ A_i * cos(w_i * t - g_i) ]
// where t is hours since the epoch (2000-01-01 00:00 UTC), A_i the amplitude,
// w_i the angular speed and g_i the phase lag of each constituent.
// Heights are meters above the local Zero Hidrografico (ZH).

const DEG_TO_RAD = Math.PI / 180;

// Hours since epoch for a UTC date
function getHoursSinceEpoch(date) {
  return (date.getTime() - EPOCH.getTime()) / 3600000;
}

// Convert a local wall-clock time (year, month, day, hour, minute) in the
// location's time zone into a UTC Date, accounting for DST transitions.
function localToUtc(location, year, month, day, hour, minute) {
  // Approximate first with the standard offset, then correct for DST.
  const standard = Date.UTC(year, month - 1, day, hour, minute) - location.baseUtcOffset * 3600000;
  const offset = localOffsetHours(location, standard);
  return new Date(standard - (offset - location.baseUtcOffset) * 3600000);
}

// Convert a UTC instant into local wall-clock components in the location's
// time zone, accounting for DST transitions.
function utcToLocal(location, utcMs) {
  const offset = localOffsetHours(location, utcMs);
  const shifted = new Date(utcMs + offset * 3600000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes()
  };
}

// Calculate tide height at a specific UTC time for a location
function calculateTideHeight(location, utcDate) {
  const t = getHoursSinceEpoch(utcDate);
  let height = location.z0;
  for (const key in location.constituents) {
    const constituent = location.constituents[key];
    const speed = CONSTITUENTS[key].angularSpeed;
    height += constituent.amplitude * Math.cos((speed * t - constituent.phase) * DEG_TO_RAD);
  }
  return height;
}

// Find all tide turning points (high and low tides) for a given local day.
// Scans from noon the previous day to noon the next day (UTC-anchored) so
// extrema near midnight are never missed, then keeps events whose local date
// matches the requested day.
function getAllTidePoints(location, year, month, day) {
  const dayStartUtc = localToUtc(location, year, month, day, 0, 0).getTime();
  const dayEndUtc = localToUtc(location, year, month, day + 1, 0, 0).getTime();
  const scanStart = dayStartUtc - 13 * 3600000;
  const scanEnd = dayEndUtc + 13 * 3600000;

  const events = [];
  const stepMs = 10 * 60 * 1000;
  let prevTime = null;
  let prevHeight = null;
  let rising = null;

  for (let t = scanStart; t <= scanEnd; t += stepMs) {
    const height = calculateTideHeight(location, new Date(t));
    if (prevTime !== null) {
      const dir = height > prevHeight ? 1 : -1;
      if (rising !== null && dir !== rising) {
        const extremeTime = refineExtremum(location, prevTime, t, rising === 1 ? 'high' : 'low');
        if (extremeTime.utcMs >= dayStartUtc && extremeTime.utcMs < dayEndUtc) {
          events.push(extremeTime);
        }
      }
      rising = dir;
    }
    prevTime = t;
    prevHeight = height;
  }

  events.sort((a, b) => a.utcMs - b.utcMs);
  const highs = events.filter(e => e.type === 'high');
  const lows = events.filter(e => e.type === 'low');

  return {
    highs: highs.map(e => ({ time: e.time, height: e.height.toFixed(2) })),
    lows: lows.map(e => ({ time: e.time, height: e.height.toFixed(2) }))
  };
}

// Quadratic interpolation around a detected turning point to pin down its
// exact time and height (the scan grid is 10 minutes wide).
function refineExtremum(location, beforeMs, afterMs, type) {
  const midMs = (beforeMs + afterMs) / 2;
  const step = 60 * 1000;
  let bestTime = midMs;
  let bestHeight = calculateTideHeight(location, new Date(midMs));
  const from = beforeMs - 2 * step;
  const to = afterMs + 2 * step;
  for (let t = from; t <= to; t += step) {
    const h = calculateTideHeight(location, new Date(t));
    if ((type === 'high' && h > bestHeight) || (type === 'low' && h < bestHeight)) {
      bestHeight = h;
      bestTime = t;
    }
  }
  const local = utcToLocal(location, bestTime);
  return {
    utcMs: bestTime,
    time: formatTime(local.hour, local.minute),
    height: bestHeight,
    type: type
  };
}

// Format time as HH:MM
function formatTime(hour, minute) {
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  return `${h}:${m}`;
}
