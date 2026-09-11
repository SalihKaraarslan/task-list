import { env } from './config/env';
import { createApp } from './app';
import { connectDb } from './db/connect';

async function main(): Promise<void> {
  // Connect to the database first. If this fails, we do not start the server.
  await connectDb(env.mongodbUri);

  const app = await createApp();

  // Listen on all network interfaces, so a phone on the same Wi-Fi can reach the API.
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${env.port}`);
    console.log(`GraphQL endpoint: http://localhost:${env.port}/graphql`);
  });
}

main().catch((error: unknown) => {
  console.error('Failed to start the server:', error);
  process.exit(1);
});
