const jwt = require('jsonwebtoken');

const JWT_SECRET = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'change-me-to-a-strong-random-secret-in-production') {
    throw new Error(
      'JWT_SECRET is not set. Refusing to verify tokens with a missing or default secret.'
    );
  }
  return secret;
};

/**
 * Verify a JWT access token and return the decoded payload.
 * Returns null on failure.
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET());
  } catch {
    return null;
  }
}

/**
 * Socket.io middleware that authenticates incoming connections
 * via the `auth.token` handshake field.
 */
function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new Error('Invalid or expired token'));
  }

  socket.user = decoded;
  next();
}

/**
 * Optional auth -- attaches user if token present, continues either way.
 */
function socketOptionalAuth(socket, next) {
  const token = socket.handshake.auth?.token;
  if (token) {
    socket.user = verifyToken(token);
  }
  next();
}

module.exports = { verifyToken, socketAuthMiddleware, socketOptionalAuth };
