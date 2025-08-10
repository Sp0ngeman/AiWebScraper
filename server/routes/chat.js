const express = require('express');
const axios = require('axios');
const router = express.Router();
const { loadSettings, saveSettings } = require('../lib/settings');

// In-memory chat store for demo purposes
const conversations = new Map(); // id -> [{role, content, ts}]

router.get('/settings', (req, res) => {
  res.json(loadSettings());
});

router.post('/settings', (req, res) => {
  const next = saveSettings(req.body || {});
  res.json(next);
});

router.post('/chat', async (req, res) => {
  const { conversationId = 'default', message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });
  const settings = loadSettings();
  const history = conversations.get(conversationId) || [];
  history.push({ role: 'user', content: message, ts: Date.now() });

  const systemPrompt = `You are a helpful browser agent orchestrator. When the user asks to perform web tasks, describe the plan and then request to run 'browser-use' actions. Keep responses concise.`;
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(({ role, content }) => ({ role, content })),
  ];

  try {
    // Call selected LLM
    let completion;
    if (settings.provider === 'openai' && settings.openai.apiKey) {
      completion = await axios.post(
        `${settings.openai.baseUrl}/v1/chat/completions`,
        { model: settings.openai.model, messages, temperature: 0.3, stream: false },
        { headers: { Authorization: `Bearer ${settings.openai.apiKey}` } }
      );
      completion = completion.data.choices?.[0]?.message?.content || '';
    } else {
      completion = await axios.post(
        `${settings.local.baseUrl}/v1/chat/completions`,
        { model: settings.local.model, messages, temperature: 0.3, stream: false },
        { headers: { 'Content-Type': 'application/json' } }
      );
      completion = completion.data.choices?.[0]?.message?.content || '';
    }

    const assistantMsg = completion.trim();
    history.push({ role: 'assistant', content: assistantMsg, ts: Date.now() });
    conversations.set(conversationId, history);

    res.json({ conversationId, messages: history });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// SSE stream for agent steps (placeholder: emits periodic keepalive)
router.get('/stream/agent', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const timer = setInterval(() => {
    res.write(`event: keepalive\n`);
    res.write(`data: {"ts": ${Date.now()}}\n\n`);
  }, 15000);

  req.on('close', () => clearInterval(timer));
});

module.exports = router;

