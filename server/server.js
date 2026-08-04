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

// Real Hardware ESP32 WebSocket Connection Bridge
wss.on('connection', (ws) => {
  console.log('[WebSocket] Hardware Client/ESP32 Connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      // Broadcast ESP32 16-Sensor telemetry frame to all dashboard clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (e) {
      console.error('[WebSocket Error] Invalid Data');
    }
  });

  ws.on('close', () => console.log('[WebSocket] Client Disconnected'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[Pressure Padded Sole] Running on http://localhost:${PORT}`);
});