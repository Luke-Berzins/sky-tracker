// src/client/js/planet.js
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
            const response = await fetch('/api/celestial-data');
            if (!response.ok) {
                throw new Error(`Server error: ${await response.text()}`);
            }
            
            const data = await response.json();
            this.planetData = Object.values(data).find(
                obj => obj.name.toLowerCase() === planetName
            );

            if (!this.planetData) {
                throw new Error('Planet not found');
            }

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
        const visibilityHtml = `
            <div class="data-row">
                <span>Status</span>
                <span>${this.planetData.visibility.message}</span>
            </div>
            <div class="data-row">
                <span>Next Rise</span>
                <span>${this.planetData.visibility.next_rise || 'N/A'}</span>
            </div>
            <div class="data-row">
                <span>Next Set</span>
                <span>${this.planetData.visibility.next_set || 'N/A'}</span>
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