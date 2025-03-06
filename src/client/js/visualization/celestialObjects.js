// src/client/js/visualization/celestialObjects.js

// Helper function for compass direction
function getCompassDirection(azimuth) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((azimuth %= 360) < 0 ? azimuth + 360 : azimuth) / 45) % 8;
    return directions[index];
}

// Map to store object elements for interaction
const objectElementsMap = new Map();

/**
 * Renders a celestial object with optimized performance
 * @param {HTMLElement} container - The container element
 * @param {Object} object - Celestial object data
 * @param {Function} onClick - Optional click handler
 * @returns {HTMLElement} - The created element
 */
export function renderCelestialObject(container, object, onClick = null) {
    const currentPosition = object.daily_path[0];
    if (!currentPosition) return null;

    const objectEl = document.createElement('div');
    objectEl.className = `celestial-object ${object.type.toLowerCase()} ${object.name.toLowerCase()}`;
    objectEl.dataset.name = object.name;
    
    const altitude = currentPosition.altitude;
    const azimuth = currentPosition.azimuth;
    
    objectEl.style.left = `${(azimuth / 360) * 100}%`;
    objectEl.style.top = `${80 - ((altitude / 90) * 80)}%`;

    if (onClick) {
        objectEl.style.cursor = 'pointer';
        objectEl.addEventListener('click', onClick);
    }

    // Create tooltip but keep it hidden initially for better performance
    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'object-tooltip';
    tooltipEl.style.display = 'none'; // Hide by default
    
    // Only populate tooltip content when needed
    objectEl.addEventListener('mouseenter', () => {
        if (!tooltipEl.innerHTML) {
            tooltipEl.innerHTML = `
                <h3>${object.name}</h3>
                <div class="tooltip-content">
                    <p>${object.visibility.message}</p>
                    <p>Altitude: ${altitude.toFixed(1)}°</p>
                    <p>Azimuth: ${azimuth.toFixed(1)}° (${getCompassDirection(azimuth)})</p>
                    ${onClick ? '<p class="click-hint">Click for details →</p>' : ''}
                </div>
            `;
        }
        tooltipEl.style.display = 'block';
    });
    
    objectEl.addEventListener('mouseleave', () => {
        tooltipEl.style.display = 'none';
    });
    
    objectEl.appendChild(tooltipEl);
    
    // Store reference for later interaction
    objectElementsMap.set(object.name, objectEl);
    
    return objectEl;
}

/**
 * Render all celestial objects using canvas for better performance
 * @param {HTMLElement} container - The container element
 * @param {Object} objectsData - The celestial objects data
 * @param {Function} onObjectClick - Click handler for objects
 */
