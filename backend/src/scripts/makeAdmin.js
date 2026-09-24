/**
 * One-time CLI script to make a user an admin. Admin accounts should
 * never be created through the public registration form — this is the
 * deliberate "only I can do this from the server" door.
 *
 * Usage:
 *   cd backend
 *   node src/scripts/makeAdmin.js user@example.com
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node src/scripts/makeAdmin.js <email>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { role: 'admin' },
    { new: true }
  );

  if (!user) {
    console.error(`No user found with email: ${email}`);
  } else {
    console.log(`✅ ${user.name} (${user.email}) is now an admin.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
