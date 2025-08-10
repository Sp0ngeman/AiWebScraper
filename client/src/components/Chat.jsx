import React, { useEffect, useRef, useState } from 'react';

export default function Chat() {
  const [messages, setMessages] = useState([{ role: 'system', content: '💬 Ask me to browse or scrape. I can automate tasks using Browser-Use style actions.' }]);
  const [input, setInput] = useState('');
  const containerRef = useRef(null);
  const [runId, setRunId] = useState(null);
  const [steps, setSteps] = useState([]);
  const streamRef = useRef(null);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    });
  }

  useEffect(scrollToBottom, [messages]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });
    const json = await res.json();
    if (json?.messages) setMessages(json.messages);
  }

  async function startAgent() {
    const res = await fetch('/api/agent/run', { method: 'POST' });
    const json = await res.json();
    if (!json?.runId) return;
    setRunId(json.runId);
    setSteps([]);
    if (streamRef.current) {
      try { streamRef.current.close(); } catch (_) {}
    }
    const es = new EventSource(`/api/stream/agent/${json.runId}`);
    streamRef.current = es;
    es.addEventListener('step', (evt) => {
      try { setSteps((prev) => [...prev, JSON.parse(evt.data)]); } catch (_) {}
    });
    es.addEventListener('done', () => {
      es.close();
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow flex flex-col h-[70vh]">
        <div className="border-b border-slate-200 p-3 flex items-center justify-between">
          <div className="text-sm text-slate-600">Chat</div>
          <button onClick={startAgent} className="rounded-md bg-emerald-600 px-3 py-1.5 text-white text-sm">Run demo agent</button>
        </div>
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={
              m.role === 'user' ? 'ml-auto max-w-[80%] rounded-lg bg-indigo-600 text-white px-3 py-2' :
              m.role === 'assistant' ? 'mr-auto max-w-[80%] rounded-lg bg-slate-100 text-slate-900 px-3 py-2' :
              'mx-auto text-slate-600 text-sm'
            }>
              {m.content}
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 p-3 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} className="flex-1 rounded-md border border-slate-300 px-3 py-2" placeholder="Ask me to login, scrape, or navigate..." />
          <button onClick={send} className="rounded-md bg-indigo-600 px-4 py-2 text-white">Send</button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow h-[70vh] p-3">
        <h3 className="font-semibold mb-2">Agent Activity</h3>
        <p className="text-sm text-slate-600">Live stream of steps while the agent runs actions.</p>
        <div className="mt-3 h-[85%] overflow-y-auto text-sm text-slate-700 space-y-2">
          {steps.length === 0 ? (
            <div className="rounded border border-slate-100 p-2">No steps yet. Start a run.</div>
          ) : steps.map((s, i) => (
            <div key={i} className="rounded border border-slate-100 p-2">{s.msg || JSON.stringify(s)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

