const mongoose = require('mongoose');

const airIndexSchema = new mongoose.Schema({
  stationId: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  datetime: {
    type: Date,
    required: true,
    index: true
  },
  pollutants: {
    PM25: { type: Number, default: null },
    PM10: { type: Number, default: null },
    NO2: { type: Number, default: null },
    SO2: { type: Number, default: null },
    O3: { type: Number, default: null }
  },
  subIndices: {
    PM25: { type: Number, default: null },
    PM10: { type: Number, default: null },
    NO2: { type: Number, default: null },
    SO2: { type: Number, default: null },
    O3: { type: Number, default: null }
  },
  index: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['good', 'moderate', 'unhealthy-sensitive', 'unhealthy', 'very-unhealthy', 'hazardous'],
    required: true
  },
  color: {
    type: String,
    required: true
  },
  limits: {
    PM25: { type: Number },
    PM10: { type: Number },
    NO2: { type: Number },
    SO2: { type: Number },
    O3: { type: Number }
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
airIndexSchema.index({ stationId: 1, datetime: -1 });
airIndexSchema.index({ index: 1 });
airIndexSchema.index({ category: 1 });

const AirIndex = mongoose.model('AirIndex', airIndexSchema);

module.exports = AirIndex;
