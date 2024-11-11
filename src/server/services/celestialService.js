// src/server/services/celestialService.js
import axios from 'axios';
import { PYTHON_SERVICE_URL } from '../config/constants.js';

export async function fetchCelestialData() {
    try {
        const dailyResponse = await axios.get(`${PYTHON_SERVICE_URL}/daily_positions`);
        const realtimeResponse = await axios.get(`${PYTHON_SERVICE_URL}/realtime-positions`);
        
        const dailyData = dailyResponse.data;
        const realtimeData = realtimeResponse.data;

        // Merge realtime data
        Object.entries(realtimeData).forEach(([objectName, position]) => {
            if (dailyData[objectName]) {
                const currentPathIndex = dailyData[objectName].daily_path.findIndex(
                    pos => new Date(pos.time) > new Date()
                );
                if (currentPathIndex !== -1) {
                    dailyData[objectName].daily_path[currentPathIndex] = position;
                }
            }
        });

        return dailyData;
    } catch (error) {
        console.error('Error fetching celestial data:', error);
        throw error;
    }
}
