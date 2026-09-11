import express from 'express';

const PORT = Number(process.env.PORT ?? 4000);

const app = express();

// Liveness endpoint. The GraphQL API is added in later phases.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Listen on all interfaces so a phone on the same Wi-Fi network can reach the API.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
