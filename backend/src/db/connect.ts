import mongoose from 'mongoose';

// We wait at most 10 seconds for MongoDB. After that we give up.
const SERVER_SELECTION_TIMEOUT_MS = 10_000;

export async function connectDb(uri: string): Promise<void> {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS });
  console.log('MongoDB connected');

  // These events can fire later, while the server runs. We only log them.
  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });
}

// Tells if the database is connected right now. The health endpoint uses this.
export function getDbStatus(): 'connected' | 'disconnected' {
  const isConnected = mongoose.connection.readyState === mongoose.ConnectionStates.connected;
  return isConnected ? 'connected' : 'disconnected';
}
