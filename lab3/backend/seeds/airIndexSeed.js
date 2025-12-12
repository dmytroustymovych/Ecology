require('dotenv').config();
const mongoose = require('mongoose');
const AirIndex = require('../models/AirIndex');
const { generateSyntheticData, compute } = require('../services/airIndexService');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/air_quality_db';
const STATIONS = ['station-001', 'station-002', 'station-003', 'station-004', 'station-005'];
const RECORDS_PER_STATION = 10; // 10 records per station = 50 total

/**
 * Generate seed data for air quality index
 */
const generateSeedData = () => {
  const seedData = [];
  const now = new Date();

  STATIONS.forEach(stationId => {
    for (let i = 0; i < RECORDS_PER_STATION; i++) {
      // Create timestamps going back in time (every 2 hours)
      const datetime = new Date(now);
      datetime.setHours(datetime.getHours() - (i * 2));
      
      const hour = datetime.getHours();

      // Generate synthetic pollutant data with daily cycle
      const pollutants = generateSyntheticData({
        hour,
        includeNulls: true,
        nullProbability: 0.15 // 15% chance of missing data
      });

      // Calculate air quality index
      try {
        const result = compute({ pollutants });

        seedData.push({
          stationId,
          datetime,
          pollutants,
          subIndices: result.subIndices,
          index: result.index,
          category: result.category,
          color: result.color,
          limits: result.limits
        });
      } catch (error) {
        console.warn(`Failed to compute for ${stationId} at ${datetime}: ${error.message}`);
      }
    }
  });

  return seedData;
};

/**
 * Seed the database
 */
const seedDatabase = async () => {
  try {
    console.log('Starting seed process...');
    console.log(`Connecting to MongoDB: ${MONGODB_URI}`);

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing air quality records...');
    await AirIndex.deleteMany({});
    console.log('Existing records cleared');

    // Generate and insert seed data
    console.log('Generating seed data...');
    const seedData = generateSeedData();
    console.log(`Generated ${seedData.length} records`);

    console.log('Inserting seed data...');
    const inserted = await AirIndex.insertMany(seedData);
    console.log(`Inserted ${inserted.length} records`);
    // Display statistics
    const stats = await AirIndex.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgIndex: { $avg: '$index' }
        }
      },
      { $sort: { avgIndex: 1 } }
    ]);

    console.log('\nSeed Statistics:');
    console.log('═'.repeat(50));
    stats.forEach(stat => {
      console.log(`  ${stat._id.padEnd(25)} : ${stat.count} records (avg: ${stat.avgIndex.toFixed(2)})`);
    });
    console.log('═'.repeat(50));

    // Display sample records
    const samples = await AirIndex.find().limit(3).lean();
    console.log('\nSample Records:');
    console.log('═'.repeat(50));
    samples.forEach((record, idx) => {
      console.log(`  ${idx + 1}. Station: ${record.stationId}`);
      console.log(`     Date: ${record.datetime.toISOString()}`);
      console.log(`     Index: ${record.index} (${record.category})`);
      console.log(`     Pollutants: PM2.5=${record.pollutants.PM25}, PM10=${record.pollutants.PM10}`);
      console.log('     ' + '-'.repeat(46));
    });
    console.log('═'.repeat(50));

    console.log('\nSeed completed successfully!');
    console.log(`\nYou can now run: npm start`);
    console.log(`API available at: http://localhost:${process.env.PORT || 5000}/api/airindex\n`);

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run seed if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { generateSeedData, seedDatabase };
