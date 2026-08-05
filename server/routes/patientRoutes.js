const express = require('express');
const router = express.Router();
const { registerPatient, getPatientProfile } = require('../controllers/patientController');

router.post('/', registerPatient);
router.get('/:email', getPatientProfile);

module.exports = router;