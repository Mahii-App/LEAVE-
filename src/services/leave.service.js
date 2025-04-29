const Leave = require('../models/leave.model');
const httpStatus = require('../utils/httpStatus');
const messages = require('../utils/messages');
const moment = require('moment');

exports.applyLeave = async (user, body) => {
  const { type, date, reason } = body;
  const leaveDate = moment(date).startOf('day');


  if (!['Planned', 'Emergency'].includes(type)) {
    throw { status: httpStatus.BAD_REQUEST, message: 'Invalid leave type' };
  }

  
  const existingLeave = await Leave.findOne({
    user: user._id,
    date: leaveDate.toDate()
  });

  if (existingLeave) {
    throw { status: httpStatus.CONFLICT, message: messages.LEAVE_ALREADY_EXISTS };
  }

  
  if (leaveDate.isBefore(moment().startOf('day').subtract(3, 'days'))) {
    throw { status: httpStatus.BAD_REQUEST, message: messages.LEAVE_BACKDATED };
  }

  const leave = new Leave({
    user: user._id,
    type,
    date: leaveDate.toDate(),
    reason
  });

  await leave.save();
  return leave;
};

exports.getLeaves = async (userId, query) => {
  const { type, page = 1, limit = 10 } = query;
  const filter = { user: userId };
  if (type) filter.type = type;

  const skips = (page - 1) * limit;
  const leaves = await Leave.find(filter)
    .sort({ date: -1 })
    .skip(Number(skips))
    .limit(Number(limit));

  return leaves;
};

exports.getLeaveById = async (leaveId, userId) => {
  return await Leave.findOne({ _id: leaveId, user: userId });
};
