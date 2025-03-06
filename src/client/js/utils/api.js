// src/client/js/utils/api.js

// Logging utility
const Logger = {
    isEnabled: true,
    levels: {
        INFO: 'INFO',
        ERROR: 'ERROR',
        WARN: 'WARN',
        DEBUG: 'DEBUG'
    },
    log(level, component, message, data = null) {
        if (!this.isEnabled) return;
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] [${component}] ${message}`;
        
        switch (level) {
            case this.levels.ERROR:
                console.error(logMessage, data);
                break;
            case this.levels.WARN:
                console.warn(logMessage, data);
                break;
            case this.levels.DEBUG:
                console.debug(logMessage, data);
                break;
            default:
                console.log(logMessage, data);
        }
    }
};

// Response validation utilities
const ValidationUtils = {
    validateCelestialData(data) {
        if (!data) return false;
        if (typeof data !== 'object') return false;
        if (Object.keys(data).length === 0) return false;
        return true;
    },

    validatePlanetData(data) {
        if (!data) return false;
        if (!data.name) return false;
        if (!data.daily_path || !Array.isArray(data.daily_path)) return false;
        if (!data.visibility) return false;
        return true;
    },

    validatePlanetsList(data) {
        if (!data || !data.planets || !Array.isArray(data.planets)) return false;
        return true;
    }
};

// API request wrapper with logging
async function makeRequest(endpoint, options = {}) {
    const requestId = Math.random().toString(36).substring(7);
    Logger.log(Logger.levels.INFO, 'API', `Starting request ${requestId} to ${endpoint}`);
    
    const startTime = performance.now();
    try {
        const response = await fetch(endpoint, options);
        const endTime = performance.now();
        Logger.log(Logger.levels.DEBUG, 'API', `Request ${requestId} completed in ${(endTime - startTime).toFixed(2)}ms`, {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries([...response.headers])
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            Logger.log(Logger.levels.ERROR, 'API', `Request ${requestId} failed`, {
                status: response.status,
                errorData
            });
            throw new Error(errorData?.detail || errorData?.error || `HTTP Error ${response.status}`);
        }

        const data = await response.json();
        Logger.log(Logger.levels.DEBUG, 'API', `Request ${requestId} data received`, data);
        return data;
    } catch (error) {
        Logger.log(Logger.levels.ERROR, 'API', `Request ${requestId} error`, error);
        throw error;
    }
}

// Enhanced API functions
export async function fetchCelestialData() {
    Logger.log(Logger.levels.INFO, 'Celestial', 'Fetching realtime positions');
    try {
        const data = await makeRequest('/realtime-positions');
        if (!ValidationUtils.validateCelestialData(data)) {
            Logger.log(Logger.levels.ERROR, 'Celestial', 'Invalid data format received', data);
            throw new Error('Invalid celestial data format');
        }
        Logger.log(Logger.levels.INFO, 'Celestial', `Received data for ${Object.keys(data).length} objects`);
        return data;
    } catch (error) {
        Logger.log(Logger.levels.ERROR, 'Celestial', 'Failed to fetch celestial data', error);
        throw error;
    }
}

export async function fetchPlanetData(planetName) {
    Logger.log(Logger.levels.INFO, 'Planet', `Fetching data for planet: ${planetName}`);
    try {
        const data = await makeRequest(`/planet/${planetName.toLowerCase()}`);
        if (!ValidationUtils.validatePlanetData(data)) {
            Logger.log(Logger.levels.ERROR, 'Planet', 'Invalid planet data format', data);
            throw new Error(`Invalid data format for planet ${planetName}`);
        }
        Logger.log(Logger.levels.INFO, 'Planet', `Successfully fetched data for ${planetName}`, {
            isVisible: data.visibility.isVisible,
            pathPoints: data.daily_path.length
        });
        return data;
    } catch (error) {
        Logger.log(Logger.levels.ERROR, 'Planet', `Failed to fetch data for ${planetName}`, error);
        throw error;
    }
}

export async function fetchAllPlanets() {
    Logger.log(Logger.levels.INFO, 'Planets', 'Fetching all planets list');
    try {
        const data = await makeRequest('/planets');
        if (!ValidationUtils.validatePlanetsList(data)) {
            Logger.log(Logger.levels.ERROR, 'Planets', 'Invalid planets list format', data);
            throw new Error('Invalid planets list format');
        }
        Logger.log(Logger.levels.INFO, 'Planets', `Retrieved ${data.planets.length} planets`);
        return data.planets;
    } catch (error) {
        Logger.log(Logger.levels.ERROR, 'Planets', 'Failed to fetch planets list', error);
        throw error;
    }
}

// Export logging utility for use in other modules
export const LoggerUtil = Logger;