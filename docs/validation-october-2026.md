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
