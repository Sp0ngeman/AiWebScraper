// Express API server entry
// - Serves scraping endpoints
// - Enables CORS for local Vite dev server
// - Provides JSON/CSV export endpoints

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });

const scrapeRoutes = require('./routes/scrape');
const chatRoutes = require('./routes/chat');
const agentRoutes = require('./routes/agent');

const app = express();
const PORT = process.env.API_PORT || process.env.PORT || 5174; // pick non-Vite port by default

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Health
app.get('/api/healthz', (_req, res) => {
  res.json({ ok: true });
});

// Routes
app.use('/api', scrapeRoutes);
app.use('/api', chatRoutes);
app.use('/api', agentRoutes);

// Ensure exports dir exists
const exportsDir = path.join(__dirname, '..', 'exports');
if (!fs.existsSync(exportsDir)) {
  try { fs.mkdirSync(exportsDir, { recursive: true }); } catch (_) {}
}

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});

