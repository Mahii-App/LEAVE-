const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const sendEmail = require('../utils/sendEmail');
const httpStatus = require('../utils/httpStatus');
const messages = require('../utils/messages');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

exports.signup = async (data) => {
  const { name, email, password } = data;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw { status: httpStatus.CONFLICT, message: messages.USER_EXISTS };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    leavesRemaining: 6, t
  });

  return user;
};

exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw { status: httpStatus.UNAUTHORIZED, message: messages.INVALID_CREDENTIALS };
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw { status: httpStatus.UNAUTHORIZED, message: messages.INVALID_CREDENTIALS };
  }

  const token = jwt.sign({ _id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return { token, user };
};

exports.sendOtp = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw { status: httpStatus.NOT_FOUND, message: messages.USER_NOT_FOUND };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redisClient.setEx(`otp:${email}`, 300, otp); 

  await sendEmail(email, 'Your OTP', `Your OTP is ${otp}`);
  return { message: messages.OTP_SENT };
};

exports.verifyOtp = async (email, otp) => {
  const storedOtp = await redisClient.get(`otp:${email}`);
  if (!storedOtp || storedOtp !== otp) {
    throw { status: httpStatus.UNAUTHORIZED, message: messages.INVALID_OTP };
  }

  await redisClient.del(`otp:${email}`);
  return { message: messages.OTP_VERIFIED };
};

exports.forgetPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw { status: httpStatus.NOT_FOUND, message: messages.USER_NOT_FOUND };
  }

  const token = crypto.randomBytes(32).toString('hex');
  await redisClient.setEx(`reset:${email}`, 600, token); 

  const resetLink = `https://your-frontend/reset-password?email=${email}&token=${token}`;
  await sendEmail(email, 'Reset Password', `Click to reset: ${resetLink}`);

  return { message: messages.PASSWORD_RESET_LINK_SENT };
};

exports.getProfile = async (userId) => {
  return await User.findById(userId).select('-password');
};

exports.updateProfile = async (userId, updateData) => {
  const { name, profilePic } = updateData;
  return await User.findByIdAndUpdate(
    userId,
    { $set: { name, profilePic } },
    { new: true, runValidators: true }
  ).select('-password');
};
