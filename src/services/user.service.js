const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const generateToken = require('../utils/generateToken');
const httpStatus = require('../utils/httpStatus');
const messages = require('../utils/messages');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const transporter = require('../config/nodemailer');
 
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

const otpStorage = new Map();
const resetTokens = new Map();

exports.signup = async (data) => {
  const {name, email, password} = data;
  console.log(name, email, password)
  const existingUser = await User.findOne({email});
  if (existingUser) {
    throw { status: httpStatus.CONFLICT, message: messages.USER_EXISTS };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword
  });

  return {
    _id: user._id,
    name: user.name,
    email: user.email
  };
};

exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    logger.warn(`Invalid login attempt for email: ${email}`);
    return {
      success: false,
      message: messages.INVALID_CREDENTIALS
    }
  }

  const token = generateToken(user);
  console.log(token)
  logger.info(`User logged in successfully: ${email}`);
  return token;
};



exports.sendOtp = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw { status: httpStatus.NOT_FOUND, message: messages.USER_NOT_FOUND };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await resetTokens.setEx(`otp:${email}`, 300, otp); 

  await sendEmail(email, 'Your OTP', `Your OTP is ${otp}`);
  return { message: messages.OTP_SENT };
  return { 
    success: true,    
    message: messages.OTP_SENT 
  };
};


exports.verifyOtp = async (email, otp) => {
  const storedOtp = await resetTokens.get(`otp:${email}`);
  if (!storedOtp || storedOtp !== otp) {
    throw { status: httpStatus.UNAUTHORIZED, message: messages.INVALID_OTP };
  }

  await resetTokens.del(`otp:${email}`);

  
  return { 
    success: true,
    message: messages.OTP_VERIFIED, 
    
  };
};

exports.forgetPassword = async (email) => {
  const user = await User.findOne({ email });
  console.log(user)
  if (!user) {
    throw { 
            status: httpStatus.UNAUTHORIZED, 
            message: messages.USER_NOT_FOUND
          };
  }

  const resetToken  = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); 
  resetTokens.set(resetToken, { email, expiresAt });

  logger.info('Password reset initiated', { email });
  return { resetToken };
};

exports.sendOtp = async (resetToken) => {
  const tokenData = resetTokens.get(resetToken);
  if (!tokenData) {
    throw { message: messages.RESET_TOKEN_EXPIRED, status: httpStatus.NOT_FOUND };
  }

  const { email, expiresAt } = tokenData;
  if (Date.now() > expiresAt) {
    resetTokens.delete(resetToken);
    throw { message: messages.RESET_TOKEN_EXPIRED, status: httpStatus.NOT_FOUND };
  }

  const otp = crypto.randomInt(1000000, 9999999).toString();
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); 
  otpStorage.set(resetToken, { otp, email, otpExpiresAt });


  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: 'Password Reset OTP',
    text: `Your OTP for password reset is: ${otp}. This OTP is valid for 5 minutes.`
};

await transporter.sendMail(mailOptions);


  logger.info('OTP sent successfully', { email });
  return { resetToken };
};

exports.verifyOtp = async (resetToken, otp, newPassword) => {
  const tokenData = resetTokens.get(resetToken);

  if (!tokenData) {
      logger.warn('Invalid reset token during OTP verification');
      return {
        success: false,
        message: messages.INVALID_TOKEN
      }
  }

  const otpData = otpStorage.get(resetToken);
  if (!otpData) {
      logger.warn('OTP not found for provided token');
      return {
        success: false,
        message: messages.OTP_NOT_FOUND
      }
  }

  const { otp: storedOtp, email, otpExpiresAt } = otpData;
  if (Date.now() > otpExpiresAt) {
      otpStorage.delete(resetToken);
      logger.warn('Expired OTP used');
      return validationError(res, messages.OTP_EXPIRED);
  }

  if (otp !== storedOtp) {
      logger.warn('Invalid OTP provided');
      return {
        success: false, messages: messages.INVALID_OTP
      }
  }

  const user = await User.findOne({ email });
  if (!user) {
      logger.error('User not found during password reset', { email });
      return{
        success: false,
        message: messages.USER_NOT_FOUND
      }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedPassword;
  await user.save();

  resetTokens.delete(resetToken);
  otpStorage.delete(resetToken);

  logger.info('Password reset successfully completed', { email });
  return  {
    success: true,
    message: messages.PASSWORD_RESET_SUCCESS
  }
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
