const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'ප්‍රවේශයට අවසර නැත. කරුණාකර පිවිසෙන්න.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'මෙම පරිශීලකයා තවදුරටත් නොමැත.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'මෙම ගිණුම අක්‍රීය කර ඇත.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'ප්‍රවේශයට අවසර නැත. කරුණාකර නැවත පිවිසෙන්න.' });
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'මෙම ක්‍රියාව සඳහා ඔබට අවසර නැත.',
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
