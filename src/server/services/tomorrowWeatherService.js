// src/server/services/tomorrowWeatherService.js
import fetch from 'node-fetch';
import queryString from 'query-string';
import moment from 'moment';

// Cache for weather data
const weatherCache = {
    data: null,
    timestamp: 0,
    validityPeriod: 300000 // 5 minutes cache validity
};

// Default location coordinates (Cambridge, same as existing app)
const DEFAULT_LAT = 43.397221;
const DEFAULT_LONG = -80.311386;

/**
 * Fetches weather data from Tomorrow.io API
 * @param {number} lat - Latitude
 * @param {number} long - Longitude
 * @param {boolean} forceRefresh - Whether to bypass cache
 * @param {string} apiKey - Tomorrow.io API key
 * @returns {Promise<Object>} Weather data
 */
export async function fetchTomorrowWeather(lat = DEFAULT_LAT, long = DEFAULT_LONG, forceRefresh = false, apiKey) {
    // Validate API key
    if (!apiKey) {
        throw new Error('API key is required for Tomorrow.io weather service');
    }
    try {
        // Check cache if not forcing refresh
        const now = Date.now();
        if (!forceRefresh && weatherCache.data && (now - weatherCache.timestamp) < weatherCache.validityPeriod) {
            console.log("Using cached weather data");
            return weatherCache.data;
        }

        // API endpoint URL
        const getTimelineURL = "https://api.tomorrow.io/v4/timelines";

        // Fields to request from the API
        const fields = [
            "precipitationIntensity",
            "precipitationType",
            "windSpeed",
            "windGust",
            "windDirection",
            "temperature",
            "temperatureApparent",
            "cloudCover",
            "cloudBase",
            "cloudCeiling",
            "weatherCode",
            "visibility",
            "humidity"
        ];

        // Units (imperial or metric)
        const units = "metric";

        // Timesteps (current, hourly, daily)
        const timesteps = ["current"];

        // Time parameters
        const nowTime = moment.utc();
        const startTime = moment.utc(nowTime).add(0, "minutes").toISOString();
        const endTime = moment.utc(nowTime).add(1, "hours").toISOString();

        // Timezone
        const timezone = "America/New_York";

        // Construct the API request parameters
        const getTimelineParameters = queryString.stringify({
            apikey: apiKey,
            location: [lat, long],
            fields,
            units,
            timesteps,
            startTime,
            endTime,
            timezone,
        }, { arrayFormat: "comma" });

        // Make the API request
        const response = await fetch(getTimelineURL + "?" + getTimelineParameters, { 
            method: "GET", 
            compress: true 
        });

        // Check if the request was successful
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Tomorrow.io API error: ${response.status} - ${errorData}`);
        }

        // Parse the JSON response
        const data = await response.json();
        
        // Log the raw response for debugging
        console.log("Tomorrow.io API response:", JSON.stringify(data, null, 2));

        // Process the data (this is a placeholder - we'll process the real data format later)
        const processedData = {
            raw: data,
            timestamp: now,
            source: "Tomorrow.io"
        };

        // Update cache
        weatherCache.data = processedData;
        weatherCache.timestamp = now;

        return processedData;
    } catch (error) {
        console.error('Error fetching Tomorrow.io weather data:', error);
        throw error;
    }
}

/**
 * Converts the raw Tomorrow.io data to our app's weather format
 * @param {Object} rawData - Raw weather data from Tomorrow.io
 * @returns {Object} Formatted weather data
 */
export function formatTomorrowWeatherData(rawData) {
    try {
        // Extract the timeline data - based on the actual response structure
        const timeline = rawData.raw.data.timelines[0];
        
        if (!timeline || !timeline.intervals || timeline.intervals.length === 0) {
            throw new Error('No weather data available in timeline');
        }
        
        // Get the current interval
        const currentData = timeline.intervals[0].values;
        
        // Determine the weather condition based on weatherCode
        // This is a simplified mapping - we'll need to update with Tomorrow.io's actual codes
        const weatherCodeMap = {
            0: "Unknown",
            1000: "Clear",
            1100: "Mostly Clear",
            1101: "Partly Cloudy",
            1102: "Mostly Cloudy",
            1001: "Cloudy",
            2000: "Fog",
            2100: "Light Fog",
            4000: "Drizzle",
            4001: "Rain",
            4200: "Light Rain",
            4201: "Heavy Rain",
            5000: "Snow",
            5001: "Flurries",
            5100: "Light Snow",
            5101: "Heavy Snow",
            6000: "Freezing Drizzle",
            6001: "Freezing Rain",
            6200: "Light Freezing Rain",
            6201: "Heavy Freezing Rain",
            7000: "Ice Pellets",
            7101: "Heavy Ice Pellets",
            7102: "Light Ice Pellets",
            8000: "Thunderstorm"
        };
        
        // Get current time
        const currentTime = new Date();
        
        // Determine if it's night (between 6 PM and 6 AM)
        const hour = currentTime.getHours();
        const isNight = hour >= 18 || hour < 6;
        
        // Get the condition from the map or default to "Unknown"
        const condition = weatherCodeMap[currentData.weatherCode] || "Unknown";
        
        // Convert visibility to km if needed (Tomorrow.io provides it in km in metric units)
        const visibility = currentData.visibility || 10; // Default to 10 km if not available
        
        // Determine if conditions are good for observation:
        // - Night time
        // - Clear or mostly clear skies (low cloud cover)
        // - Good visibility (> 8 km)
        // - Low wind speed (< 15 km/h or about 4.2 m/s)
        const isGoodForObservation = (
            isNight && 
            currentData.cloudCover < 30 && 
            visibility > 8 && 
            currentData.windSpeed < 4.2
        );
        
        // Calculate sunrise times (simplified calculation, in a real app we would use a library)
        // For now, let's get it from the backend endpoint directly
        const getSunriseTimes = async () => {
            try {
                const response = await fetch('http://localhost:8000/weather');
                if (!response.ok) return null;
                const data = await response.json();
                return {
                    sunrise_time: data.sunrise_time,
                    time_to_leave: data.time_to_leave
                };
            } catch (error) {
                console.error('Error fetching sunrise times:', error);
                return null;
            }
        };
        
        // Get sunrise times
        const sunriseTimes = await getSunriseTimes();
        
        // Format the data according to our app's expected format
        return {
            temperature: currentData.temperature,
            condition: condition,
            humidity: currentData.humidity,
            wind_speed: currentData.windSpeed,
            cloud_cover: currentData.cloudCover,
            visibility: visibility,
            observation_time: currentTime.toISOString(),
            is_good_for_observation: isGoodForObservation,
            weather_code: currentData.weatherCode,
            sunrise_time: sunriseTimes?.sunrise_time || null,
            time_to_leave: sunriseTimes?.time_to_leave || null
        };
    } catch (error) {
        console.error('Error formatting Tomorrow.io weather data:', error);
        throw error;
    }
}
