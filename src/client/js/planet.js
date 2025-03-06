//planet.js
import { renderPlanetPath } from './visualization/celestialObjects.js';

// Helper function for compass direction
function getCompassDirection(azimuth) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((azimuth %= 360) < 0 ? azimuth + 360 : azimuth) / 45) % 8;
    return directions[index];
}
class PlanetDetailPage {
    constructor() {
        this.planetData = null;
        this.updateInterval = null;
        this.init();
    }

    async init() {
        await this.loadPlanetData();
        this.setupEventListeners();
        this.startAutoUpdate();
    }

    startAutoUpdate() {
        // Update data every minute
        this.updateInterval = setInterval(() => this.loadPlanetData(), 60000);
    }

    async loadPlanetData() {
        try {
            const planetName = window.location.pathname.split('/').pop();
            const response = await fetch(`/planet/${planetName}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 404) {
                    throw new Error(`Planet not found. ${errorText}`);
                }
                throw new Error(`Server error: ${errorText}`);
            }
            
            this.planetData = await response.json();
            this.updateUI();
        } catch (error) {
            this.handleError(error);
        }
    }

    updateUI() {
        document.title = `${this.planetData.name} - Sky Tracker`;
        this.updatePlanetInfo();
        this.updatePositionData();
        this.updateVisibilityData();
        this.renderPath();
    }

    updatePlanetInfo() {
        document.getElementById('planetName').textContent = this.planetData.name;
        
        const planetIcon = document.getElementById('planetIcon');
        planetIcon.style.color = this.getPlanetColor(this.planetData.name.toLowerCase());

        const visibilityStatus = document.getElementById('visibilityStatus');
        visibilityStatus.className = `visibility-status ${
            this.planetData.visibility.isVisible ? 'visible' : 'not-visible'
        }`;
        visibilityStatus.innerHTML = `
            ${this.planetData.visibility.isVisible ? '●' : '○'}
            ${this.planetData.visibility.isVisible ? 'Currently Visible' : 'Not Currently Visible'}
        `;

        // Add constellation information if available
        if (this.planetData.base_data.constellation) {
            const constellationElement = document.getElementById('constellation');
            if (constellationElement) {
                constellationElement.textContent = this.planetData.base_data.constellation;
            }
        }

        // Add magnitude information if available
        if (this.planetData.base_data.magnitude !== null) {
            const magnitudeElement = document.getElementById('magnitude');
            if (magnitudeElement) {
                magnitudeElement.textContent = this.planetData.base_data.magnitude.toFixed(1);
            }
        }
    }

    updatePositionData() {
        const currentPosition = this.planetData.daily_path[0];
        if (!currentPosition) return;

        const timeStr = new Date(currentPosition.time).toLocaleTimeString();
        
        const positionHtml = `
            <div class="data-row">
                <span>Time</span>
                <span>${timeStr}</span>
            </div>
            <div class="data-row">
                <span>Altitude</span>
                <span>${currentPosition.altitude.toFixed(1)}°</span>
            </div>
            <div class="data-row">
                <span>Azimuth</span>
                <span>${currentPosition.azimuth.toFixed(1)}°</span>
            </div>
            <div class="data-row">
                <span>Direction</span>
                <span>${getCompassDirection(currentPosition.azimuth)}</span>
            </div>
        `;
        
        document.getElementById('positionData').innerHTML = positionHtml;
    }

    updateVisibilityData() {
        // Split the visibility message into lines
        const messageLines = this.planetData.visibility.message.split('\n');
        const status = messageLines[0];
        const nextRise = messageLines.find(line => line.startsWith('Next rise:'));
        const nextSet = messageLines.find(line => line.startsWith('Next set:'));

        const visibilityHtml = `
            <div class="data-row">
                <span>Status</span>
                <span>${status}</span>
            </div>
            <div class="data-row">
                <span>Next Rise</span>
                <span>${nextRise ? nextRise.replace('Next rise: ', '') : 'N/A'}</span>
            </div>
            <div class="data-row">
                <span>Next Set</span>
                <span>${nextSet ? nextSet.replace('Next set: ', '') : 'N/A'}</span>
            </div>
        `;
        
        document.getElementById('visibilityData').innerHTML = visibilityHtml;
    }

    renderPath() {
        const container = document.getElementById('pathVisualization');
        renderPlanetPath(container, this.planetData.daily_path);
    }

    getPlanetColor(planetName) {
        const colors = {
            mercury: '#c0c0c0',
            venus: '#ffd700',
            mars: '#ff4500',
            jupiter: '#ffa500',
            saturn: '#daa520',
            uranus: '#00ffff',
            neptune: '#0000ff'
        };
        return colors[planetName] || '#ffffff';
    }

    handleError(error) {
        console.error('Error:', error);
        document.body.innerHTML = `
            <div class="error-message">
                <h2>Error loading planet data</h2>
                <p>${error.message}</p>
                <a href="/" class="nav-button">Return to Sky View</a>
            </div>
        `;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            if (this.planetData) {
                this.renderPath();
            }
        });
    }

    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Initialize the page
let planetPage;
document.addEventListener('DOMContentLoaded', () => {
    planetPage = new PlanetDetailPage();
});

// Cleanup when leaving the page
window.addEventListener('beforeunload', () => {
    if (planetPage) {
        planetPage.cleanup();
    }
});