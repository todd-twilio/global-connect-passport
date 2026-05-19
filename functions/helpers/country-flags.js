/**
 * Country Flag Emoji Helper
 *
 * Maps country names to flag emojis
 */

const COUNTRY_FLAGS = {
  // Americas
  'United States': '🇺🇸',
  'USA': '🇺🇸',
  'Canada': '🇨🇦',
  'Mexico': '🇲🇽',
  'Brazil': '🇧🇷',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Colombia': '🇨🇴',
  'Peru': '🇵🇪',

  // Europe
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Spain': '🇪🇸',
  'Italy': '🇮🇹',
  'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪',
  'Switzerland': '🇨🇭',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Finland': '🇫🇮',
  'Poland': '🇵🇱',
  'Ireland': '🇮🇪',
  'Austria': '🇦🇹',
  'Portugal': '🇵🇹',
  'Greece': '🇬🇷',

  // Asia-Pacific
  'Japan': '🇯🇵',
  'China': '🇨🇳',
  'South Korea': '🇰🇷',
  'Korea': '🇰🇷',
  'India': '🇮🇳',
  'Singapore': '🇸🇬',
  'Australia': '🇦🇺',
  'New Zealand': '🇳🇿',
  'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳',
  'Malaysia': '🇲🇾',
  'Indonesia': '🇮🇩',
  'Philippines': '🇵🇭',
  'Taiwan': '🇹🇼',
  'Hong Kong': '🇭🇰',

  // Middle East & Africa
  'UAE': '🇦🇪',
  'United Arab Emirates': '🇦🇪',
  'Saudi Arabia': '🇸🇦',
  'Israel': '🇮🇱',
  'South Africa': '🇿🇦',
  'Egypt': '🇪🇬',
  'Nigeria': '🇳🇬',
  'Kenya': '🇰🇪'
};

/**
 * Get flag emoji for country
 * @param {string} country - Country name
 * @returns {string} - Flag emoji or empty string if not found
 */
function getFlag(country) {
  if (!country) return '';
  return COUNTRY_FLAGS[country] || '';
}

/**
 * Format message with flag emoji
 * @param {string} country - Country name
 * @returns {string} - Flag emoji or empty string
 */
function formatCountryWithFlag(country) {
  const flag = getFlag(country);
  return flag ? `${flag} ` : '';
}

/**
 * Get flag emoji from ISO 3166-1 alpha-2 country code
 * @param {string} countryCode - 2-letter ISO country code (e.g., 'US', 'BR', 'JP')
 * @returns {string} - Flag emoji or empty string if invalid
 */
function getFlagFromCode(countryCode) {
  if (!countryCode || typeof countryCode !== 'string') return '';

  const code = countryCode.toUpperCase().trim();
  if (code.length !== 2) return '';

  // Convert each letter to regional indicator symbol
  // A-Z (65-90) maps to 127462-127487
  const codePoints = [...code].map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

module.exports = {
  getFlag,
  formatCountryWithFlag,
  getFlagFromCode,
  COUNTRY_FLAGS
};
