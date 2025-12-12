import React, { useState } from 'react';
import AirIndexForm from './components/AirIndexForm';
import ResultCard from './components/ResultCard';
import ChartComponent from './components/ChartComponent';
import { airIndexService } from './services/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCalculate = async (data) => {
    setLoading(true);
    setError(null);

    try {
      const response = await airIndexService.calculate(data);
      
      if (response.success) {
        setResult(response);
        toast.success('Індекс успішно розраховано!', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
      } else {
        throw new Error(response.error || 'Помилка розрахунку');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Невідома помилка';
      setError(errorMessage);
      
      toast.error(`${errorMessage}`, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });

      // Display validation errors if present
      if (err.response?.data?.details) {
        err.response.data.details.forEach((detail) => {
          toast.warning(`${detail.field}: ${detail.message}`, {
            position: 'top-right',
            autoClose: 5000
          });
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      const response = await airIndexService.generateData({
        includeNulls: true,
        nullProbability: 0.2
      });

      toast.info('Згенеровано синтетичні дані', {
        position: 'top-right',
        autoClose: 2000
      });

      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Помилка генерації даних';
      toast.error(`${errorMessage}`, {
        position: 'top-right',
        autoClose: 3000
      });
      return null;
    }
  };

  return (
    <div className="app">
      <ToastContainer />
      
      <header className="app-header">
        <h1>Air Quality Index Calculator</h1>
        <p>Розрахунок інтегрального індексу якості повітря</p>
      </header>

      <main className="main-content">
        <AirIndexForm 
          onCalculate={handleCalculate}
          onGenerate={handleGenerate}
          loading={loading}
        />
        
        <ResultCard 
          result={result}
          loading={loading}
          error={error}
        />
      </main>

      {result && !loading && !error && (
        <ChartComponent result={result} />
      )}

      <footer style={{ 
        textAlign: 'center', 
        color: 'white', 
        marginTop: '30px',
        opacity: 0.8 
      }}>
        <p>© 2025 | Екологічний моніторинг | Лабораторна робота #3</p>
      </footer>
    </div>
  );
}

export default App;
