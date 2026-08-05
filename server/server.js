const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const patientRoutes = require('./routes/patientRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

//connectDB();

app.use('/api/patients', patientRoutes);
app.use('/api/sessions', sessionRoutes);

app.use(express.static(path.join(__dirname, '../client')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// POST Endpoint to receive data from ESP32 via HTTP POST
app.post('/api/data', (req, res) => {
  try {
    const payload = req.body;

    if (!payload || !payload.pressure_data || !Array.isArray(payload.pressure_data)) {
      return res.status(400).json({ error: 'Invalid payload format' });
    }

    // Unpack the 32-bit integers received from ESP32
    const unpackedData = payload.pressure_data.map(packedValue => {
      const side = (packedValue >> 16) & 0x03;
      const sensorId = (packedValue >> 12) & 0x0F;
      const sensorValue = packedValue & 0x0FFF;

      return { side, sensorId, sensorValue };
    });

    // 1. Print to console for debugging
    console.log('[POST /api/data] Unpacked Data Received:', unpackedData);

    // 2. Broadcast the unpacked data to all connected frontend WebSocket clients
    const broadcastPayload = JSON.stringify({ pressure_data: unpackedData });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(broadcastPayload);
      }
    });

    // Send successful response to ESP32
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[POST /api/data Error]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// WebSocket Connection Bridge (for Frontend Clients)
wss.on('connection', (ws) => {
  console.log('[WebSocket] Frontend Client Connected');

  ws.on('close', () => console.log('[WebSocket] Frontend Client Disconnected'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[Pressure Padded Sole] Running on http://localhost:${PORT}`);
});