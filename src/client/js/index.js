//index.js

// Import the optimized createStars function from the stars.js module
import { createStars } from './visualization/stars.js';
import { initWeatherComponent, fetchWeatherData } from './weather.js';

async function fetchData() {
    try {
        const response = await fetch('/api/celestial-data');
        if (!response.ok) {
            throw new Error(`Server error: ${await response.text()}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data);
        
        // Filter out objects below horizon
        const visibleObjects = Object.fromEntries(
            Object.entries(data).filter(([_, object]) => 
                object.visibility.isVisible && 
                object.daily_path[0]?.altitude > 0
            )
        );
        
        if (Object.keys(visibleObjects).length === 0) {
            const container = document.getElementById('celestial-objects');
            const visibleList = document.getElementById('visible-list');
            if (container) container.innerHTML = '<div class="no-objects">No celestial objects currently visible</div>';
            if (visibleList) visibleList.innerHTML = '<h2>Currently Visible</h2><div class="no-objects">No objects above horizon</div>';
            return;
        }
        
        renderSkyObjects(visibleObjects);
    } catch (error) {
        console.error('Error:', error);
        const container = document.getElementById('celestial-objects');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h2>Error loading celestial data</h2>
                    <p>${error.message}</p>
                    <button onclick="retryFetch()">Retry</button>
                </div>
            `;
        }
    }
}

function getCompassDirection(azimuth) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((azimuth %= 360) < 0 ? azimuth + 360 : azimuth) / 45) % 8;
    return directions[index];
}

// Import the optimized renderer
import { renderAllCelestialObjects } from './visualization/celestialObjects.js';

function renderSkyObjects(data) {
    const container = document.getElementById('celestial-objects');
    const visibleList = document.getElementById('visible-list');
    
    if (!container || !visibleList) {
        console.error('Required DOM elements not found');
        return;
    }

    // Clear existing visible list
    visibleList.innerHTML = '<h2>Currently Visible</h2>';

    // Use the canvas-based optimized renderer
    renderAllCelestialObjects(container, data, (object) => {
        // Planet click handler
        if (object.type.toLowerCase() === 'planet') {
            window.location.href = `/planet/${object.name.toLowerCase()}`;
        }
    });

    // Populate the visible list
    Object.values(data).forEach(object => {
        const currentPosition = object.daily_path[0];
        if (!currentPosition) return;

        // Add to visible list
        const listItem = document.createElement('div');
        listItem.className = 'visible-item';
        
        if (object.type.toLowerCase() === 'planet') {
            listItem.style.cursor = 'pointer';
            listItem.addEventListener('click', () => {
                window.location.href = `/planet/${object.name.toLowerCase()}`;
            });
        }
        
        // Use a document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'object-name';
        nameSpan.textContent = object.name;
        fragment.appendChild(nameSpan);
        
        const detailsSpan = document.createElement('span');
        detailsSpan.className = 'object-details';
        detailsSpan.textContent = `Alt: ${currentPosition.altitude.toFixed(1)}° Az: ${currentPosition.azimuth.toFixed(1)}°`;
        fragment.appendChild(detailsSpan);
        
        listItem.appendChild(fragment);
        visibleList.appendChild(listItem);
    });
}

// Initialize
// User activity detection to optimize polling
let userActive = true;
let inactivityTimer;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    userActive = true;
    inactivityTimer = setTimeout(() => {
        userActive = false;
    }, 300000); // 5 minutes of inactivity
}

// Setup user activity listeners
function setupActivityListeners() {
    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetInactivityTimer);
    });
    resetInactivityTimer();
}

