import React, { useMemo, useState } from 'react';
import Chat from './components/Chat.jsx';
import SettingsModal from './components/SettingsModal.jsx';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-900 text-white py-6 shadow">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">AI Browser Agent</h1>
              <p className="text-slate-300">Chat interface with LLM + Browser-Use orchestration</p>
            </div>
            <button onClick={() => setShowSettings(true)} className="rounded-md bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600">Settings</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Chat />
      </main>

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

