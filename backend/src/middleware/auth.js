const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Method 1: Bearer token in Authorization header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Method 2: HttpOnly cookie (set by sendTokenResponse)
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (decoded.isImpersonation) {
      req.user.isImpersonation = true;
      req.user.impersonatedBy = decoded.impersonatedBy;
    }

    if (req.user.status === 'suspended') {
      return res.status(401).json({
        success: false,
        message: 'Your account has been suspended. Contact admin.'
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Normalize role to lowercase and trim whitespace for comparison
    const userRole = req.user.role?.toLowerCase().trim();
    const normalizedRoles = roles.map(r => r.toLowerCase().trim());
    
    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This resource requires ${roles.join(' or ')} role.`,
        requiredRoles: roles,
        userRole: req.user.role
      });
    }
    next();
  };
};
