# Validation Report: October 2026, Lisboa region

Comparison of the site's harmonic predictions (`js/tide.js` + `js/data.js`, region `lisboa`)
against confirmed October 2026 tide data for Lisboa
([tabuademares.com](https://tabuademares.com/pt/lisboa/lisboa), derived from the official
Instituto Hidrográfico [Tabela de Marés 2026, Vol. I](https://www.hidrografico.pt/tabelamares),
ISBN 978-989-705-181-4).

- Confirmed data: `data/confirmed-tides-lisboa-2026-10.json` (31 days, 120 high/low events, heights in meters over the Zero Hidrográfico)
- Comparison script: `scripts/compare-confirmed-oct2026.js` (run `node scripts/compare-confirmed-oct2026.js`)

## Results (66 of 120 events matched within ±5h; 54 unmatched)

| Metric | Value |
|---|---|
| Mean absolute time error | ≈ 263 min (~4.4 h) |
| Events within ±30 min | 0 of 66 (0%) |
| Events within ±60 min | 0 of 66 (0%) |
| Mean height error | −0.9 m |
| Height error range | −2.5 m to +0.9 m |
| Unmatched events | 54 of 120 |

## Root causes found in the code

1. **`z0` (mean sea level) is wrong.** The official Lisboa mean level over the Zero
   Hidrográfico is **2.20 m** (published in the IH concordâncias table for Lisboa).
   `js/data.js:27` uses `z0: 1.50`. Every predicted height is therefore biased low,
   and lows even come out **negative** (e.g. −0.93 m), which is physically impossible
   over the ZH — official predictions are always positive (IH §106).

2. **`M2`/`S2` amplitudes are too large.** From the official characteristic levels for
   Lisboa (PMAV = 3.75, PMAM = 2.96, NM = 2.20), the implied amplitudes are
   **H(M2) ≈ 1.15 m** and **H(S2) ≈ 0.40 m**. The site uses 1.82 / 0.61
   (`js/data.js:23-25`), so predicted high tides overshoot and the tidal range is
   exaggerated (site range −1.46 m to 4.46 m vs official ≈ 0.5 m to 4.1 m).

3. **Phase lags are not calibrated.** Time errors cluster around ±4–5 h with a drift
   through the month (early October: site *after* reference; late October: site
   *before* reference). This is the signature of a wrong M2 phase (`245°` in
   `js/data.js:23`) combined with the use of a single fixed epoch phase instead of
   the astronomical equilibrium argument `V(t)` described in the README. The
   seasonal DST handling (`TIMEZONE_OFFSET_HOURS = 1`, `js/data.js:76`) is also
   wrong after 25 October 2026, when mainland Portugal returns to WET (UTC+0) —
   adding a further 1 h shift for the last week of the month.

4. **Only 4 constituents.** Even with correct constants, M2/S2/K1/O1 alone give
   ±10–20 min / ±0.1–0.2 m accuracy. The IH uses the full harmonic analysis of
   year-long maregraphic series for each port.

## Recommendation

Replace the hand-approximated constants in `js/data.js` with the official IH
harmonic constants for a reference port per region (published in the Tabela de
Marés Vol. I, chapter "Constantes harmónicas fundamentais"), set `z0` to the port's
nível médio over the ZH, and implement the equilibrium arguments `V(t)` so phases
stay valid across years. For Lisboa that means approximately: M2 ≈ 1.15 m, S2 ≈
0.40 m, z0 = 2.20 m, with phase lags re-derived from the 2026 tables.

---

## Update: fix applied (2026-10-10)

The prediction engine has been recalibrated. Changes:

- `js/data.js`: constants for all seven regions re-fitted by linear least squares
  (M2, S2, N2, K2, K1, O1) against the confirmed October 2026 tables of the
  reference ports (Leixões, Aveiro, Lisboa, Sines, Faro, Funchal, Ponta Delgada).
  `z0` now equals the port's nível médio over the Zero Hidrográfico, so predicted
  heights are always positive. Added a proper EU DST rule
  (`lastSundayOfMonth`/`isDstActive`/`localOffsetHours`) replacing the hardcoded
  UTC+1, including the Azores (UTC−1).
- `js/tide.js`: rewritten around UTC-anchored time (hours since 2000-01-01 UTC),
  correct DST-aware local↔UTC conversion, a wider scan window (±13 h) so extrema
  near local midnight are never dropped, and 1-minute quadratic refinement of
  each extremum.

### Results after the fix (`node scripts/validate-confirmed-oct2026.js`)

| Region | n | mean time error | max | mean height error | max |
|---|---|---|---|---|---|
| Norte | 118 | 13.7 min | 51 min | 0.120 m | 0.360 m |
| Centro | 118 | 20.8 min | 64 min | 0.112 m | 0.360 m |
| Lisboa | 118 | 16.9 min | 48 min | 0.108 m | 0.360 m |
| Alentejo | 117 | 18.3 min | 74 min | 0.104 m | 0.290 m |
| Algarve | 117 | 16.3 min | 60 min | 0.098 m | 0.280 m |
| Madeira | 118 | 23.7 min | 114 min | 0.087 m | 0.280 m |
| Açores | 119 | 15.5 min | 56 min | 0.069 m | 0.260 m |
| **All** | **825** | **17.9 min** | 114 min | **0.100 m** | 0.360 m |

- Within ±30 min: **84%** (690/825); within ±60 min: **98%** (812/825)
- Before the fix: 0% within ±60 min, mean time error ≈ 4.4 h, mean height
  error −0.9 m, negative low tides.

The few unmatched events are extrema falling within ~40 minutes of local
midnight, where the small residual phase error shifts them across the day
boundary; the events themselves are still predicted, just attributed to the
neighbouring day.

The tables the constants were fitted against cover October 2026; accuracy for
other months/years will drift because the phase lags absorb the nodal cycle
only for the calibration period. Recalibrating against tables spanning a full
year would remove most of the residual seasonal error.

---

## Update 2: astronomical equilibrium arguments + nodal corrections (2026-10-10)

The engine now implements the full harmonic formulation with time-varying
astronomy, making the fitted constants **time-invariant port properties**
instead of October-2026-anchored phases:

- `js/data.js` stores, per constituent, the amplitude H and the phase lag g
  relative to the Doodson equilibrium argument V(t)+u(t), plus the fundamental
  astronomical arguments (Moon/Sun longitudes, perigees, node) needed to compute
  V(t) at prediction time.
- `js/tide.js` computes V(t)+u(t) and the nodal amplitude factor f(t)
  (18.6-year lunar node cycle) per instant:
  `h(t) = z0 + Σ H·f(t)·cos((V(t)+u(t) − g)·π/180)`

### Why this replaces monthly/per-period recalibration

Fitting against a single month (October 2026) left the phase lags absorbing
that month's particular Sun–Moon geometry, so predictions would drift in other
months. With the equilibrium argument computed per instant, g is a genuine
Greenwich-type phase lag: the same constants remain valid across the year and
degrade only slowly (minutes per year) over the 18.6-year nodal cycle, which
the f/u corrections now track explicitly.

### Validation

In-sample (October 2026 confirmed tables, 831 events, 7 ports):

| Region | n | mean time err | max | mean height err | max |
|---|---|---|---|---|---|
| Norte | 120 | 9.7 min | 49 min | 0.072 m | 0.190 m |
| Centro | 120 | 19.4 min | 85 min | 0.089 m | 0.260 m |
| Lisboa | 119 | 12.3 min | 29 min | 0.077 m | 0.200 m |
| Alentejo | 118 | 14.4 min | 55 min | 0.083 m | 0.210 m |
| Algarve | 118 | 13.4 min | 57 min | 0.083 m | 0.220 m |
| Madeira | 117 | 23.2 min | 114 min | 0.085 m | 0.260 m |
| Açores | 119 | 12.6 min | 46 min | 0.055 m | 0.180 m |
| **All** | **831** | **15.0 min** | 114 min | **0.078 m** | 0.260 m |

Within ±30 min: **89%** (743/831); within ±60 min: **99%** (819/831).

Out-of-sample (Lisboa, 17 days spanning Oct 11 – Nov 3 2026 from
tide-forecast.com, i.e. a different data source than the calibration set):
n=65, mean time error **19.4 min**, 75% within ±30 min, 97% within ±60 min —
confirming the constants generalize beyond the calibration month with only
mild degradation. (November-only events: 83% within ±30 min.)

Future-date sanity checks (2027, 2028) produce plausible tides with zero
negative heights across 1,596 events spanning two different nodal regimes
(October 2026, February 2027).

Remaining error sources: shallow-water constituents (M4 etc.) not modelled,
and the Sa/Ss annual meteorological terms omitted (they require ≥1 year of
calibration data; with only October available they are unidentifiable). If a
full year of confirmed tables is ever added, adding Sa/Ss to the fit would
remove most of the residual seasonal variation.
