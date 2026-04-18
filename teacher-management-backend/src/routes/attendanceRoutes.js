const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getAttendance,
  getMyAttendance,
  editAttendance,
  getMonthlyReport,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin'), markAttendance);
router.get('/', protect, authorize('admin'), getAttendance);
router.get('/me', protect, authorize('teacher'), getMyAttendance);
router.put('/:id', protect, authorize('admin'), editAttendance);
router.get('/report/:teacherId', protect, authorize('admin'), getMonthlyReport);

module.exports = router;
