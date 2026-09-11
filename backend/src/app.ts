import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { env } from './config/env';
import { getDbStatus } from './db/connect';
import { formatError } from './graphql/formatError';
import { resolvers } from './graphql/resolvers';
import { typeDefs } from './graphql/typeDefs';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestLogger } from './middleware/requestLogger';

// Builds the Express app. The order of the middleware matters.
export async function createApp(): Promise<Express> {
  const app = express();

  // 1. Security headers. In development we turn off the Content-Security-Policy,
  //    because it blocks the Apollo Sandbox page that we use for testing.
  app.use(helmet(env.isProduction ? {} : { contentSecurityPolicy: false }));

  // 2. One log line per request.
  app.use(requestLogger);

  // 3. Health check. It also shows if the database is connected.
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', db: getDbStatus() });
  });

  // 4. GraphQL. Apollo must start before we can use it as middleware.
  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    formatError,
    // Introspection lets tools like Apollo Sandbox read the schema. We keep it off in production.
    introspection: !env.isProduction,
  });
  await apollo.start();

  // One endpoint for the whole GraphQL API.
  // cors: lets the mobile app call the API. express.json: reads the JSON request body.
  app.use('/graphql', cors<cors.CorsRequest>(), express.json(), expressMiddleware(apollo));

  // 5. Anything else is a 404 in JSON.
  app.use(notFoundHandler);

  // 6. Last: catch errors from any middleware above.
  app.use(errorHandler);

  return app;
}
