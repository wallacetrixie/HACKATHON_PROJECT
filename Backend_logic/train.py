import os
import pandas as pd
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer, Trainer, TrainingArguments
from datasets import Dataset

# Constants
DATASET_PATH = "dataset.csv"
MODEL_NAME = "roberta-base"
OUTPUT_DIR = "./fine_tuned_model"

# Ensure dataset exists
if not os.path.exists(DATASET_PATH):
    raise FileNotFoundError(f"Dataset file '{DATASET_PATH}' not found.")

# Load dataset
df = pd.read_csv(DATASET_PATH)

if "text" not in df.columns or "label" not in df.columns:
    raise ValueError("Dataset must contain 'text' and 'label' columns.")
df["label"] = df["label"].map({"human": 0, "ai": 1})

dataset = Dataset.from_pandas(df)

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=2)
def tokenize_function(examples):
    return tokenizer(examples["text"], truncation=True, padding="max_length", max_length=512)

tokenized_datasets = dataset.map(tokenize_function, batched=True)

# Define training arguments
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    logging_dir="./logs",
    per_device_train_batch_size=8, 
    num_train_epochs=5,  
    weight_decay=0.01,
    save_total_limit=2, 
    logging_steps=10,
)

# Trainer setup
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_datasets,
)


trainer.train()

model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

print(f"✅ Fine-tuning completed! Model saved at '{OUTPUT_DIR}'")
