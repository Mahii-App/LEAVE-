const leaveService = require('../services/leave.service');
const httpStatus = require('../utils/httpStatus');
const messages = require('../utils/messages');
const logger = require('../utils/logger');

exports.applyLeave = async (req, res) => {
  try {
    const result = await leaveService.applyLeave(req.user, req.body);
    logger.info(`Leave applied successfully for user ${req.user._id}`, { leaveId: result._id });
    res.status(httpStatus.CREATED).json({ message: messages.LEAVE_APPLIED, leave: result });
  } catch (error) {
    logger.error(`Error applying leave for user ${req.user._id}`, { error: error.message });
    res.status(error.status || httpStatus.SERVER_ERROR).json({ message: error.message });
  }
};

exports.getLeaves = async (req, res) => {
  try {
    const leaves = await leaveService.getLeaves(req.user._id, req.query);
    logger.info(`Retrieved leaves for user ${req.user._id}`, { count: leaves.length });
    res.status(httpStatus.OK).json(leaves);
  } catch (error) {
    logger.error(`Error retrieving leaves for user ${req.user._id}`, { error: error.message });
    res.status(httpStatus.SERVER_ERROR).json({ message: error.message });
  }
};

exports.getLeaveById = async (req, res) => {
  try {
    const leave = await leaveService.getLeaveById(req.params.leaveId, req.user._id);
    if (!leave) {
      logger.warn(`Leave not found for ID ${req.params.leaveId} by user ${req.user._id}`);
      return res.status(httpStatus.NOT_FOUND).json({ message: 'Leave not found' });
    }
    logger.info(`Retrieved leave ${req.params.leaveId} for user ${req.user._id}`);
    res.status(httpStatus.OK).json(leave);
  } catch (error) {
    logger.error(`Error retrieving leave ${req.params.leaveId} for user ${req.user._id}`, { error: error.message });
    res.status(httpStatus.SERVER_ERROR).json({ message: error.message });
  }
};