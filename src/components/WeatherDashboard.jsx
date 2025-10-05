import React, { useEffect, useState } from "react";
import { fetchCoordsByCity, fetchWeatherByCoords } from "../utils/api";
import WeatherCard from "./WeatherCard";
import WeatherChart from "./WeatherChart";
import ThreeBackground from "./ThreeBackground";

const OPENWEATHERMAP_API_KEY = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;

function WeatherDashboard() {
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState(null);
  const [current, setCurrent] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const UNITS = 'metric';

  // Check API key on mount
  useEffect(() => {
    if (!OPENWEATHERMAP_API_KEY) {
      setError('API key not found. Please check your .env file');
    } else {
      // Test with London on mount
      handleTestCity('London');
    }
  }, []);

  const handleTestCity = async (cityName) => {
    if (!OPENWEATHERMAP_API_KEY) {
      setError('No API key available');
      return;
    }
    
    setLoading(true);
    setError('');
    setQuery(cityName);
    
    try {
      const coordsData = await fetchCoordsByCity(cityName, OPENWEATHERMAP_API_KEY);
      setCoords({ lat: coordsData.lat, lon: coordsData.lon });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (!OPENWEATHERMAP_API_KEY) {
      setError('API key not configured');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const coordsData = await fetchCoordsByCity(query, OPENWEATHERMAP_API_KEY);
      setCoords({ lat: coordsData.lat, lon: coordsData.lon });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch weather when coords change
  useEffect(() => {
    if (coords && OPENWEATHERMAP_API_KEY) {
      setLoading(true);
      fetchWeatherByCoords(coords.lat, coords.lon, OPENWEATHERMAP_API_KEY, UNITS)
        .then(data => {
          setCurrent(data.current);
          setHourly(data.hourly || []);
          setError('');
        })
        .catch(err => {
          setError(err.message);
          setCurrent(null);
          setHourly([]);
        })
        .finally(() => setLoading(false));
    }
  }, [coords]);

  // Helper function for weather emojis
  const getWeatherEmoji = (condition) => {
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
  };

  // Format time function
  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      <div className="p-6 lg:flex lg:gap-6 lg:items-start max-w-7xl mx-auto">
        {/* Left Panel - Weather Data */}
        <div className="flex-1">
          <div className="relative rounded-2xl bg-black/30 p-6 shadow-2xl backdrop-blur-md overflow-hidden border border-white/10">
            
            {/* API Key Status */}
            {!OPENWEATHERMAP_API_KEY && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <div className="text-red-300 font-medium">API Key Missing</div>
                                <div className="text-red-400 text-sm mt-1">
                  Create a .env file with: VITE_OPENWEATHERMAP_API_KEY=your_key_here
                </div>
              </div>
            )}

            {/* Search Form */}
            <form onSubmit={onSearch} className="flex gap-3 mb-6">
              <input 
                value={query} 
                onChange={e => setQuery(e.target.value)} 
                placeholder="Enter city name..." 
                className="flex-1 bg-white/10 rounded-xl px-4 py-3 outline-none border border-white/20 placeholder-gray-400 focus:border-indigo-400 transition-colors"
                disabled={loading}
              />
              <button 
                type="submit"
                disabled={loading || !query.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Searching...
                  </div>
                ) : 'Search'}
              </button>
            </form>

            {/* Quick Cities */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {['London', 'New York', 'Tokyo', 'Paris', 'Lusaka', 'Sydney', 'Dubai', 'Mumbai'].map(city => (
                <button
                  key={city}
                  onClick={() => {
                    setQuery(city);
                    handleTestCity(city);
                  }}
                  disabled={loading}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed rounded-lg text-sm transition-all duration-200 border border-white/10 hover:border-white/20"
                >
                  {city}
                </button>
              ))}
            </div>

            {/* Weather Display Row */}
            <div className="flex flex-col lg:flex-row gap-6 items-start mb-6">
              <WeatherCard current={current} units={UNITS} loading={loading} />
              
              <div className="flex-1 h-48 bg-white/5 rounded-2xl p-4 border border-white/10">
                <WeatherChart hourly={hourly} current={current} units={UNITS} />
              </div>
            </div>

            {/* Weather Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10 hover:bg-white/10 transition-all duration-200 group">
                <div className="text-2xl font-bold group-hover:scale-110 transition-transform">
                  {current ? `${current.humidity}%` : '--'}
                </div>
                <div className="text-sm opacity-80 mt-1">Humidity</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10 hover:bg-white/10 transition-all duration-200 group">
                <div className="text-2xl font-bold group-hover:scale-110 transition-transform">
                  {current ? `${current.wind_speed} m/s` : '--'}
                </div>
                <div className="text-sm opacity-80 mt-1">Wind Speed</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10 hover:bg-white/10 transition-all duration-200 group">
                <div className="text-2xl font-bold group-hover:scale-110 transition-transform">
                  {current ? `${current.pressure} hPa` : '--'}
                </div>
                <div className="text-sm opacity-80 mt-1">Pressure</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10 hover:bg-white/10 transition-all duration-200 group">
                <div className="text-2xl font-bold group-hover:scale-110 transition-transform">
                  {current ? `${current.uvi || '--'}` : '--'}
                </div>
                <div className="text-sm opacity-80 mt-1">UV Index</div>
              </div>
            </div>

            {/* Additional Weather Info */}
            {current && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                  <div className="text-lg font-semibold">{Math.round(current.dew_point)}°</div>
                  <div className="text-xs opacity-80 mt-1">Dew Point</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                  <div className="text-lg font-semibold">{current.clouds}%</div>
                  <div className="text-xs opacity-80 mt-1">Cloud Cover</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                  <div className="text-lg font-semibold">{(current.visibility / 1000).toFixed(1)} km</div>
                  <div className="text-xs opacity-80 mt-1">Visibility</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                  <div className="text-lg font-semibold">{current.wind_deg}°</div>
                  <div className="text-xs opacity-80 mt-1">Wind Direction</div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-lg mb-4">
                <div className="text-red-300 font-medium">Note: Using demo data</div>
                <div className="text-red-400 text-sm mt-1">{error}</div>
              </div>
            )}

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                  <p className="text-white/80 text-lg">Loading weather data...</p>
                  <p className="text-white/60 text-sm mt-2">Fetching latest conditions</p>
                </div>
              </div>
            )}

            {/* 3D Background */}
            <div className="absolute -right-20 -top-20 w-96 h-96 opacity-40 pointer-events-none">
              <ThreeBackground current={current} />
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="font-medium mb-2 text-lg">🌍 3D Weather Visualization</p>
            <ul className="list-disc pl-5 space-y-1 text-sm opacity-80">
              <li>Real-time weather condition visualization</li>
              <li>Dynamic 3D scenes that change with weather conditions</li>
              <li>Interactive temperature sphere with atmospheric effects</li>
              <li>Live weather animations (rain, clouds, etc.)</li>
            </ul>
          </div>
        </div>

        {/* Right Panel - Forecast & Details */}
        <aside className="w-full lg:w-80 mt-6 lg:mt-0 space-y-6">
          {/* 24-Hour Forecast */}
          <div className="rounded-2xl p-6 bg-black/30 backdrop-blur-md border border-white/10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>📅</span>
              24-Hour Forecast
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {hourly.length ? hourly.slice(0, 24).map((h, index) => (
                <div 
                  key={h.dt} 
                  className="flex justify-between items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/5 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg transform group-hover:scale-110 transition-transform">
                      {getWeatherEmoji(h.weather?.[0]?.main?.toLowerCase())}
                    </div>
                    <div className="text-sm">
                      {index === 0 ? (
                        <span className="font-semibold text-cyan-300">Now</span>
                      ) : (
                        new Date(h.dt * 1000).getHours() + ':00'
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm opacity-80">
                      Feels {Math.round(h.feels_like)}°
                    </div>
                    <div className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      {Math.round(h.temp)}°
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 opacity-60">
                  <div className="text-4xl mb-2">🌤️</div>
                  <div>No forecast data</div>
                  <div className="text-sm mt-1">Search for a city to see forecast</div>
                </div>
              )}
            </div>
          </div>

          {/* Weather Details Card */}
          <div className="rounded-2xl p-6 bg-black/30 backdrop-blur-md border border-white/10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🔍</span>
              Weather Details
            </h3>
            {current ? (
              <div className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                    <span className="opacity-80">Feels Like</span>
                    <span className="font-semibold">{Math.round(current.feels_like)}°</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                    <span className="opacity-80">Humidity</span>
                    <span className="font-semibold">{current.humidity}%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                    <span className="opacity-80">Pressure</span>
                    <span className="font-semibold">{current.pressure} hPa</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                    <span className="opacity-80">UV Index</span>
                    <span className="font-semibold">{current.uvi || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                    <span className="opacity-80">Visibility</span>
                    <span className="font-semibold">{(current.visibility / 1000).toFixed(1)} km</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 opacity-60">
                <div className="text-3xl mb-2">🌡️</div>
                <div>No weather data</div>
                <div className="text-sm mt-1">Search for a city to see details</div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}

export default WeatherDashboard;