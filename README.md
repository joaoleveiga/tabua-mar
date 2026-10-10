# Portugal Coastal Tides

A simple static website to check tide predictions for Portugal's coastal NUTS II regions using open-source harmonic tide prediction methods.

## Features

- **Locations**: Norte, Centro, Lisboa e Vale do Tejo, Alentejo, Algarve, Madeira, Açores
- **Calendar**: Starting from August 2026
- **Predictions**: High tide and low tide times with heights
- **Method**: Harmonic tide prediction using M₂, S₂, N₂, K₂, K₁, O₁ constituents
- **Calibration**: Constants least-squares fitted against confirmed October 2026 tide tables derived from the official IH Portugal Tabela de Marés 2026 (see `data/` and `docs/validation-october-2026.md`)
- **Zero Dependencies**: Pure HTML, CSS, and JavaScript

## How It Works

The website uses the **harmonic method** for tide prediction, which calculates tide height as a sum of cosine functions for each tidal constituent:

```
h(t) = Z₀ + Σ [Hᵢ · fᵢ(t) · cos((Vᵢ(t) + uᵢ(t) − gᵢ) · π/180)]
```

Where:
- Z₀: Mean sea level offset over the Zero Hidrográfico (ZH)
- Hᵢ: Amplitude of constituent
- Vᵢ(t): Doodson equilibrium argument (astronomical, computed per instant)
- uᵢ(t), fᵢ(t): Nodal phase and amplitude corrections (18.6-year lunar node cycle)
- gᵢ: Phase lag relative to the equilibrium argument (location-specific)
- t: Hours since 2000-01-01 00:00 UTC

Because the equilibrium arguments and nodal corrections are computed per instant, the fitted constants are time-invariant port properties: predictions remain valid across months and years (validated out-of-sample on November 2026 data), not just the calibration month.

### Tidal Constituents Used

| Constituent | Period (hours) | Description |
|-------------|----------------|-------------|
| M₂ | 12.4206 | Principal lunar semidiurnal |
| S₂ | 12.0000 | Principal solar semidiurnal |
| N₂ | 12.6583 | Larger lunar elliptic semidiurnal |
| K₂ | 11.9672 | Luni-solar semidiurnal |
| K₁ | 23.9345 | Luni-solar diurnal |
| O₁ | 25.8193 | Principal lunar diurnal |

### Validation

Predictions were validated against confirmed October 2026 tide tables for the seven
reference ports (one per region): mean time error 15 minutes (89% within ±30 min,
99% within ±60 min), mean height error 0.08 m over the Zero Hidrográfico. Out-of-sample
times for Lisboa (Oct 11 – Nov 3 2026, independent source) average 19 minutes.
See `docs/validation-october-2026.md` and run `node scripts/validate-confirmed-oct2026.js`.

## Data Sources

Harmonic constants are least-squares fitted from:
- Official **IH Portugal** (Instituto Hidrográfico Português) Tabela de Marés 2026, Volume I predictions, as republished in monthly reference tables
- One reference port per region: Leixões (Norte), Aveiro (Centro), Lisboa (Lisboa e Vale do Tejo), Sines (Alentejo), Faro (Algarve), Funchal (Madeira), Ponta Delgada (Açores)

## Project Structure

```
.
├── index.html          # Main HTML page
├── css/
│   └── style.css      # Custom styling
├── js/
│   ├── data.js        # Location definitions and harmonic constants
│   ├── tide.js        # Harmonic tide calculation engine
│   └── app.js         # UI logic and event handling
└── README.md
```

## Usage

1. Open `index.html` in a web browser
2. Select a location (Norte, Centro, Lisboa e Vale do Tejo, Alentejo, Algarve, Madeira, or Açores)
3. Select a date (starting from August 1, 2026)
4. View the high and low tide predictions for that day

## Deployment

This is a static website that can be deployed anywhere:
- GitHub Pages
- Netlify
- Vercel
- Any static web hosting

### GitHub Pages

The site is configured for GitHub Pages deployment. Simply enable GitHub Pages in the repository settings, selecting the `main` branch and `/ (root)` folder.

## License

This project is open source and available under the [GPLv3 License](LICENSE).

## Credits

- Tide prediction method based on open-source harmonic analysis
- Data approximated from IH Portugal and NOAA public data
