// src/client/js/visualization/celestialObjects.js
export function renderCelestialObject(container, object, onClick = null) {
    const currentPosition = object.daily_path[0];
    if (!currentPosition) return null;

    const objectEl = document.createElement('div');
    objectEl.className = `celestial-object ${object.type.toLowerCase()} ${object.name.toLowerCase()}`;
    
    const altitude = currentPosition.altitude;
    const azimuth = currentPosition.azimuth;
    
    objectEl.style.left = `${(azimuth / 360) * 100}%`;
    objectEl.style.top = `${80 - ((altitude / 90) * 80)}%`;

    if (onClick) {
        objectEl.style.cursor = 'pointer';
        objectEl.addEventListener('click', onClick);
    }

    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'object-tooltip';
    tooltipEl.innerHTML = `
        <h3>${object.name}</h3>
        <div class="tooltip-content">
            <p>${object.visibility.message}</p>
            <p>Altitude: ${altitude.toFixed(1)}°</p>
            <p>Azimuth: ${azimuth.toFixed(1)}° (${getCompassDirection(azimuth)})</p>
            ${onClick ? '<p class="click-hint">Click for details →</p>' : ''}
        </div>
    `;
    objectEl.appendChild(tooltipEl);
    
    return objectEl;
}

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

    pathData.forEach((point, index) => {
        const x = (point.azimuth / 360) * canvas.width;
        const y = canvas.height - ((point.altitude / 90) * canvas.height);
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
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
}