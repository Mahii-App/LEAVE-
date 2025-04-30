const User = require('../models/user.model');
const generateToken = require('../utils/generateToken');
const generateOtp = require('../utils/otp');
const httpStatus = require('../utils/httpStatus');
const messages = require('../utils/messages');
const nodemailer = require('nodemailer');
const transport = require('../config/nodemailer');
const logger = require('../utils/logger');
const redis = require('../config/redis');
const userService = require('../services/user.service');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcrypt');
const { setDefaultAutoSelectFamily } = require('net');

exports.signup = async (req, res) => {
  try {
    const data = req.body;
    const user = await userService.signup(data); 
 
    logger.info(`User created successfully: ${user.email}`); 
    res.status(httpStatus.CREATED).json({ message: messages.USER_CREATED, user });
  } catch (error) {
    logger.error(`Error during signup for email: ${req.body.email}`, { error: error.message });
    
    res.status(error.status || httpStatus.SERVER_ERROR).json({ 
      message: error.message || messages.SERVER_ERROR 
    });
  }
};
exports.login = async (req, res) => {
  try {
    const token = await userService.login(req.body);

    logger.info(`User logged in successfully: ${req.body.email}`);
    res.status(httpStatus.OK).json({ token, message: messages.LOGIN_SUCCESS });
  } catch (error) {
    logger.error(`Error during login for email: ${req.body.email}`, { error: error.message });
    res.status(httpStatus.SERVER_ERROR).json({ message: error.message });
  }
}; 
exports.forgetPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const result = await userService.forgetPassword(email);
    logger.info('Password reset initiated', email);
    return res.status(httpStatus.OK).json(result);
  } catch (error) {
    logger.error(`Failed to reset password: ${error.message}`);
    return res.status(error.status || httpStatus.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};



exports.sendOtp = async (req, res) => {
  try {
    const {resetToken} = req.body;
    const result = await userService.sendOtp(resetToken);
    logger.info(`OTP sent to ${req.body.email}`);
    return res.status(httpStatus.OK).json(result);
  } catch (error) {
    logger.error(`Send OTP error: ${error.message}`);
    return res.status(error.status || httpStatus.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};


exports.verifyOtp = async (req, res) => {
  try {
    const { resetToken, otp, newPassword } = req.body;
    const result = await userService.verifyOtp(resetToken, otp, newPassword);
    logger.info(`Password changed successfully `);
    return res.status(httpStatus.OK).json(result);
  } 
  catch (error) {
    logger.error(`Verify OTP error: ${error.message}`);
    return res.status(httpStatus.BAD_REQUEST ).json({
      success: false,
      message: error.message,
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