const AirIndex = require('../models/AirIndex');
const airIndexService = require('../services/airIndexService');
const { validateAirIndexCalc } = require('../validators/airIndexValidator');

/**
 * Calculate air quality index
 * POST /api/airindex/calc
 */
const calculateAirIndex = async (req, res, next) => {
  try {
    // Validate input
    const validation = validateAirIndexCalc(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const { stationId, datetime, pollutants, limits } = validation.value;

    // Calculate index
    const result = airIndexService.compute({ pollutants, limits });

    // Prepare response
    const response = {
      success: true,
      data: {
        stationId,
        datetime,
        pollutants,
        subIndices: result.subIndices,
        index: result.index,
        category: result.category,
        categoryLabel: result.categoryLabel,
        color: result.color,
        icon: result.icon,
        limits: result.limits,
        validMeasurements: result.validMeasurements,
        totalPollutants: result.totalPollutants
      }
    };

    // Optionally save to database
    if (req.query.save === 'true') {
      const airIndexDoc = new AirIndex({
        stationId,
        datetime,
        pollutants,
        subIndices: result.subIndices,
        index: result.index,
        category: result.category,
        color: result.color,
        limits: result.limits
      });

      await airIndexDoc.save();
      response.data.id = airIndexDoc._id;
      response.data.saved = true;
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all air quality records
 * GET /api/airindex
 */
const getAllRecords = async (req, res, next) => {
  try {
    const {
      stationId,
      category,
      startDate,
      endDate,
      limit = 50,
      skip = 0,
      sort = '-datetime'
    } = req.query;

    // Build query
    const query = {};
    if (stationId) query.stationId = stationId;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.datetime = {};
      if (startDate) query.datetime.$gte = new Date(startDate);
      if (endDate) query.datetime.$lte = new Date(endDate);
    }

    // Execute query
    const records = await AirIndex
      .find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await AirIndex.countDocuments(query);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: total > parseInt(skip) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get record by ID
 * GET /api/airindex/:id
 */
const getRecordById = async (req, res, next) => {
  try {
    const record = await AirIndex.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Record not found'
      });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate synthetic data
 * GET /api/airindex/generate
 */
const generateData = (req, res, next) => {
  try {
    const hour = parseInt(req.query.hour) || new Date().getHours();
    const includeNulls = req.query.includeNulls !== 'false';
    const nullProbability = parseFloat(req.query.nullProbability) || 0.2;

    const pollutants = airIndexService.generateSyntheticData({
      hour,
      includeNulls,
      nullProbability
    });

    res.json({
      success: true,
      data: {
        stationId: `station-${Math.floor(Math.random() * 10) + 1}`,
        datetime: new Date().toISOString(),
        pollutants,
        hour,
        includeNulls,
        nullProbability
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get statistics
 * GET /api/airindex/stats
 */
const getStatistics = async (req, res, next) => {
  try {
    const { stationId, startDate, endDate } = req.query;

    const matchStage = {};
    if (stationId) matchStage.stationId = stationId;
    if (startDate || endDate) {
      matchStage.datetime = {};
      if (startDate) matchStage.datetime.$gte = new Date(startDate);
      if (endDate) matchStage.datetime.$lte = new Date(endDate);
    }

    const stats = await AirIndex.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          avgIndex: { $avg: '$index' },
          minIndex: { $min: '$index' },
          maxIndex: { $max: '$index' },
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await AirIndex.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overall: stats[0] || {},
        byCategory: categoryStats
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculateAirIndex,
  getAllRecords,
  getRecordById,
  generateData,
  getStatistics
};
