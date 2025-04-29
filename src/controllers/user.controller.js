const User = require('../models/user.model');
const generateToken = require('../utils/generateToken');
const generateOtp = require('../utils/otp');
const httpStatus = require('../utils/httpStatus');
const messages = require('../utils/messages');
const nodemailer = require('nodemailer');
const transport = require('../config/nodemailer');
const logger = require('../utils/logger');
const redis = require('../config/redis');

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });

    if (existing) {
      logger.warn(`Signup attempt with existing email: ${email}`);
      return res.status(httpStatus.CONFLICT).json({ message: 'Email already exists' });
    }

    const user = new User({ name, email, password });
    await user.save();

    logger.info(`User created successfully: ${email}`);
    res.status(httpStatus.CREATED).json({ message: messages.USER_CREATED });
  } catch (error) {
    logger.error(`Error during signup for email: ${req.body.email}`, { error: error.message });
    res.status(httpStatus.SERVER_ERROR).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      logger.warn(`Invalid login attempt for email: ${email}`);
      return res.status(httpStatus.BAD_REQUEST).json({ message: messages.INVALID_CREDENTIALS });
    }

    const token = generateToken(user);
    logger.info(`User logged in successfully: ${email}`);
    res.status(httpStatus.OK).json({ token, message: messages.LOGIN_SUCCESS });
  } catch (error) {
    logger.error(`Error during login for email: ${req.body.email}`, { error: error.message });
    res.status(httpStatus.SERVER_ERROR).json({ message: error.message });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const { otp } = generateOtp(); 

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`OTP requested for non-existent email: ${email}`);
      return res.status(httpStatus.NOT_FOUND).json({ message: messages.USER_NOT_FOUND });
    }

    await redis.set(`otp:${email}`, otp, { EX: 300 }); 

    await transport.sendMail({
      to: user.email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
    });

    logger.info(`OTP sent to ${email}`);
    res.status(httpStatus.OK).json({ message: messages.OTP_SENT });
  } catch (error) {
    logger.error(`Error sending OTP to ${req.body.email}`, { error: error.message });
    res.status(httpStatus.SERVER_ERROR).json({ message: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`OTP verification attempted for non-existent email: ${email}`);
      return res.status(httpStatus.NOT_FOUND).json({ message: messages.USER_NOT_FOUND });
    }

    const storedOtp = await redis.get(`otp:${email}`);
    if (!storedOtp) {
      logger.warn(`OTP expired for email: ${email}`);
      return res.status(httpStatus.BAD_REQUEST).json({ message: messages.OTP_EXPIRED });
    }

    if (storedOtp !== otp) {
      logger.warn(`Invalid OTP provided for email: ${email}`);
      return res.status(httpStatus.BAD_REQUEST).json({ message: 'Invalid OTP' });
    }

    user.isVerified = true;
    await user.save();
    await redis.del(`otp:${email}`);

    logger.info(`OTP verified for ${email}`);
    res.status(httpStatus.OK).json({ message: messages.OTP_VERIFIED });
  } catch (error) {
    logger.error(`Error verifying OTP for email: ${req.body.email}`, { error: error.message });
    res.status(httpStatus.SERVER_ERROR).json({ message: error.message });
  }
};

exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return res.status(httpStatus.NOT_FOUND).json({ message: 'User not found' });
    }

    const resetToken = generateToken(user, '1h');
    const resetLink = `http://localhost:5000/users/api/v1/reset-password?token=${resetToken}`;

    const mailOptions = {
      to: user.email,
      subject: 'Password Reset',
      text: `Click the link to reset your password: ${resetLink}`,
    };

    await transport.sendMail(mailOptions);

    logger.info(`Password reset email sent to ${email}`);
    res.status(httpStatus.OK).json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    logger.error(`Error sending password reset email to ${req.body.email}`, { error: error.message });
    res.status(httpStatus.SERVER_ERROR).json({
      message: 'An error occurred while sending the reset email',
      error: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { name } = req.body;

    if (name) user.name = name;
    if (req.file) user.profilePic = req.file.path;

    await user.save();

    logger.info(`Profile updated for user: ${user.email}`);
    res.status(httpStatus.OK).json({ message: 'Profile updated successfully' });
  } catch (error) {
    logger.error(`Error updating profile for user: ${req.user.email}`, { error: error.message });
    res.status(httpStatus.SERVER_ERROR).json({ message: error.message });
  }
};

exports.getProfile = (req, res) => {
  try {
    const user = req.user;
    logger.info(`Profile retrieved for user: ${user.email}`);
    res.status(httpStatus.OK).json({ user });
  } catch (error) {
    logger.error(`Error retrieving profile for user: ${req.user.email}`, { error: error.message });
    res.status(httpStatus.SERVER_ERROR).json({ message: error.message });
  }
};