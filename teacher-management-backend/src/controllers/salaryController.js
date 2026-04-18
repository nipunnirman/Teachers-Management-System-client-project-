const Salary = require('../models/Salary');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Teacher = require('../models/Teacher');

// @desc    Generate / process salary for a teacher for a month
// @route   POST /api/salary/generate
// @access  Admin
const generateSalary = async (req, res, next) => {
  try {
    const { teacherId, month, year, bonus, manualDeductions, notes } = req.body;
    const m = parseInt(month);
    const y = parseInt(year);

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });

    // Pull attendance for the month
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const attendanceRecords = await Attendance.find({
      teacher: teacherId,
      date: { $gte: startDate, $lte: endDate },
    });

    const workingDays = attendanceRecords.filter(
      (r) => !['holiday', 'weekend'].includes(r.status)
    ).length;
    const presentDays = attendanceRecords.filter((r) => r.status === 'present').length;
    const absentDays = attendanceRecords.filter((r) => r.status === 'absent').length;
    const lateDays = attendanceRecords.filter((r) => r.status === 'late').length;
    const halfDays = attendanceRecords.filter((r) => r.status === 'half-day').length;

    // Pull approved leave days
    const leaveRecords = await Leave.find({
      teacher: teacherId,
      status: 'approved',
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });
    const leaveDays = leaveRecords.reduce((acc, l) => acc + (l.totalDays || 0), 0);

    // Salary structure from teacher profile
    const { baseSalary = 0, allowances = 0, transportAllowance = 0, housingAllowance = 0 } =
      teacher.salaryStructure || {};

    // Calculate deductions
    const dailyRate = workingDays > 0 ? baseSalary / workingDays : 0;
    const absentDeduction = parseFloat((absentDays * dailyRate).toFixed(2));
    const lateDeduction = parseFloat((lateDays * (dailyRate * 0.1)).toFixed(2)); // 10% per late day
    const halfDayDeduction = parseFloat((halfDays * (dailyRate * 0.5)).toFixed(2));

    const salaryData = {
      teacher: teacherId,
      month: m,
      year: y,
      baseSalary,
      allowances: {
        transport: transportAllowance,
        housing: housingAllowance,
        other: allowances,
      },
      bonus: bonus || 0,
      deductions: {
        absentDeduction: absentDeduction + halfDayDeduction,
        lateDeduction,
        tax: manualDeductions?.tax || 0,
        other: manualDeductions?.other || 0,
      },
      workingDays,
      presentDays,
      absentDays,
      leaveDays,
      status: 'processed',
      generatedBy: req.user.id,
      notes,
    };

    const salary = await Salary.findOneAndUpdate(
      { teacher: teacherId, month: m, year: y },
      salaryData,
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Salary generated successfully.', salary });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all salary records
// @route   GET /api/salary
// @access  Admin
const getAllSalaries = async (req, res, next) => {
  try {
    const { month, year, teacherId, status } = req.query;
    const filter = {};
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (teacherId) filter.teacher = teacherId;
    if (status) filter.status = status;

    const salaries = await Salary.find(filter)
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name email' } })
      .populate('generatedBy', 'name')
      .sort({ year: -1, month: -1 });

    res.status(200).json({ success: true, count: salaries.length, salaries });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a teacher's own salary records
// @route   GET /api/salary/me
// @access  Teacher
const getMySalary = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found.' });

    const salaries = await Salary.find({ teacher: teacher._id }).sort({ year: -1, month: -1 });
    res.status(200).json({ success: true, count: salaries.length, salaries });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single salary slip
// @route   GET /api/salary/:id
// @access  Admin | Teacher (own)
const getSalarySlip = async (req, res, next) => {
  try {
    const salary = await Salary.findById(req.params.id)
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name email' } })
      .populate('generatedBy', 'name');

    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found.' });

    res.status(200).json({ success: true, salary });
  } catch (error) {
    next(error);
  }
};

// @desc    Update salary (add bonus/deduction manually)
// @route   PUT /api/salary/:id
// @access  Admin
const updateSalary = async (req, res, next) => {
  try {
    const salary = await Salary.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found.' });

    res.status(200).json({ success: true, message: 'Salary updated.', salary });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark salary as paid
// @route   PUT /api/salary/:id/mark-paid
// @access  Admin
const markAsPaid = async (req, res, next) => {
  try {
    const salary = await Salary.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', paidOn: new Date() },
      { new: true }
    );
    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found.' });

    res.status(200).json({ success: true, message: 'Salary marked as paid.', salary });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateSalary, getAllSalaries, getMySalary, getSalarySlip, updateSalary, markAsPaid };
