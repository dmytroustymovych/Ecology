import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from './components/Header';
import StationsTable from './components/StationsTable';
import MeasurementsTable from './components/MeasurementsTable';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('stations');

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'measurements') setActiveView('measurements');
      else setActiveView('stations');
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  return (
    <div className="App">
      <Header />
      <div className="container mt-4">
        {activeView === 'stations' && (
          <div className="row">
            <div className="col-12">
              <h2>Станції моніторингу</h2>
              <StationsTable />
            </div>
          </div>
        )}
        {activeView === 'measurements' && (
          <div className="row">
            <div className="col-12">
              <h2>Останні вимірювання</h2>
              <MeasurementsTable />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
// Коментарі до коду:
// Імпортуємо React та необхідні компоненти і стилі.
// Функціональний компонент App є головним компонентом додатку.
// Використовуємо Bootstrap для стилізації.
// Включаємо компоненти Header, StationsTable та MeasurementsTable для відображення відповідних секцій.
// Експортуємо компонент App для використання в інших частинах додатку.



