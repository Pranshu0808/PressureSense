const Patient = require('../models/Patient');

exports.registerPatient = async (req, res) => {
  try {
    const { name, email, age, gender, weightKg, heightCm } = req.body;
    let patient = await Patient.findOne({ email });

    if (patient) {
      patient.name = name;
      patient.age = age;
      patient.gender = gender;
      patient.weightKg = weightKg;
      patient.heightCm = heightCm;
      await patient.save();
    } else {
      const patientId = `PSA-${Math.floor(1000 + Math.random() * 9000)}`;
      patient = new Patient({ patientId, name, email, age, gender, weightKg, heightCm });
      await patient.save();
    }

    res.status(200).json({ success: true, data: patient });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ email: req.params.email });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.status(200).json({ success: true, data: patient });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};