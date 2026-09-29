import json
import random
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


# ============================================================
# BLOODBRIDGE AI - TRAINED DONOR MATCHING MODEL
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DATASET_PATH = BASE_DIR / "training_data.csv"
MODEL_PATH = BASE_DIR / "bloodbridge_model.joblib"
METRICS_PATH = BASE_DIR / "model_metrics.json"


RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)


BLOOD_GROUPS = [
    "O+",
    "O-",
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
]

URGENCY_LEVELS = [
    "Routine",
    "Urgent",
    "Critical",
]

AVAILABILITY_LEVELS = [
    "Available",
    "Unavailable",
]

GENDER_VALUES = [
    "Male",
    "Female",
    "Other",
]


# ============================================================
# ABO/Rh COMPATIBILITY
# This is used for training data generation AND remains a
# separate safety rule in the application.
# ============================================================

COMPATIBLE_DONORS = {
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


def is_compatible(donor_blood_group, recipient_blood_group):
    return donor_blood_group in COMPATIBLE_DONORS.get(
        recipient_blood_group,
        [],
    )


# ============================================================
# SYNTHETIC TRAINING DATA GENERATION
#
# This is explicitly synthetic data for a project prototype.
# It is NOT real patient/hospital data.
# ============================================================

def generate_training_dataset(number_of_rows=12000):
    rows = []

    for _ in range(number_of_rows):

        donor_blood_group = random.choice(BLOOD_GROUPS)
        recipient_blood_group = random.choice(BLOOD_GROUPS)

        donor_age = random.randint(18, 60)

        donor_gender = random.choice(GENDER_VALUES)

        donor_available = random.choices(
            AVAILABILITY_LEVELS,
            weights=[0.75, 0.25],
            k=1,
        )[0]

        distance_km = round(
            min(
                np.random.gamma(
                    shape=2.0,
                    scale=7.0,
                ),
                80,
            ),
            2,
        )

        estimated_travel_minutes = int(
            max(
                2,
                distance_km * random.uniform(2.0, 4.5)
                + random.randint(-5, 8),
            )
        )

        days_since_last_donation = random.randint(
            0,
            365,
        )

        donation_eligible = (
            days_since_last_donation >= 90
        )

        urgency = random.choices(
            URGENCY_LEVELS,
            weights=[0.20, 0.35, 0.45],
            k=1,
        )[0]

        units_required = random.randint(
            1,
            4,
        )

        donor_city = random.choice(
            [
                "Vizag",
                "Hyderabad",
                "Mumbai",
                "Chennai",
                "Bangalore",
                "Delhi",
                "Vijayawada",
                "Warangal",
            ]
        )

        recipient_city = random.choice(
            [
                "Vizag",
                "Hyderabad",
                "Mumbai",
                "Chennai",
                "Bangalore",
                "Delhi",
                "Vijayawada",
                "Warangal",
            ]
        )

        compatible = is_compatible(
            donor_blood_group,
            recipient_blood_group,
        )

        # ----------------------------------------------------
        # Latent suitability score used only to create synthetic
        # labels. The ML model itself will learn from features.
        # ----------------------------------------------------

        latent_score = 0.0

        if compatible:
            latent_score += 42
        else:
            latent_score -= 45

        if donor_available == "Available":
            latent_score += 22
        else:
            latent_score -= 20

        if distance_km <= 5:
            latent_score += 20
        elif distance_km <= 15:
            latent_score += 15
        elif distance_km <= 25:
            latent_score += 9
        elif distance_km <= 50:
            latent_score += 3
        else:
            latent_score -= 12

        if estimated_travel_minutes <= 15:
            latent_score += 10
        elif estimated_travel_minutes <= 30:
            latent_score += 6
        elif estimated_travel_minutes <= 60:
            latent_score += 2
        else:
            latent_score -= 5

        if donation_eligible:
            latent_score += 8
        else:
            latent_score -= 10

        if urgency == "Critical":
            if distance_km <= 15:
                latent_score += 7
            else:
                latent_score -= 5

        elif urgency == "Urgent":
            if distance_km <= 25:
                latent_score += 4

        if donor_city == recipient_city:
            latent_score += 3

        if donor_age < 18 or donor_age > 65:
            latent_score -= 20

        # ----------------------------------------------------
        # Add controlled noise so the ML task isn't perfectly
        # deterministic and the evaluation is more realistic.
        # ----------------------------------------------------

        latent_score += np.random.normal(
            loc=0,
            scale=7,
        )

        # Convert latent score to probability.
        probability = 1 / (
            1 + np.exp(
                -(latent_score - 45) / 10
            )
        )

        # Small random variation in the generated outcome.
        successful_match = (
            1
            if random.random() < probability
            else 0
        )

        rows.append(
            {
                "donor_blood_group": donor_blood_group,
                "recipient_blood_group": recipient_blood_group,
                "donor_age": donor_age,
                "donor_gender": donor_gender,
                "donor_available": donor_available,
                "distance_km": distance_km,
                "estimated_travel_minutes": estimated_travel_minutes,
                "days_since_last_donation": days_since_last_donation,
                "donation_eligible": donation_eligible,
                "urgency": urgency,
                "units_required": units_required,
                "donor_city": donor_city,
                "recipient_city": recipient_city,
                "successful_match": successful_match,
            }
        )

    return pd.DataFrame(rows)


# ============================================================
# TRAIN MODEL
# ============================================================

def train_model(df):

    feature_columns = [
        "donor_blood_group",
        "recipient_blood_group",
        "donor_age",
        "donor_gender",
        "donor_available",
        "distance_km",
        "estimated_travel_minutes",
        "days_since_last_donation",
        "donation_eligible",
        "urgency",
        "units_required",
        "donor_city",
        "recipient_city",
    ]

    target_column = "successful_match"

    X = df[feature_columns]
    y = df[target_column]

    categorical_features = [
        "donor_blood_group",
        "recipient_blood_group",
        "donor_gender",
        "donor_available",
        "urgency",
        "donor_city",
        "recipient_city",
    ]

    numerical_features = [
        "donor_age",
        "distance_km",
        "estimated_travel_minutes",
        "days_since_last_donation",
        "units_required",
    ]

    boolean_features = [
        "donation_eligible",
    ]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                OneHotEncoder(
                    handle_unknown="ignore",
                ),
                categorical_features,
            ),
            (
                "numerical",
                "passthrough",
                numerical_features,
            ),
            (
                "boolean",
                "passthrough",
                boolean_features,
            ),
        ]
    )

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=14,
        min_samples_split=6,
        min_samples_leaf=3,
        class_weight="balanced",
        random_state=RANDOM_SEED,
        n_jobs=-1,
    )

    pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                preprocessor,
            ),
            (
                "model",
                model,
            ),
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=RANDOM_SEED,
        stratify=y,
    )

    print()
    print("=" * 60)
    print("TRAINING BLOODBRIDGE AI MODEL")
    print("=" * 60)

    print(f"Total samples : {len(df)}")
    print(f"Training data : {len(X_train)}")
    print(f"Testing data  : {len(X_test)}")

    print()
    print("Training Random Forest...")
    
    pipeline.fit(
        X_train,
        y_train,
    )

    predictions = pipeline.predict(
        X_test,
    )

    probabilities = pipeline.predict_proba(
        X_test
    )[:, 1]

    accuracy = accuracy_score(
        y_test,
        predictions,
    )

    precision = precision_score(
        y_test,
        predictions,
        zero_division=0,
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0,
    )

    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0,
    )

    confusion = confusion_matrix(
        y_test,
        predictions,
    )

    print()
    print("=" * 60)
    print("MODEL EVALUATION")
    print("=" * 60)

    print(
        f"Accuracy  : {accuracy * 100:.2f}%"
    )

    print(
        f"Precision : {precision * 100:.2f}%"
    )

    print(
        f"Recall    : {recall * 100:.2f}%"
    )

    print(
        f"F1 Score  : {f1 * 100:.2f}%"
    )

    print()
    print("Confusion Matrix:")
    print(confusion)

    print()
    print("Classification Report:")
    print(
        classification_report(
            y_test,
            predictions,
            target_names=[
                "Low/Not suitable",
                "High suitability",
            ],
            zero_division=0,
        )
    )

    # --------------------------------------------------------
    # Save model
    # --------------------------------------------------------

    model_package = {
        "pipeline": pipeline,
        "feature_columns": feature_columns,
        "model_name": "BloodBridge Random Forest Donor Matching Model",
        "model_type": "RandomForestClassifier",
        "training_samples": len(X_train),
        "testing_samples": len(X_test),
        "random_seed": RANDOM_SEED,
        "version": "1.0.0",
    }

    joblib.dump(
        model_package,
        MODEL_PATH,
    )

    # --------------------------------------------------------
    # Save evaluation metrics
    # --------------------------------------------------------

    metrics = {
        "model_name": "BloodBridge Random Forest Donor Matching Model",
        "model_type": "RandomForestClassifier",
        "dataset_type": "Synthetic prototype training data",
        "total_samples": int(len(df)),
        "training_samples": int(len(X_train)),
        "testing_samples": int(len(X_test)),
        "accuracy": round(
            float(accuracy),
            4,
        ),
        "precision": round(
            float(precision),
            4,
        ),
        "recall": round(
            float(recall),
            4,
        ),
        "f1_score": round(
            float(f1),
            4,
        ),
        "features": feature_columns,
        "safety_note": (
            "ABO/Rh compatibility must remain a separate "
            "hard safety filter. The ML model must not "
            "override blood-bank compatibility decisions."
        ),
    }

    with open(
        METRICS_PATH,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            metrics,
            file,
            indent=4,
        )

    return pipeline


