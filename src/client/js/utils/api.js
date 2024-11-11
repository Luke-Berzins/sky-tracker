// src/client/js/utils/api.js
export async function fetchCelestialData() {
    const response = await fetch('/api/celestial-data');
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Server error: ${errorData.details || errorData.error || 'Unknown error'}`);
    }
    const data = await response.json();
    if (!data || Object.keys(data).length === 0) {
        throw new Error('No celestial data received');
    }
    return data;
}
