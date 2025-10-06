import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'ai_detector_history_v1';

function emitLoadEvent(text) {
  const event = new CustomEvent('loadHistoryItem', { detail: { text } });
  window.dispatchEvent(event);
}

const Sidebar = () => {
  const [history, setHistory] = useState([]);
  const [threshold, setThreshold] = useState(() => Number(localStorage.getItem('ai_detector_threshold') || 50));
  const [dark, setDark] = useState(() => (localStorage.getItem('ai_detector_theme') === 'dark'));

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setHistory(JSON.parse(raw));
    // apply stored theme on mount
    try {
      const stored = localStorage.getItem('ai_detector_theme');
      if (stored === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
    } catch (err) {}
  }, []);

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    try {
      localStorage.setItem('ai_detector_theme', next ? 'dark' : 'light');
      if (next) document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme');
    } catch (err) {}
  };

  const handleThresholdChange = (e) => {
    const val = Number(e.target.value);
    setThreshold(val);
    localStorage.setItem('ai_detector_threshold', String(val));
  };

  const handleExport = () => {
    const data = JSON.stringify(history || [], null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai_detector_history.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (Array.isArray(parsed)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          setHistory(parsed);
        } else alert('Imported file must be an array of history objects');
      } catch (err) {
        alert('Invalid JSON');
      }
    };
    reader.readAsText(file);
  };

  const examples = [
    'Artificial intelligence is transforming how we write and create content.',
    'This essay was written by a student to explain their research project.',
    'In a world driven by AI, ethical considerations must be front and center.'
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>AI Tool</h3>
      </div>

      <div className="sidebar-controls">
        <button onClick={handleExport}>Export</button>
        <label className="import-label">
          Import
          <input type="file" accept="application/json" onChange={handleImport} style={{ display: 'none' }} />
        </label>
        <button onClick={handleClear}>Clear</button>
      </div>

      <div className="sidebar-section">
        <h4>Settings</h4>
        <div className="setting-row">
          <label>Threshold: <strong>{threshold}%</strong></label>
          <input type="range" min="1" max="100" value={threshold} onChange={handleThresholdChange} />
        </div>
        <div className="setting-row">
          <label>Theme</label>
          <button onClick={toggleTheme}>{dark ? 'Dark' : 'Light'}</button>
        </div>
      </div>

      <div className="sidebar-section">
        <h4>Examples</h4>
        <ul className="examples-list">
          {examples.map((ex, i) => (
            <li key={i}><button className="example-btn" onClick={() => emitLoadEvent(ex)}>{ex.length > 60 ? ex.slice(0,57) + '...' : ex}</button></li>
          ))}
        </ul>
      </div>

      <div className="history-list">
        <h4>History</h4>
        {history.length === 0 && <p className="muted">No history yet</p>}
        <ul>
          {history.map((item, idx) => (
            <li key={idx} className="history-item">
              <button onClick={() => emitLoadEvent(item.text)} className="history-btn">
                {item.text.length > 60 ? item.text.slice(0, 57) + '...' : item.text}
              </button>
              <small className="timestamp">{new Date(item.time).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
