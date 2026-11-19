const mongoose = require('mongoose');
const models = require('../models');

const INITIAL_SCHEMA_VERSION = '001-initialize-schema';

async function initializeSchema() {
  for (const model of Object.values(models)) {
    await model.createIndexes();
  }

  const { Category, Product } = models;
  const categoryNames = await Product.distinct('category', {
    category: { $type: 'string', $ne: '' },
  });

  for (const categoryName of categoryNames) {
    const category = await Category.findOrCreateByName(categoryName);
    await Product.updateMany(
      {
        category: categoryName,
        $or: [{ categoryId: { $exists: false } }, { categoryId: null }],
      },
      { $set: { categoryId: category._id } }
    );
  }
}

async function runMigrations() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB must be connected before running migrations.');
  }

  const migrationCollection = mongoose.connection.collection('_migrations');
  const migrationAlreadyApplied = await migrationCollection.findOne({ _id: INITIAL_SCHEMA_VERSION });
  if (migrationAlreadyApplied) {
    return;
  }

  await initializeSchema();
  await migrationCollection.updateOne(
    { _id: INITIAL_SCHEMA_VERSION },
    { $setOnInsert: { appliedAt: new Date() } },
    { upsert: true }
  );
  console.log(`Database migration applied: ${INITIAL_SCHEMA_VERSION}`);
}

module.exports = runMigrations;
