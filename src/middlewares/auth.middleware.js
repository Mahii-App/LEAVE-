const jwt = require('jsonwebtoken');
const httpStatus = require('../utils/httpStatus');
const messages = require('../utils/messages');
const User = require('../models/user.model');


const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: messages.UNAUTHORIZED });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: messages.UNAUTHORIZED });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(httpStatus.UNAUTHORIZED).json({ message: messages.UNAUTHORIZED });
  }
};

module.exports = auth;
