const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['holiday', 'term', 'meeting', 'event'], default: 'event' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

calendarEventSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
