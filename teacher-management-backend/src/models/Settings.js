const mongoose = require('mongoose');

// One record holds the school-wide settings.
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'school', unique: true },
    academicYear: { type: String, default: '2025-2026', trim: true },
    // Teachers checking in after this time (Sri Lanka time) are marked late.
    lateAfter: { type: String, default: '07:30', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    // Days allowed per calendar year. 0 means no limit is applied.
    leaveLimits: {
      annual: { type: Number, default: 24, min: 0 },
      casual: { type: Number, default: 21, min: 0 },
      sick: { type: Number, default: 0, min: 0 },
      maternity: { type: Number, default: 0, min: 0 },
      paternity: { type: Number, default: 0, min: 0 },
      unpaid: { type: Number, default: 0, min: 0 },
      other: { type: Number, default: 0, min: 0 },
    },
    // Optional check that QR scans happen at the school.
    location: {
      enabled: { type: Boolean, default: false },
      latitude: Number,
      longitude: Number,
      radiusMeters: { type: Number, default: 200, min: 50 },
    },
  },
  { timestamps: true }
);

settingsSchema.statics.current = function () {
  return this.findOneAndUpdate(
    { key: 'school' },
    { $setOnInsert: { key: 'school' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

module.exports = mongoose.model('Settings', settingsSchema);
