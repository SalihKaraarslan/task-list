import express from 'express';

import { env } from './config/env';
import { connectDb, getDbStatus } from './db/connect';

async function main(): Promise<void> {
  // Connect to the database first. If this fails, we do not start the server.
  await connectDb(env.mongodbUri);

  const app = express();

  // Health check. It also shows if the database is connected.
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', db: getDbStatus() });
  });

  // Listen on all network interfaces, so a phone on the same Wi-Fi can reach the API.
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${env.port}`);
  });
}

main().catch((error: unknown) => {
  console.error('Failed to start the server:', error);
  process.exit(1);
});
