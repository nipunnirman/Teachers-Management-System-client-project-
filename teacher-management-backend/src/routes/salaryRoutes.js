const express = require('express');
const router = express.Router();
const {
  generateSalary,
  getAllSalaries,
  getMySalary,
  getSalarySlip,
  updateSalary,
  markAsPaid,
} = require('../controllers/salaryController');
const { protect, authorize } = require('../middleware/auth');

router.post('/generate', protect, authorize('admin'), generateSalary);
router.get('/', protect, authorize('admin'), getAllSalaries);
router.get('/me', protect, authorize('teacher'), getMySalary);
router.get('/:id', protect, getSalarySlip);
router.put('/:id', protect, authorize('admin'), updateSalary);
router.put('/:id/mark-paid', protect, authorize('admin'), markAsPaid);

module.exports = router;
