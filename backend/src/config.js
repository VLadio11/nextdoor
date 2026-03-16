'use strict';

const settings = {
  databaseUrl: process.env.DATABASE_URL || '',

  // Nextdoor API
  nextdoorApiKey: process.env.NEXTDOOR_API_KEY || '',
  nextdoorApiSecret: process.env.NEXTDOOR_API_SECRET || '',

  // Simulation mode — use when official API approval is pending
  simMode: process.env.SIM_MODE !== 'false',

  // SMTP Email
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  smtpFrom: process.env.SMTP_FROM || 'Nextdoor Monitor <alerts@yourdomain.com>',
  smtpUseTls: process.env.SMTP_USE_TLS !== 'false',

  // Polling
  pollIntervalSeconds: parseInt(process.env.POLL_INTERVAL_SECONDS || '300', 10),
  nextdoorRequestsPerMinute: parseInt(process.env.NEXTDOOR_REQUESTS_PER_MINUTE || '10', 10),

  // App
  environment: process.env.ENVIRONMENT || 'development',
  logLevel: process.env.LOG_LEVEL || 'INFO',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((s) => s.trim()),
};

module.exports = { settings };
