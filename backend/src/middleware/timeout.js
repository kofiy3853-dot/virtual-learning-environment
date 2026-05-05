// Request Timeout Middleware
// Automatically closes requests that exceed the timeout duration

const timeoutHandler = (timeoutMs = 30000) => (req, res, next) => {
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Request timeout - operation took too long',
      });
    }
  }, timeoutMs);

  // Clear timeout when response is sent
  res.on('finish', () => clearTimeout(timeoutId));
  res.on('close', () => clearTimeout(timeoutId));

  next();
};

module.exports = timeoutHandler;
