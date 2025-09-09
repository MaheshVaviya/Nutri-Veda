const express = require('express');
const PatientRegistrationController = require('../controllers/patientRegistrationController');

const router = express.Router();

// Step-by-Step Registration Endpoints
router.post('/register/step1', PatientRegistrationController.registerBasicInfo);
router.post('/register/step2', PatientRegistrationController.registerContactInfo);
router.post('/register/step3', PatientRegistrationController.registerHealthProfile);
router.post('/register/step4', PatientRegistrationController.registerHealthMetrics);
router.post('/register/step5', PatientRegistrationController.registerLifestyle);
router.post('/register/step6', PatientRegistrationController.completeRegistration);

// Registration Helper Endpoints
router.get('/register/guide', PatientRegistrationController.getRegistrationGuide);

module.exports = router;
