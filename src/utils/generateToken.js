
const jwt = require('jsonwebtoken');

const generateToken = (user, expiresIn = process.env.JWT_EXPIRES_IN) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

module.exports = generateToken;
