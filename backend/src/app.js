const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const bookRoutes = require('./routes/book.routes');
const chapterRoutes = require('./routes/chapter.routes');
const pageRoutes = require('./routes/page.routes');
const aiRoutes = require('./routes/ai.routes');
const uploadRoutes = require('./routes/upload.routes');
const characterRoutes = require('./routes/character.routes');
const versionRoutes = require('./routes/version.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const creditsRoutes = require('./routes/credits.routes');
const adminRoutes = require('./routes/admin.routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// ==========================================
// Proxy & Security Headers Configuration
// ==========================================
// Enable if behind Nginx or Docker reverse proxy for rate-limiting & IP accuracy
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false
  })
);

// ==========================================
// Production-Grade CORS Configuration
// ==========================================
const defaultOrigins = ['http://localhost', 'http://localhost:3000','https://pushtaklekhan.spmeshram.tech'];

const allowedOrigins = process.env.CLIENT_URL
  ? Array.from(new Set([...process.env.CLIENT_URL.split(',').map((o) => o.trim()), ...defaultOrigins]))
  : defaultOrigins;

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, server-to-server, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS Error: Origin ${origin} is not allowed by policy.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // Cache preflight requests for 24 hours
};

app.use(cors(corsOptions));

// ==========================================
// Rate Limiters
// ==========================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);
app.use('/api/ai/', aiLimiter);

// ==========================================
// Middleware Pipelines
// ==========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) =>
  res.status(200).json({ status: 'ok', service: 'Inkwell API', timestamp: new Date().toISOString() })
);

// ==========================================
// API Routes
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all 404 handler
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
);

// Global Centralized Error Middleware
app.use(errorMiddleware);

module.exports = app;