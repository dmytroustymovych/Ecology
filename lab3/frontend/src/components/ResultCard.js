import React from 'react';
import './ResultCard.css';

const AQI_SCALE = [
  { min: 0, max: 50, name: 'good', color: '#00E400', label: 'Добре'},
  { min: 51, max: 100, name: 'moderate', color: '#FFFF00', label: 'Помірно'},
  { min: 101, max: 150, name: 'unhealthy-sensitive', color: '#FF7E00', label: 'Погано для чутливих'},
  { min: 151, max: 200, name: 'unhealthy', color: '#FF0000', label: 'Погано'},
  { min: 201, max: 300, name: 'very-unhealthy', color: '#8F3F97', label: 'Дуже погано'},
  { min: 301, max: 500, name: 'hazardous', color: '#7E0023', label: 'Небезпечно'}
];

const POLLUTANT_LABELS = {
  PM25: 'PM2.5',
  PM10: 'PM10',
  NO2: 'NO₂',
  SO2: 'SO₂',
  O3: 'O₃'
};

const ResultCard = ({ result, loading, error }) => {
  if (loading) {
    return (
      <div className="result-card">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '20px' }}>Розрахунок індексу...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="result-card">
        <div className="error">
          <h3>Помилка</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="result-card">
        <div className="no-result">
          <p>Заповніть форму та натисніть "Розрахувати індекс"</p>
          <p style={{ fontSize: '0.9rem', color: '#aaa' }}>
            або згенеруйте синтетичні дані для швидкого тесту
          </p>
        </div>
      </div>
    );
  }

  const { data } = result;

  return (
    <div className="result-card">
      <div className="result-header">
        <div 
          className="aqi-circle"
          style={{ backgroundColor: data.color }}
        >
          <div className="aqi-value">{data.index}</div>
          <div className="aqi-label">AQI</div>
          <div className="aqi-icon">{data.icon}</div>
        </div>
        <h3 style={{ color: data.color, fontSize: '1.5rem', marginTop: '10px' }}>
          {data.categoryLabel}
        </h3>
        <p style={{ color: '#888', marginTop: '5px' }}>
          Станція: {data.stationId} | {new Date(data.datetime).toLocaleString('uk-UA')}
        </p>
      </div>

      <div className="sub-indices">
        {Object.entries(data.subIndices).map(([pollutant, subIndex]) => {
          const concentration = data.pollutants[pollutant];
          const isMissing = subIndex === null;

          return (
            <div 
              key={pollutant}
              className={`sub-index-item ${isMissing ? 'missing' : ''}`}
            >
              <h4>{POLLUTANT_LABELS[pollutant] || pollutant}</h4>
              <div className="value">
                {isMissing ? '—' : subIndex.toFixed(1)}
              </div>
              <div className="concentration">
                {isMissing ? 'Немає даних' : `${concentration.toFixed(1)} µg/m³`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="result-details">
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          Валідних вимірювань: {data.validMeasurements} з {data.totalPollutants}
        </p>
      </div>

      <AQIScaleLegend />
    </div>
  );
};

const AQIScaleLegend = () => {
  return (
    <div className="aqi-scale">
      <h3>Шкала якості повітря</h3>
      <div className="scale-items">
        {AQI_SCALE.map((item) => (
          <div key={item.name} className="scale-item">
            <div 
              className="scale-color"
              style={{ backgroundColor: item.color }}
            ></div>
            <div className="scale-info">
              <div className="name">{item.icon} {item.label}</div>
              <div className="range">{item.min} - {item.max}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultCard;
