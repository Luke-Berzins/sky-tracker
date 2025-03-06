export function formatDegrees(value) {
    return `${value.toFixed(1)}°`;
}

export function formatTime(date) {
    return new Date(date).toLocaleTimeString();
}