const crypto = require('crypto');
const nodemailer = require('nodemailer');
const redisClient = require('../config/redis');
const messages = require('../utils/messages');
const httpStatus = require('../utils/httpStatus');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOtpEmail = async (email, otp) => {
  
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};

const storeOtpInRedis = async (email, otp) => {
  await redisClient.setex(email, 300, otp); 
};

const verifyOtp = async (email, enteredOtp) => {
  const storedOtp = await redisClient.get(email);
  if (!storedOtp) {
    return { success: false, status: httpStatus.BAD_REQUEST, message: messages.OTP_EXPIRED };
  }
  if (storedOtp !== enteredOtp) {
    return { success: false, status: httpStatus.BAD_REQUEST, message: messages.INVALID_OTP };
  }

  await redisClient.del(email);
  return { success: true, status: httpStatus.OK, message: messages.OTP_VERIFIED };
};

module.exports = {
  generateOtp,
  sendOtpEmail,
  storeOtpInRedis,
  verifyOtp,
};
