// src/client/js/utils/coordinates.js
function getCompassDirection(azimuth) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((azimuth %= 360) < 0 ? azimuth + 360 : azimuth) / 45) % 8;
    return directions[index];
}

// Make it available globally
window.getCompassDirection = getCompassDirection;