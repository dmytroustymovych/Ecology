import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './ChartComponent.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ChartComponent = ({ result }) => {
  if (!result || !result.data) {
    return null;
  }

  const { data } = result;

  // Prepare data for chart
  const pollutants = [];
  const concentrations = [];
  const subIndices = [];
  const colors = [];

  const pollutantLabels = {
    PM25: 'PM2.5',
    PM10: 'PM10',
    NO2: 'NO₂',
    SO2: 'SO₂',
    O3: 'O₃'
  };

  Object.entries(data.pollutants).forEach(([key, value]) => {
    if (value !== null) {
      pollutants.push(pollutantLabels[key] || key);
      concentrations.push(value);
      subIndices.push(data.subIndices[key]);
      
      // Color based on sub-index
      const subIndex = data.subIndices[key];
      if (subIndex <= 50) colors.push('#00E400');
      else if (subIndex <= 100) colors.push('#FFFF00');
      else if (subIndex <= 150) colors.push('#FF7E00');
      else if (subIndex <= 200) colors.push('#FF0000');
      else if (subIndex <= 300) colors.push('#8F3F97');
      else colors.push('#7E0023');
    }
  });

  const chartData = {
    labels: pollutants,
    datasets: [
      {
        label: 'Sub-Index',
        data: subIndices,
        backgroundColor: colors,
        borderColor: colors.map(c => c),
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Під-індекси забруднювачів',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context) {
            const index = context.dataIndex;
            return `Концентрація: ${concentrations[index].toFixed(1)} µg/m³`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Sub-Index Value'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="card chart-container">
      <h2>Візуалізація даних</h2>
      <div style={{ height: '300px', position: 'relative' }}>
        <Bar data={chartData} options={options} />
      </div>
      
      <div className="chart-info">
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          Висота стовпців відображає під-індекс кожного забруднювача
        </p>
      </div>
    </div>
  );
};

export default ChartComponent;
