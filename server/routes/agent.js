const express = require('express');
const router = express.Router();
const { createRun, getRun, endRun } = require('../lib/agentBus');

// SSE for a particular runId
router.get('/stream/agent/:runId', (req, res) => {
  const { runId } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const bus = getRun(runId) || createRun(runId);
  const onStep = (payload) => {
    res.write(`event: step\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };
  const onEnd = () => {
    res.write(`event: done\n`);
    res.write(`data: {"ok": true}\n\n`);
    res.end();
  };
  bus.on('step', onStep);
  bus.once('end', onEnd);

  req.on('close', () => {
    bus.off('step', onStep);
  });
});

// Kick off a fake run (placeholder until real browser-use integration)
router.post('/agent/run', async (req, res) => {
  const runId = `${Date.now()}`;
  const bus = createRun(runId);
  res.json({ runId });
  // Simulate some steps
  setTimeout(() => bus.emit('step', { msg: 'Launching browser...' }), 500);
  setTimeout(() => bus.emit('step', { msg: 'Navigating to site...' }), 1200);
  setTimeout(() => bus.emit('step', { msg: 'Extracting content...' }), 2200);
  setTimeout(() => endRun(runId), 3400);
});

module.exports = router;

