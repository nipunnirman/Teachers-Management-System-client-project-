const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'සේවාදායක දෝෂයක් ඇති විය.';

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = field === 'email' ? 'මෙම ඊමේල් ලිපිනය දැනටමත් භාවිතයේ ඇත.' : 'මෙම තොරතුර දැනටමත් පවතී.';
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map((e) => e.message).join(', ');
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'ප්‍රවේශ යතුර වලංගු නැත.';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'සැසිය කල් ඉකුත් වී ඇත. කරුණාකර නැවත පිවිසෙන්න.';
    statusCode = 401;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    message = 'අදාළ තොරතුර හමු නොවීය.';
    statusCode = 404;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
