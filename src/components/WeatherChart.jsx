import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
  Filler // Added for fill functionality
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
  Filler // Register Filler for the fill effect
);

function formatHour(dt) {
  return new Date(dt * 1000).toLocaleTimeString([], { hour: '2-digit' });
}

export default function WeatherChart({ hourly = [], current, units = 'metric' }) {
  // Limit to next 12 hours for better readability
  const next12Hours = hourly.slice(0, 12);
  
  const data = {
    labels: next12Hours.map(h => formatHour(h.dt)),
    datasets: [{
      label: `Temperature (${units === 'metric' ? '°C' : '°F'})`,
      data: next12Hours.map(h => Math.round(h.temp)),
      borderColor: 'rgb(99, 102, 241)', // indigo-500
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.3,
      fill: true,
      pointBackgroundColor: 'rgb(99, 102, 241)',
      pointBorderColor: '#fff',
      pointBorderWidth: 1,
      pointRadius: 3,
      pointHoverRadius: 5
    }]
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
        text: 'Next 12 Hours',
        color: '#e5e7eb', // gray-200 for better contrast
        font: {
          size: 14,
          weight: 'normal'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#f3f4f6',
        bodyColor: '#f3f4f6',
        borderColor: 'rgba(99, 102, 241, 0.5)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#9ca3af' // gray-400
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#9ca3af' // gray-400
        }
      }
    }
  };

  return (
    <div style={{ height: 160 }}>
      {next12Hours.length ? (
        <Line data={data} options={options} />
      ) : (
        <div className="flex items-center justify-center h-full opacity-40 text-gray-400">
          No chart data available
        </div>
      )}
    </div>
  );
}