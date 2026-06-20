const Attendance = require('../models/Attendance');
const Teacher = require('../models/Teacher');
const Notification = require('../models/Notification');

// @desc    Mark attendance for a teacher
// @route   POST /api/attendance
// @access  Admin
const markAttendance = async (req, res, next) => {
  try {
    const { teacherId, date, status, checkIn, checkOut, notes } = req.body;

    // Normalize date to midnight UTC
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const attendance = await Attendance.findOneAndUpdate(
      { teacher: teacherId, date: attendanceDate },
      { teacher: teacherId, date: attendanceDate, status, checkIn, checkOut, notes, markedBy: req.user.id },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Attendance marked.', attendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance records with filters
// @route   GET /api/attendance
// @access  Admin
const getAttendance = async (req, res, next) => {
  try {
    const { teacherId, month, year, startDate, endDate, status } = req.query;

    const filter = {};
    if (teacherId) filter.teacher = teacherId;
    if (status) filter.status = status;

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    } else if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const records = await Attendance.find(filter)
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name email' } })
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: records.length, records });
  } catch (error) {
    next(error);
  }
};

// @desc    Get own attendance (teacher)
// @route   GET /api/attendance/me
// @access  Teacher
const getMyAttendance = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found.' });

    const { month, year } = req.query;
    const filter = { teacher: teacher._id };

    if (month && year) {
      filter.date = {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 0, 23, 59, 59),
      };
    }

    const records = await Attendance.find(filter).sort({ date: -1 });

    // Summary counts
    const summary = {
      present: records.filter((r) => r.status === 'present').length,
      absent: records.filter((r) => r.status === 'absent').length,
      late: records.filter((r) => r.status === 'late').length,
      halfDay: records.filter((r) => r.status === 'half-day').length,
    };

    res.status(200).json({ success: true, count: records.length, summary, records });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit attendance record (admin only)
// @route   PUT /api/attendance/:id
// @access  Admin
const editAttendance = async (req, res, next) => {
  try {
    const { status, checkIn, checkOut, editReason } = req.body;
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status, checkIn, checkOut, isEdited: true, editedBy: req.user.id, editReason },
      { new: true, runValidators: true }
    );

    if (!attendance) return res.status(404).json({ success: false, message: 'Attendance record not found.' });

    res.status(200).json({ success: true, message: 'Attendance updated.', attendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Monthly attendance report for a teacher
// @route   GET /api/attendance/report/:teacherId
// @access  Admin
const getMonthlyReport = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month);
    const y = parseInt(year);

    const records = await Attendance.find({
      teacher: req.params.teacherId,
      date: {
        $gte: new Date(y, m - 1, 1),
        $lte: new Date(y, m, 0, 23, 59, 59),
      },
    }).sort({ date: 1 });

    const summary = {
      total: records.length,
      present: records.filter((r) => r.status === 'present').length,
      absent: records.filter((r) => r.status === 'absent').length,
      late: records.filter((r) => r.status === 'late').length,
      halfDay: records.filter((r) => r.status === 'half-day').length,
      holiday: records.filter((r) => r.status === 'holiday').length,
    };

    res.status(200).json({ success: true, month: m, year: y, summary, records });
  } catch (error) {
    next(error);
  }
};

// Generate HMAC daily token based on a secret and today's date
const crypto = require('crypto');
const generateDailyToken = () => {
  const secret = process.env.JWT_SECRET || 'super-secret-key-for-qr';
  const todayStr = new Date().toISOString().slice(0, 10); // Format: YYYY-MM-DD
  return crypto.createHmac('sha256', secret).update(todayStr).digest('hex');
};

// @desc    Get today's QR code token
// @route   GET /api/attendance/qr/today
// @access  Admin
const getTodayQRToken = async (req, res, next) => {
  try {
    const token = generateDailyToken();
    res.status(200).json({ success: true, token });
  } catch (error) {
    next(error);
  }
};

// @desc    Scan QR token and mark teacher attendance
// @route   POST /api/attendance/qr/scan
// @access  Teacher
const scanQRAndMark = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'QR token is required.' });
    }

    const expectedToken = generateDailyToken();
    if (token !== expectedToken) {
      return res.status(400).json({ success: false, message: 'Invalid or expired QR code.' });
    }

    // Find the teacher profile associated with logged in user
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found for this user.' });
    }

    const today = new Date();
    const attendanceDate = new Date(today);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Check if already checked in today
    let attendance = await Attendance.findOne({ teacher: teacher._id, date: attendanceDate });
    
    if (attendance) {
      if (!attendance.checkOut) {
        // Mark check-out
        attendance.checkOut = today;
        await attendance.save();

        // Create a notification for the teacher
        await Notification.create({
          recipient: req.user.id,
          title: 'Check-out Recorded',
          message: `Your check-out has been recorded at ${today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} via QR scan.`,
          type: 'attendance'
        });

        return res.status(200).json({
          success: true,
          message: 'Check-out marked successfully via QR scan.',
          attendance
        });
      } else {
        return res.status(200).json({
          success: true,
          message: 'You have already checked in and checked out for today.',
          attendance
        });
      }
    }

    // Mark check-in
    attendance = await Attendance.create({
      teacher: teacher._id,
      date: attendanceDate,
      status: 'present',
      checkIn: today,
      markedBy: req.user.id,
      notes: 'Checked in via QR scan'
    });

    // Create a notification for the teacher
    await Notification.create({
      recipient: req.user.id,
      title: 'Check-in Recorded',
      message: `Your check-in has been recorded at ${today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} via QR scan.`,
      type: 'attendance'
    });

    res.status(200).json({
      success: true,
      message: 'Check-in marked successfully via QR scan.',
      attendance
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  getAttendance,
  getMyAttendance,
  editAttendance,
  getMonthlyReport,
  getTodayQRToken,
  scanQRAndMark,
};
