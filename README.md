# Portugal Coastal Tides

A simple static website to check tide predictions for Portugal's coastal NUTS II regions using open-source harmonic tide prediction methods.

## Features

- **Locations**: Norte, Centro, Lisboa e Vale do Tejo, Alentejo, Algarve, Madeira, Açores
- **Calendar**: Starting from August 2026
- **Predictions**: High tide and low tide times with heights
- **Method**: Harmonic tide prediction using M₂, S₂, K₁, O₁ constituents
- **Zero Dependencies**: Pure HTML, CSS, and JavaScript

## How It Works

The website uses the **harmonic method** for tide prediction, which calculates tide height as a sum of cosine functions for each tidal constituent:

```
h(t) = Z₀ + Σ [Aᵢ · cos(ωᵢ·t + φᵢ - Vᵢ(t))]
```

Where:
- Z₀: Mean sea level offset
- Aᵢ: Amplitude of constituent
- ωᵢ: Angular speed
- φᵢ: Phase lag (location-specific)
- Vᵢ(t): Astronomical equilibrium argument

### Tidal Constituents Used

| Constituent | Period (hours) | Description |
|-------------|----------------|-------------|
| M₂ | 12.4206 | Principal lunar semidiurnal |
| S₂ | 12.0000 | Principal solar semidiurnal |
| K₁ | 23.9345 | Luni-solar diurnal |
| O₁ | 25.8193 | Principal lunar diurnal |

## Data Sources

Harmonic constants are approximated from:
- **IH Portugal** (Instituto Hidrográfico Português)
- **NOAA** tide prediction data

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
