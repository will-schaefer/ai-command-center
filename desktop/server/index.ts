import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { claude } from './routes/claude';
import { codex } from './routes/codex';
import { gemini } from './routes/gemini';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

// Tool routes
app.route('/api/claude', claude);
app.route('/api/codex', codex);
app.route('/api/gemini', gemini);

const port = 3001;
console.log(`Server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
