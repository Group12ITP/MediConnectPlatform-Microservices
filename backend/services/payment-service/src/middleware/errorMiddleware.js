const errorMiddleware = (err, _req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(err);

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorMiddleware;

