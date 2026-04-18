const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    // Earnings
    baseSalary: {
      type: Number,
      required: true,
    },
    allowances: {
      transport: { type: Number, default: 0 },
      housing: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    bonus: {
      type: Number,
      default: 0,
    },
    // Deductions
    deductions: {
      absentDeduction: { type: Number, default: 0 },
      lateDeduction: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    // Attendance Summary (for reference)
    workingDays: Number,
    presentDays: Number,
    absentDays: Number,
    leaveDays: Number,
    // Calculated totals
    grossSalary: Number,
    totalDeductions: Number,
    netSalary: Number,

    status: {
      type: String,
      enum: ['draft', 'processed', 'paid'],
      default: 'draft',
    },
    paidOn: Date,
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
  },
  { timestamps: true }
);

// Unique salary per teacher per month per year
salarySchema.index({ teacher: 1, month: 1, year: 1 }, { unique: true });

// Auto-calculate totals before saving
salarySchema.pre('save', function (next) {
  const totalAllowances =
    (this.allowances.transport || 0) +
    (this.allowances.housing || 0) +
    (this.allowances.other || 0);

  this.grossSalary = this.baseSalary + totalAllowances + (this.bonus || 0);

  this.totalDeductions =
    (this.deductions.absentDeduction || 0) +
    (this.deductions.lateDeduction || 0) +
    (this.deductions.tax || 0) +
    (this.deductions.other || 0);

  this.netSalary = this.grossSalary - this.totalDeductions;
  next();
});

module.exports = mongoose.model('Salary', salarySchema);
