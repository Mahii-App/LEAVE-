
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');
const upload = require('../middlewares/multer.middleware');

router.post('/signup', userController.signup);
router.post('/login', userController.login);  
router.post('/send-otp', userController.sendOtp);       
router.post('/verify-otp', userController.verifyOtp);    
router.post('/forget_password', userController.forgetPassword); 


router.get('/profile', auth, userController.getProfile);
router.patch(
	'/profile',
	auth,
	upload.single('profilePic'),
	userController.updateProfile
  );

module.exports = router;