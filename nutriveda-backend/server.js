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

// Routes
app.use('/api/v1/foods', foodRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/diet-charts', dietChartRoutes);

// Health check endpoint
app.get( '/health', async (req, res) => {
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