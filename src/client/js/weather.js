// src/client/js/weather.js

/**
 * Fetches weather data from the server
 * @param {boolean} forceRefresh - Whether to bypass cache
 * @returns {Promise<Object>} Weather data
 */
export async function fetchWeatherData(forceRefresh = false) {
    try {
        // Add refresh parameter if needed
        const url = forceRefresh ? '/api/weather?refresh=true' : '/api/weather';
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Server error: ${await response.text()}`);
        }
        const data = await response.json();
        
        // Log data source for debugging
        console.log(`Weather data source: ${data.source || 'unknown'}`);
        
        return data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

/**
 * Gets a weather icon based on condition and observation quality
 * @param {string} condition Weather condition
 * @param {boolean} isGoodForObservation Whether conditions are good for observation
 * @returns {string} Weather icon HTML
 */
function getWeatherIcon(condition, isGoodForObservation) {
    const iconMap = {
        'Clear': '☀️',
        'Partly Cloudy': '⛅',
        'Cloudy': '☁️',
        'Rain': '🌧️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Fog': '🌫️'
    };
    
    return iconMap[condition] || '🌡️';
}

/**
 * Creates and renders the weather widget
 * @param {HTMLElement} container Container element
 * @param {Object} weatherData Weather data
 * @param {Function} refreshCallback Function to call when refresh is clicked
 */
function renderWeatherWidget(container, weatherData, refreshCallback) {
    // Format data for display
    const observationTime = new Date(weatherData.observation_time).toLocaleTimeString();
    const isGoodForObservation = weatherData.is_good_for_observation;
    
    // Create weather widget
    const weatherWidget = document.createElement('div');
    weatherWidget.className = `weather-container ${isGoodForObservation ? 'good' : 'bad'}`;
    
    console.log('Weather data for rendering:', weatherData);
    
    // Add header with icon and observation status
    weatherWidget.innerHTML = `
        <div class="weather-header">
            <h2 class="weather-title">
                <span class="weather-icon">${getWeatherIcon(weatherData.condition, isGoodForObservation)}</span>
                Current Weather
            </h2>
            <span class="observation-status ${isGoodForObservation ? 'good' : 'bad'}">
                ${isGoodForObservation ? 'Good for observation' : 'Poor for observation'}
            </span>
        </div>
        
        <div class="weather-data">
            <div class="weather-item weather-condition">
                <span class="weather-label">Condition</span>
                <span class="weather-value">${weatherData.condition}</span>
            </div>
            
            <div class="weather-item">
                <span class="weather-label">Temperature</span>
                <span class="weather-value">${weatherData.temperature.toFixed(1)}°C</span>
            </div>
            
            <div class="weather-item">
                <span class="weather-label">Cloud Cover</span>
                <span class="weather-value">${weatherData.cloud_cover}%</span>
            </div>
            
            <div class="weather-item">
                <span class="weather-label">Humidity</span>
                <span class="weather-value">${weatherData.humidity}%</span>
            </div>
            
            <div class="weather-item">
                <span class="weather-label">Wind Speed</span>
                <span class="weather-value">${weatherData.wind_speed.toFixed(1)} m/s</span>
            </div>
            
            <div class="weather-item">
                <span class="weather-label">Visibility</span>
                <span class="weather-value">${weatherData.visibility.toFixed(1)} km</span>
            </div>
            
            ${weatherData.sunrise_time ? `
            <div class="weather-item weather-highlight">
                <span class="weather-label">Sunrise</span>
                <span class="weather-value">${new Date(weatherData.sunrise_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            
            <div class="weather-item weather-highlight">
                <span class="weather-label">Time to Leave</span>
                <span class="weather-value">${new Date(weatherData.time_to_leave).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="weather-footer">
            Last updated: ${observationTime}
            <a href="#" class="refresh-link" title="Refresh weather data">⟳</a>
        </div>
    `;
    
    // Add to container
    container.innerHTML = '';
    container.appendChild(weatherWidget);
    
    // Add refresh link behavior
    if (refreshCallback) {
        const refreshLink = weatherWidget.querySelector('.refresh-link');
        if (refreshLink) {
            refreshLink.addEventListener('click', (e) => {
                e.preventDefault();
                refreshCallback();
            });
        }
    }
}

/**
 * Initializes the weather component
 * @param {string} containerId ID of the container element
 */
export async function initWeatherComponent(containerId = 'weather-container') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Weather container with ID ${containerId} not found`);
        return;
    }
    
    // Function to refresh weather data
    async function refreshWeather(forceRefresh = true) {
        try {
            // Show loading indicator
            container.querySelector('.refresh-link')?.classList.add('rotating');
            
            // Fetch fresh data
            const freshData = await fetchWeatherData(forceRefresh);
            
            // Add sunrise time if it's missing
            if (!freshData.sunrise_time) {
                const today = new Date();
                // Simple approximation - real calculation would use solar position
                // This is just a fallback - 6:30am sunrise as an example
                const approxSunrise = new Date(today.setHours(6, 30, 0, 0));
                const timeToLeave = new Date(approxSunrise);
                timeToLeave.setMinutes(approxSunrise.getMinutes() - 30);
                
                freshData.sunrise_time = approxSunrise.toISOString();
                freshData.time_to_leave = timeToLeave.toISOString();
            }
            
            // Render updated widget
            renderWeatherWidget(container, freshData, refreshWeather);
            
            // Update sky appearance if the function is available
            if (window.updateSky) {
                window.updateSky();
            }
            
            return freshData;
        } catch (error) {
            console.error('Error refreshing weather data:', error);
            container.querySelector('.refresh-link')?.classList.remove('rotating');
            return null;
        }
    }
    
    try {
        // Show loading state
        container.innerHTML = '<div class="weather-container">Loading weather data...</div>';
        
        // Force a refresh on initial load to ensure we get the latest data
        const weatherData = await refreshWeather(true);
        
        // Render weather widget with refresh callback if we didn't already do it
        if (!weatherData) {
            const cachedData = await fetchWeatherData();
            renderWeatherWidget(container, cachedData, refreshWeather);
        }
        
        // Set up automatic refresh every 5 minutes
        setInterval(() => refreshWeather(false), 300000); // 5 minutes
        
    } catch (error) {
        container.innerHTML = `
            <div class="weather-container bad">
                <div class="weather-header">
                    <h2 class="weather-title">
                        <span class="weather-icon">⚠️</span>
                        Weather Unavailable
                    </h2>
                </div>
                <div class="weather-data">
                    <p>Unable to load weather data. Please try again later.</p>
                </div>
                <button onclick="refreshWeather(true)">Retry</button>
            </div>
        `;
    }
}