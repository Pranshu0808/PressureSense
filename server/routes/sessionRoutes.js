const express = require('express');
const router = express.Router();
const { saveSession, dispatchReport } = require('../controllers/sessionController');

router.post('/save', saveSession);
router.post('/send-report', dispatchReport);

module.exports = router;