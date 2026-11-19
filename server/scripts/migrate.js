require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const runMigrations = require('../migrations');

async function migrate() {
  try {
    await connectDB();
    await runMigrations();
  } finally {
    await mongoose.disconnect();
  }
}

migrate().catch((err) => {
  console.error('Database migration failed:', err.message);
  process.exitCode = 1;
});
