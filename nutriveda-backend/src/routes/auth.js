const express = require('express');
const AuthController = require('../controllers/authController');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', AuthController.registerValidation, AuthController.register);
router.post('/login', AuthController.loginValidation, AuthController.login);

// Protected routes
router.use(AuthMiddleware.verifyToken);
router.get('/profile', AuthController.getProfile);
router.put('/profile', AuthController.updateProfile);
router.post('/change-password', AuthController.changePassword);
router.post('/logout', AuthController.logout);

module.exports = router;