# ============================================================
# TEST THE TRAINED MODEL WITH EXAMPLE DONORS
# ============================================================

def test_trained_model(pipeline):

    examples = pd.DataFrame(
        [
            {
                "donor_blood_group": "O+",
                "recipient_blood_group": "A+",
                "donor_age": 28,
                "donor_gender": "Male",
                "donor_available": "Available",
                "distance_km": 7.5,
                "estimated_travel_minutes": 18,
                "days_since_last_donation": 140,
                "donation_eligible": True,
                "urgency": "Critical",
                "units_required": 1,
                "donor_city": "Vizag",
                "recipient_city": "Vizag",
            },
            {
                "donor_blood_group": "AB+",
                "recipient_blood_group": "O+",
                "donor_age": 30,
                "donor_gender": "Female",
                "donor_available": "Available",
                "distance_km": 5,
                "estimated_travel_minutes": 12,
                "days_since_last_donation": 150,
                "donation_eligible": True,
                "urgency": "Critical",
                "units_required": 1,
                "donor_city": "Vizag",
                "recipient_city": "Vizag",
            },
        ]
    )

    predictions = pipeline.predict(
        examples
    )

    probabilities = pipeline.predict_proba(
        examples
    )[:, 1]

    print()
    print("=" * 60)
    print("TRAINED MODEL TEST")
    print("=" * 60)

    for index in range(
        len(examples)
    ):
        probability = probabilities[index] * 100

        prediction = (
            "HIGH SUITABILITY"
            if predictions[index] == 1
            else "LOW SUITABILITY"
        )

        print()
        print(
            f"Example {index + 1}"
        )

        print(
            f"Donor blood group    : "
            f"{examples.iloc[index]['donor_blood_group']}"
        )

        print(
            f"Recipient blood group: "
            f"{examples.iloc[index]['recipient_blood_group']}"
        )

        print(
            f"Distance             : "
            f"{examples.iloc[index]['distance_km']} km"
        )

        print(
            f"Travel time          : "
            f"{examples.iloc[index]['estimated_travel_minutes']} min"
        )

        print(
            f"AI probability       : "
            f"{probability:.2f}%"
        )

        print(
            f"Prediction           : "
            f"{prediction}"
        )

    print()
    print("=" * 60)
    print("MODEL SAVED SUCCESSFULLY")
    print("=" * 60)

    print(
        f"Model  : {MODEL_PATH}"
    )

    print(
        f"Metrics: {METRICS_PATH}"
    )

    print(
        f"Dataset: {DATASET_PATH}"
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 60)
    print("BLOODBRIDGE AI - MODEL TRAINING")
    print("=" * 60)

    print()
    print("Generating synthetic training dataset...")

    df = generate_training_dataset(
        number_of_rows=12000
    )

    df.to_csv(
        DATASET_PATH,
        index=False,
    )

    print(
        f"Training dataset created: "
        f"{DATASET_PATH}"
    )

    print(
        f"Rows generated: {len(df)}"
    )

    pipeline = train_model(
        df
    )

    test_trained_model(
        pipeline
    )


if __name__ == "__main__":
    main()