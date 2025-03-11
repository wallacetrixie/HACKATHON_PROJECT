import { useState } from "react";
import axios from "axios";
import "./styles/FineTuneModel.css"; 

const FineTuneModel = () => {
  const [humanText, setHumanText] = useState("");
  const [aiText, setAiText] = useState("");
  const [trainingStatus, setTrainingStatus] = useState("");

  const handleTrainModel = async () => {
    if (!humanText.trim() || !aiText.trim()) {
      setTrainingStatus("Both text fields are required.");
      return;
    }

    setTrainingStatus("Training in progress...");

    try {
      const response = await axios.post("http://localhost:5000/train", {
        human_text: humanText,
        ai_text: aiText,
      });
      setTrainingStatus(response.data.message);
    } catch (error) {
      setTrainingStatus("Error training the model. Please try again.");
    }
  };

  return (
    <div className="fine-tune-container">
      <h2 className="title">Fine-Tune AI Detector</h2>

      <textarea
        className="text-area"
        placeholder="Enter human-written text"
        value={humanText}
        onChange={(e) => setHumanText(e.target.value)}
      />

      <textarea
        className="text-area"
        placeholder="Enter AI-generated text"
        value={aiText}
        onChange={(e) => setAiText(e.target.value)}
      />

      <button className="train-button" onClick={handleTrainModel}>
        Train Model
      </button>

      {trainingStatus && <p className="status-message">{trainingStatus}</p>}
    </div>
  );
};

export default FineTuneModel;
