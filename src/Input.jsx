import { useState } from "react";
import axios from "axios";
import "./styles/input.css";

export default function AIDetector() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post("http://127.0.0.1:5000/analyze", { text });
      setResult(response.data);
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

  return (
    <div className="container">
      {/* Left Section - Input */}
      <div className="left-section">
        <div className="card">
          <h1 className="title">AI Content Detector</h1>
          <textarea
            className="text-area"
            rows="5"
            placeholder="Enter text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="button-group">
            <button className="button submit" onClick={handleSubmit} disabled={!text.trim() || loading}>
              {loading ? "Analyzing..." : "Analyze"}
            </button>
            <button className="button clear" onClick={handleClear}>
              Clear
            </button>
          </div>
          {error && <p className="error-text">{error}</p>}
        </div>
      </div>

      {/* Right Section - Result */}
      <div className="right-section">
        {result && (
          <div className="result-box">
            <h2 className="result-title">Analysis Result</h2>
            <p className={result.label === "AI" ? "ai-text" : "human-text"}>
              {result.label === "AI" ? "AI-Generated Content" : "Human-Written Content"}
            </p>
            <p className="confidence">Confidence: {result.confidence}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
