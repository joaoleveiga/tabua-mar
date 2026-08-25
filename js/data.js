// Location data with harmonic constants for Portugal coastal regions
// Based on public IH Portugal and NOAA data
// Sorted by: Norte, Centro, Lisboa e Vale do Tejo, Alentejo, Algarve, Madeira, Açores

const LOCATIONS = {
  norte: {
    name: "Norte",
    m2: { amplitude: 2.15, phase: 260 },
    s2: { amplitude: 0.72, phase: 290 },
    k1: { amplitude: 0.35, phase: 130 },
    o1: { amplitude: 0.22, phase: 100 },
    z0: 1.75
  },
  centro: {
    name: "Centro",
    m2: { amplitude: 1.90, phase: 240 },
    s2: { amplitude: 0.60, phase: 270 },
    k1: { amplitude: 0.30, phase: 120 },
    o1: { amplitude: 0.20, phase: 90 },
    z0: 1.45
  },
  lisboa: {
    name: "Lisboa e Vale do Tejo",
    m2: { amplitude: 1.82, phase: 245 },
    s2: { amplitude: 0.61, phase: 275 },
    k1: { amplitude: 0.32, phase: 125 },
    o1: { amplitude: 0.21, phase: 95 },
    z0: 1.50
  },
  alentejo: {
    name: "Alentejo",
    m2: { amplitude: 1.65, phase: 230 },
    s2: { amplitude: 0.52, phase: 260 },
    k1: { amplitude: 0.28, phase: 115 },
    o1: { amplitude: 0.19, phase: 90 },
    z0: 1.35
  },
  algarve: {
    name: "Algarve",
    m2: { amplitude: 1.48, phase: 43.68 },
    s2: { amplitude: 0.45, phase: 67.50 },
    k1: { amplitude: 0.25, phase: 18.50 },
    o1: { amplitude: 0.18, phase: 0.18 },
    z0: 1.20
  },
  madeira: {
    name: "Madeira",
    m2: { amplitude: 0.95, phase: 180 },
    s2: { amplitude: 0.30, phase: 210 },
    k1: { amplitude: 0.20, phase: 100 },
    o1: { amplitude: 0.15, phase: 80 },
    z0: 1.10
  },
  acores: {
    name: "Açores",
    m2: { amplitude: 1.10, phase: 200 },
    s2: { amplitude: 0.35, phase: 230 },
    k1: { amplitude: 0.22, phase: 110 },
    o1: { amplitude: 0.16, phase: 85 },
    z0: 1.25
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
