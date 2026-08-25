// Translation manager for i18n support

const TRANSLATIONS = {};
let currentLang = 'pt_PT';

// Supported languages
const SUPPORTED_LANGS = ['pt_PT', 'en_GB'];

// Load translations from JSON file
async function loadTranslations(lang) {
  try {
    const response = await fetch(`js/translations/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load translations for ${lang}`);
    }
    TRANSLATIONS[lang] = await response.json();
    return TRANSLATIONS[lang];
  } catch (error) {
    console.error(`Error loading translations for ${lang}:`, error);
    // Fallback to pt_PT if loading fails
    if (lang !== 'pt_PT') {
      return loadTranslations('pt_PT');
    }
    return null;
  }
}

// Get translation for a key with optional parameter substitution
function translate(key, params = {}) {
  const translations = TRANSLATIONS[currentLang];
  
  if (!translations || !translations[key]) {
    // Return key as fallback for development
    return key;
  }
  
  let str = translations[key];
  
  // Replace placeholders like {location}, {githubLink}, etc.
  for (const [param, value] of Object.entries(params)) {
    str = str.replace(new RegExp(`\{${param}\}`, 'g'), value);
  }
  
  return str;
}

// Set the current language
async function setLanguage(lang) {
  // Validate language
  if (!SUPPORTED_LANGS.includes(lang)) {
    console.warn(`Language ${lang} not supported. Falling back to pt_PT.`);
    lang = 'pt_PT';
  }
  
  // Load translations if not already loaded
  if (!TRANSLATIONS[lang]) {
    await loadTranslations(lang);
  }
  
  currentLang = lang;
  
  // Save preference to localStorage
  try {
    localStorage.setItem('tideLang', lang);
  } catch (e) {
    console.warn('Could not save language preference to localStorage');
  }
  
  // Update HTML lang attribute
  document.documentElement.lang = lang.replace('_', '-');
  
  // Update language picker value
  const langSelect = document.getElementById('language');
  if (langSelect) {
    langSelect.value = lang;
  }
  
  return lang;
}

// Get user's preferred language
function getUserLanguage() {
  // Priority: localStorage > browser > default (pt_PT)
  
  // Check localStorage
  try {
    const savedLang = localStorage.getItem('tideLang');
    if (savedLang && SUPPORTED_LANGS.includes(savedLang)) {
      return savedLang;
    }
  } catch (e) {
    // localStorage not available
  }
  
  // Check browser language
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language || navigator.userLanguage || navigator.browserLanguage || navigator.systemLanguage || '';
    
    // Check for exact match
    if (SUPPORTED_LANGS.includes(browserLang)) {
      return browserLang;
    }
    
    // Check for language prefix (e.g., 'pt' from 'pt-PT')
    const langPrefix = browserLang.split('-')[0].toLowerCase();
    for (const supportedLang of SUPPORTED_LANGS) {
      const supportedPrefix = supportedLang.split('_')[0].toLowerCase();
      if (langPrefix === supportedPrefix) {
        return supportedLang;
      }
    }
  }
  
  // Default to pt_PT
  return 'pt_PT';
}

// Initialize translations
async function initTranslations() {
  const userLang = getUserLanguage();
  await setLanguage(userLang);
  return currentLang;
}

// Utility function to update all data-i18n elements on page
function updatePageTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = translate(key);
    }
  });
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    translate,
    setLanguage,
    getUserLanguage,
    initTranslations,
    updatePageTranslations,
    currentLang: () => currentLang
  };
}
