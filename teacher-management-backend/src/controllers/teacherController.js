const Teacher = require('../models/Teacher');
const User = require('../models/User');

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Admin
const getAllTeachers = async (req, res, next) => {
  try {
    const { search, subject, grade, department, employmentType } = req.query;

    const filter = {};
    if (subject) filter.subjects = subject;
    if (grade) filter.grades = grade;
    if (department) filter.department = department;
    if (employmentType) filter.employmentType = employmentType;

    let query = Teacher.find(filter).populate('user', 'name email isActive');

    if (search) {
      const users = await User.find({
        name: { $regex: search, $options: 'i' },
      }).select('_id');
      const userIds = users.map((u) => u._id);
      query = Teacher.find({ ...filter, user: { $in: userIds } }).populate('user', 'name email isActive');
    }

    const teachers = await query.sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: teachers.length, teachers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single teacher by ID
// @route   GET /api/teachers/:id
// @access  Admin | Teacher (own profile)
const getTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('user', 'name email role isActive lastLogin');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }
    res.status(200).json({ success: true, teacher });
  } catch (error) {
    next(error);
  }
};

// @desc    Get teacher profile for logged-in teacher
// @route   GET /api/teachers/me
// @access  Teacher
const getMyProfile = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user.id }).populate('user', 'name email role');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found.' });
    }
    res.status(200).json({ success: true, teacher });
  } catch (error) {
    next(error);
  }
};

// @desc    Update teacher profile (admin: full, teacher: limited fields)
// @route   PUT /api/teachers/:id
// @access  Admin | Teacher (own profile)
const updateTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    // Teachers can only update limited fields
    let allowedUpdates = req.body;
    if (req.user.role === 'teacher') {
      const { phone, address, emergencyContact } = req.body;
      allowedUpdates = { phone, address, emergencyContact };
    }

    // Record change in audit trail
    teacher.changeHistory.push({
      changedBy: req.user.id,
      changedAt: new Date(),
      changes: allowedUpdates,
    });

    Object.assign(teacher, allowedUpdates);
    await teacher.save();

    res.status(200).json({ success: true, message: 'Teacher updated successfully.', teacher });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete teacher (and linked user)
// @route   DELETE /api/teachers/:id
// @access  Admin
const deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    // Deactivate user instead of hard delete (preserves audit trail)
    await User.findByIdAndUpdate(teacher.user, { isActive: false });
    await teacher.deleteOne();

    res.status(200).json({ success: true, message: 'Teacher removed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllTeachers, getTeacher, getMyProfile, updateTeacher, deleteTeacher };
