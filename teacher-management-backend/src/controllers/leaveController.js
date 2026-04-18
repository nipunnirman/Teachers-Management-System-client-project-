const Leave = require('../models/Leave');
const Teacher = require('../models/Teacher');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Submit a leave request
// @route   POST /api/leaves
// @access  Teacher
const applyLeave = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found.' });

    const { leaveType, startDate, endDate, reason } = req.body;
    const leave = await Leave.create({ teacher: teacher._id, leaveType, startDate, endDate, reason });

    // Notify all admins
    const admins = await User.find({ role: 'admin', isActive: true });
    const notifications = admins.map((admin) => ({
      recipient: admin._id,
      title: 'New Leave Request',
      message: `${req.user.name} has submitted a leave request from ${startDate} to ${endDate}.`,
      type: 'leave',
    }));
    await Notification.insertMany(notifications);

    res.status(201).json({ success: true, message: 'Leave request submitted.', leave });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all leave requests (admin) or own requests (teacher)
// @route   GET /api/leaves
// @access  Admin | Teacher
const getLeaves = async (req, res, next) => {
  try {
    const { status, teacherId, month, year } = req.query;
    const filter = {};

    if (status) filter.status = status;

    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user.id });
      filter.teacher = teacher?._id;
    } else if (teacherId) {
      filter.teacher = teacherId;
    }

    if (month && year) {
      filter.startDate = {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 0),
      };
    }

    const leaves = await Leave.find(filter)
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name email' } })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject a leave request
// @route   PUT /api/leaves/:id/review
// @access  Admin
const reviewLeave = async (req, res, next) => {
  try {
    const { status, reviewNote } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
    }

    const leave = await Leave.findById(req.params.id).populate({
      path: 'teacher',
      populate: { path: 'user', select: 'name _id' },
    });

    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found.' });
    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This request has already been reviewed.' });
    }

    leave.status = status;
    leave.reviewedBy = req.user.id;
    leave.reviewedAt = new Date();
    leave.reviewNote = reviewNote;
    await leave.save();

    // Notify the teacher
    await Notification.create({
      recipient: leave.teacher.user._id,
      title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your leave request from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()} has been ${status}.${reviewNote ? ' Note: ' + reviewNote : ''}`,
      type: 'leave',
    });

    res.status(200).json({ success: true, message: `Leave ${status}.`, leave });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a leave request (before approval)
// @route   PUT /api/leaves/:id/cancel
// @access  Teacher
const cancelLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be cancelled.' });
    }

    leave.status = 'cancelled';
    leave.isCancelled = true;
    await leave.save();

    res.status(200).json({ success: true, message: 'Leave request cancelled.', leave });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leave balance for a teacher
// @route   GET /api/leaves/balance/:teacherId
// @access  Admin | Teacher
const getLeaveBalance = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const leaves = await Leave.find({
      teacher: req.params.teacherId,
      status: 'approved',
      startDate: { $gte: new Date(year, 0, 1) },
      endDate: { $lte: new Date(year, 11, 31) },
    });

    const used = {};
    leaves.forEach((l) => {
      used[l.leaveType] = (used[l.leaveType] || 0) + l.totalDays;
    });

    const entitlement = { annual: 14, sick: 10, casual: 7, maternity: 84, paternity: 5 };
    const balance = {};
    for (const type in entitlement) {
      balance[type] = { entitled: entitlement[type], used: used[type] || 0, remaining: entitlement[type] - (used[type] || 0) };
    }

    res.status(200).json({ success: true, year, balance });
  } catch (error) {
    next(error);
  }
};

module.exports = { applyLeave, getLeaves, reviewLeave, cancelLeave, getLeaveBalance };
