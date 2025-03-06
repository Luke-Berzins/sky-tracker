// src/server/config/environment.js
// Environment configuration for the application

// Add your Tomorrow.io API key here
export const TOMORROW_API_KEY = "KrKU9PUVRuVHTvUcf6e3Awrn4KzvC5C0"; // Replace with your API key

// Weather service configuration
export const WEATHER_SERVICE = {
    // Which weather service to use: "mock", "openweathermap", "tomorrow"
    provider: "tomorrow",
    
    // Default location (Cambridge)
    defaultLat: 43.397221,
    defaultLong: -80.311386,
    
    // Cache settings
    cacheValidityPeriod: 300000, // 5 minutes in milliseconds
}
