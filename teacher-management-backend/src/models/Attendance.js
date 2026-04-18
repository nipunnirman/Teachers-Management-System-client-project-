const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'holiday', 'weekend'],
      required: true,
    },
    checkIn: Date,
    checkOut: Date,
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    editReason: String,
  },
  { timestamps: true }
);

// Unique attendance per teacher per day
attendanceSchema.index({ teacher: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
