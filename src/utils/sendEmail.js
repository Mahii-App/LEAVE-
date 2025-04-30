const transporter = require('../config/nodemailer'); 
const dotenv = require('dotenv');
dotenv.config();
const sendEmail = async (to, subject, text) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER || 'mahi.rajput@appinventiv.com',
    to,
    subject,
    text,
  });
};

module.exports = sendEmail;