// Smart polling function that adjusts based on user activity
function setupPolling(pollingFunction, activeInterval = 60000, inactiveInterval = 300000) {
    let timer;
    
    function poll() {
        pollingFunction();
        const interval = userActive ? activeInterval : inactiveInterval;
        timer = setTimeout(poll, interval);
    }
    
    // Start polling
    poll();
    
    // Return control function
    return {
        stop: () => clearTimeout(timer),
        forceUpdate: () => {
            clearTimeout(timer);
            poll();
        }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing sky view...');
    
    // Initialize user activity tracking
    setupActivityListeners();
    
    // Get existing sky container instead of creating a new one
    const skyContainer = document.querySelector('.sky-container');
    
    // Update the header title based on time of day
    updateHeaderTitle();
    
    // Function to update sky based on time and weather
    async function updateSkyAndStars() {
        try {
            // Get current hour to determine if it's day or night
            const currentHour = new Date().getHours();
            const isDay = currentHour >= 6 && currentHour < 19; // Simple day/night check (6am-7pm)
            
            // Fetch weather data
            const weatherData = await fetchWeatherData().catch(() => null);
            
            // Get or create the sky container
            const skyContainer = document.querySelector('.sky-container');
            if (!skyContainer) return;
            
            // Update sky classes for time of day
            skyContainer.classList.remove('day-sky', 'night-sky');
            skyContainer.classList.add(isDay ? 'day-sky' : 'night-sky');
            
            // Update cloud effects based on weather
            if (weatherData) {
                // Remove existing weather layers
                const existingCloudLayer = skyContainer.querySelector('.cloud-layer');
                if (existingCloudLayer) skyContainer.removeChild(existingCloudLayer);
                
                const existingRainLayer = skyContainer.querySelector('.rain-layer');
                if (existingRainLayer) skyContainer.removeChild(existingRainLayer);
                
                // Add clouds based on weather conditions or cloud cover
                if (weatherData.condition.includes('Cloud') || weatherData.cloud_cover > 20) {
                    skyContainer.classList.add('cloudy');
                    
                    const cloudLayer = document.createElement('div');
                    cloudLayer.className = 'cloud-layer';
                    
                    // Set cloud opacity based on cloud cover percentage
                    const cloudOpacity = Math.min(0.8, Math.max(0.1, weatherData.cloud_cover / 100));
                    cloudLayer.style.opacity = cloudOpacity;
                    
                    skyContainer.appendChild(cloudLayer);
                } else {
                    skyContainer.classList.remove('cloudy');
                }
                
                // Add rain effect if raining
                if (weatherData.condition.includes('Rain')) {
                    skyContainer.classList.add('rainy');
                    
                    const rainLayer = document.createElement('div');
                    rainLayer.className = 'rain-layer';
                    
                    // Create varied raindrops for more realistic effect
                    for (let i = 0; i < 150; i++) {
                        const drop = document.createElement('div');
                        drop.className = 'raindrop';
                        
                        // Randomize drop properties for variety
                        drop.style.left = `${Math.random() * 100}%`;
                        
                        // Varying speeds
                        const speed = 0.5 + Math.random() * 1.2;
                        drop.style.animationDuration = `${speed}s`;
                        
                        // Varying delays
                        drop.style.animationDelay = `${Math.random() * 2}s`;
                        
                        // Varying sizes and opacities
                        const size = 0.8 + Math.random() * 1.2;
                        drop.style.width = `${size}px`;
                        drop.style.height = `${10 + Math.random() * 15}px`;
                        drop.style.opacity = `${0.4 + Math.random() * 0.6}`;
                        
                        rainLayer.appendChild(drop);
                    }
                    
                    skyContainer.appendChild(rainLayer);
                    
                    // Add subtle fog/mist effect on rainy days
                    if (!skyContainer.querySelector('.mist-effect')) {
                        const mistEffect = document.createElement('div');
                        mistEffect.className = 'mist-effect';
                        skyContainer.appendChild(mistEffect);
                    }
                } else {
                    skyContainer.classList.remove('rainy');
                    
                    // Remove mist effect if it exists
                    const mistEffect = skyContainer.querySelector('.mist-effect');
                    if (mistEffect) {
                        skyContainer.removeChild(mistEffect);
                    }
                }
            }
            
            // Force re-creation of stars by clearing existing ones first
            const starsContainer = document.querySelector('.stars');
            if (starsContainer) {
                starsContainer.innerHTML = ''; // Clear existing stars
            }
            createStars(300, true, weatherData, isDay);
        } catch (error) {
            console.error('Error updating sky conditions:', error);
        }
    }
    
    // Initial data fetch for celestial objects
    fetchData();
    
    // Setup smart polling for celestial data
    const polling = setupPolling(fetchData);
    
    // Initialize weather component
    initWeatherComponent('weather-container');
    
    // Initial sky/stars update - run it twice to ensure proper initialization
    updateSkyAndStars();
    
    // Run again after a short delay to ensure weather data is loaded
    setTimeout(updateSkyAndStars, 1000);
    
    // Update sky every 3 minutes or when weather refreshes
    setInterval(updateSkyAndStars, 180000); // 3 minutes
    
    // Make polling and sky update functions available globally
    window.skyPolling = polling;
    window.updateSky = updateSkyAndStars;
    
    // Update title every hour
    setInterval(updateHeaderTitle, 3600000); // every hour
});

// Function to update the header title based on time of day
function updateHeaderTitle() {
    const currentHour = new Date().getHours();
    const headerTitle = document.querySelector('.site-title');
    
    if (headerTitle) {
        // Change to "Today" between 4am and 6pm, "Tonight" otherwise
        if (currentHour >= 4 && currentHour < 18) {
            headerTitle.textContent = headerTitle.textContent.replace('Tonight', 'Today');
        } else {
            headerTitle.textContent = headerTitle.textContent.replace('Today', 'Tonight');
        }
    }
}

// Make retry function globally available
window.retryFetch = () => {
    console.log('Retrying data fetch...');
    const container = document.getElementById('celestial-objects');
    if (container) {
        container.innerHTML = '<p>Retrying...</p>';
    }
    fetchData();
};