export function renderAllCelestialObjects(container, objectsData, onObjectClick = null) {
    if (!container || !objectsData) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create canvas for better performance
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvas.className = 'celestial-canvas';
    
    // Create overlay for interactive elements
    const interactiveOverlay = document.createElement('div');
    interactiveOverlay.className = 'interactive-overlay';
    interactiveOverlay.style.position = 'absolute';
    interactiveOverlay.style.top = '0';
    interactiveOverlay.style.left = '0';
    interactiveOverlay.style.width = '100%';
    interactiveOverlay.style.height = '100%';
    interactiveOverlay.style.pointerEvents = 'none'; // Allow clicks to pass through by default
    
    // Add horizon line
    const horizonLine = document.createElement('div');
    horizonLine.className = 'horizon-line';
    horizonLine.style.top = '80%';
    
    // Append elements
    container.appendChild(canvas);
    container.appendChild(interactiveOverlay);
    container.appendChild(horizonLine);
    
    // Get canvas context
    const ctx = canvas.getContext('2d');
    
    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Map of object colors for consistent rendering
    const objectColors = {
        'planet': '#ffd700',
        'moon': '#f5f5f5',
        'sun': '#ffcc00',
        'star': '#ffffff'
    };
    
    // Draw each object
    Object.values(objectsData).forEach(object => {
        if (!object.daily_path || !object.daily_path.length) return;
        
        const currentPosition = object.daily_path[0];
        if (!currentPosition) return;
        
        const x = (currentPosition.azimuth / 360) * canvas.width;
        const y = canvas.height * (0.8 - (currentPosition.altitude / 90) * 0.8);
        
        const objectType = object.type.toLowerCase();
        const color = objectColors[objectType] || '#ffffff';
        
        // Different rendering based on object type
        const size = objectType === 'planet' ? 4 : 
                    objectType === 'moon' ? 8 : 
                    objectType === 'sun' ? 10 : 3;
        
        // Draw object
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Add glow effect for celestial objects
        const gradient = ctx.createRadialGradient(x, y, size, x, y, size * 3);
        gradient.addColorStop(0, `${color}80`); // Semi-transparent
        gradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(x, y, size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add clickable area for interactive objects
        if (onObjectClick) {
            const hitArea = document.createElement('div');
            hitArea.className = 'object-hit-area';
            hitArea.dataset.name = object.name;
            hitArea.style.position = 'absolute';
            hitArea.style.left = `${x - size * 4}px`;
            hitArea.style.top = `${y - size * 4}px`;
            hitArea.style.width = `${size * 8}px`;
            hitArea.style.height = `${size * 8}px`;
            hitArea.style.borderRadius = '50%';
            hitArea.style.cursor = 'pointer';
            hitArea.style.pointerEvents = 'auto';
            
            hitArea.addEventListener('click', () => onObjectClick(object));
            
            // Create tooltip element
            const tooltipEl = document.createElement('div');
            tooltipEl.className = 'object-tooltip';
            tooltipEl.style.display = 'none';
            
            // Add tooltip behavior
            hitArea.addEventListener('mouseenter', () => {
                if (!tooltipEl.innerHTML) {
                    tooltipEl.innerHTML = `
                        <h3>${object.name}</h3>
                        <div class="tooltip-content">
                            <p>${object.visibility.message}</p>
                            <p>Altitude: ${currentPosition.altitude.toFixed(1)}°</p>
                            <p>Azimuth: ${currentPosition.azimuth.toFixed(1)}° (${getCompassDirection(currentPosition.azimuth)})</p>
                            <p class="click-hint">Click for details →</p>
                        </div>
                    `;
                }
                tooltipEl.style.display = 'block';
            });
            
            hitArea.addEventListener('mouseleave', () => {
                tooltipEl.style.display = 'none';
            });
            
            hitArea.appendChild(tooltipEl);
            interactiveOverlay.appendChild(hitArea);
            
            // Store reference in map
            objectElementsMap.set(object.name, hitArea);
        }
    });
    
    return canvas;
}

/**
 * Renders a planet's path with optimization
 * @param {HTMLElement} container - The container element
 * @param {Array} pathData - The path data points
 * @returns {HTMLCanvasElement} - The canvas element
 */
export function renderPlanetPath(container, pathData) {
    if (!container || !pathData?.length) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    container.innerHTML = '';
    container.appendChild(canvas);

    // Plot the path
    ctx.beginPath();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;

    // Optimize by only plotting points that show significant change
    let lastX = null;
    let lastY = null;
    const minDistance = 3; // Minimum distance between points to render
    
    pathData.forEach((point, index) => {
        const x = (point.azimuth / 360) * canvas.width;
        const y = canvas.height - ((point.altitude / 90) * canvas.height);
        
        // Only plot points that are a meaningful distance from previous point
        if (index === 0) {
            ctx.moveTo(x, y);
            lastX = x;
            lastY = y;
        } else {
            const distance = Math.sqrt(Math.pow(x - lastX, 2) + Math.pow(y - lastY, 2));
            if (distance >= minDistance) {
                ctx.lineTo(x, y);
                lastX = x;
                lastY = y;
            }
        }
    });
    
    ctx.stroke();

    // Add current position marker
    const current = pathData[0];
    if (current) {
        const x = (current.azimuth / 360) * canvas.width;
        const y = canvas.height - ((current.altitude / 90) * canvas.height);
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.fill();
    }
    
    return canvas;
}