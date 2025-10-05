// src/components/WeatherCard.jsx
import React from 'react';

export default function WeatherCard({ current, units, loading }) {
  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 min-w-[200px] text-center">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-12 bg-white/20 rounded w-1/2 mx-auto mb-4"></div>
          <div className="h-4 bg-white/20 rounded w-5/6 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 min-w-[200px] text-center">
        <div className="text-gray-400">No weather data</div>
      </div>
    );
  }

  const weatherCondition = current.weather?.[0]?.main?.toLowerCase() || 'clear';
  const temp = Math.round(current.temp);
  const feelsLike = Math.round(current.feels_like);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 min-w-[200px] border border-white/20">
      <div className="text-center">
        {/* Weather Icon */}
        <div className="text-4xl mb-3">
          {getWeatherEmoji(weatherCondition)}
        </div>
        
        {/* Temperature */}
        <div className="text-5xl font-bold mb-2">
          {temp}°{units === 'metric' ? 'C' : 'F'}
        </div>
        
        {/* Feels Like */}
        <div className="text-gray-300 text-sm mb-4">
          Feels like {feelsLike}°
        </div>
        
        {/* Weather Description */}
        {current.weather?.[0] && (
          <div className="text-lg capitalize text-white/80 mb-2">
            {current.weather[0].description}
          </div>
        )}
        
        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-3 text-xs opacity-80 mt-4">
          <div>
            <div className="font-semibold">Humidity</div>
            <div>{current.humidity}%</div>
          </div>
          <div>
            <div className="font-semibold">Wind</div>
            <div>{current.wind_speed} m/s</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for weather emojis
function getWeatherEmoji(condition) {
  const emojis = {
    thunderstorm: '⛈️',
    drizzle: '🌧️',
    rain: '🌧️',
    snow: '❄️',
    mist: '🌫️',
    smoke: '🌫️',
    haze: '🌫️',
    dust: '🌫️',
    fog: '🌫️',
    sand: '🌫️',
    ash: '🌫️',
    squall: '💨',
    tornado: '🌪️',
    clear: '☀️',
    clouds: '☁️'
  };
  
  return emojis[condition] || '🌤️';
}