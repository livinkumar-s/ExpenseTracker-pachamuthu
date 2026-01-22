const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');

// Initialize express
const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(morgan('dev'));

// CORS configuration - allow frontend access
app.use(cors({
    origin: ['http://localhost:5173',
        'https://expense-tracker-pachamuthu.vercel.app/'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.'
    }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Parse cookies

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// API Documentation route
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'Expense Tracker API',
        version: '1.0.0',
        documentation: {
            baseUrl: 'https://expense-tracker-pachamuthu-backend1-three.vercel.app/api',
            endpoints: {
                auth: {
                    register: 'POST /api/auth/register',
                    login: 'POST /api/auth/login',
                    getProfile: 'GET /api/auth/me',
                    logout: 'GET /api/auth/logout'
                },
                transactions: {
                    getAll: 'GET /api/transactions',
                    getSummary: 'GET /api/transactions/summary',
                    getMonthly: 'GET /api/transactions/monthly',
                    getCategories: 'GET /api/categories',
                    getSingle: 'GET /api/transactions/:id',
                    create: 'POST /api/transactions',
                    update: 'PUT /api/transactions/:id',
                    delete: 'DELETE /api/transactions/:id'
                }
            }
        }
    });
});

// Health check endpoint
app.get('/health', async (req, res) => {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState;
    const dbStatusText = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting'
    }[dbStatus];

    res.status(200).json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
            status: dbStatusText,
            connected: dbStatus === 1
        }
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.redirect('/api');
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        requestedUrl: req.originalUrl
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Server configuration
const PORT = process.env.PORT || 3333;

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;