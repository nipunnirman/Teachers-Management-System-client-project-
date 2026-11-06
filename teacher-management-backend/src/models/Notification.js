const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    // English copies, so each person sees notifications in their own language.
    titleEn: String,
    messageEn: String,
    type: {
      type: String,
      enum: ['attendance', 'leave', 'salary', 'timetable', 'announcement', 'general'],
      default: 'general',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    link: String, // Optional deep link to relevant page
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// MongoDB permanently deletes each notification one week after it was created.
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Send to phones only when a notification is first created, not when it is marked read.
notificationSchema.pre('save', function (next) {
  this.$locals.wasNew = this.isNew;
  next();
});
notificationSchema.post('save', async function (doc) {
  if (doc.$locals.wasNew) await require('../utils/push').pushNotifications([doc]);
});
notificationSchema.post('insertMany', async function (docs) {
  await require('../utils/push').pushNotifications(docs);
});

module.exports = mongoose.model('Notification', notificationSchema);
