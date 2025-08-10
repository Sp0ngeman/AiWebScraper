const fs = require('fs');
const path = require('path');

const runtimeDir = path.join(__dirname, '..', '.runtime');
const settingsPath = path.join(runtimeDir, 'settings.json');

const defaultSettings = {
  provider: 'local', // 'local' | 'openai'
  openai: {
    apiKey: '',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com'
  },
  local: {
    baseUrl: process.env.LOCAL_LLM_URL || 'http://127.0.0.1:1234',
    model: process.env.LOCAL_LLM_MODEL || 'deepseek/deepseek-r1-0528-qwen3-8b'
  }
};

function ensureRuntimeDir() {
  if (!fs.existsSync(runtimeDir)) {
    try { fs.mkdirSync(runtimeDir, { recursive: true }); } catch (_) {}
  }
}

function loadSettings() {
  try {
    ensureRuntimeDir();
    if (!fs.existsSync(settingsPath)) return { ...defaultSettings };
    const raw = fs.readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch (_) {
    return { ...defaultSettings };
  }
}

function saveSettings(next) {
  ensureRuntimeDir();
  const merged = { ...defaultSettings, ...next };
  fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

module.exports = { loadSettings, saveSettings, defaultSettings };

