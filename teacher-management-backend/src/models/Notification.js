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

module.exports = mongoose.model('Notification', notificationSchema);
