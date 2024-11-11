// src/client/js/data.js
async function fetchData() {
    try {
        const response = await fetch('/api/celestial-data');
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Server error: ${errorData.details || errorData.error || 'Unknown error'}`);
        }
        
        const data = await response.json();
        
        if (!data || Object.keys(data).length === 0) {
            throw new Error('No celestial data received');
        }
        
        renderCelestialObjects(data);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('celestial-bodies').innerHTML = `
            <div class="error-message">
                <h2>Error loading celestial data</h2>
                <p>${error.message}</p>
                <button onclick="retryFetch()">Retry</button>
            </div>
        `;
    }
}

function renderCelestialObjects(data) {
    const bodiesHtml = Object.values(data).map(object => `
        <div class="body-card ${object.visibility.isVisible ? 'visible' : 'not-visible'}">
            <div class="visibility-indicator ${object.visibility.isVisible ? 'visible' : 'not-visible'}">
                ${object.visibility.isVisible ? 'Visible' : 'Not Visible'}
            </div>
            <h2>${object.name}</h2>
            <p class="body-type">${object.type}</p>
            ${renderBaseData(object.base_data)}
            <p class="visibility-message">${object.visibility.message}</p>
            ${renderCurrentPosition(object)}
            <div class="daily-path-chart">
                ${renderDailyPathChart(object.daily_path)}
            </div>
        </div>
    `).join('');
    
    document.getElementById('celestial-bodies').innerHTML = bodiesHtml;
}

function renderBaseData(baseData) {
    if (!baseData) return '';
    const details = [];
    
    if (baseData.magnitude !== null && baseData.magnitude !== undefined) {
        details.push(`<p>Magnitude: ${baseData.magnitude.toFixed(1)}</p>`);
    }
    if (baseData.constellation) {
        details.push(`<p>Constellation: ${baseData.constellation}</p>`);
    }
    
    return details.length ? `
        <div class="base-data">
            ${details.join('')}
        </div>
    ` : '';
}

function renderCurrentPosition(object) {
    const currentTime = new Date();
    const currentPosition = object.daily_path.find(pos => 
        new Date(pos.time) > currentTime
    ) || object.daily_path[0];

    if (!currentPosition) return '';

    return `
        <div class="current-position">
            <h3>Current Position</h3>
            <p>
                <strong>Altitude:</strong> ${currentPosition.altitude.toFixed(1)}° | 
                <strong>Azimuth:</strong> ${currentPosition.azimuth.toFixed(1)}°
            </p>
            ${renderCompassDirection(currentPosition.azimuth)}
        </div>
    `;
}

function renderCompassDirection(azimuth) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((azimuth %= 360) < 0 ? azimuth + 360 : azimuth) / 45) % 8;
    return `<p><strong>Direction:</strong> ${directions[index]}</p>`;
}

function renderDailyPathChart(dailyPath) {
    const nextPositions = dailyPath.slice(0, 5);
    return `
        <div class="upcoming-positions">
            <h3>Upcoming Positions</h3>
            ${nextPositions.map(pos => `
                <p>
                    <strong>${new Date(pos.time).toLocaleTimeString()}</strong>: 
                    Alt ${pos.altitude.toFixed(1)}° | 
                    Az ${pos.azimuth.toFixed(1)}°
                </p>
            `).join('')}
        </div>
    `;
}

function retryFetch() {
    document.getElementById('celestial-bodies').innerHTML = '<p>Retrying...</p>';
    fetchData();
}

window.retryFetch = retryFetch;

// Initial load
document.addEventListener('DOMContentLoaded', fetchData);

// Update every minute
const updateInterval = setInterval(fetchData, 60000);

// Clean up interval on page unload
window.addEventListener('unload', () => {
    clearInterval(updateInterval);
});