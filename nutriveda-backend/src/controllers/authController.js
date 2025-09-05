const User = require('../models/User');
const AuthMiddleware = require('../middleware/auth');
const { validationResult, body } = require('express-validator');

class AuthController {
  static registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('role').optional().isIn(['dietitian', 'admin', 'assistant']).withMessage('Invalid role')
  ];

  static loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ];

  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const user = await User.create(req.body);
      
      // Remove password from response
      const { password, ...userResponse } = user;
      
      // Generate tokens
      const token = AuthMiddleware.generateToken(user);
      const refreshToken = AuthMiddleware.generateRefreshToken(user);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          tokens: {
            accessToken: token,
            refreshToken: refreshToken,
            expiresIn: '7d'
          }
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
      }

      // Validate password
      const isValidPassword = await User.validatePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate tokens
      const token = AuthMiddleware.generateToken(user);
      const refreshToken = AuthMiddleware.generateRefreshToken(user);

      // Remove password from response
      const { password: pwd, ...userResponse } = user;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          tokens: {
            accessToken: token,
            refreshToken: refreshToken,
            expiresIn: '7d'
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = req.user;
      const { password, ...userProfile } = user;

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: userProfile
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updateData.password;
      delete updateData.email;
      delete updateData.role;

      const updatedUser = await User.update(userId, updateData);
      const { password, ...userResponse } = updatedUser;

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: userResponse
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }

      // Validate current password
      const user = await User.findById(userId);
      const isValidPassword = await User.validatePassword(currentPassword, user.password);
      
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      await User.updatePassword(userId, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async logout(req, res) {
    // In a production app, you might want to blacklist the token
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}

module.exports = AuthController;