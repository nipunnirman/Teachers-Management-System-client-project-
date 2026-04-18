const Teacher = require('../models/Teacher');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Salary = require('../models/Salary');
const Timetable = require('../models/Timetable');
const User = require('../models/User');

// @desc    Admin dashboard overview
// @route   GET /api/reports/dashboard
// @access  Admin
const getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [
      totalTeachers,
      activeTeachers,
      todayPresent,
      todayAbsent,
      pendingLeaves,
      totalSalaryThisMonth,
    ] = await Promise.all([
      Teacher.countDocuments(),
      User.countDocuments({ role: 'teacher', isActive: true }),
      Attendance.countDocuments({ date: today, status: 'present' }),
      Attendance.countDocuments({ date: today, status: 'absent' }),
      Leave.countDocuments({ status: 'pending' }),
      Salary.aggregate([
        {
          $match: {
            month: today.getMonth() + 1,
            year: today.getFullYear(),
            status: { $in: ['processed', 'paid'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$netSalary' } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      dashboard: {
        totalTeachers,
        activeTeachers,
        todayAttendance: { present: todayPresent, absent: todayAbsent },
        pendingLeaves,
        totalSalaryThisMonth: totalSalaryThisMonth[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Attendance analytics (monthly trend)
// @route   GET /api/reports/attendance
// @access  Admin
const getAttendanceReport = async (req, res, next) => {
  try {
    const { year } = req.query;
    const y = parseInt(year) || new Date().getFullYear();

    // Monthly breakdown for the whole year
    const monthly = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: new Date(y, 0, 1), $lte: new Date(y, 11, 31) },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$date' }, status: '$status' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    // Top absentees
    const absentees = await Attendance.aggregate([
      {
        $match: {
          status: 'absent',
          date: { $gte: new Date(y, 0, 1) },
        },
      },
      { $group: { _id: '$teacher', absences: { $sum: 1 } } },
      { $sort: { absences: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'teachers',
          localField: '_id',
          foreignField: '_id',
          as: 'teacher',
        },
      },
      { $unwind: '$teacher' },
      {
        $lookup: {
          from: 'users',
          localField: 'teacher.user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $project: { absences: 1, teacherName: '$user.name', teacherId: '$teacher.teacherId' } },
    ]);

    res.status(200).json({ success: true, year: y, monthly, topAbsentees: absentees });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave analytics
// @route   GET /api/reports/leave
// @access  Admin
const getLeaveReport = async (req, res, next) => {
  try {
    const { year } = req.query;
    const y = parseInt(year) || new Date().getFullYear();

    const byType = await Leave.aggregate([
      {
        $match: {
          status: 'approved',
          startDate: { $gte: new Date(y, 0, 1) },
        },
      },
      { $group: { _id: '$leaveType', totalDays: { $sum: '$totalDays' }, count: { $sum: 1 } } },
      { $sort: { totalDays: -1 } },
    ]);

    const byStatus = await Leave.aggregate([
      {
        $match: { createdAt: { $gte: new Date(y, 0, 1) } },
      },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.status(200).json({ success: true, year: y, byType, byStatus });
  } catch (error) {
    next(error);
  }
};

// @desc    Salary analytics
// @route   GET /api/reports/salary
// @access  Admin
const getSalaryReport = async (req, res, next) => {
  try {
    const { year } = req.query;
    const y = parseInt(year) || new Date().getFullYear();

    const monthly = await Salary.aggregate([
      { $match: { year: y } },
      {
        $group: {
          _id: '$month',
          totalGross: { $sum: '$grossSalary' },
          totalNet: { $sum: '$netSalary' },
          totalDeductions: { $sum: '$totalDeductions' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const byEmploymentType = await Salary.aggregate([
      { $match: { year: y } },
      {
        $lookup: {
          from: 'teachers',
          localField: 'teacher',
          foreignField: '_id',
          as: 'teacher',
        },
      },
      { $unwind: '$teacher' },
      {
        $group: {
          _id: '$teacher.employmentType',
          totalNet: { $sum: '$netSalary' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({ success: true, year: y, monthly, byEmploymentType });
  } catch (error) {
    next(error);
  }
};

// @desc    Teacher workload report
// @route   GET /api/reports/workload
// @access  Admin
const getWorkloadReport = async (req, res, next) => {
  try {
    const { academicYear } = req.query;
    const filter = { isActive: true };
    if (academicYear) filter.academicYear = academicYear;

    const workload = await Timetable.aggregate([
      { $match: filter },
      { $group: { _id: '$teacher', totalPeriods: { $sum: 1 }, subjects: { $addToSet: '$subject' } } },
      { $sort: { totalPeriods: -1 } },
      {
        $lookup: { from: 'teachers', localField: '_id', foreignField: '_id', as: 'teacher' },
      },
      { $unwind: '$teacher' },
      {
        $lookup: { from: 'users', localField: 'teacher.user', foreignField: '_id', as: 'user' },
      },
      { $unwind: '$user' },
      {
        $project: {
          totalPeriods: 1,
          subjects: 1,
          teacherName: '$user.name',
          teacherId: '$teacher.teacherId',
          department: '$teacher.department',
        },
      },
    ]);

    res.status(200).json({ success: true, workload });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getAttendanceReport, getLeaveReport, getSalaryReport, getWorkloadReport };
