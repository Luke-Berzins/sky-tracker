// src/server/routes/api.js
import express from 'express';
import { fetchCelestialData, fetchWeatherData } from '../services/celestialService.js';
import { fetchTomorrowWeather, formatTomorrowWeatherData } from '../services/tomorrowWeatherService.js';
import { fetchWeather } from '../services/unifiedWeatherService.js';

const router = express.Router();

// Endpoint for getting celestial data
router.get('/celestial-data', async (req, res) => {
    try {
        // Get the force refresh parameter
        const forceRefresh = req.query.refresh === 'true';
        
        // Use the service to get data
        const data = await fetchCelestialData(forceRefresh);
        
        res.json(data);
    } catch (error) {
        console.error('API Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch celestial data',
            details: error.message
        });
    }
});

// Endpoint for forcefully refreshing cached data
router.get('/refresh-celestial-data', async (req, res) => {
    try {
        const data = await fetchCelestialData(true);
        res.json({ 
            success: true, 
            message: 'Celestial data refreshed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Refresh Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to refresh celestial data',
            details: error.message
        });
    }
});

// Endpoint for getting weather data
router.get('/weather', async (req, res) => {
    try {
        // Get the force refresh parameter
        const forceRefresh = req.query.refresh === 'true';
        
        // Use the unified weather service to get data
        const data = await fetchWeather(forceRefresh);
        
        res.json(data);
    } catch (error) {
        console.error('Weather API Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch weather data',
            details: error.message
        });
    }
});

// Endpoint for getting Tomorrow.io weather data (test endpoint)
router.get('/tomorrow-weather', async (req, res) => {
    try {
        // Get the force refresh parameter
        const forceRefresh = req.query.refresh === 'true';
        
        // Get coordinates from query params or use defaults
        const lat = parseFloat(req.query.lat) || undefined;
        const long = parseFloat(req.query.long) || undefined;
        
        // Get API key from query params
        const apiKey = req.query.key;
        if (!apiKey) {
            return res.status(400).json({ error: 'API key is required' });
        }
        
        // Use the service to get data
        const rawData = await fetchTomorrowWeather(lat, long, forceRefresh, apiKey);
        
        // Format the data if requested
        if (req.query.format === 'true') {
            try {
                const formattedData = formatTomorrowWeatherData(rawData);
                res.json({
                    raw: rawData,
                    formatted: formattedData
                });
            } catch (formatError) {
                console.error('Error formatting weather data:', formatError);
                res.json({
                    raw: rawData,
                    formatError: formatError.message
                });
            }
        } else {
            // Return raw data
            res.json(rawData);
        }
    } catch (error) {
        console.error('Tomorrow.io Weather API Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch Tomorrow.io weather data',
            details: error.message
        });
    }
});

export default router;