const express = require('express');
const router = express.Router();
const { getReliefPlan, assignRelief, removeRelief, getMyRelief } = require('../controllers/reliefController');
const { protect, authorize } = require('../middleware/auth');

router.get('/me', protect, authorize('teacher'), getMyRelief);
router.get('/', protect, authorize('admin'), getReliefPlan);
router.post('/', protect, authorize('admin'), assignRelief);
router.delete('/:id', protect, authorize('admin'), removeRelief);

module.exports = router;
