const { dateLabel, dateLabelEn, pick } = require('../utils/sinhala');
const { countLeaveDays } = require('../utils/leaveDays');
const Settings = require('../models/Settings');
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
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'අවසන් දිනය ආරම්භක දිනයට පෙර විය නොහැක.' });
    }
    const totalDays = await countLeaveDays(startDate, endDate);
    if (totalDays === 0) {
      return res.status(400).json({ success: false, message: 'තෝරාගත් දිනවල පාසල් දින නොමැත.' });
    }

    const { leaveLimits } = await Settings.current();
    const limit = leaveLimits[leaveType] || 0;
    if (limit > 0) {
      const year = new Date(startDate).getUTCFullYear();
      const taken = await Leave.find({
        teacher: teacher._id,
        leaveType,
        status: { $in: ['approved', 'pending'] },
        startDate: { $gte: new Date(Date.UTC(year, 0, 1)), $lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59)) },
      }).select('totalDays');
      const used = taken.reduce((sum, l) => sum + (l.totalDays || 0), 0);
      if (used + totalDays > limit) {
        const left = Math.max(0, limit - used);
        return res.status(400).json({
          success: false,
          message: pick(req, `මෙම වර්ගයේ නිවාඩු ඉතිරිව ඇත්තේ දින ${left}ක් පමණි. ඔබ ඉල්ලා ඇත්තේ දින ${totalDays}කි.`, `Only ${left} day(s) of this leave remain, and you asked for ${totalDays}.`),
        });
      }
    }

    const leave = await Leave.create({ teacher: teacher._id, leaveType, startDate, endDate, reason, totalDays });

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
    const year = parseInt(req.query.year, 10) || new Date().getUTCFullYear();

    // Teachers may only see their own balance.
    let teacherId = req.params.teacherId;
    if (req.user.role !== 'admin') {
      const own = await Teacher.findOne({ user: req.user.id }).select('_id');
      if (!own) return res.status(404).json({ success: false, message: 'ගුරු පැතිකඩ හමු නොවීය.' });
      if (teacherId !== 'me' && teacherId !== String(own._id)) {
        return res.status(403).json({ success: false, message: 'මෙම ක්‍රියාව සඳහා ඔබට අවසර නැත.' });
      }
      teacherId = own._id;
    }

    const leaves = await Leave.find({
      teacher: teacherId,
      status: { $in: ['approved', 'pending'] },
      startDate: { $gte: new Date(Date.UTC(year, 0, 1)), $lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59)) },
    });

    const { leaveLimits } = await Settings.current();
    const balance = {};
    for (const type of ['annual', 'casual', 'sick', 'maternity', 'paternity', 'unpaid', 'other']) {
      const ofType = leaves.filter((l) => l.leaveType === type);
      const used = ofType.filter((l) => l.status === 'approved').reduce((sum, l) => sum + (l.totalDays || 0), 0);
      const pending = ofType.filter((l) => l.status === 'pending').reduce((sum, l) => sum + (l.totalDays || 0), 0);
      const limit = leaveLimits[type] || 0;
      balance[type] = { limit, used, pending, remaining: limit > 0 ? Math.max(0, limit - used - pending) : null };
    }

    res.status(200).json({ success: true, year, balance });
  } catch (error) {
    next(error);
  }
};

module.exports = { applyLeave, getLeaves, reviewLeave, cancelLeave, getLeaveBalance };
