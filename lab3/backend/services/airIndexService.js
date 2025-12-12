/**
 * Default air quality limits (µg/m³) based on WHO and EU standards
 */
const DEFAULT_LIMITS = {
  PM25: 50,   // 24-hour mean
  PM10: 300,  // 24-hour mean
  NO2: 400,   // 1-hour mean
  SO2: 200,   // 24-hour mean
  O3: 150     // 8-hour mean
};

/**
 * Air Quality Index categories and thresholds
 */
const AQI_CATEGORIES = [
  { min: 0, max: 50, name: 'good', color: '#00E400', label: 'Добре'},
  { min: 51, max: 100, name: 'moderate', color: '#FFFF00', label: 'Помірно'},
  { min: 101, max: 150, name: 'unhealthy-sensitive', color: '#FF7E00', label: 'Погано для чутливих'},
  { min: 151, max: 200, name: 'unhealthy', color: '#FF0000', label: 'Погано'},
  { min: 201, max: 300, name: 'very-unhealthy', color: '#8F3F97', label: 'Дуже погано'},
  { min: 301, max: Infinity, name: 'hazardous', color: '#7E0023', label: 'Небезпечно'}
];

/**
 * Calculate sub-index for a single pollutant
 * Formula: SubIndex = (Concentration / Limit) * 100
 * 
 * @param {number|null} concentration - Pollutant concentration
 * @param {number} limit - Limit value
 * @returns {number|null} Sub-index value or null if concentration is missing
 */
const calculateSubIndex = (concentration, limit) => {
  if (concentration === null || concentration === undefined || isNaN(concentration)) {
    return null;
  }
  
  if (limit <= 0) {
    throw new Error('Limit must be positive');
  }

  return (concentration / limit) * 100;
};

/**
 * Get air quality category based on index value
 * 
 * @param {number} index - Air quality index
 * @returns {object} Category information
 */
const getCategory = (index) => {
  const category = AQI_CATEGORIES.find(cat => index >= cat.min && index <= cat.max);
  return category || AQI_CATEGORIES[AQI_CATEGORIES.length - 1];
};

/**
 * Calculate integral air quality index
 * Uses maximum sub-index approach (most conservative)
 * 
 * @param {object} payload - Input data
 * @param {object} payload.pollutants - Pollutant concentrations
 * @param {object} [payload.limits] - Custom limits (optional)
 * @returns {object} Calculation results
 */
const compute = (payload) => {
  const { pollutants, limits: customLimits } = payload;

  // Validate input
  if (!pollutants || typeof pollutants !== 'object') {
    throw new Error('Pollutants data is required');
  }

  // Merge custom limits with defaults
  const limits = { ...DEFAULT_LIMITS, ...customLimits };

  // Validate limits
  Object.entries(limits).forEach(([key, value]) => {
    if (value <= 0) {
      throw new Error(`Limit for ${key} must be positive`);
    }
  });

  // Calculate sub-indices
  const subIndices = {};
  const validSubIndices = [];

  Object.keys(DEFAULT_LIMITS).forEach(pollutant => {
    const concentration = pollutants[pollutant];
    const limit = limits[pollutant];

    try {
      const subIndex = calculateSubIndex(concentration, limit);
      subIndices[pollutant] = subIndex;

      if (subIndex !== null) {
        validSubIndices.push(subIndex);
      }
    } catch (error) {
      throw new Error(`Error calculating sub-index for ${pollutant}: ${error.message}`);
    }
  });

  // Check if we have at least one valid measurement
  if (validSubIndices.length === 0) {
    throw new Error('At least one valid pollutant measurement is required');
  }

  // Calculate integral index using maximum sub-index (most conservative approach)
  const index = Math.max(...validSubIndices);

  // Get category information
  const categoryInfo = getCategory(index);

  return {
    subIndices,
    index: Math.round(index * 100) / 100, // Round to 2 decimal places
    category: categoryInfo.name,
    categoryLabel: categoryInfo.label,
    color: categoryInfo.color,
    icon: categoryInfo.icon,
    limits,
    validMeasurements: validSubIndices.length,
    totalPollutants: Object.keys(DEFAULT_LIMITS).length
  };
};

/**
 * Generate synthetic air quality data with daily cycle
 * 
 * @param {object} options - Generation options
 * @returns {object} Synthetic pollutant data
 */
const generateSyntheticData = (options = {}) => {
  const {
    hour = new Date().getHours(),
    includeNulls = true,
    nullProbability = 0.2
  } = options;

  // Daily cycle factors (0.0 - 1.0)
  // Morning peak: 7-9, Evening peak: 17-19
  const hourFactor = (() => {
    if (hour >= 7 && hour <= 9) return 0.8 + Math.random() * 0.2;
    if (hour >= 17 && hour <= 19) return 0.7 + Math.random() * 0.3;
    if (hour >= 23 || hour <= 5) return 0.3 + Math.random() * 0.2;
    return 0.5 + Math.random() * 0.3;
  })();

  const addNoise = (value, range) => {
    const noise = (Math.random() - 0.5) * range * 0.2;
    return Math.max(0, value + noise);
  };

  const maybeNull = (value) => {
    if (includeNulls && Math.random() < nullProbability) {
      return null;
    }
    return Math.round(value * 10) / 10;
  };

  return {
    PM25: maybeNull(addNoise(20 + hourFactor * 80, 145)), // 5-150
    PM10: maybeNull(addNoise(50 + hourFactor * 150, 290)), // 10-300
    NO2: maybeNull(addNoise(50 + hourFactor * 200, 390)), // 10-400
    SO2: maybeNull(addNoise(20 + hourFactor * 100, 195)), // 5-200
    O3: maybeNull(addNoise(40 + hourFactor * 120, 240)) // 10-250
  };
};

module.exports = {
  compute,
  calculateSubIndex,
  getCategory,
  generateSyntheticData,
  DEFAULT_LIMITS,
  AQI_CATEGORIES
};
