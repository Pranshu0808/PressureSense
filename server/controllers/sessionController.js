const Session = require('../models/Session');
const { sendTelemetryReport } = require('../utils/mailer');

exports.saveSession = async (req, res) => {
  try {
    const session = new Session(req.body);
    await session.save();
    res.status(201).json({ success: true, sessionId: session.sessionId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.dispatchReport = async (req, res) => {
  try {
    const { email, patientName, sessionId, avgPressure, peakPressure, footHealth, symmetry, notes } = req.body;
    await sendTelemetryReport(email, patientName, { sessionId, avgPressure, peakPressure, footHealth, symmetry, notes });
    res.status(200).json({ success: true, message: 'Telemetry report sent to mobile inbox' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};