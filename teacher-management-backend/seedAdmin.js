require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminExists = await User.findOne({ email: 'admin@admin.com' });
    if (adminExists) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@admin.com',
      password: 'password123',
      role: 'admin',
    });

    console.log('Admin user created successfully:');
    console.log('Email:', admin.email);
    console.log('Password:', 'password123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
