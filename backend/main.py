from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd

# Load model and expected feature columns
model = joblib.load("model.pkl")
feature_columns = joblib.load("feature_columns.pkl")

# FastAPI setup
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input schema
class PatientInfo(BaseModel):
    arrival_hour: int
    day_of_week: str
    doctor_type: str
    patient_type: str

# Prediction endpoint
@app.post("/predict")
def predict_wait_time(data: PatientInfo):
    input_data = data.model_dump()  # replaces deprecated dict()
    df = pd.DataFrame([input_data])

    # One-hot encode input
    df = pd.get_dummies(df)

    # Add missing columns
    for col in feature_columns:
        if col not in df.columns:
            df[col] = 0

    # Ensure correct column order
    df = df[feature_columns]

    # Predict wait time
    prediction = model.predict(df)[0]
    return {"predicted_wait_time_minutes": round(prediction, 2)}
