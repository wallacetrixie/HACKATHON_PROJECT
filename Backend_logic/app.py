from flask import Flask, request, jsonify
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch
from flask_cors import CORS  # Enables frontend-backend commun

app = Flask(__name__)
CORS(app)  # Allow requests from React frontend

# Load RoBERTa AI Detector Model
MODEL_NAME = "roberta-base-openai-detector"  # Ensure this model exists
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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)



