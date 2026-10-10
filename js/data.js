// Location data with harmonic constants for Portugal coastal regions.
// Constants are time-invariant port harmonics (amplitude H, Greenwich-type
// phase lag g relative to the Doodson equilibrium argument V+u), fitted by
// least squares against confirmed October 2026 tide tables derived from the
// official Instituto Hidrografico (IH Portugal) Tabela de Mares 2026 Vol. I
// predictions for the reference ports (see data/confirmed-tides-*.json).
// Prediction model (see js/tide.js):
//   h(t) = z0 + sum H_c * f_c(t) * cos((V_c(t) + u_c(t) - g_c) * pi/180)
// where t is hours since 2000-01-01 00:00 UTC. Because the equilibrium
// arguments and nodal corrections are computed per-instant, the constants do
// not expire with the calibration month (validated out-of-sample on November
// 2026 data; see docs/validation-october-2026.md).
// Sorted by: Norte, Centro, Lisboa e Vale do Tejo, Alentejo, Algarve, Madeira, Acores.

const LOCATIONS = {
  norte: {
    name: "Norte",
    referencePort: "Leixões",
    baseUtcOffset: 0,
    z0: 2.0206,
    constituents: {
      m2: { amplitude: 1.0626, phase: 61.68 },
      s2: { amplitude: 0.5075, phase: 98.31 },
      n2: { amplitude: 0.1776, phase: 40.51 },
      k2: { amplitude: 0.0629, phase: 79.94 },
      k1: { amplitude: 0.0556, phase: 31.10 },
      o1: { amplitude: 0.0558, phase: 313.76 }
    }
  },
  centro: {
    name: "Centro",
    referencePort: "Aveiro",
    baseUtcOffset: 0,
    z0: 1.9979,
    constituents: {
      m2: { amplitude: 0.9029, phase: 67.40 },
      s2: { amplitude: 0.4973, phase: 106.02 },
      n2: { amplitude: 0.1756, phase: 47.93 },
      k2: { amplitude: 0.0549, phase: 103.07 },
      k1: { amplitude: 0.0544, phase: 34.91 },
      o1: { amplitude: 0.0574, phase: 319.23 }
    }
  },
  lisboa: {
    name: "Lisboa e Vale do Tejo",
    referencePort: "Lisboa",
    baseUtcOffset: 0,
    z0: 2.3479,
    constituents: {
      m2: { amplitude: 1.2849, phase: 70.61 },
      s2: { amplitude: 0.5044, phase: 108.66 },
      n2: { amplitude: 0.1867, phase: 48.27 },
      k2: { amplitude: 0.1009, phase: 83.57 },
      k1: { amplitude: 0.0567, phase: 34.81 },
      o1: { amplitude: 0.0549, phase: 317.23 }
    }
  },
  alentejo: {
    name: "Alentejo",
    referencePort: "Sines",
    baseUtcOffset: 0,
    z0: 2.0238,
    constituents: {
      m2: { amplitude: 0.9553, phase: 48.75 },
      s2: { amplitude: 0.5206, phase: 82.83 },
      n2: { amplitude: 0.1730, phase: 26.19 },
      k2: { amplitude: 0.0248, phase: 69.29 },
      k1: { amplitude: 0.0542, phase: 23.26 },
      o1: { amplitude: 0.0579, phase: 308.98 }
    }
  },
  algarve: {
    name: "Algarve",
    referencePort: "Faro",
    baseUtcOffset: 0,
    z0: 1.9918,
    constituents: {
      m2: { amplitude: 1.0128, phase: 50.72 },
      s2: { amplitude: 0.5141, phase: 85.78 },
      n2: { amplitude: 0.1766, phase: 28.38 },
      k2: { amplitude: 0.0432, phase: 71.37 },
      k1: { amplitude: 0.0550, phase: 23.48 },
      o1: { amplitude: 0.0572, phase: 310.46 }
    }
  },
  madeira: {
    name: "Madeira",
    referencePort: "Funchal",
    baseUtcOffset: 0,
    z0: 1.3663,
    constituents: {
      m2: { amplitude: 0.6842, phase: 32.48 },
      s2: { amplitude: 0.4301, phase: 65.28 },
      n2: { amplitude: 0.1406, phase: 12.48 },
      k2: { amplitude: 0.0194, phase: 118.58 },
      k1: { amplitude: 0.0487, phase: 23.76 },
      o1: { amplitude: 0.0523, phase: 309.53 }
    }
  },
  acores: {
    name: "Açores",
    referencePort: "Ponta Delgada",
    baseUtcOffset: -1,
    z0: 0.9885,
    constituents: {
      m2: { amplitude: 0.5055, phase: 49.86 },
      s2: { amplitude: 0.2607, phase: 82.80 },
      n2: { amplitude: 0.0952, phase: 21.63 },
      k2: { amplitude: 0.0056, phase: 111.22 },
      k1: { amplitude: 0.0269, phase: 12.07 },
      o1: { amplitude: 0.0298, phase: 283.53 }
    }
  }
};

