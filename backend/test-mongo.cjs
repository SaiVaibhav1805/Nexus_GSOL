const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      retryWrites: true,
      w: 'majority',
      appName: 'Cluster0'
    });
    console.log("Connected successfully");
  } catch (err) {
    console.error("Connection error:", err.message);
  } finally {
    process.exit(0);
  }
}
test();
