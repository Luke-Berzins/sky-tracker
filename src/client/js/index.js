// src/client/js/index.js
const createStars = () => {
    const stars = document.querySelector('.stars');
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
};

const createMeteor = () => {
    const meteor = document.createElement('div');
    meteor.className = 'meteor';
    meteor.style.top = Math.random() * 50 + '%';
    meteor.style.left = '100%';
    meteor.style.animation = 'meteor 1s linear forwards';
    document.querySelector('.sky-container').appendChild(meteor);
    setTimeout(() => meteor.remove(), 1000);
};

const getCompassDirection = (azimuth) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((azimuth %= 360) < 0 ? azimuth + 360 : azimuth) / 45) % 8;
    return directions[index];
};

const positionObject = (altitude, azimuth) => {
    const normalizedAzimuth = ((azimuth + 360) % 360);
    if (normalizedAzimuth <= 90 || normalizedAzimuth >= 270) {
        let x;
        if (normalizedAzimuth >= 270) {
            x = ((normalizedAzimuth - 360) + 90) / 180;
        } else {
            x = azimuth / 180;
        }
        const y = 1 - ((altitude + 90) / 180);
        return { x, y };
    }
    return null;
};

async function fetchCelestialData() {
    const response = await fetch('/api/celestial-data');
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Server error: ${errorData.details || errorData.error || 'Unknown error'}`);
    }
    return response.json();
}

async function updateSky() {
    try {
        const data = await fetchCelestialData();
        renderVisibleObjects(data);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('celestial-objects').innerHTML = `
            <div class="error-message">
                <h2>Error loading celestial data</h2>
                <p>${error.message}</p>
                <button onclick="window.retryFetch()">Retry</button>
            </div>
        `;
    }
}

function renderVisibleObjects(data) {
    const visibleObjects = Object.values(data).filter(obj => obj.visibility.isVisible);
    
    if (visibleObjects.length === 0) {
        document.getElementById('celestial-objects').innerHTML = `
            <div class="no-visible">
                <h2>No Objects Currently Visible</h2>
                <p>Check back later when celestial objects are above the horizon.</p>
            </div>
        `;
        return;
    }

    const objectsHtml = visibleObjects.map(object => {
        const currentPosition = object.daily_path[0];
        if (!currentPosition) return '';

        const pos = positionObject(currentPosition.altitude, currentPosition.azimuth);
        if (!pos) return '';

        return `
            <div class="celestial-object ${object.type.toLowerCase()} ${object.name.toLowerCase()}"
                 style="left: ${pos.x * 100}%; top: ${pos.y * 100}%">
                <div class="object-info">
                    <h3>${object.name}</h3>
                    <p>${object.visibility.message}</p>
                    <p>Altitude: ${currentPosition.altitude.toFixed(1)}°</p>
                    <p>Azimuth: ${currentPosition.azimuth.toFixed(1)}° (${getCompassDirection(currentPosition.azimuth)})</p>
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('celestial-objects').innerHTML = objectsHtml;
}

// Initialize
createStars();
updateSky();

// Update every minute
setInterval(updateSky, 60000);

// Create meteors randomly
setInterval(() => {
    if (Math.random() < 0.3) createMeteor();
}, 2000);

// Make retry function globally available
window.retryFetch = () => {
    document.getElementById('celestial-objects').innerHTML = '<p>Retrying...</p>';
    updateSky();
};