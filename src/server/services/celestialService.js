// src/server/services/celestialService.js
import { PYTHON_SERVICE_URL } from '../config/constants.js';
import axios from 'axios';

// Use axios instead of fetch since we're in Node.js
async function fetchJson(url) {
    const response = await axios.get(url);
    return response.data;
}

// Cache for weather data
const weatherCache = {
    data: null,
    timestamp: 0,
    validityPeriod: 300000 // 5 minutes cache validity for weather data
};

// Cache mechanism for celestial data
const cache = {
    data: null,
    timestamp: 0,
    validityPeriod: 60000 // 1 minute cache validity
};

export async function fetchWeatherData(forceRefresh = false) {
    try {
        // Check cache if not forcing refresh
        const now = Date.now();
        if (!forceRefresh && weatherCache.data && (now - weatherCache.timestamp) < weatherCache.validityPeriod) {
            return weatherCache.data;
        }

        // Fetch weather data
        const weatherData = await fetchJson(`${PYTHON_SERVICE_URL}/weather`);
        
        // Update cache
        weatherCache.data = weatherData;
        weatherCache.timestamp = now;
        
        return weatherData;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

export async function fetchCelestialData(forceRefresh = false) {
    try {
        // Check cache if not forcing refresh
        const now = Date.now();
        if (!forceRefresh && cache.data && (now - cache.timestamp) < cache.validityPeriod) {
            return cache.data;
        }

        // Fetch combined data from new endpoint
        const combinedData = await fetchJson(`${PYTHON_SERVICE_URL}/combined-positions`);
        
        // Update cache
        cache.data = combinedData;
        cache.timestamp = now;
        
        return combinedData;
    } catch (error) {
        // If the combined endpoint doesn't exist yet, fall back to the old approach
        try {
            const [dailyData, realtimeData] = await Promise.all([
                fetchJson(`${PYTHON_SERVICE_URL}/daily_positions`),
                fetchJson(`${PYTHON_SERVICE_URL}/realtime-positions`)
            ]);

            // Merge the data more efficiently with binary search
            Object.entries(realtimeData).forEach(([objectName, position]) => {
                if (dailyData[objectName]) {
                    const dailyPath = dailyData[objectName].daily_path;
                    const now = new Date();
                    
                    // Binary search to find the current position more efficiently
                    let low = 0;
                    let high = dailyPath.length - 1;
                    
                    while (low <= high) {
                        const mid = Math.floor((low + high) / 2);
                        const midTime = new Date(dailyPath[mid].time);
                        
                        if (midTime < now) {
                            low = mid + 1;
                        } else {
                            high = mid - 1;
                        }
                    }
                    
                    const currentPathIndex = low;
                    if (currentPathIndex !== -1 && currentPathIndex < dailyPath.length) {
                        dailyData[objectName].daily_path[currentPathIndex] = position;
                    }
                }
            });
            
            // Update cache
            cache.data = dailyData;
            cache.timestamp = now;
            
            return dailyData;
        } catch (fallbackError) {
            console.error('Error fetching celestial data:', fallbackError);
            throw fallbackError;
        }
    }
}
