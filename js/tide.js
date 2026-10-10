// Harmonic tide prediction engine.
// Uses the harmonic method with M2, S2, N2, K2, K1 and O1 constituents:
//   h(t) = Z0 + sum [ H_i * f_i(t) * cos((V_i(t) + u_i(t) - g_i) * pi/180) ]
// where t is hours since the epoch (2000-01-01 00:00 UTC), H_i the amplitude,
// g_i the phase lag relative to the equilibrium argument, V_i(t) the Doodson
// equilibrium argument, and f_i(t)/u_i(t) the nodal amplitude and phase
// corrections (18.6-year lunar node cycle). Heights are meters above the
// local Zero Hidrografico (ZH).

const DEG_TO_RAD = Math.PI / 180;

// Hours since epoch for a UTC date
function getHoursSinceEpoch(date) {
  return (date.getTime() - EPOCH.getTime()) / 3600000;
}

// Compute the fundamental astronomical arguments (degrees) at t hours since
// the epoch, including the mean lunar time angle tau.
function astronomicalArgs(tHours) {
  const days = tHours / 24;
  const args = {};
  for (const key in ASTRONOMICAL_ARGS) {
    const a = ASTRONOMICAL_ARGS[key];
    args[key] = (a.value + a.rate * days) % 360;
  }
  // mean lunar time angle: tau = 15*t - s + h (t in mean solar hours)
  args.tau = (15 * tHours - args.s + args.h) % 360;
  return args;
}

// Equilibrium argument V(t) + nodal phase correction u(t), in degrees.
function equilibriumArg(constituent, tHours) {
  const args = astronomicalArgs(tHours);
  const spec = EQUILIBRIUM_ARGS[constituent];
  const keys = ['tau', 's', 'h', 'p', 'N', 'pp'];
  let arg = 0;
  for (let i = 0; i < keys.length; i++) {
    arg += spec.multipliers[i] * args[keys[i]];
  }
  // nodal phase corrections u (leading Doodson terms, degrees)
  const N = args.N * DEG_TO_RAD;
  switch (constituent) {
    case 'm2':
    case 'n2':
      arg += -2.14 * Math.sin(N);
      break;
    case 'k2':
      arg += -1.28 * Math.sin(2 * N) - 0.31 * Math.sin(N);
      break;
    case 'k1':
      arg += -0.086 * Math.sin(N) + 0.018 * Math.sin(2 * N);
      break;
    case 'o1':
      arg += 0.108 * Math.sin(N) + 0.024 * Math.sin(2 * N);
      break;
  }
  return (arg + spec.phase) % 360;
}

// Nodal amplitude factor f(t).
function nodalAmplitudeFactor(constituent, tHours) {
  const args = astronomicalArgs(tHours);
  const N = args.N * DEG_TO_RAD;
  switch (constituent) {
    case 'm2':
    case 'n2':
      return 1.000 - 0.0373 * Math.cos(N);
    case 's2':
      return 1.000;
    case 'k2':
      return 1.000 + 0.0282 * Math.cos(2 * N) + 0.0310 * Math.cos(N);
    case 'k1':
      return 1.000 + 0.1154 * Math.cos(N) - 0.0158 * Math.cos(2 * N);
    case 'o1':
      return 1.000 + 0.1884 * Math.cos(N) - 0.0242 * Math.cos(2 * N);
    default:
      return 1.0;
  }
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
  for (const constituent in location.constituents) {
    const spec = location.constituents[constituent];
    const angle = equilibriumArg(constituent, t) - spec.phase;
    height += spec.amplitude * nodalAmplitudeFactor(constituent, t) * Math.cos(angle * DEG_TO_RAD);
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
