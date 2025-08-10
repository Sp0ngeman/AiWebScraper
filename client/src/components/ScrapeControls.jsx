import React, { useState } from 'react';

export default function ScrapeControls({ onRun, loading, onExportJSON, onExportCSV, hasResults }) {
  const [headless, setHeadless] = useState(true);

  return (
    <div className="rounded-xl bg-white shadow p-4 border border-slate-100">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2">
          <input id="headless" type="checkbox" className="h-4 w-4" checked={headless} onChange={(e) => setHeadless(e.target.checked)} />
          <label htmlFor="headless" className="text-sm text-slate-700">Run headless</label>
        </div>

        <div className="flex gap-2">
          <button
            disabled={loading}
            onClick={() => onRun({ headless })}
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Scraping…' : 'Scrape Hacker News'}
          </button>

          <button
            disabled={!hasResults}
            onClick={onExportJSON}
            className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            Export JSON
          </button>

          <button
            disabled={!hasResults}
            onClick={onExportCSV}
            className="inline-flex items-center rounded-md bg-cyan-600 px-4 py-2 text-white text-sm font-medium hover:bg-cyan-700 disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}

