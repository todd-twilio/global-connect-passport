/**
 * Country Greetings Helper
 *
 * Provides localized "Nice to meet you" networking phrases
 * Maps country codes to appropriate first-meeting greetings
 *
 * Last updated: 2026-04-14
 * Countries: 22
 * Phrases: 19 countries use "nice to meet you", 3 use simple greetings
 * Sources: Forvo.com pronunciation dictionary (verified 2026-04-14)
 */

const COUNTRY_GREETINGS = {
  // Americas (7 countries)
  'US': {
    greeting: 'Hi, nice to meet you',
    nativeScript: null,
    romanization: null,
    language: 'English',
    forvoUrl: 'https://forvo.com/word/nice_to_meet_you/#en',
    notes: 'Standard American networking phrase (26K listens, 4 pronunciations)'
  },

  'CA': {
    greeting: 'Bonjour, enchanté',
    nativeScript: null,
    romanization: null,
    language: 'French',
    forvoUrl: 'https://forvo.com/word/enchanté/#fr',
    notes: 'French networking phrase, professional and friendly (183K listens, 6 pronunciations)'
  },

  'MX': {
    greeting: 'Hola, mucho gusto',
    nativeScript: null,
    romanization: null,
    language: 'Spanish',
    forvoUrl: 'https://forvo.com/word/mucho_gusto/#es',
    notes: 'Most natural networking phrase in Latin America (24K listens, 3 pronunciations)'
  },

  'CR': {
    greeting: 'Hola, mucho gusto',
    nativeScript: null,
    romanization: null,
    language: 'Spanish',
    forvoUrl: 'https://forvo.com/word/mucho_gusto/#es',
    notes: 'Universal Spanish networking phrase (24K listens, 3 pronunciations)'
  },

  'BR': {
    greeting: 'Olá, prazer',
    nativeScript: null,
    romanization: null,
    language: 'Portuguese',
    forvoUrl: 'https://forvo.com/word/prazer/#pt',
    notes: 'Brazilian Portuguese networking phrase (8.6K listens, 3 pronunciations)'
  },

  'AR': {
    greeting: 'Hola, mucho gusto',
    nativeScript: null,
    romanization: null,
    language: 'Spanish',
    forvoUrl: 'https://forvo.com/word/mucho_gusto/#es',
    notes: 'Standard Spanish networking phrase (24K listens, 3 pronunciations)'
  },

  'NZ': {
    greeting: 'Kia ora',
    nativeScript: null,
    romanization: null,
    language: 'Māori/English',
    forvoUrl: 'https://forvo.com/word/kia_ora/#mi',
    notes: 'Multi-purpose Māori greeting - works for both hello and nice to meet you'
  },

  // Europe (10 countries)
  'GB': {
    greeting: 'Hi, nice to meet you',
    nativeScript: null,
    romanization: null,
    language: 'English',
    forvoUrl: 'https://forvo.com/word/nice_to_meet_you/#en',
    notes: 'British networking phrase (26K listens, 4 pronunciations)'
  },

  'IE': {
    greeting: 'Dia dhuit',
    nativeScript: null,
    romanization: null,
    language: 'Irish Gaelic',
    forvoUrl: 'https://forvo.com/word/dia_dhuit/#ga',
    notes: 'Traditional Irish greeting - "nice to meet you" phrase not available on Forvo'
  },

  'FR': {
    greeting: 'Bonjour, enchanté',
    nativeScript: null,
    romanization: null,
    language: 'French',
    forvoUrl: 'https://forvo.com/word/enchanté/#fr',
    notes: 'Perfect French networking phrase (183K listens, 6 pronunciations)'
  },

  'DE': {
    greeting: 'Hallo, freut mich',
    nativeScript: null,
    romanization: null,
    language: 'German',
    forvoUrl: 'https://forvo.com/word/freut_mich/#de',
    notes: 'German networking phrase meaning "I\'m pleased" (20K listens, 1 pronunciation)'
  },

  'ES': {
    greeting: 'Hola, encantado',
    nativeScript: null,
    romanization: null,
    language: 'Spanish',
    forvoUrl: 'https://forvo.com/word/encantado/#es',
    notes: 'Spanish networking phrase, slightly formal (82K listens, 8 pronunciations)'
  },

  'IT': {
    greeting: 'Ciao, piacere',
    nativeScript: null,
    romanization: null,
    language: 'Italian',
    forvoUrl: 'https://forvo.com/word/piacere/#it',
    notes: 'Italian networking phrase, natural and common (86K listens, 7 pronunciations)'
  },

  'NL': {
    greeting: 'Hallo, aangenaam',
    nativeScript: null,
    romanization: null,
    language: 'Dutch',
    forvoUrl: 'https://forvo.com/word/aangenaam/#nl',
    notes: 'Dutch networking phrase, standard formal greeting (33K listens, 6 pronunciations)'
  },

  'SE': {
    greeting: 'Hej, trevligt att träffas',
    nativeScript: null,
    romanization: null,
    language: 'Swedish',
    forvoUrl: 'https://forvo.com/word/trevligt_att_träffas/#sv',
    notes: 'Swedish networking phrase meaning "nice to meet you" (20K listens, 4 pronunciations)'
  },

  'HU': {
    greeting: 'Szia, örülök',
    nativeScript: null,
    romanization: null,
    language: 'Hungarian',
    forvoUrl: 'https://forvo.com/word/örülök/#hu',
    notes: 'Hungarian networking phrase meaning "I\'m pleased" (18K listens, 2 pronunciations)'
  },

  'RU': {
    greeting: 'Priyatno poznakomit\'sya',
    nativeScript: 'Привет, приятно познакомиться',
    romanization: 'Privet, priyatno poznakomit\'sya',
    language: 'Russian',
    forvoUrl: 'https://forvo.com/word/приятно_познакомиться/#ru',
    notes: 'Russian networking phrase meaning "nice to meet you" (2.3K listens, 3 pronunciations)'
  },

  // Asia-Pacific (6 countries)
  'AU': {
    greeting: 'Hi, nice to meet you',
    nativeScript: null,
    romanization: null,
    language: 'English',
    forvoUrl: 'https://forvo.com/word/nice_to_meet_you/#en',
    notes: 'Australian networking phrase (26K listens, 4 pronunciations)'
  },

  'JP': {
    greeting: 'Hajimemashite',
    nativeScript: 'こんにちは、初めまして',
    romanization: 'Konnichiwa, hajimemashite',
    language: 'Japanese',
    forvoUrl: 'https://forvo.com/word/初めまして/#ja',
    notes: 'Perfect Japanese first-meeting phrase - more appropriate than Konnichiwa (17K listens, 5 pronunciations)'
  },

  'CN': {
    greeting: 'Hěn gāoxìng rènshi nǐ',
    nativeScript: '你好，很高兴认识你',
    romanization: 'Nǐ hǎo, hěn gāoxìng rènshi nǐ',
    language: 'Mandarin Chinese',
    forvoUrl: 'https://forvo.com/word/很高兴认识你/#zh',
    notes: 'Mandarin networking phrase meaning "nice to meet you" (15K listens, 6 pronunciations)'
  },

  'KR': {
    greeting: 'Mannaseo bangapseumnida',
    nativeScript: '안녕하세요, 만나서 반갑습니다',
    romanization: 'Annyeonghaseyo, mannaseo bangapseumnida',
    language: 'Korean',
    forvoUrl: 'https://forvo.com/word/만나서_반갑습니다/#ko',
    notes: 'Polite Korean networking phrase meaning "nice to meet you" (15K listens, 3 pronunciations)'
  },

  'IN': {
    greeting: 'Namaste',
    nativeScript: 'नमस्ते',
    romanization: 'Namaste',
    language: 'Hindi',
    forvoUrl: 'https://forvo.com/word/नमस्ते/#hi',
    notes: 'Traditional Hindi greeting - "nice to meet you" phrase not available on Forvo'
  },

  'PH': {
    greeting: 'Kamusta',
    nativeScript: null,
    romanization: null,
    language: 'Tagalog',
    forvoUrl: 'https://forvo.com/word/kamusta/#tl',
    notes: 'Filipino greeting - "nice to meet you" phrase not available on Forvo'
  },

  // Africa (1 country)
  'NG': {
    greeting: 'Bawo ni',
    nativeScript: null,
    romanization: null,
    language: 'Yoruba',
    forvoUrl: 'https://forvo.com/word/bawo_ni/#yo',
    notes: 'Yoruba greeting (pronounced: bah-wo nee)'
  },

  // Default fallback
  'DEFAULT': {
    greeting: 'Hello',
    nativeScript: null,
    romanization: null,
    language: 'English',
    forvoUrl: null,
    notes: 'Default fallback greeting'
  }
};

