// Location data with harmonic constants for Portugal coastal regions
// Based on public IH Portugal and NOAA data

const LOCATIONS = {
  lisboa: {
    name: "Lisboa",
    m2: { amplitude: 1.82, phase: 245 },
    s2: { amplitude: 0.61, phase: 275 },
    k1: { amplitude: 0.32, phase: 125 },
    o1: { amplitude: 0.21, phase: 95 },
    z0: 1.50
  },
  algarve: {
    name: "Algarve",
    m2: { amplitude: 1.48, phase: 220 },
    s2: { amplitude: 0.45, phase: 250 },
    k1: { amplitude: 0.25, phase: 110 },
    o1: { amplitude: 0.18, phase: 85 },
    z0: 1.20
  },
  alentejo: {
    name: "Alentejo",
    m2: { amplitude: 1.65, phase: 230 },
    s2: { amplitude: 0.52, phase: 260 },
    k1: { amplitude: 0.28, phase: 115 },
    o1: { amplitude: 0.19, phase: 90 },
    z0: 1.35
  }
};

// Tidal constituents data
const CONSTITUENTS = {
  m2: { period: 12.4206, angularSpeed: 28.9841 },
  s2: { period: 12.0000, angularSpeed: 30.0000 },
  k1: { period: 23.9345, angularSpeed: 15.0411 },
  o1: { period: 25.8193, angularSpeed: 13.9430 }
};

// Reference epoch: 2000-01-01 00:00:00 UTC
const EPOCH = new Date("2000-01-01T00:00:00Z");

// Portugal timezone offset for August 2026 (WEST = UTC+1)
const TIMEZONE_OFFSET_HOURS = 1;
