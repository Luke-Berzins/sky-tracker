/**
 * Creates a sky background that adapts to weather conditions and time of day
 * @param {Object} weatherData - Optional weather data object
 * @param {boolean} isDay - Whether it's daytime (default: false)
 * @returns {HTMLElement} Sky container element
 */
export function createSkyBackground(weatherData = null, isDay = false) {
    const container = document.createElement('div');
    container.className = 'sky-container';
    
    // Set sky class based on time of day
    if (isDay) {
        container.classList.add('day-sky');
    } else {
        container.classList.add('night-sky');
    }
    
    // Add weather effects if data is available
    if (weatherData) {
        // Add cloud layer if cloudy
        if (weatherData.condition.includes('Cloud') || weatherData.cloud_cover > 20) {
            const cloudLayer = document.createElement('div');
            cloudLayer.className = 'cloud-layer';
            
            // Set cloud opacity based on cloud cover percentage
            const cloudOpacity = Math.min(0.95, Math.max(0.1, weatherData.cloud_cover / 100));
            cloudLayer.style.opacity = cloudOpacity;
            
            container.appendChild(cloudLayer);
            container.classList.add('cloudy');
        }
        
        // Add rain effect if raining
        if (weatherData.condition.includes('Rain')) {
            container.classList.add('rainy');
            
            // Create rain drops
            const rainLayer = document.createElement('div');
            rainLayer.className = 'rain-layer';
            
            // Add rain drops
            for (let i = 0; i < 100; i++) {
                const drop = document.createElement('div');
                drop.className = 'raindrop';
                drop.style.left = `${Math.random() * 100}%`;
                drop.style.animationDuration = `${0.5 + Math.random() * 1}s`;
                drop.style.animationDelay = `${Math.random() * 2}s`;
                rainLayer.appendChild(drop);
            }
            
            container.appendChild(rainLayer);
        }
    }
    
    return container;
}

/**
 * Updates the sky background based on weather and time
 * @param {HTMLElement} skyContainer - The sky container element
 * @param {Object} weatherData - Weather data object
 * @param {boolean} isDay - Whether it's daytime
 */
export function updateSkyBackground(skyContainer, weatherData, isDay) {
    // Update time of day classes
    skyContainer.classList.remove('day-sky', 'night-sky');
    skyContainer.classList.add(isDay ? 'day-sky' : 'night-sky');
    
    // Update weather effects
    skyContainer.classList.remove('cloudy', 'rainy');
    
    // Remove existing weather layers
    const existingCloudLayer = skyContainer.querySelector('.cloud-layer');
    if (existingCloudLayer) {
        skyContainer.removeChild(existingCloudLayer);
    }
    
    const existingRainLayer = skyContainer.querySelector('.rain-layer');
    if (existingRainLayer) {
        skyContainer.removeChild(existingRainLayer);
    }
    
    // Add weather effects if data is available
    if (weatherData) {
        // Add cloud layer if cloudy
        if (weatherData.condition.includes('Cloud') || weatherData.cloud_cover > 20) {
            const cloudLayer = document.createElement('div');
            cloudLayer.className = 'cloud-layer';
            
            // Set cloud opacity based on cloud cover percentage
            const cloudOpacity = Math.min(0.95, Math.max(0.1, weatherData.cloud_cover / 100));
            cloudLayer.style.opacity = cloudOpacity;
            
            skyContainer.appendChild(cloudLayer);
            skyContainer.classList.add('cloudy');
        }
        
        // Add rain effect if raining
        if (weatherData.condition.includes('Rain')) {
            skyContainer.classList.add('rainy');
            
            // Create rain drops
            const rainLayer = document.createElement('div');
            rainLayer.className = 'rain-layer';
            
            // Add rain drops
            for (let i = 0; i < 100; i++) {
                const drop = document.createElement('div');
                drop.className = 'raindrop';
                drop.style.left = `${Math.random() * 100}%`;
                drop.style.animationDuration = `${0.5 + Math.random() * 1}s`;
                drop.style.animationDelay = `${Math.random() * 2}s`;
                rainLayer.appendChild(drop);
            }
            
            skyContainer.appendChild(rainLayer);
        }
    }
}