// Angular speeds in degrees per hour (standard tidal constituent values).
const CONSTITUENTS = {
  m2: { period: 12.4206, angularSpeed: 28.9841042 },
  s2: { period: 12.0000, angularSpeed: 30.0000000 },
  n2: { period: 12.6583, angularSpeed: 28.4397295 },
  k2: { period: 11.9672, angularSpeed: 30.0821378 },
  k1: { period: 23.9345, angularSpeed: 15.0410686 },
  o1: { period: 25.8193, angularSpeed: 13.9430356 }
};

// Reference epoch: 2000-01-01 00:00:00 UTC
const EPOCH = new Date("2000-01-01T00:00:00Z");

// Fundamental astronomical arguments (Doodson linear models, epoch J2000).
// Degrees at epoch and degrees/day.
const ASTRONOMICAL_ARGS = {
  s:  { value: 218.3164477, rate: 13.17639648 },  // Moon mean longitude
  h:  { value: 280.46646,   rate: 0.98564736 },    // Sun mean longitude
  p:  { value: 83.3532464,  rate: 0.11140353 },   // Moon perigee mean longitude
  N:  { value: 125.04452,   rate: -0.05295377 },   // Moon ascending node mean longitude
  pp: { value: 282.9376,    rate: 0.00471125 }     // Sun perigee mean longitude
};

// Doodson numbers per constituent: multipliers over (tau, s, h, p, N, pp)
// plus the constituent phase constant in degrees.
// M2=255.555, S2=273.555, N2=245.655, K2=275.555, K1=165.555, O1=145.555
const EQUILIBRIUM_ARGS = {
  m2: { multipliers: [2,  0,  0, 0, 0, 0], phase: 0   },
  s2: { multipliers: [2,  2, -2, 0, 0, 0], phase: 0   },
  n2: { multipliers: [2, -1,  0, 1, 0, 0], phase: 0   },
  k2: { multipliers: [2,  2,  0, 0, 0, 0], phase: 0   },
  k1: { multipliers: [1,  1,  0, 0, 0, 0], phase: 90  },
  o1: { multipliers: [1, -1,  0, 0, 0, 0], phase: 270 }
};

// European Union daylight saving time: last Sunday of March to last Sunday of
// October, transitions at 01:00 UTC. Applies to mainland Portugal, Madeira
// (same rules, base UTC+0) and the Azores (base UTC-1).
function lastSundayOfMonth(year, month) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  return lastDay.getUTCDate() - lastDay.getUTCDay();
}

function isDstActive(utcMs) {
  const year = new Date(utcMs).getUTCFullYear();
  const start = Date.UTC(year, 2, lastSundayOfMonth(year, 2), 1);
  const end = Date.UTC(year, 9, lastSundayOfMonth(year, 9), 1);
  return utcMs >= start && utcMs < end;
}

// Offset in hours between local time at the given instant and UTC, for the
// given location (base standard offset plus DST when active).
function localOffsetHours(location, utcMs) {
  return location.baseUtcOffset + (isDstActive(utcMs) ? 1 : 0);
}
