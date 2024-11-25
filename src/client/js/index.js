function createStars() {
    const stars = document.querySelector('.stars');
    if (!stars) return;

    // Create more stars for better density in the upper area
    for (let i = 0; i < 300; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = Math.random() * 3 + 'px';
        star.style.height = star.style.width;
        // Bias stars towards the top of the sky
        star.style.top = `${Math.random() * Math.random() * 100}%`;
        star.style.left = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        stars.appendChild(star);
    }
}

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

function renderSkyObjects(data) {
    const container = document.getElementById('celestial-objects');
    const visibleList = document.getElementById('visible-list');
    
    if (!container || !visibleList) {
        console.error('Required DOM elements not found');
        return;
    }

    // Clear existing content
    container.innerHTML = '';
    visibleList.innerHTML = '<h2>Currently Visible</h2>';

    Object.values(data).forEach(object => {
        const currentPosition = object.daily_path[0];
        if (!currentPosition) return;

        const objectEl = document.createElement('div');
        objectEl.className = `celestial-object ${object.type.toLowerCase()} ${object.name.toLowerCase()}`;
        
        const altitude = currentPosition.altitude;
        const azimuth = currentPosition.azimuth;
        
        // New positioning calculation
        // Horizon starts at 80% of container height
        // Zenith (90°) is at 0% (top)
        const horizonLine = 80; // Percentage from top where horizon sits
        const verticalRange = horizonLine; // Amount of space for objects
        const verticalPosition = horizonLine - (altitude / 90) * verticalRange;
        
        objectEl.style.left = `${(azimuth / 360) * 100}%`;
        objectEl.style.top = `${verticalPosition}%`;

        // Make object clickable if it's a planet
        if (object.type.toLowerCase() === 'planet') {
            objectEl.style.cursor = 'pointer';
            objectEl.addEventListener('click', () => {
                window.location.href = `/planet/${object.name.toLowerCase()}`;
            });
        }

        // Add info tooltip
        const tooltipEl = document.createElement('div');
        tooltipEl.className = 'object-tooltip';
        tooltipEl.innerHTML = `
            <h3>${object.name}</h3>
            <div class="tooltip-content">
                <p>${object.visibility.message}</p>
                <p>Altitude: ${altitude.toFixed(1)}°</p>
                <p>Azimuth: ${azimuth.toFixed(1)}° (${getCompassDirection(azimuth)})</p>
                ${object.type.toLowerCase() === 'planet' ? '<p class="click-hint">Click for details →</p>' : ''}
            </div>
        `;
        objectEl.appendChild(tooltipEl);
        container.appendChild(objectEl);

        // Add to visible list
        const listItem = document.createElement('div');
        listItem.className = 'visible-item';
        if (object.type.toLowerCase() === 'planet') {
            listItem.style.cursor = 'pointer';
            listItem.addEventListener('click', () => {
                window.location.href = `/planet/${object.name.toLowerCase()}`;
            });
        }
        listItem.innerHTML = `
            <span class="object-name">${object.name}</span>
            <span class="object-details">
                Alt: ${altitude.toFixed(1)}° 
                Az: ${azimuth.toFixed(1)}°
            </span>
        `;
        visibleList.appendChild(listItem);
    });

    // Add horizon line
    const horizonLine = document.createElement('div');
    horizonLine.className = 'horizon-line';
    horizonLine.style.top = '80%';
    container.appendChild(horizonLine);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing sky view...');
    createStars();
    fetchData();
    setInterval(fetchData, 60000);
});

// Make retry function globally available
window.retryFetch = () => {
    console.log('Retrying data fetch...');
    const container = document.getElementById('celestial-objects');
    if (container) {
        container.innerHTML = '<p>Retrying...</p>';
    }
    fetchData();
};