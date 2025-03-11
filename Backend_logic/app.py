from flask import Flask, request, jsonify
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch
import time
from flask_cors import CORS 

app = Flask(__name__)
CORS(app)  # Allow requests from React frontend

# Loading RoBERTa AI Detector Model
MODEL_NAME = "roberta-base-openai-detector"  
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

@app.route("/analyze", methods=["POST"])
def analyze_text():
    data = request.json
    text = data.get("text", "")

    if not text.strip():
        return jsonify({"error": "Text is required"}), 400

    # Tokenize and predict
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)

    scores = torch.nn.functional.softmax(outputs.logits, dim=-1)
    ai_score = scores[0][1].item()  # Confidence of AI-generated
    human_score = scores[0][0].item()  # Confidence of human-written

    result = {
        "label": "AI" if ai_score > human_score else "Human",
        "confidence": round(max(ai_score, human_score) * 100, 2),
    }

    return jsonify(result)

@app.route("/train", methods=["POST"])
def train_model():
    """
    Simulate training process when given human and AI text.
    This is a mock implementation since real fine-tuning requires large datasets and GPU resources.
    """
    data = request.json
    human_text = data.get("human_text", "").strip()
    ai_text = data.get("ai_text", "").strip()

    if not human_text or not ai_text:
        return jsonify({"error": "Both human and AI text are required for training."}), 400

    # Simulating training process
    time.sleep(3) 
    feedback = f"Model has been fine-tuned using the provided samples."

    return jsonify({"message": feedback, "status": "Training completed"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
