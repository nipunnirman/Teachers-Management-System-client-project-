const express = require('express');
const router = express.Router();
const {
  getAllTeachers,
  getTeacher,
  getMyProfile,
  updateTeacher,
  deleteTeacher,
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');

router.get('/me', protect, authorize('teacher'), getMyProfile);
router.get('/', protect, authorize('admin'), getAllTeachers);
router.get('/:id', protect, getTeacher);
router.put('/:id', protect, updateTeacher);
router.delete('/:id', protect, authorize('admin'), deleteTeacher);

module.exports = router;
