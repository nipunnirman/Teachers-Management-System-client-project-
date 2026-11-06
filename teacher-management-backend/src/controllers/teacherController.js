const Teacher = require('../models/Teacher');
const User = require('../models/User');
const { ADMIN_PROFILE_FIELDS, TEACHER_PROFILE_FIELDS, pickAllowed } = require('../utils/teacherFields');

const isOwnProfile = (teacher, req) => String(teacher.user?._id || teacher.user) === String(req.user.id);

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

    let query = Teacher.find(filter).select('-changeHistory').populate('user', 'name email isActive');

    if (search) {
      const users = await User.find({
        name: { $regex: search, $options: 'i' },
      }).select('_id');
      const userIds = users.map((u) => u._id);
      query = Teacher.find({ ...filter, user: { $in: userIds } }).select('-changeHistory').populate('user', 'name email isActive');
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
    const teacher = await Teacher.findById(req.params.id).select('-changeHistory').populate('user', 'name email role isActive lastLogin');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'ගුරුවරයා හමු නොවීය.' });
    }
    if (req.user.role !== 'admin' && !isOwnProfile(teacher, req)) {
      return res.status(403).json({ success: false, message: 'මෙම ක්‍රියාව සඳහා ඔබට අවසර නැත.' });
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
    const teacher = await Teacher.findOne({ user: req.user.id }).select('-changeHistory').populate('user', 'name email role');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'ගුරු පැතිකඩ හමු නොවීය.' });
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
      return res.status(404).json({ success: false, message: 'ගුරුවරයා හමු නොවීය.' });
    }

    // Teachers can only update limited fields on their own profile
    if (req.user.role !== 'admin' && !isOwnProfile(teacher, req)) {
      return res.status(403).json({ success: false, message: 'මෙම ක්‍රියාව සඳහා ඔබට අවසර නැත.' });
    }
    const allowedUpdates = pickAllowed(req.body, req.user.role === 'admin' ? ADMIN_PROFILE_FIELDS : TEACHER_PROFILE_FIELDS);

    if (allowedUpdates.profilePhoto && !/^data:image\/(jpeg|png|webp);base64,/.test(allowedUpdates.profilePhoto)) {
      return res.status(400).json({ success: false, message: 'ඡායාරූපය වලංගු නැත.' });
    }

    // Record change in audit trail, leaving out the photo data
    const { profilePhoto, ...loggedChanges } = allowedUpdates;
    teacher.changeHistory.push({
      changedBy: req.user.id,
      changedAt: new Date(),
      changes: profilePhoto !== undefined ? { ...loggedChanges, profilePhoto: 'updated' } : loggedChanges,
    });

    Object.assign(teacher, allowedUpdates);
    await teacher.save();

    res.status(200).json({ success: true, message: 'ගුරු තොරතුරු සාර්ථකව යාවත්කාලීන විය.', teacher });
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
      return res.status(404).json({ success: false, message: 'ගුරුවරයා හමු නොවීය.' });
    }

    // Deactivate user instead of hard delete (preserves audit trail)
    await User.findByIdAndUpdate(teacher.user, { isActive: false });
    await teacher.deleteOne();

    res.status(200).json({ success: true, message: 'ගුරුවරයා සාර්ථකව ඉවත් කරන ලදී.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllTeachers, getTeacher, getMyProfile, updateTeacher, deleteTeacher };
