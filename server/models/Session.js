const mongoose = require('mongoose');

const SensorFrameSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  leftFoot: [{ sensorId: String, value: Number }],
  rightFoot: [{ sensorId: String, value: Number }],
  copX: Number,
  copY: Number
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  patientId: { type: String, required: true },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  durationSeconds: Number,
  stepCount: Number,
  metrics: {
    avgPressureKpa: Number,
    peakPressureKpa: Number,
    footHealthScore: Number,
    symmetryScore: Number,
    stabilityScore: Number,
    riskLevel: String,
    currentPhase: String
  },
  practitionerNotes: String,
  frames: [SensorFrameSchema]
});

module.exports = mongoose.model('Session', SessionSchema);