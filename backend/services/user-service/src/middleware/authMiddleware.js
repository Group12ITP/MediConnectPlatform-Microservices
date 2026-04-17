const jwt = require('jsonwebtoken');

/**
 * protect — verify the Bearer JWT and attach decoded payload to req.doctor.
 *
 * We only verify the JWT *signature* here. The doctor's existence was already
 * confirmed at login. A DB lookup after token verification is unnecessary and
 * causes issues in a microservices setup.
 */
exports.protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.doctor = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.name, error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired — please log in again'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or malformed token'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.doctor || !roles.includes(req.doctor.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.doctor?.role}' is not authorized to access this route`
      });
    }
    next();
  };
};