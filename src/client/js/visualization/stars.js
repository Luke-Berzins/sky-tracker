
// src/client/js/visualization/stars.js
/**
 * Creates stars in the sky with optimized rendering and dynamic visibility based on time and weather
 * @param {number} count - Number of stars to create
 * @param {boolean} topBias - Whether to bias stars toward top of sky
 * @param {Object} weatherData - Optional weather data
 * @param {boolean} isDay - Whether it's daytime
 */
export function createStars(count = 200, topBias = false, weatherData = null, isDay = false) {
    // Create stars container if it doesn't exist
    let starsContainer = document.querySelector('.stars');
    if (!starsContainer) {
        starsContainer = document.createElement('div');
        starsContainer.className = 'stars';
        const skyContainer = document.querySelector('.sky-container');
        if (skyContainer) {
            skyContainer.appendChild(starsContainer);
        } else {
            console.error('Sky container not found');
            return;
        }
    }
    
    // Determine star visibility based on time of day and weather
    updateStarsVisibility(starsContainer, weatherData, isDay);
    
    // If stars already exist, just update visibility
    if (starsContainer.childElementCount > 0) {
        return;
    }
    
    // Create star elements in a document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Create star with varying size (smaller stars are more common)
        const sizeRand = Math.random();
        let size;
        
        if (sizeRand < 0.6) { // 60% of stars are tiny
            size = 1;
        } else if (sizeRand < 0.9) { // 30% of stars are small
            size = 2;
        } else { // 10% of stars are medium
            size = 3;
        }
        
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // Top bias if requested
        star.style.top = topBias 
            ? `${Math.random() * Math.random() * 100}%` 
            : Math.random() * 100 + '%';
            
        star.style.left = Math.random() * 100 + '%';
        
        // Add star color based on temperature class
        const temperatureRand = Math.random();
        
        if (temperatureRand < 0.1) { // 10% blue stars (hottest)
            star.style.background = '#CAE8FF';
            star.style.boxShadow = '0 0 3px #CAE8FF';
        } else if (temperatureRand < 0.4) { // 30% white stars
            star.style.background = 'white';
            star.style.boxShadow = '0 0 3px white';
        } else if (temperatureRand < 0.7) { // 30% yellow stars
            star.style.background = '#FFFF99';
            star.style.boxShadow = '0 0 3px #FFFF99';
        } else if (temperatureRand < 0.9) { // 20% orange stars
            star.style.background = '#FFD580';
            star.style.boxShadow = '0 0 3px #FFD580';
        } else { // 10% red stars (coolest)
            star.style.background = '#FFCCCB';
            star.style.boxShadow = '0 0 3px #FFCCCB';
        }
        
        star.style.animationDelay = Math.random() * 3 + 's';
        fragment.appendChild(star);
    }
    
    // Append all stars at once for better performance
    starsContainer.appendChild(fragment);
    
    // Set up meteor creation interval
    setupMeteorInterval();
}

/**
 * Updates star visibility based on time of day and weather
 * @param {HTMLElement} starsContainer - The stars container element
 * @param {Object} weatherData - Weather data
 * @param {boolean} isDay - Whether it's daytime
 */
export function updateStarsVisibility(starsContainer = null, weatherData = null, isDay = false) {
    if (!starsContainer) {
        starsContainer = document.querySelector('.stars');
        if (!starsContainer) return;
    }
    
    // Determine if stars should be visible
    const isStarsVisible = !isDay && (!weatherData || weatherData.cloud_cover < 80);
    
    // Animate transition
    starsContainer.style.transition = 'opacity 1.5s ease-in-out';
    starsContainer.style.opacity = isStarsVisible ? '1' : '0';
}

/**
 * Sets up interval for creating meteors
 */
function setupMeteorInterval() {
    // Clear existing interval if it exists
    if (window.meteorInterval) {
        clearInterval(window.meteorInterval);
    }
    
    // Create occasional meteors
    window.meteorInterval = setInterval(() => {
        const starsContainer = document.querySelector('.stars');
        if (!starsContainer) return;
        
        // Only create meteors at night when stars are visible
        const starsVisible = starsContainer.style.opacity !== '0';
        if (starsVisible && Math.random() > 0.9) { // 10% chance of meteor every interval
            createMeteor();
        }
    }, 8000);
}

/**
 * Creates a meteor effect
 */
export function createMeteor() {
    const meteor = document.createElement('div');
    meteor.className = 'meteor';
    
    // Set random position near top of sky
    meteor.style.top = Math.random() * 20 + '%';
    meteor.style.left = (Math.random() * 80 + 10) + '%';
    
    // Set random angle (mainly pointing down, slight variation)
    const angle = 15 + Math.random() * 30;
    meteor.style.transform = `rotate(${angle}deg)`;
    
    // Set styles for meteor
    meteor.style.position = 'absolute';
    meteor.style.width = '2px';
    meteor.style.height = '150px';
    meteor.style.background = 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)';
    meteor.style.borderRadius = '1px';
    meteor.style.opacity = '0';
    meteor.style.zIndex = '10';
    
    // Use CSS animation for performance
    meteor.style.animation = 'meteor 1s linear forwards';
    
    // Add to sky container
    const skyContainer = document.querySelector('.sky-container');
    if (skyContainer) {
        skyContainer.appendChild(meteor);
        
        // Remove after animation completes
        setTimeout(() => {
            if (meteor.parentNode) {
                meteor.parentNode.removeChild(meteor);
            }
        }, 1000);
    }
}

// Add meteor animation if not already present
if (!document.querySelector('#meteor-animation-styles')) {
    const meteorStyle = document.createElement('style');
    meteorStyle.id = 'meteor-animation-styles';
    meteorStyle.innerHTML = `
    @keyframes meteor {
        0% {
            transform: translateX(0) translateY(0) rotate(35deg);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        70% {
            opacity: 1;
        }
        100% {
            transform: translateX(-300px) translateY(150vh) rotate(35deg);
            opacity: 0;
        }
    }`;
    document.head.appendChild(meteorStyle);
}
