import { useEffect, useState } from "react";
import axios from "axios";
import "./styles/input.css";

const STORAGE_KEY = 'ai_detector_history_v1';

export default function AIDetector() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    function onLoad(e) {
      if (e?.detail?.text) {
        setText(e.detail.text);
        setResult(null);
        setError("");
      }
    }
    window.addEventListener('loadHistoryItem', onLoad);
    return () => window.removeEventListener('loadHistoryItem', onLoad);
  }, []);

  const [threshold, setThreshold] = useState(() => Number(localStorage.getItem('ai_detector_threshold') || 50));

  useEffect(() => {
    const t = Number(localStorage.getItem('ai_detector_threshold') || 50);
    setThreshold(t);
  }, []);

  useEffect(() => {
    function onThreshold(e){ if (e?.detail?.threshold) setThreshold(Number(e.detail.threshold)); }
    window.addEventListener('thresholdChanged', onThreshold);
    return () => window.removeEventListener('thresholdChanged', onThreshold);
  }, []);

  const saveToHistory = (payload) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(payload);
      // keep most recent 50
      const trimmed = arr.slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      console.error('Save history failed', err);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post("http://127.0.0.1:5000/analyze", { text });
      setResult(response.data);
      saveToHistory({ text, result: response.data, time: Date.now() });
    } catch (err) {
      setError("Failed to analyze text. Try again.");
    }

    setLoading(false);
  };

  const handleClear = () => {
    setText("");
    setResult(null);
    setError("");
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ''));
    reader.readAsText(file);
  };

  const wordCount = (s='') => String(s).trim() === '' ? 0 : String(s).trim().split(/\s+/).length;

  const copyResult = async () => {
    if (!result) return;
    try { await navigator.clipboard.writeText(JSON.stringify(result, null, 2)); setSaved(true); setTimeout(()=>setSaved(false),1200); } catch (err){ }
  };

  const handleQuickSave = () => {
    if (!text.trim()) return;
    saveToHistory({ text, result: result || null, time: Date.now() });
  };

  return (
    <div className="container">
      {/* Left Section - Input */}
      <div className="left-section">
        <div className="card">
          <h1 className="title">AI Content Detector</h1>
          <textarea
            className="text-area"
            rows="6"
            placeholder="Enter text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:12 }}>
            <input type="file" accept=".txt" onChange={handleFile} />
            <div style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 13 }}>{wordCount(text)} words</div>
          </div>

          <div className="button-group">
            <button className="button submit" onClick={handleSubmit} disabled={!text.trim() || loading}>
              {loading ? "Analyzing..." : "Analyze"}
            </button>
            <button className="button clear" onClick={handleClear}>
              Clear
            </button>
            <button className="button clear" onClick={handleQuickSave} title="Save current input to history">
              Save
            </button>
          </div>
          {saved && <p className="status-message">Saved to history</p>}
          {error && <p className="error-text">{error}</p>}
        </div>
      </div>

      {/* Right Section - Result */}
      <div className="right-section">
        {result && (
          <div className="result-box">
            <div className="result-details">
              <h2 className="result-title">Analysis Result</h2>
              <div>
                <button className="copy-btn" onClick={copyResult}>Copy</button>
              </div>
            </div>

            {/* prefer server label, otherwise use client threshold */}
            <p className={(result.label ? (result.label === 'AI' ? 'ai-text' : 'human-text') : (result.confidence >= threshold ? 'ai-text' : 'human-text'))}>
              {result.label ? (result.label === 'AI' ? 'AI-Generated Content' : 'Human-Written Content') : (result.confidence >= threshold ? 'AI-Generated Content' : 'Human-Written Content')}
            </p>
            <p className="confidence">Confidence: {result.confidence}%</p>
            <p className="small-note">Client threshold: {threshold}% — server value shown above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
