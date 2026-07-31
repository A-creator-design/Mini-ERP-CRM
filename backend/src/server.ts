import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function start() {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL via Prisma');

    app.listen(env.port, () => {
      console.log(`ERP+CRM API listening on port ${env.port} [${env.nodeEnv}]`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();
