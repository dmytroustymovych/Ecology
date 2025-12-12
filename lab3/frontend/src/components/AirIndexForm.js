import React, { useState } from 'react';
import './AirIndexForm.css';

const POLLUTANT_RANGES = {
  PM25: { min: 5, max: 150, unit: 'µg/m³', label: 'PM2.5' },
  PM10: { min: 10, max: 300, unit: 'µg/m³', label: 'PM10' },
  NO2: { min: 10, max: 400, unit: 'µg/m³', label: 'NO₂' },
  SO2: { min: 5, max: 200, unit: 'µg/m³', label: 'SO₂' },
  O3: { min: 10, max: 250, unit: 'µg/m³', label: 'O₃' }
};

const AirIndexForm = ({ onCalculate, onGenerate, loading }) => {
  const [formData, setFormData] = useState({
    stationId: 'station-001',
    datetime: new Date().toISOString().slice(0, 16),
    pollutants: {
      PM25: '',
      PM10: '',
      NO2: '',
      SO2: '',
      O3: ''
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePollutantChange = (pollutant, value) => {
    setFormData(prev => ({
      ...prev,
      pollutants: {
        ...prev.pollutants,
        [pollutant]: value === '' ? null : parseFloat(value)
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare data for API
    const payload = {
      stationId: formData.stationId,
      datetime: formData.datetime,
      pollutants: Object.fromEntries(
        Object.entries(formData.pollutants).map(([key, value]) => 
          [key, value === '' || value === null ? null : parseFloat(value)]
        )
      )
    };

    onCalculate(payload);
  };

  const handleGenerateData = async () => {
    const syntheticData = await onGenerate();
    if (syntheticData && syntheticData.data) {
      setFormData({
        stationId: syntheticData.data.stationId,
        datetime: new Date(syntheticData.data.datetime).toISOString().slice(0, 16),
        pollutants: {
          PM25: syntheticData.data.pollutants.PM25 || '',
          PM10: syntheticData.data.pollutants.PM10 || '',
          NO2: syntheticData.data.pollutants.NO2 || '',
          SO2: syntheticData.data.pollutants.SO2 || '',
          O3: syntheticData.data.pollutants.O3 || ''
        }
      });
    }
  };

  return (
    <div className="card">
      <h2>Введення даних</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="stationId">ID станції:</label>
          <input
            type="text"
            id="stationId"
            name="stationId"
            value={formData.stationId}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="datetime">Дата та час:</label>
          <input
            type="datetime-local"
            id="datetime"
            name="datetime"
            value={formData.datetime}
            onChange={handleInputChange}
            required
          />
        </div>

        <h3 style={{ marginTop: '20px', marginBottom: '15px', color: '#555' }}>
          Концентрації забруднювачів:
        </h3>

        <div className="form-row">
          {Object.entries(POLLUTANT_RANGES).map(([key, info]) => (
            <div key={key} className="form-group">
              <label htmlFor={key}>
                {info.label} ({info.unit}):
              </label>
              <input
                type="number"
                id={key}
                name={key}
                step="0.1"
                min={info.min}
                max={info.max}
                value={formData.pollutants[key]}
                onChange={(e) => handlePollutantChange(key, e.target.value)}
                placeholder={`${info.min} - ${info.max}`}
              />
              <small>
                Діапазон: {info.min} - {info.max} {info.unit}
              </small>
            </div>
          ))}
        </div>

        <div className="button-group">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={handleGenerateData}
            disabled={loading}
          >
            Згенерувати дані
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Розрахунок...' : 'Розрахувати індекс'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AirIndexForm;
