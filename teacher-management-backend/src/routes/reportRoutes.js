const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getAttendanceReport,
  getLeaveReport,
  getSalaryReport,
  getWorkloadReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, authorize('admin'), getDashboard);
router.get('/attendance', protect, authorize('admin'), getAttendanceReport);
router.get('/leave', protect, authorize('admin'), getLeaveReport);
router.get('/salary', protect, authorize('admin'), getSalaryReport);
router.get('/workload', protect, authorize('admin'), getWorkloadReport);

module.exports = router;
