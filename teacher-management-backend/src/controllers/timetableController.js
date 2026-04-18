const Timetable = require('../models/Timetable');
const Teacher = require('../models/Teacher');
const Notification = require('../models/Notification');

// @desc    Create a timetable entry
// @route   POST /api/timetable
// @access  Admin
const createEntry = async (req, res, next) => {
  try {
    const { teacher, subject, grade, className, day, period, startTime, endTime, academicYear, term } = req.body;

    // Check for conflict: same teacher, day, period, academicYear
    const conflict = await Timetable.findOne({ teacher, day, period, academicYear, isActive: true });
    if (conflict) {
      return res.status(400).json({
        success: false,
        message: `Conflict: This teacher already has a class on ${day}, Period ${period} (${conflict.subject} - ${conflict.className}).`,
      });
    }

    const entry = await Timetable.create({
      teacher, subject, grade, className, day, period, startTime, endTime, academicYear, term,
      createdBy: req.user.id,
    });

    // Notify teacher
    const teacherDoc = await Teacher.findById(teacher).populate('user', '_id name');
    if (teacherDoc) {
      await Notification.create({
        recipient: teacherDoc.user._id,
        title: 'Timetable Updated',
        message: `You have been assigned ${subject} for ${className} on ${day}, Period ${period} (${startTime} - ${endTime}).`,
        type: 'timetable',
      });
    }

    res.status(201).json({ success: true, message: 'Timetable entry created.', entry });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all timetable entries (filterable)
// @route   GET /api/timetable
// @access  Admin
const getAllEntries = async (req, res, next) => {
  try {
    const { teacherId, day, grade, className, academicYear } = req.query;
    const filter = { isActive: true };
    if (teacherId) filter.teacher = teacherId;
    if (day) filter.day = day;
    if (grade) filter.grade = grade;
    if (className) filter.className = className;
    if (academicYear) filter.academicYear = academicYear;

    const entries = await Timetable.find(filter)
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
      .sort({ day: 1, period: 1 });

    res.status(200).json({ success: true, count: entries.length, entries });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in teacher's timetable
// @route   GET /api/timetable/me
// @access  Teacher
const getMyTimetable = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found.' });

    const { academicYear } = req.query;
    const filter = { teacher: teacher._id, isActive: true };
    if (academicYear) filter.academicYear = academicYear;

    const entries = await Timetable.find(filter).sort({ day: 1, period: 1 });

    // Group by day for a structured weekly view
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekly = {};
    days.forEach((d) => {
      weekly[d] = entries.filter((e) => e.day === d).sort((a, b) => a.period - b.period);
    });

    res.status(200).json({ success: true, weekly, entries });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a timetable entry
// @route   PUT /api/timetable/:id
// @access  Admin
const updateEntry = async (req, res, next) => {
  try {
    const { teacher, day, period, academicYear } = req.body;

    // Check conflict if key fields are changing
    if (teacher && day && period && academicYear) {
      const conflict = await Timetable.findOne({
        teacher,
        day,
        period,
        academicYear,
        isActive: true,
        _id: { $ne: req.params.id },
      });
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: `Conflict detected on ${day}, Period ${period}.`,
        });
      }
    }

    const entry = await Timetable.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!entry) return res.status(404).json({ success: false, message: 'Timetable entry not found.' });

    res.status(200).json({ success: true, message: 'Timetable entry updated.', entry });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete (deactivate) a timetable entry
// @route   DELETE /api/timetable/:id
// @access  Admin
const deleteEntry = async (req, res, next) => {
  try {
    const entry = await Timetable.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!entry) return res.status(404).json({ success: false, message: 'Timetable entry not found.' });

    res.status(200).json({ success: true, message: 'Timetable entry removed.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createEntry, getAllEntries, getMyTimetable, updateEntry, deleteEntry };
