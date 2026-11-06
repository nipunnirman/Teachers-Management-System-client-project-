const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'නම අවශ්‍යයි'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'ඊමේල් ලිපිනය අවශ්‍යයි'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'කරුණාකර වලංගු ඊමේල් ලිපිනයක් ඇතුළත් කරන්න'],
    },
    password: {
      type: String,
      required: [true, 'මුරපදය අවශ්‍යයි'],
      minlength: [8, 'මුරපදයේ අවම වශයෙන් අක්ෂර 8ක් තිබිය යුතුය'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'teacher'],
      default: 'teacher',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    loginHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        ip: String,
      },
    ],
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecret: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
