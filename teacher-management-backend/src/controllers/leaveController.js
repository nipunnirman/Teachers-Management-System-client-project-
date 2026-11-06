const { dateLabel, dateLabelEn } = require('../utils/sinhala');
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
    if (!teacher) return res.status(404).json({ success: false, message: 'ගුරු පැතිකඩ හමු නොවීය.' });

    const { leaveType, startDate, endDate, reason } = req.body;
    const leave = await Leave.create({ teacher: teacher._id, leaveType, startDate, endDate, reason });

    // Notify all admins
    const admins = await User.find({ role: 'admin', isActive: true });
    const notifications = admins.map((admin) => ({
      recipient: admin._id,
      title: 'නව නිවාඩු ඉල්ලීමක්',
      titleEn: 'New Leave Request',
      message: `${req.user.name} ${startDate} සිට ${endDate} දක්වා නිවාඩු ඉල්ලීමක් යොමු කර ඇත.`,
      messageEn: `${req.user.name} has submitted a leave request from ${startDate} to ${endDate}.`,
      type: 'leave',
    }));
    await Notification.insertMany(notifications);

    res.status(201).json({ success: true, message: 'නිවාඩු ඉල්ලීම යවන ලදී.', leave });
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
      return res.status(400).json({ success: false, message: 'තත්ත්වය අනුමත හෝ ප්‍රතික්ෂේප විය යුතුය.' });
    }

    const leave = await Leave.findById(req.params.id).populate({
      path: 'teacher',
      populate: { path: 'user', select: 'name _id' },
    });

    if (!leave) return res.status(404).json({ success: false, message: 'නිවාඩු ඉල්ලීම හමු නොවීය.' });
    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'මෙම ඉල්ලීම දැනටමත් පරීක්ෂා කර ඇත.' });
    }

    leave.status = status;
    leave.reviewedBy = req.user.id;
    leave.reviewedAt = new Date();
    leave.reviewNote = reviewNote;
    await leave.save();

    // Notify the teacher
    await Notification.create({
      recipient: leave.teacher.user._id,
      title: status === 'approved' ? 'නිවාඩු ඉල්ලීම අනුමත විය' : 'නිවාඩු ඉල්ලීම ප්‍රතික්ෂේප විය',
      titleEn: status === 'approved' ? 'Leave Request Approved' : 'Leave Request Rejected',
      message: `${dateLabel(leave.startDate)} සිට ${dateLabel(leave.endDate)} දක්වා වූ ඔබගේ නිවාඩු ඉල්ලීම ${status === 'approved' ? 'අනුමත' : 'ප්‍රතික්ෂේප'} කර ඇත.${reviewNote ? ' සටහන: ' + reviewNote : ''}`,
      messageEn: `Your leave request from ${dateLabelEn(leave.startDate)} to ${dateLabelEn(leave.endDate)} has been ${status}.${reviewNote ? ' Note: ' + reviewNote : ''}`,
      type: 'leave',
    });

    res.status(200).json({ success: true, message: status === 'approved' ? 'නිවාඩුව අනුමත කරන ලදී.' : 'නිවාඩුව ප්‍රතික්ෂේප කරන ලදී.', leave });
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
    if (!leave) return res.status(404).json({ success: false, message: 'නිවාඩු ඉල්ලීම හමු නොවීය.' });

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'පොරොත්තුවෙන් පවතින ඉල්ලීම් පමණක් අවලංගු කළ හැක.' });
    }

    leave.status = 'cancelled';
    leave.isCancelled = true;
    await leave.save();

    res.status(200).json({ success: true, message: 'නිවාඩු ඉල්ලීම අවලංගු කරන ලදී.', leave });
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
