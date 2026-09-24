require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const { connectRedis } = require('./config/redis');

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    await connectDB();
    await connectRedis();
    app.listen(PORT, () => {
      console.log(`✅ Inkwell API running on port ${PORT}`);
      console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
