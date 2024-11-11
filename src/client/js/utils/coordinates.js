
// src/client/js/utils/coordinates.js
export function getCompassDirection(azimuth) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((azimuth %= 360) < 0 ? azimuth + 360 : azimuth) / 45) % 8;
    return directions[index];
}

export function positionObject(altitude, azimuth) {
    const normalizedAzimuth = ((azimuth + 360) % 360);
    if (normalizedAzimuth <= 90 || normalizedAzimuth >= 270) {
        if (normalizedAzimuth >= 270) {
            // Convert 270-360 to -90-0 degrees
            x = ((normalizedAzimuth - 360) + 90) / 180;
        } else {
            // Convert 0-90 to 0-90 degrees
            x = azimuth / 180;
        }
        const y = 1 - ((altitude + 90) / 180);
        return { x, y };
    }
    return null;
}