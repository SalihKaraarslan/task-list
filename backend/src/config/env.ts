import dotenv from 'dotenv';

// Load the .env file into process.env. "quiet" hides the dotenv log line.
dotenv.config({ quiet: true });

// Read one value that must exist. Stop with a clear message if it is missing.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Read the port. Use 4000 when PORT is not set.
function parsePort(value: string | undefined): number {
  const port = Number(value ?? 4000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${value}`);
  }
  return port;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';

// All config lives here. Other files import "env" and never read process.env.
export const env = Object.freeze({
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: parsePort(process.env.PORT),
  mongodbUri: requireEnv('MONGODB_URI'),
});
