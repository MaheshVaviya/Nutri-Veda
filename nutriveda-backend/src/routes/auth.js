const express = require('express');
const AuthController = require('../controllers/authController');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

// Auth info endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authentication API',
    endpoints: {
      register: 'POST /api/v1/auth/register',
      login: 'POST /api/v1/auth/login',
      profile: 'GET /api/v1/auth/profile (requires token)',
      updateProfile: 'PUT /api/v1/auth/profile (requires token)',
      changePassword: 'POST /api/v1/auth/change-password (requires token)'
    }
  });
});

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