import React from 'react';

export default function ResultsTable({ data, loading }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600 shadow">
        Running scraper…
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600 shadow">
        No data yet. Run a scrape to see results.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Rank</th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Title</th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">URL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-slate-50">
              <td className="px-4 py-2 text-sm text-slate-700 w-16">{row.rank}</td>
              <td className="px-4 py-2 text-sm text-slate-800">{row.title}</td>
              <td className="px-4 py-2 text-sm text-indigo-700 underline truncate max-w-[420px]">
                <a href={row.url} target="_blank" rel="noreferrer">{row.url}</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

