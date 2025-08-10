import React, { useEffect, useState } from 'react';

export default function SettingsModal({ open, onClose }) {
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const res = await fetch('/api/settings');
      const json = await res.json();
      setSettings(json);
    })();
  }, [open]);

  if (!open) return null;
  if (!settings) return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center">
      <div className="rounded-xl bg-white p-6 w-full max-w-lg">Loading...</div>
    </div>
  );

  function update(path, value) {
    setSettings((prev) => {
      const next = { ...prev };
      const keys = path.split('.');
      let cur = next;
      keys.slice(0, -1).forEach((k) => (cur[k] = { ...cur[k] }));
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  }

  async function save() {
    setBusy(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center">
      <div className="rounded-xl bg-white w-full max-w-lg shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Settings</h2>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Provider</label>
            <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={settings.provider} onChange={(e) => update('provider', e.target.value)}>
              <option value="local">Local LLM</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>

          {settings.provider === 'openai' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">OpenAI API Key</label>
                <input type="password" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={settings.openai.apiKey} onChange={(e) => update('openai.apiKey', e.target.value)} placeholder="sk-..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Model</label>
                <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={settings.openai.model} onChange={(e) => update('openai.model', e.target.value)} />
              </div>
            </div>
          )}

          {settings.provider === 'local' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Local Base URL</label>
                <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={settings.local.baseUrl} onChange={(e) => update('local.baseUrl', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Model</label>
                <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={settings.local.model} onChange={(e) => update('local.model', e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-slate-300 px-3 py-2">Cancel</button>
          <button disabled={busy} onClick={save} className="rounded-md bg-indigo-600 text-white px-3 py-2 disabled:opacity-50">Save</button>
        </div>
      </div>
    </div>
  );
}

