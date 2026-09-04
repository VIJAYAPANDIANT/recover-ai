import app from './app.js';
import prisma from './utils/prisma.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('📦 Connected to PostgreSQL database via Prisma');

    const server = app.listen(PORT, () => {
      console.log(`🚀 RecoverAI API server is running on http://localhost:${PORT}`);
      console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Dashboard metrics: http://localhost:${PORT}/api/dashboard/metrics`);
      console.log(`💳 Payments API: http://localhost:${PORT}/api/payments`);
      console.log(`🛡️  Recovery cases: http://localhost:${PORT}/api/recovery/cases`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('PostgreSQL connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
