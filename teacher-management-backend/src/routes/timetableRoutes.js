const express = require('express');
const router = express.Router();
const {
  createEntry,
  getAllEntries,
  getMyTimetable,
  updateEntry,
  deleteEntry,
} = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin'), createEntry);
router.get('/', protect, authorize('admin'), getAllEntries);
router.get('/me', protect, authorize('teacher'), getMyTimetable);
router.put('/:id', protect, authorize('admin'), updateEntry);
router.delete('/:id', protect, authorize('admin'), deleteEntry);

module.exports = router;
