// src/server/routes/api.js
import express from 'express';
import axios from 'axios';

const router = express.Router();
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

router.get('/celestial-data', async (req, res) => {
    try {
        const [dailyResponse, realtimeResponse] = await Promise.all([
            axios.get(`${PYTHON_SERVICE_URL}/daily_positions`),
            axios.get(`${PYTHON_SERVICE_URL}/realtime-positions`)
        ]);

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

        res.json(dailyData);
    } catch (error) {
        console.error('API Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch celestial data',
            details: error.message
        });
    }
});

export default router;