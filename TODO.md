# Internationalization (i18n) Implementation Plan

## Goal
Add English (en_GB) and Portuguese (pt_PT) language support to the website with a language picker, defaulting to pt_PT.

## Implementation Strategy

### 1. Translation System Architecture
- **Format**: JSON-based translation files
- **Location**: `js/translations/` directory
- **Files**:
  - `js/translations/en_GB.json` - English (UK) translations
  - `js/translations/pt_PT.json` - Portuguese (Portugal) translations

### 2. Translation Keys Structure
```json
{
  "title": "Portugal Coastal Tides",
  "subtitle": "NUTS II Regions",
  "location_label": "Location:",
  "date_label": "Date:",
  "select_location": "Select a location...",
  "tide_predictions": "Tide Predictions for {location}",
  "date_display": "Date:",
  "tide": "Tide",
  "hour": "Hour",
  "height": "Height",
  "high": "High",
  "low": "Low",
  "privacy_policy": "Privacy Policy",
  "gplv3": "GPLv3",
  "predictions_note": "Tide predictions based on harmonic constituents (M₂, S₂, K₁, O₁). Data approximated from IH Portugal.",
  "select_date": "Select a location and date to see tide predictions.",
  "error": "Error calculating tides.",
  "please_select": "Please select a location and date."
}
```

### 3. Core Implementation Steps

#### Step 1: Create Translation Files
- [ ] Create `js/translations/` directory
- [ ] Create `en_GB.json` with all English strings
- [ ] Create `pt_PT.json` with all Portuguese strings

#### Step 2: Add Language Picker UI
- [ ] Add `<select id="language">` dropdown in header with options for pt_PT and en_GB
- [ ] Style the language picker to fit at top of page
- [ ] Add aria-label for accessibility

#### Step 3: Create Translation Manager
- [ ] Add `js/translations.js` module with:
  - `loadTranslations(lang)` - Load translation file
  - `translate(key, params)` - Get translated string with interpolation
  - `setLanguage(lang)` - Change language and update UI
  - `getUserLanguage()` - Detect browser preference (default pt_PT)
  - `saveLanguagePreference(lang)` - Save to localStorage

#### Step 4: Update HTML Structure
- [ ] Add `lang` attribute to `<html>` element (dynamically updated)
- [ ] Add data-i18n attributes to all translatable elements
- [ ] Update index.html and privacy.html with translation markers

#### Step 5: Update JavaScript
- [ ] Modify app.js to use translation system
- [ ] Add event listener for language change
- [ ] Initialize with saved or default language
- [ ] Update dynamic content (results, errors) to use translations

#### Step 6: CSS Updates
- [ ] Style language picker to be compact and accessible
- [ ] Ensure language picker works on mobile

### 4. Technical Details

**Language Detection Priority:**
1. URL parameter (`?lang=pt_PT`)
2. localStorage preference
3. Browser Accept-Language header
4. Default: pt_PT

**File Structure:**
```
js/
├── translations/
│   ├── en_GB.json
│   ├── pt_PT.json
│   └── index.js (translation manager)
├── data.js
├── tide.js
└── app.js
```

**Translation Usage Pattern:**
```html
<h1 data-i18n="title">Portugal Coastal Tides</h1>
<p data-i18n="subtitle">NUTS II Regions</p>
```

```javascript
// In app.js
function displayResults(location, dateStr, tidePoints) {
  const formattedDate = formatDate(dateStr);
  const title = translate('tide_predictions', { location: location.name });
  resultsDiv.innerHTML = `
    <h2>${title}</h2>
    <p class="date-display">${translate('date_display')}: ${formattedDate}</p>
    ...
  `;
}
```

### 5. Testing Checklist
- [ ] Verify all text is translatable
- [ ] Test language switcher functionality
- [ ] Verify default language is pt_PT
- [ ] Test on mobile devices
- [ ] Verify accessibility of language picker
- [ ] Test with browser language preferences
- [ ] Verify localStorage persistence

### 6. Deployment Considerations
- Ensure JSON files are served with correct Content-Type
- Consider caching strategy for translation files
- Verify no hardcoded strings remain

## Timeline
- Phase 1: Translation files and manager (1-2 hours)
- Phase 2: UI integration (1-2 hours)
- Phase 3: Testing and polish (1 hour)

## Notes
- Keep date format localized (DD/MM/YYYY for pt_PT, potentially different for en_GB)
- Consider RTl support for future languages (not needed for pt_PT/en_GB)
- Number formatting should respect locale (decimal separator)
