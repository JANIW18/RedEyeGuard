import pandas as pd
import numpy as np
import pickle
import json
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

print("Training Redeye Guard Phishing Detector...")

# Load the UCI dataset
df = pd.read_csv('dataset1.csv')
print(f"Loaded {len(df)} samples")

# Clean column names (remove spaces)
df.columns = df.columns.str.strip()

# Map target: -1 (legitimate) -> 0, 1 (phishing) -> 1
df['target'] = df['Result'].map({-1: 0, 1: 1})

# All 30 features
feature_columns = [
    'having_IPhaving_IP_Address', 'URLURL_Length', 'Shortining_Service',
    'having_At_Symbol', 'double_slash_redirecting', 'Prefix_Suffix',
    'having_Sub_Domain', 'SSLfinal_State', 'Domain_registeration_length',
    'Favicon', 'port', 'HTTPS_token', 'Request_URL', 'URL_of_Anchor',
    'Links_in_tags', 'SFH', 'Submitting_to_email', 'Abnormal_URL',
    'Redirect', 'on_mouseover', 'RightClick', 'popUpWidnow', 'Iframe',
    'age_of_domain', 'DNSRecord', 'web_traffic', 'Page_Rank',
    'Google_Index', 'Links_pointing_to_page', 'Statistical_report'
]

X = df[feature_columns].astype(float)
y = df['target']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train XGBoost model
model = xgb.XGBClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    use_label_encoder=False,
    eval_metric='logloss'
)

model.fit(X_train_scaled, y_train)

# Evaluate
y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print(f"\n Model Performance:")
print(f"Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
print(f"Precision: {precision:.4f} ({precision*100:.2f}%)")
print(f"Recall:    {recall:.4f} ({recall*100:.2f}%)")
print(f"F1 Score:  {f1:.4f} ({f1*100:.2f}%)")

# Save original pickle files (optional)
pickle.dump(model, open('phishing_model.pkl', 'wb'))
pickle.dump(scaler, open('scaler.pkl', 'wb'))
pickle.dump(feature_columns, open('feature_columns.pkl', 'wb'))

print("\n Pickle files saved.")


weights = model.feature_importances_.tolist()

model_json = {
    'weights': weights,
    'n_estimators': model.n_estimators
}
scaler_json = {
    'mean': scaler.mean_.tolist(),
    'scale': scaler.scale_.tolist()
}

with open('model.json', 'w') as f:
    json.dump(model_json, f)
with open('scaler.json', 'w') as f:
    json.dump(scaler_json, f)
with open('feature_columns.json', 'w') as f:
    json.dump(feature_columns, f)

print("JSON files saved for extension.")