const express = require('express');
const PatientController = require('../controllers/patientController');

const router = express.Router();

router.get('/', PatientController.getAllPatients);
router.post('/', PatientController.createPatient);
router.get('/:id', PatientController.getPatientById);
router.put('/:id', PatientController.updatePatient);

module.exports = router;