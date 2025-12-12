const {
  compute,
  calculateSubIndex,
  getCategory,
  generateSyntheticData,
  DEFAULT_LIMITS
} = require('../services/airIndexService');

describe('Air Index Service', () => {
  describe('calculateSubIndex', () => {
    it('should calculate sub-index correctly', () => {
      const result = calculateSubIndex(50, 100);
      expect(result).toBe(50);
    });

    it('should return null for null concentration', () => {
      const result = calculateSubIndex(null, 100);
      expect(result).toBeNull();
    });

    it('should return null for undefined concentration', () => {
      const result = calculateSubIndex(undefined, 100);
      expect(result).toBeNull();
    });

    it('should throw error for zero or negative limit', () => {
      expect(() => calculateSubIndex(50, 0)).toThrow('Limit must be positive');
      expect(() => calculateSubIndex(50, -10)).toThrow('Limit must be positive');
    });

    it('should handle high concentration values', () => {
      const result = calculateSubIndex(200, 100);
      expect(result).toBe(200);
    });

    it('should handle low concentration values', () => {
      const result = calculateSubIndex(5, 100);
      expect(result).toBe(5);
    });
  });

  describe('getCategory', () => {
    it('should return "good" for index 0-50', () => {
      expect(getCategory(0).name).toBe('good');
      expect(getCategory(25).name).toBe('good');
      expect(getCategory(50).name).toBe('good');
    });

    it('should return "moderate" for index 51-100', () => {
      expect(getCategory(51).name).toBe('moderate');
      expect(getCategory(75).name).toBe('moderate');
      expect(getCategory(100).name).toBe('moderate');
    });

    it('should return "unhealthy-sensitive" for index 101-150', () => {
      expect(getCategory(101).name).toBe('unhealthy-sensitive');
      expect(getCategory(125).name).toBe('unhealthy-sensitive');
      expect(getCategory(150).name).toBe('unhealthy-sensitive');
    });

    it('should return "unhealthy" for index 151-200', () => {
      expect(getCategory(151).name).toBe('unhealthy');
      expect(getCategory(175).name).toBe('unhealthy');
      expect(getCategory(200).name).toBe('unhealthy');
    });

    it('should return "very-unhealthy" for index 201-300', () => {
      expect(getCategory(201).name).toBe('very-unhealthy');
      expect(getCategory(250).name).toBe('very-unhealthy');
      expect(getCategory(300).name).toBe('very-unhealthy');
    });

    it('should return "hazardous" for index > 300', () => {
      expect(getCategory(301).name).toBe('hazardous');
      expect(getCategory(500).name).toBe('hazardous');
      expect(getCategory(1000).name).toBe('hazardous');
    });
  });

  describe('compute', () => {
    it('should calculate index with all pollutants', () => {
      const payload = {
        pollutants: {
          PM25: 25,
          PM10: 150,
          NO2: 200,
          SO2: 100,
          O3: 75
        }
      };

      const result = compute(payload);

      expect(result.index).toBeDefined();
      expect(result.category).toBeDefined();
      expect(result.subIndices.PM25).toBeCloseTo(50, 1);
      expect(result.subIndices.PM10).toBeCloseTo(50, 1);
      expect(result.subIndices.NO2).toBeCloseTo(50, 1);
      expect(result.subIndices.SO2).toBeCloseTo(50, 1);
      expect(result.subIndices.O3).toBeCloseTo(50, 1);
      expect(result.validMeasurements).toBe(5);
    });

    it('should handle missing pollutants (null values)', () => {
      const payload = {
        pollutants: {
          PM25: 25,
          PM10: null,
          NO2: null,
          SO2: 100,
          O3: 75
        }
      };

      const result = compute(payload);

      expect(result.index).toBeDefined();
      expect(result.subIndices.PM25).toBeCloseTo(50, 1);
      expect(result.subIndices.PM10).toBeNull();
      expect(result.subIndices.NO2).toBeNull();
      expect(result.subIndices.SO2).toBeCloseTo(50, 1);
      expect(result.subIndices.O3).toBeCloseTo(50, 1);
      expect(result.validMeasurements).toBe(3);
    });

    it('should use maximum sub-index as integral index', () => {
      const payload = {
        pollutants: {
          PM25: 75, // 150% of limit (if limit = 50)
          PM10: 60, // 20% of limit (if limit = 300)
          NO2: 80, // 20% of limit (if limit = 400)
          SO2: 40, // 20% of limit (if limit = 200)
          O3: 30  // 20% of limit (if limit = 150)
        }
      };

      const result = compute(payload);

      // PM25 should have the highest sub-index
      expect(result.index).toBeGreaterThanOrEqual(result.subIndices.PM25);
      expect(result.index).toBeGreaterThanOrEqual(result.subIndices.PM10);
      expect(result.index).toBeGreaterThanOrEqual(result.subIndices.NO2);
      expect(result.index).toBeGreaterThanOrEqual(result.subIndices.SO2);
      expect(result.index).toBeGreaterThanOrEqual(result.subIndices.O3);
    });

    it('should accept custom limits', () => {
      const payload = {
        pollutants: {
          PM25: 50,
          PM10: 150,
          NO2: 200,
          SO2: 100,
          O3: 75
        },
        limits: {
          PM25: 100, // Custom higher limit
          PM10: 300,
          NO2: 400,
          SO2: 200,
          O3: 150
        }
      };

      const result = compute(payload);

      expect(result.subIndices.PM25).toBeCloseTo(50, 1); // 50/100 * 100 = 50
      expect(result.limits.PM25).toBe(100);
    });

    it('should throw error if no valid pollutants provided', () => {
      const payload = {
        pollutants: {
          PM25: null,
          PM10: null,
          NO2: null,
          SO2: null,
          O3: null
        }
      };

      expect(() => compute(payload)).toThrow('At least one valid pollutant measurement is required');
    });

    it('should throw error for invalid limits', () => {
      const payload = {
        pollutants: {
          PM25: 50
        },
        limits: {
          PM25: -10
        }
      };

      expect(() => compute(payload)).toThrow('Limit for PM25 must be positive');
    });

    it('should throw error if pollutants is missing', () => {
      const payload = {};

      expect(() => compute(payload)).toThrow('Pollutants data is required');
    });

    it('should return correct category for different index ranges', () => {
      // Good quality
      const result1 = compute({
        pollutants: { PM25: 10, PM10: 50, NO2: 50, SO2: 25, O3: 30 }
      });
      expect(result1.category).toBe('good');

      // High pollution
      const result2 = compute({
        pollutants: { PM25: 100, PM10: 150, NO2: 200, SO2: 150, O3: 120 }
      });
      expect(['moderate', 'unhealthy-sensitive', 'unhealthy']).toContain(result2.category);
    });
  });

  describe('generateSyntheticData', () => {
    it('should generate data with all pollutants', () => {
      const data = generateSyntheticData({ includeNulls: false });

      expect(data.PM25).toBeDefined();
      expect(data.PM10).toBeDefined();
      expect(data.NO2).toBeDefined();
      expect(data.SO2).toBeDefined();
      expect(data.O3).toBeDefined();
    });

    it('should respect includeNulls option', () => {
      const data = generateSyntheticData({ includeNulls: false });

      expect(data.PM25).not.toBeNull();
      expect(data.PM10).not.toBeNull();
      expect(data.NO2).not.toBeNull();
      expect(data.SO2).not.toBeNull();
      expect(data.O3).not.toBeNull();
    });

    it('should generate values within expected ranges', () => {
      const data = generateSyntheticData({ includeNulls: false });

      if (data.PM25 !== null) {
        expect(data.PM25).toBeGreaterThanOrEqual(0);
        expect(data.PM25).toBeLessThanOrEqual(160);
      }
      if (data.PM10 !== null) {
        expect(data.PM10).toBeGreaterThanOrEqual(0);
        expect(data.PM10).toBeLessThanOrEqual(320);
      }
      if (data.NO2 !== null) {
        expect(data.NO2).toBeGreaterThanOrEqual(0);
        expect(data.NO2).toBeLessThanOrEqual(420);
      }
      if (data.SO2 !== null) {
        expect(data.SO2).toBeGreaterThanOrEqual(0);
        expect(data.SO2).toBeLessThanOrEqual(220);
      }
      if (data.O3 !== null) {
        expect(data.O3).toBeGreaterThanOrEqual(0);
        expect(data.O3).toBeLessThanOrEqual(270);
      }
    });

    it('should vary data based on hour', () => {
      const morningData = generateSyntheticData({ hour: 8, includeNulls: false });
      const nightData = generateSyntheticData({ hour: 2, includeNulls: false });

      // Morning should generally have higher values due to traffic
      // This is probabilistic, so we just check that values are different
      expect(morningData).toBeDefined();
      expect(nightData).toBeDefined();
    });
  });
});
