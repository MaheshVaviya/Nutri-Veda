const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthMiddleware {
  static generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRE || '7d',
        issuer: 'nutriveda',
        audience: 'nutriveda-users'
      }
    );
  }

  static generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
      { 
        expiresIn: '30d',
        issuer: 'nutriveda',
        audience: 'nutriveda-refresh'
      }
    );
  }

  static async verifyToken(req, res, next) {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '') || 
                   req.header('x-auth-token');

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user details
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token or user deactivated.'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired.',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
  }

  static checkRole(allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      const userRole = req.user.role;
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
        });
      }

      next();
    };
  }

  static optionalAuth(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      User.findById(decoded.id).then(user => {
        req.user = user && user.isActive ? user : null;
        next();
      }).catch(() => {
        req.user = null;
        next();
      });
    } catch (error) {
      req.user = null;
      next();
    }
  }
}

module.exports = AuthMiddleware;