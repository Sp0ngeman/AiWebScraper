const express = require('express');
const router = express.Router();
const { scrapeHackerNews } = require('../services/scraper');
const { exportJSON, exportCSV } = require('../utils/export');

// Minimal demo: scrape Hacker News front page titles and links
router.post('/scrape/hn', async (req, res) => {
  try {
    const { headless = true } = req.body || {};
    const data = await scrapeHackerNews({ headless });
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export received array of objects to JSON
router.post('/export/json', async (req, res) => {
  try {
    const { data, filename = 'scrape.json' } = req.body || {};
    if (!Array.isArray(data)) return res.status(400).json({ success: false, error: 'data must be an array' });
    const filePath = await exportJSON(data, filename);
    res.json({ success: true, filePath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export received array of objects to CSV
router.post('/export/csv', async (req, res) => {
  try {
    const { data, filename = 'scrape.csv' } = req.body || {};
    if (!Array.isArray(data)) return res.status(400).json({ success: false, error: 'data must be an array' });
    const filePath = await exportCSV(data, filename);
    res.json({ success: true, filePath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

