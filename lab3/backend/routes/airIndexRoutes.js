const express = require('express');
const router = express.Router();
const airIndexController = require('../controllers/airIndexController');

// POST /api/airindex/calc - Calculate air quality index
router.post('/calc', airIndexController.calculateAirIndex);

// GET /api/airindex/generate - Generate synthetic data
router.get('/generate', airIndexController.generateData);

// GET /api/airindex/stats - Get statistics
router.get('/stats', airIndexController.getStatistics);

// GET /api/airindex/:id - Get record by ID
router.get('/:id', airIndexController.getRecordById);

// GET /api/airindex - Get all records
router.get('/', airIndexController.getAllRecords);

module.exports = router;
