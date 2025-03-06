// src/server/services/unifiedWeatherService.js
import { fetchWeatherData as fetchMockWeather } from './celestialService.js';
import { fetchTomorrowWeather, formatTomorrowWeatherData } from './tomorrowWeatherService.js';
import { TOMORROW_API_KEY, WEATHER_SERVICE } from '../config/environment.js';
import fetch from 'node-fetch';

// Cache for weather data
const weatherCache = {
    data: null,
    timestamp: 0,
    validityPeriod: WEATHER_SERVICE.cacheValidityPeriod || 300000 // 5 minutes cache validity
};

/**
 * Fetches weather data from the configured provider
 * @param {boolean} forceRefresh - Whether to bypass cache
 * @returns {Promise<Object>} Weather data in a unified format
 */
export async function fetchWeather(forceRefresh = false) {
    try {
        // Check cache if not forcing refresh
        const now = Date.now();
        if (!forceRefresh && weatherCache.data && (now - weatherCache.timestamp) < weatherCache.validityPeriod) {
            console.log("Using cached unified weather data");
            return weatherCache.data;
        }
        
        let weatherData;
        
        // Get data from the configured provider
        switch (WEATHER_SERVICE.provider) {
            case 'tomorrow':
                // Ensure API key is available
                if (!TOMORROW_API_KEY) {
                    console.warn('Tomorrow.io API key not set, falling back to mock data');
                    weatherData = await fetchMockWeather(forceRefresh);
                } else {
                    try {
                        // Get data from Tomorrow.io
                        const rawData = await fetchTomorrowWeather(
                            WEATHER_SERVICE.defaultLat,
                            WEATHER_SERVICE.defaultLong,
                            forceRefresh,
                            TOMORROW_API_KEY
                        );
                        
                        // Format the data to our app's format
                        weatherData = formatTomorrowWeatherData(rawData);
                    } catch (error) {
                        console.error('Tomorrow.io API error, falling back to mock data:', error);
                        weatherData = await fetchMockWeather(forceRefresh);
                    }
                }
                break;
                
            case 'openweathermap':
                // We could add OpenWeatherMap integration here
                console.warn('OpenWeatherMap provider not yet implemented, falling back to mock data');
                weatherData = await fetchMockWeather(forceRefresh);
                break;
                
            case 'mock':
            default:
                // Use our built-in mock weather data
                weatherData = await fetchMockWeather(forceRefresh);
                break;
        }
        
        // Add source information
        weatherData.source = WEATHER_SERVICE.provider;
        
        // Add sunrise and time to leave information by fetching from Python backend
        try {
            // We need to fetch this from the Python service because it has the ephem library
            const response = await fetch('http://localhost:8000/weather');
            if (response.ok) {
                const sunriseData = await response.json();
                weatherData.sunrise_time = sunriseData.sunrise_time;
                weatherData.time_to_leave = sunriseData.time_to_leave;
            }
        } catch (error) {
            console.error('Error fetching sunrise data:', error);
            // But don't fail if we can't get sunrise data
        }
        
        // Update cache
        weatherCache.data = weatherData;
        weatherCache.timestamp = now;
        
        return weatherData;
    } catch (error) {
        console.error('Error in unified weather service:', error);
        throw error;
    }
}