const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/', auth, leaveController.applyLeave);
router.get('/', auth, leaveController.getLeaves);
router.get('/:leaveId', auth, leaveController.getLeaveById);

module.exports = router;

