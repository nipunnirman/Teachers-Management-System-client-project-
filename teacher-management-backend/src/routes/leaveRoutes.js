const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getLeaves,
  reviewLeave,
  cancelLeave,
  getLeaveBalance,
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('teacher'), applyLeave);
router.get('/', protect, getLeaves);
router.put('/:id/review', protect, authorize('admin'), reviewLeave);
router.put('/:id/cancel', protect, authorize('teacher'), cancelLeave);
router.get('/balance/:teacherId', protect, getLeaveBalance);

module.exports = router;
