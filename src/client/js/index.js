function createStars() {
    const stars = document.querySelector('.stars');
    if (!stars) return;

    for (let i = 0; i < 200; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = Math.random() * 3 + 'px';
        star.style.height = star.style.width;
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
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
        console.log('Fetched data:', data); // Debug log
        renderSkyObjects(data);
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

        // Position the object
        const objectEl = document.createElement('div');
        objectEl.className = `celestial-object ${object.type.toLowerCase()} ${object.name.toLowerCase()}`;
        
        // Calculate position using altitude and azimuth
        const altitude = currentPosition.altitude;
        const azimuth = currentPosition.azimuth;
        
        // Simple positioning (we'll refine this later)
        objectEl.style.left = `${(azimuth / 360) * 100}%`;
        objectEl.style.top = `${100 - ((altitude + 90) / 180) * 100}%`;

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

        // Add to visible list if visible
        if (object.visibility.isVisible) {
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
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing sky view...'); // Debug log
    createStars();
    fetchData();
    // Update every minute
    setInterval(fetchData, 60000);
});

// Make retry function globally available
window.retryFetch = () => {
    console.log('Retrying data fetch...'); // Debug log
    const container = document.getElementById('celestial-objects');
    if (container) {
        container.innerHTML = '<p>Retrying...</p>';
    }
    fetchData();
};