import Constants from 'expo-constants';

const API_PORT = 4000;

// Finds the address of the backend, in this order:
// 1. EXPO_PUBLIC_API_URL from the .env file, when it is set.
// 2. The computer that runs "expo start", on port 4000. Expo Go knows that address.
// 3. localhost, for the web target.
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv;
  }

  const devServerHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (devServerHost) {
    return `http://${devServerHost}:${API_PORT}/graphql`;
  }

  return `http://localhost:${API_PORT}/graphql`;
}

export const API_URL = resolveApiUrl();
