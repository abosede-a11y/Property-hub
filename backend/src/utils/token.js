const jwt = require('jsonwebtoken');

function signAuthToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { signAuthToken };
