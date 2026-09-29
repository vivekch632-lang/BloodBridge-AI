from pathlib import Path

import joblib
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ============================================================
# BLOODBRIDGE AI - TRAINED MODEL API
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "bloodbridge_model.joblib"


# ============================================================
# LOAD TRAINED MODEL
# ============================================================

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Trained model not found at: {MODEL_PATH}"
    )

model_package = joblib.load(
    MODEL_PATH
)

pipeline = model_package["pipeline"]

MODEL_NAME = model_package.get(
    "model_name",
    "BloodBridge Random Forest Donor Matching Model",
)

MODEL_VERSION = model_package.get(
    "version",
    "1.0.0",
)

FEATURE_COLUMNS = model_package[
    "feature_columns"
]


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="BloodBridge AI",
    description=(
        "Trained machine-learning donor matching API "
        "for the BloodBridge emergency blood platform."
    ),
    version=MODEL_VERSION,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST SCHEMA
# ============================================================

class DonorMatchRequest(BaseModel):

    donor_blood_group: str = Field(
        ...,
        description="Donor ABO/Rh blood group",
    )

    recipient_blood_group: str = Field(
        ...,
        description="Recipient ABO/Rh blood group",
    )

    donor_age: int = Field(
        ...,
        ge=18,
        le=100,
    )

    donor_gender: str = Field(
        ...,
    )

    donor_available: str = Field(
        ...,
        description="Available or Unavailable",
    )

    distance_km: float = Field(
        ...,
        ge=0,
    )

    estimated_travel_minutes: float = Field(
        ...,
        ge=0,
    )

    days_since_last_donation: int = Field(
        ...,
        ge=0,
    )

    donation_eligible: bool

    urgency: str = Field(
        ...,
        description="Routine, Urgent, or Critical",
    )

    units_required: int = Field(
        ...,
        ge=1,
    )

    donor_city: str

    recipient_city: str


# ============================================================
# RESPONSE HELPERS
# ============================================================

def probability_label(probability):

    if probability >= 0.80:
        return "Very High"

    if probability >= 0.65:
        return "High"

    if probability >= 0.50:
        return "Moderate"

    if probability >= 0.35:
        return "Low"

    return "Very Low"


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def root():

    return {
        "service": "BloodBridge AI",
        "status": "online",
        "model": MODEL_NAME,
        "model_version": MODEL_VERSION,
        "model_type": "RandomForestClassifier",
        "trained_model_loaded": True,
    }


# ============================================================
# MODEL INFORMATION
# ============================================================

@app.get("/model-info")
def model_info():

    return {
        "model_name": MODEL_NAME,
        "model_version": MODEL_VERSION,
        "model_type": "RandomForestClassifier",
        "trained_model_loaded": True,
        "features": FEATURE_COLUMNS,
    }


# ============================================================
# PREDICT DONOR SUITABILITY
# ============================================================

@app.post("/predict")
def predict(request: DonorMatchRequest):

    try:

        # ----------------------------------------------------
        # IMPORTANT SAFETY RULE
        #
        # The ML model does NOT replace blood compatibility
        # rules. Incompatible donor/recipient combinations
        # are rejected before model ranking.
        # ----------------------------------------------------

        compatibility_map = {
            "O+": ["O+", "O-"],
            "O-": ["O-"],
            "A+": ["A+", "A-", "O+", "O-"],
            "A-": ["A-", "O-"],
            "B+": ["B+", "B-", "O+", "O-"],
            "B-": ["B-", "O-"],
            "AB+": [
                "AB+",
                "AB-",
                "A+",
                "A-",
                "B+",
                "B-",
                "O+",
                "O-",
            ],
            "AB-": [
                "AB-",
                "A-",
                "B-",
                "O-",
            ],
        }

        compatible_donors = compatibility_map.get(
            request.recipient_blood_group,
            [],
        )

        if request.donor_blood_group not in compatible_donors:

            return {
                "success": True,
                "compatible": False,
                "ai_probability": 0.0,
                "ai_probability_percent": 0.0,
                "prediction": "Not suitable",
                "confidence_label": "Not applicable",
                "model_used": MODEL_NAME,
                "model_version": MODEL_VERSION,
                "message": (
                    "Donor is not ABO/Rh compatible with "
                    "the recipient. ML ranking was not used."
                ),
            }

        # ----------------------------------------------------
        # Prepare model input
        # ----------------------------------------------------

        input_data = pd.DataFrame(
            [
                {
                    "donor_blood_group":
                        request.donor_blood_group,

                    "recipient_blood_group":
                        request.recipient_blood_group,

                    "donor_age":
                        request.donor_age,

                    "donor_gender":
                        request.donor_gender,

                    "donor_available":
                        request.donor_available,

                    "distance_km":
                        request.distance_km,

                    "estimated_travel_minutes":
                        request.estimated_travel_minutes,

                    "days_since_last_donation":
                        request.days_since_last_donation,

                    "donation_eligible":
                        request.donation_eligible,

                    "urgency":
                        request.urgency,

                    "units_required":
                        request.units_required,

                    "donor_city":
                        request.donor_city,

                    "recipient_city":
                        request.recipient_city,
                }
            ]
        )

        # ----------------------------------------------------
        # Actual trained model prediction
        # ----------------------------------------------------

        prediction = pipeline.predict(
            input_data
        )[0]

        probability = pipeline.predict_proba(
            input_data
        )[0][1]

        probability_percent = round(
            float(probability) * 100,
            2,
        )

        prediction_text = (
            "High suitability"
            if int(prediction) == 1
            else "Low suitability"
        )

        confidence = probability_label(
            float(probability)
        )

        return {
            "success": True,
            "compatible": True,

            "ai_probability":
                round(float(probability), 4),

            "ai_probability_percent":
                probability_percent,

            "prediction":
                prediction_text,

            "confidence_label":
                confidence,

            "model_used":
                MODEL_NAME,

            "model_version":
                MODEL_VERSION,

            "model_type":
                "RandomForestClassifier",

            "message": (
                "Prediction generated by the trained "
                "BloodBridge machine-learning model."
            ),

            "safety_note": (
                "ABO/Rh compatibility remains a separate "
                "hard safety filter. Final transfusion "
                "decisions must be confirmed by qualified "
                "blood-bank professionals."
            ),
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# ============================================================
# SERVER ENTRY POINT
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "api:app",
        host="127.0.0.1",
        port=8000,
        reload=False,
    )