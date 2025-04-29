const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST || 'smtp.gmail.com',
	port: process.env.EMAIL_PORT || '587',
	secure: false,
	auth: {
	  user: process.env.EMAIL_USER|| 'mahi.rajput@appinventiv.com',
	  pass: process.env.EMAIL_PASS || 'iuts pody owib enso', 
	},
  });

module.exports = transporter;
