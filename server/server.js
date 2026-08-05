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

// =======================
// Middleware
// =======================
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// =======================
// MongoDB Connection
// =======================
(async () => {
  try {
    console.log("[Server] Connecting to MongoDB...");
    await connectDB();
    console.log("[Server] MongoDB Connected Successfully");
  } catch (err) {
    console.error("[Server] MongoDB Connection Failed:", err);
  }
})();

// =======================
// Routes
// =======================
app.use('/api/patients', patientRoutes);
app.use('/api/sessions', sessionRoutes);

// =======================
// Frontend
// =======================
app.use(express.static(path.join(__dirname, '../client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// =======================
// ESP32 HTTP API
// =======================
app.post('/api/data', (req, res) => {
  try {
    const payload = req.body;

    if (!payload || !payload.pressure_data || !Array.isArray(payload.pressure_data)) {
      return res.status(400).json({
        error: 'Invalid payload format'
      });
    }

    const unpackedData = payload.pressure_data.map(packedValue => {

      const side = (packedValue >> 16) & 0x03;
      const sensorId = (packedValue >> 12) & 0x0F;
      const sensorValue = packedValue & 0x0FFF;

      return {
        side,
        sensorId,
        sensorValue
      };
    });

    console.log("[ESP32]", unpackedData);

    const broadcastPayload = JSON.stringify({
      pressure_data: unpackedData
    });

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(broadcastPayload);
      }
    });

    res.status(200).json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Internal Server Error"
    });
  }
});

// =======================
// WebSocket
// =======================
wss.on('connection', ws => {

  console.log("[WebSocket] Client Connected");

  ws.on('close', () => {
    console.log("[WebSocket] Client Disconnected");
  });

});

// =======================
// Start Server
// =======================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

  console.log(`======================================`);
  console.log(`Pressure Padded Sole Backend Running`);
  console.log(`Port : ${PORT}`);
  console.log(`======================================`);

});