/**
 * Get greeting data for a country
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code (e.g., 'US', 'JP', 'BR')
 * @returns {Object} Greeting data object with greeting, script, romanization, and language
 */
function getGreeting(countryCode) {
  if (!countryCode || typeof countryCode !== 'string') {
    return COUNTRY_GREETINGS.DEFAULT;
  }

  const code = countryCode.toUpperCase().trim();
  return COUNTRY_GREETINGS[code] || COUNTRY_GREETINGS.DEFAULT;
}

/**
 * Format greeting for SMS/WhatsApp message
 * Handles both Latin and non-Latin scripts
 *
 * @param {string} countryCode - ISO country code
 * @returns {string} Formatted greeting string for message
 *
 * Examples:
 *   'BR' -> '"Olá!" (Hello in Portuguese)'
 *   'JP' -> '"こんにちは (Konnichiwa)!" (Hello in Japanese)'
 *   'CN' -> '"你好 (Nǐ hǎo)!" (Hello in Mandarin Chinese)'
 */
function formatGreeting(countryCode) {
  const greetingData = getGreeting(countryCode);

  if (!greetingData) {
    return '"Hello!"';
  }

  // If native script exists (non-Latin), show both native and romanization
  if (greetingData.nativeScript && greetingData.romanization) {
    return `"${greetingData.nativeScript} (${greetingData.romanization})!" (Hello in ${greetingData.language})`;
  }

  // If Latin script only
  return `"${greetingData.greeting}!" (Hello in ${greetingData.language})`;
}

