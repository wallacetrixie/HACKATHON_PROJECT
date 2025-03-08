import { useState } from "react";
import "./styles/input.css";

export default function AIDetector() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = () => {
    console.log("Submitted text:", text);
  };

  const handleClear = () => {
    setText("");
    setResult(null);
  };

  return (
    <div className="container">
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
        {result && (
          <div className="result-box">
            <h2>Analysis Result</h2>
            <p className={result.label === "AI" ? "ai-text" : "human-text"}>
              {result.label === "AI" ? "AI-Generated Content" : "Human-Written Content"}
            </p>
            <p>Confidence: {result.confidence}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
