const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  weightKg: { type: Number, required: true },
  heightCm: { type: Number, required: true },
  footType: { type: String, default: 'Neutral' },
  archHeight: { type: String, default: 'Medium' },
  dominantFoot: { type: String, default: 'Right' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', PatientSchema);