import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib

# Load dataset
df = pd.read_csv("../data/hospital_data.csv")

# Convert to datetime
df['Date'] = pd.to_datetime(df['Date'], format='mixed')
df['Entry Time'] = pd.to_datetime(df['Entry Time'])
df['Post-Consultation Time'] = pd.to_datetime(df['Post-Consultation Time'])

# Combine Date + Time
df['entry_datetime'] = pd.to_datetime(df['Date'].dt.date.astype(str) + ' ' + df['Entry Time'].dt.time.astype(str))
df['post_consult_datetime'] = pd.to_datetime(df['Date'].dt.date.astype(str) + ' ' + df['Post-Consultation Time'].dt.time.astype(str))

# Calculate wait time in minutes
df['wait_time'] = (df['post_consult_datetime'] - df['entry_datetime']).dt.total_seconds() / 60
df = df[df['wait_time'] >= 0]  # Drop invalid rows

# Extract features
df['arrival_hour'] = df['entry_datetime'].dt.hour
df['day_of_week'] = df['Date'].dt.day_name()

# Keep needed columns
features = df[['arrival_hour', 'day_of_week', 'Doctor Type', 'Patient Type']]
features = features.rename(columns={
    'Doctor Type': 'doctor_type',
    'Patient Type': 'patient_type'
})
target = df['wait_time']

# One-hot encoding
features_encoded = pd.get_dummies(features)

# Save the column names
joblib.dump(features_encoded.columns.tolist(), "feature_columns.pkl")

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(features_encoded, target, test_size=0.2, random_state=42)

# Train model
model = RandomForestRegressor()
model.fit(X_train, y_train)

# Save the model
joblib.dump(model, "model.pkl")

print("✅ Model trained and saved as model.pkl")
