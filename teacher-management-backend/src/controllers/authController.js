const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const { sendEmail } = require('../utils/email');
const { ADMIN_PROFILE_FIELDS, pickAllowed } = require('../utils/teacherFields');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register a new user (Admin only)
// @route   POST /api/auth/register
// @access  Admin
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, profile } = req.body;

    const user = await User.create({ name, email, password, role });

    // If role is teacher, create a Teacher profile linked to this user
    if (role === 'teacher') {
      await Teacher.create({ ...pickAllowed(profile || {}, ADMIN_PROFILE_FIELDS), user: user._id });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'පරිශීලකයා සාර්ථකව ලියාපදිංචි විය.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'ඊමේල් ලිපිනය සහ මුරපදය අවශ්‍යයි.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'ඊමේල් ලිපිනය හෝ මුරපදය වැරදියි.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'මෙම ගිණුම අක්‍රීය කර ඇත.' });
    }

    // Log login history
    user.lastLogin = new Date();
    user.loginHistory.push({ timestamp: new Date(), ip: req.ip });
    if (user.loginHistory.length > 20) user.loginHistory.shift(); // keep last 20
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'පිවිසීම සාර්ථකයි.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'එම ඊමේල් ලිපිනය සහිත පරිශීලකයෙකු හමු නොවීය.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'මුරපදය යළි සැකසීමේ ඉල්ලීම',
      html: `<p>${user.name} මහත්මයාණෙනි / මහත්මියනි,</p>
             <p>ඔබ මුරපදය යළි සැකසීමට ඉල්ලා ඇත. එය සැකසීමට පහත සබැඳිය ක්ලික් කරන්න:</p>
             <a href="${resetURL}">${resetURL}</a>
             <p>මෙම සබැඳිය මිනිත්තු 10කින් කල් ඉකුත් වේ. ඔබ මෙය ඉල්ලා නොමැති නම්, කරුණාකර මෙම ඊමේල් පණිවිඩය නොසලකා හරින්න.</p>`,
    });

    res.status(200).json({ success: true, message: 'මුරපදය යළි සැකසීමේ ඊමේල් පණිවිඩය යවන ලදී.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'සබැඳිය වලංගු නැත හෝ කල් ඉකුත් වී ඇත.' });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.status(200).json({ success: true, message: 'මුරපදය සාර්ථකව යළි සකසන ලදී.', token });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin resets any user's password
// @route   PUT /api/auth/admin-reset-password/:userId
// @access  Admin
const adminResetPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'පරිශීලකයා හමු නොවීය.' });
    }
    user.password = req.body.newPassword;
    await user.save();
    res.status(200).json({ success: true, message: 'මුරපදය සාර්ථකව යාවත්කාලීන විය.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Change own password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'වත්මන් මුරපදය සහ නව මුරපදය අවශ්‍යයි.' });
    }
    const user = await User.findById(req.user.id).select('+password');
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'වත්මන් මුරපදය වැරදියි.' });
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: 'මුරපදය සාර්ථකව යාවත්කාලීන විය.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword, adminResetPassword, changePassword };