/**
 * Get greeting with audio URL for pronunciation
 * Returns formatted "Hi, nice to meet you" phrase and Forvo pronunciation link
 *
 * @param {string} countryCode - ISO country code
 * @returns {Object} { text: string, audioUrl: string|null, language: string }
 *
 * Examples:
 *   'JP' -> {
 *     text: '"こんにちは、初めまして (Konnichiwa, hajimemashite)!"',
 *     audioUrl: 'https://forvo.com/word/初めまして/#ja',
 *     language: 'Japanese'
 *   }
 *   'BR' -> {
 *     text: '"Olá, prazer!"',
 *     audioUrl: 'https://forvo.com/word/prazer/#pt',
 *     language: 'Portuguese'
 *   }
 */
function getGreetingWithAudio(countryCode) {
  const greetingData = getGreeting(countryCode);

  if (!greetingData) {
    return {
      text: '"Hi, nice to meet you!"',
      audioUrl: null,
      language: 'English'
    };
  }

  // Format text: all as one quoted phrase
  let text;
  if (greetingData.nativeScript && greetingData.romanization) {
    // For non-Latin scripts: show native + romanization
    text = `"${greetingData.nativeScript} (${greetingData.romanization})!"`;
  } else {
    // For Latin scripts: just show the phrase
    text = `"${greetingData.greeting}!"`;
  }

  // Return both text and audio URL
  return {
    text: text,
    audioUrl: greetingData.forvoUrl || null,
    language: greetingData.language
  };
}

/**
 * Get all supported countries
 * @returns {Array<string>} Array of supported country codes
 */
function getSupportedCountries() {
  return Object.keys(COUNTRY_GREETINGS).filter(code => code !== 'DEFAULT');
}

/**
 * Check if a country is supported
 * @param {string} countryCode - ISO country code
 * @returns {boolean} True if country has a greeting
 */
function isSupported(countryCode) {
  if (!countryCode) return false;
  const code = countryCode.toUpperCase().trim();
  return COUNTRY_GREETINGS.hasOwnProperty(code) && code !== 'DEFAULT';
}

module.exports = {
  getGreeting,
  formatGreeting,
  getGreetingWithAudio,
  getSupportedCountries,
  isSupported,
  COUNTRY_GREETINGS
};
