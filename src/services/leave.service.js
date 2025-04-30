const Leave = require('../models/leave.model');
const httpStatus = require('../utils/httpStatus');
const messages = require('../utils/messages');
const moment = require('moment');


exports.applyLeave = async (user, body) => {
  const { type, startDate, endDate, reason } = body;
  const leaveStart = moment(startDate).startOf('day');
  const leaveEnd = endDate ? moment(endDate).startOf('day') : leaveStart;


  if (!['Planned', 'Emergency'].includes(type)) {
    throw { status: httpStatus.BAD_REQUEST, message: 'Invalid leave type' };
  }

  if (leaveEnd.isBefore(leaveStart)) {
    throw { status: httpStatus.BAD_REQUEST, message: 'End date cannot be before start date' };
  }


   //sat sun
   const currentDate = moment(leaveStart);
   while (currentDate.isSameOrBefore(leaveEnd)) {
     const dayOfWeek = currentDate.day();
     if (dayOfWeek === 0 || dayOfWeek === 6) {
       throw { 
         status: httpStatus.BAD_REQUEST, 
         message: messages.LEAVE_ON_WEEKEND 
       };
     }
     currentDate.add(1, 'day');
   }
  const existingLeave = await Leave.findOne({
    user: user._id,
    // date: leaveDate.toDate()
    // date: {
    //   $gte: leaveStart.toDate(),
    //   $lte: leaveEnd.toDate()
    // }
    $or: [
      { startDate: { $gte: leaveStart.toDate(), $lte: leaveEnd.toDate() } },
      { endDate: { $gte: leaveStart.toDate(), $lte: leaveEnd.toDate() } },
      { startDate: { $lte: leaveStart.toDate() }, endDate: { $gte: leaveEnd.toDate() } } ,
      { startDate: { $lte: leaveEnd.toDate() }, endDate: { $gte: leaveStart.toDate() } }
    ]
  });

  if (existingLeave) {
    throw { status: httpStatus.CONFLICT, message: messages.LEAVE_ALREADY_EXISTS };
  }

  
  if (leaveStart.isBefore(moment().startOf('day').subtract(3, 'days'))) {
    throw { status: httpStatus.BAD_REQUEST, message: messages.LEAVE_BACKDATED };
  }

  const leave = new Leave({
    user: user._id,
    type,
    startDate: leaveStart.toDate(),
    endDate: leaveEnd.toDate(),
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
    .sort({ startDate: -1 })
    .skip(Number(skips))
    .limit(Number(limit));

  return leaves;
};

exports.getLeaveById = async (leaveId, userId) => {
  return await Leave.findOne({ _id: leaveId, user: userId });
};
