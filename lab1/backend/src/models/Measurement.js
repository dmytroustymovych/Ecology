// Імпорт mongoose для роботи з MongoDB
import mongoose from 'mongoose'; 

// Схема для окремого забруднювача
const PollutantSchema = new mongoose.Schema({ 
  pollutant: { 
    type: String,
    required: true,
    enum: ['PM2.5', 'PM10', 'Temperature', 'Humidity', 'Pressure', 'Air Quality Index', 'NO2', 'SO2', 'CO', 'O3']
  },

  value: { 
    type: Number,
    required: true,
    validate: {
      validator: function(v) {
        return !isNaN(v) && isFinite(v);
      },
      message: 'Value must be a valid number'
    }
  },

  unit: { 
    type: String,
    required: true,
    enum: ['ug/m3', 'Celcius', '%', 'hPa', 'aqi', 'mg/m3', 'ppm']
  },

  averaging_period: { 
    type: String,
    default: '2 minutes',
    enum: ['1 minute', '2 minutes', '5 minutes', '15 minutes', '1 hour', '24 hours']
  },
  
  quality_flag: { 
    type: String,
    enum: ['valid', 'invalid', 'estimated', 'preliminary'],
    default: 'preliminary'
  }
}, 
{ _id: false });

// Схема вимірювання
const MeasurementSchema = new mongoose.Schema({ 
  station_id: {
    type: String,
    required: true,
    index: true
  },
  
  measurement_time: {
    type: Date,
    required: true,
    index: true
  },
  
  pollutants: [PollutantSchema],
  
  metadata: {
    source: {
      type: String,
      default: 'SaveEcoBot'
    },
    import_time: {
      type: Date,
      default: Date.now
    },
    original_data: mongoose.Schema.Types.Mixed, // Оригінальні дані від API
    processing_notes: String // Примітки щодо обробки даних
  }
}, {
  timestamps: true
});

// Композитний індекс для швидкого пошуку
MeasurementSchema.index({ station_id: 1, measurement_time: -1 }); 
MeasurementSchema.index({ measurement_time: -1 });  
MeasurementSchema.index({ 'pollutants.pollutant': 1, measurement_time: -1 }); 

// Унікальність: одна станція не може мати два вимірювання в один час
MeasurementSchema.index({ station_id: 1, measurement_time: 1 }, { unique: true }); 

// Методи схеми
MeasurementSchema.methods.checkThresholds = function() { 
  const thresholds = {
    'PM2.5': { warning: 25, alert: 35, emergency: 75 },
    'PM10': { warning: 50, alert: 75, emergency: 150 },
    'Air Quality Index': { warning: 50, alert: 100, emergency: 150 }
  };
  
  const exceedances = []; 
  
  this.pollutants.forEach(pollutant => { 
    // Отримання порогів для конкретного забруднювача
    const threshold = thresholds[pollutant.pollutant]; 
    // Якщо пороги визначені
    if (threshold) { 
      let severity = 'normal';
      if (pollutant.value > threshold.emergency) severity = 'emergency';
      else if (pollutant.value > threshold.alert) severity = 'alert';
      else if (pollutant.value > threshold.warning) severity = 'warning';
      
      // Якщо є перевищення
      if (severity !== 'normal') { 
        // Додавання інформації про перевищення до масиву
        exceedances.push({ 
          pollutant: pollutant.pollutant,
          value: pollutant.value,
          threshold: threshold[severity],
          severity,
          ratio: (pollutant.value / threshold[severity]).toFixed(2) 
        });
      }
    }
  });
  // Повернення масиву з інформацією про перевищення
  return exceedances; 
};

MeasurementSchema.statics.getLatestByStation = function(stationId) { 
  // Статичний метод для отримання останнього вимірювання певної станції
  return this.findOne({ station_id: stationId }) // Пошук за station_id
             .sort({ measurement_time: -1 }); // Сортування за часом вимірювання у спадному порядку
};

MeasurementSchema.statics.getStatistics = async function(stationId, startDate, endDate, pollutant) { 
  // Статичний метод для отримання статистики по забруднювачу за період
  const matchStage = { // Етап фільтрації
    station_id: stationId,
    measurement_time: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    'pollutants.pollutant': pollutant
  };

  // Агрегація для обчислення статистики
  return await this.aggregate([ 
    { $match: matchStage }, // Фільтрація документів
    { $unwind: '$pollutants' }, // Розгортання масиву pollutants
    { $match: { 'pollutants.pollutant': pollutant } }, // Фільтрація за конкретним забруднювачем
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        avg: { $avg: '$pollutants.value' },
        min: { $min: '$pollutants.value' },
        max: { $max: '$pollutants.value' },
        latest: { $last: '$measurement_time' }
      }
    } // Групування для обчислення статистичних показників
  ]);
};

export default mongoose.model('Measurement', MeasurementSchema); 
// Експорт моделі Measurement на основі схеми MeasurementSchema
