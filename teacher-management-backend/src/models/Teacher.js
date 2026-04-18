const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    teacherId: {
      type: String,
      unique: true,
    },
    // Personal Information
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
    },
    phone: String,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    profilePhoto: String,

    // Professional Information
    employmentType: {
      type: String,
      enum: ['permanent', 'temporary', 'part-time'],
      default: 'permanent',
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    department: String,
    subjects: [String],
    grades: [String],
    qualifications: [
      {
        degree: String,
        institution: String,
        year: Number,
        field: String,
      },
    ],
    certifications: [
      {
        name: String,
        issuedBy: String,
        year: Number,
        documentUrl: String,
      },
    ],
    experience: [
      {
        institution: String,
        role: String,
        from: Date,
        to: Date,
        description: String,
      },
    ],
    documents: [
      {
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Salary Structure
    salaryStructure: {
      baseSalary: { type: Number, default: 0 },
      allowances: { type: Number, default: 0 },
      transportAllowance: { type: Number, default: 0 },
      housingAllowance: { type: Number, default: 0 },
    },

    // Audit Trail
    changeHistory: [
      {
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        changes: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate teacherId before saving
teacherSchema.pre('save', async function (next) {
  if (!this.teacherId) {
    const count = await mongoose.model('Teacher').countDocuments();
    this.teacherId = `TCH${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Teacher', teacherSchema);
