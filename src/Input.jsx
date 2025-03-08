import { useState } from "react";
import "./styles/input.css";

export default function AIDetector() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = () => {
    console.log("Submitted text:", text);
    setResult({
      label: Math.random() > 0.5 ? "AI" : "Human",
      confidence: (Math.random() * 100).toFixed(2),
    });
  };

  const handleClear = () => {
    setText("");
    setResult(null);
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
            <button className="button submit" onClick={handleSubmit} disabled={!text.trim()}>
              Analyze
            </button>
            <button className="button clear" onClick={handleClear}>
              Clear
            </button>
          </div>
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
