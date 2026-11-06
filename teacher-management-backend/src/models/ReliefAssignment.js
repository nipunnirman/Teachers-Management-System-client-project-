const mongoose = require('mongoose');

// A teacher covering one absent teacher's class on one date.
const reliefAssignmentSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    timetableEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable', required: true },
    absentTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    reliefTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    subject: String,
    grade: String,
    className: String,
    period: Number,
    startTime: String,
    endTime: String,
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// A class can only be covered once, and a teacher can only cover one class per period.
reliefAssignmentSchema.index({ date: 1, timetableEntry: 1 }, { unique: true });
reliefAssignmentSchema.index({ date: 1, reliefTeacher: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('ReliefAssignment', reliefAssignmentSchema);
