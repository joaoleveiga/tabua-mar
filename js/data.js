// Location data with harmonic constants for Portugal coastal regions.
// Constants least-squares fitted against confirmed October 2026 tide tables
// derived from the official Instituto Hidrografico (IH Portugal) Tabela de Mares
// 2026 Vol. I predictions for reference ports (see data/confirmed-tides-*.json).
// Model: h(t) = z0 + sum A_c * cos(speed_c * t - phase_c), t in hours since
// 2000-01-01 00:00 UTC. Phases already include the nodal-equilibrium terms for
// the 2026 epoch, so predictions are calibrated for calendar year 2026.
// Sorted by: Norte, Centro, Lisboa e Vale do Tejo, Alentejo, Algarve, Madeira, Acores.

const LOCATIONS = {
  norte: {
    name: "Norte",
    referencePort: "Leixões",
    baseUtcOffset: 0,
    z0: 2.0206,
    constituents: {
      m2: { amplitude: 1.0295, phase: 295.98 },
      s2: { amplitude: 0.5083, phase: 98.11 },
      n2: { amplitude: 0.1720, phase: 12.24 },
      k2: { amplitude: 0.0651, phase: 137.31 },
      k1: { amplitude: 0.0609, phase: 341.98 },
      o1: { amplitude: 0.0636, phase: 94.54 }
    }
  },
  centro: {
    name: "Centro",
    referencePort: "Aveiro",
    baseUtcOffset: 0,
    z0: 1.9983,
    constituents: {
      m2: { amplitude: 0.8752, phase: 298.47 },
      s2: { amplitude: 0.4984, phase: 99.22 },
      n2: { amplitude: 0.1698, phase: 16.03 },
      k2: { amplitude: 0.0575, phase: 165.15 },
      k1: { amplitude: 0.0586, phase: 344.23 },
      o1: { amplitude: 0.0664, phase: 100.38 }
    }
  },
  lisboa: {
    name: "Lisboa e Vale do Tejo",
    referencePort: "Lisboa",
    baseUtcOffset: 0,
    z0: 2.3475,
    constituents: {
      m2: { amplitude: 1.2452, phase: 302.14 },
      s2: { amplitude: 0.5053, phase: 103.99 },
      n2: { amplitude: 0.1813, phase: 27.72 },
      k2: { amplitude: 0.1046, phase: 166.86 },
      k1: { amplitude: 0.0619, phase: 347.71 },
      o1: { amplitude: 0.0628, phase: 101.94 }
    }
  },
  alentejo: {
    name: "Alentejo",
    referencePort: "Sines",
    baseUtcOffset: 0,
    z0: 2.0242,
    constituents: {
      m2: { amplitude: 0.9257, phase: 283.29 },
      s2: { amplitude: 0.5209, phase: 76.24 },
      n2: { amplitude: 0.1677, phase: 356.02 },
      k2: { amplitude: 0.0263, phase: 148.90 },
      k1: { amplitude: 0.0586, phase: 359.02 },
      o1: { amplitude: 0.0655, phase: 90.85 }
    }
  },
  algarve: {
    name: "Algarve",
    referencePort: "Faro",
    baseUtcOffset: 0,
    z0: 1.9917,
    constituents: {
      m2: { amplitude: 0.9807, phase: 285.57 },
      s2: { amplitude: 0.5153, phase: 78.89 },
      n2: { amplitude: 0.1705, phase: 6.53 },
      k2: { amplitude: 0.0452, phase: 144.71 },
      k1: { amplitude: 0.0595, phase: 357.98 },
      o1: { amplitude: 0.0658, phase: 93.32 }
    }
  },
  madeira: {
    name: "Madeira",
    referencePort: "Funchal",
    baseUtcOffset: 0,
    z0: 1.3659,
    constituents: {
      m2: { amplitude: 0.6630, phase: 269.59 },
      s2: { amplitude: 0.4311, phase: 61.13 },
      n2: { amplitude: 0.1364, phase: 352.55 },
      k2: { amplitude: 0.0197, phase: 220.57 },
      k1: { amplitude: 0.0526, phase: 354.73 },
      o1: { amplitude: 0.0597, phase: 92.28 }
    }
  },
  acores: {
    name: "Açores",
    referencePort: "Ponta Delgada",
    baseUtcOffset: -1,
    z0: 0.9892,
    constituents: {
      m2: { amplitude: 0.4899, phase: 285.30 },
      s2: { amplitude: 0.2612, phase: 83.32 },
      n2: { amplitude: 0.0919, phase: 10.09 },
      k2: { amplitude: 0.0063, phase: 187.90 },
      k1: { amplitude: 0.0289, phase: 170.35 },
      o1: { amplitude: 0.0345, phase: 90.62 }
    }
  }
};

// Angular speeds in degrees per hour (standard tidal constituent values).
const CONSTITUENTS = {
  m2: { period: 12.4206, angularSpeed: 28.9841042 },
  s2: { period: 12.0000, angularSpeed: 30.0 },
  n2: { period: 12.6583, angularSpeed: 28.4397295 },
  k2: { period: 11.9672, angularSpeed: 30.0821378 },
  k1: { period: 23.9345, angularSpeed: 15.0410686 },
  o1: { period: 25.8193, angularSpeed: 13.9430356 }
};

// Reference epoch: 2000-01-01 00:00:00 UTC
const EPOCH = new Date("2000-01-01T00:00:00Z");

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
