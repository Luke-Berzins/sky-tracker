// src/server/app.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, '../client/public')));
app.use('/js', express.static(path.join(__dirname, '../client/js')));
app.use('/css', express.static(path.join(__dirname, '../client/css')));
app.use('/assets', express.static(path.join(__dirname, '../client/assets')));

// API routes
app.use('/api', apiRoutes);

// Page routes
app.get('/data', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/data.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// Planet detail view
router.get('/planet/:name', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/public/planet.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});