const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import database for connection test
const db = require('./src/config/database');

// Import routes
const foodRoutes = require('./src/routes/food');
const patientRoutes = require('./src/routes/patient');
const dietChartRoutes = require('./src/routes/dietChart');
const authRoutes = require('./src/routes/auth'); // Missing route
const advancedFoodRoutes = require('./src/routes/advancedFood'); // Missing route
const recommendationRoutes = require('./src/routes/recommendation'); // Missing route

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Test database connection on startup
async function initializeServer() {
  console.log('🚀 Initializing NutriVeda Backend...');
  const dbConnected = await db.testConnection();
  if (!dbConnected) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }
}

// Base API route - provides information about available endpoints
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NutriVeda API v1',
    version: '1.0.0',
    endpoints: {
      foods: '/api/v1/foods',
      patients: '/api/v1/patients',
      dietCharts: '/api/v1/diet-charts',
      auth: '/api/v1/auth',
      advancedFoods: '/api/v1/advanced-foods',
      recommendations: '/api/v1/recommendations',
      health: '/health'
    },
    documentation: 'Visit individual endpoints for available operations'
  });
});

// Routes
app.use('/api/v1/foods', foodRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/diet-charts', dietChartRoutes);
app.use('/api/v1/auth', authRoutes); // Added auth routes
app.use('/api/v1/advanced-foods', advancedFoodRoutes); // Added advanced food routes
app.use('/api/v1/recommendations', recommendationRoutes); // Added recommendation routes

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbStatus = await db.testConnection();
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'NutriVeda Backend',
    database: dbStatus ? 'Connected' : 'Disconnected',
    version: '1.0.0'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, async () => {
  await initializeServer();
  console.log(`🚀 NutriVeda Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API Base URL: http://localhost:${PORT}/api/v1`);
});

module.exports = app;