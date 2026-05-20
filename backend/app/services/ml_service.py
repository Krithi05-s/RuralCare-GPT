import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import os

class MLService:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100)
        self.le_disease = LabelEncoder()
        self.le_risk = LabelEncoder()
        self.is_trained = False
        # Point to the root data directory, not the backend data directory
        self.data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/symptoms_data.csv"))
        self._train_model()

    def _train_model(self):
        try:
            if not os.path.exists(self.data_path):
                print(f"Data file not found at {self.data_path}")
                return

            df = pd.read_csv(self.data_path)
            
            # Multi-hot encoding for symptoms (order independent)
            all_symptoms = pd.concat([df['Symptom1'], df['Symptom2'], df['Symptom3']]).dropna().unique()
            
            X = pd.DataFrame(0, index=df.index, columns=all_symptoms)
            for idx, row in df.iterrows():
                for col in ['Symptom1', 'Symptom2', 'Symptom3']:
                    sym = row[col]
                    if pd.notna(sym) and sym in all_symptoms:
                        X.at[idx, sym] = 1

            y_disease = self.le_disease.fit_transform(df['Disease'])
            y_risk = self.le_risk.fit_transform(df['Risk_Level'])
            
            self.model_disease = RandomForestClassifier(n_estimators=100)
            self.model_disease.fit(X, y_disease)
            
            self.model_risk = RandomForestClassifier(n_estimators=100)
            self.model_risk.fit(X, y_risk)
            
            self.feature_columns = X.columns
            self.is_trained = True
            print("ML Models trained successfully.")
        except Exception as e:
            print(f"Error training ML models: {e}")

    def predict(self, symptoms: list):
        # Emergency severity detection logic
        emergency_symptoms = [
            "chest pain", "shortness of breath", "severe bleeding", 
            "unconsciousness", "breathing difficulty", "blood vomiting", 
            "vomiting blood", "labour pain", "labor pain", "heart attack"
        ]
        symptoms_lower = [s.lower() for s in symptoms]
        
        is_emergency = any(esm in s for esm in emergency_symptoms for s in symptoms_lower)
        if is_emergency:
            return {
                "condition": "Potential Emergency Condition",
                "risk_level": "Critical",
                "confidence": 95.0
            }

        if not self.is_trained:
            return self._heuristic_predict(symptoms)

        try:
            # 1. Exact / Overlap Matching (Best for small datasets)
            df = pd.read_csv(self.data_path)
            input_syms = set([s.lower().strip().replace(" ", "_") for s in symptoms])
            print("Predicting for input_syms:", input_syms)
            
            best_match = None
            max_overlap = 0
            
            for idx, row in df.iterrows():
                row_syms = set([str(row[col]).lower().replace(" ", "_") for col in ['Symptom1', 'Symptom2', 'Symptom3'] if pd.notna(row[col])])
                if row['Disease'] == 'Chickenpox':
                    print("Chickenpox row_syms:", row_syms)
                overlap = len(row_syms.intersection(input_syms))
                
                # If we have a very strong overlap, prefer the exact dataset match
                if overlap > max_overlap:
                    max_overlap = overlap
                    best_match = row
                    
            print(f"Max overlap: {max_overlap}, Best match: {best_match['Disease'] if best_match is not None else 'None'}")

                    
            # If at least 2 symptoms perfectly match a specific disease in our DB
            if best_match is not None and max_overlap >= 2:
                return {
                    "condition": best_match['Disease'],
                    "risk_level": best_match['Risk_Level'],
                    "confidence": min(95.0, 50.0 + (max_overlap * 15.0))
                }

            # 2. Fallback to ML Model for partial/fuzzy matches
            input_df = pd.DataFrame(0, index=[0], columns=self.feature_columns)
            
            for sym in symptoms:
                sym_clean = sym.lower().strip().replace(" ", "_")
                if sym_clean in self.feature_columns:
                    input_df.at[0, sym_clean] = 1
                else:
                    for col in self.feature_columns:
                        if sym_clean == col.lower() or (len(sym_clean) > 5 and sym_clean in col.lower()):
                            input_df.at[0, col] = 1

            
            disease_idx = self.model_disease.predict(input_df)[0]
            risk_idx = self.model_risk.predict(input_df)[0]
            
            disease_probs = self.model_disease.predict_proba(input_df)[0]
            confidence = max(disease_probs) * 100
            
            return {
                "condition": self.le_disease.inverse_transform([disease_idx])[0],
                "risk_level": self.le_risk.inverse_transform([risk_idx])[0],
                "confidence": round(confidence, 2)
            }
        except Exception as e:
            print(f"Prediction error: {e}")
            return self._heuristic_predict(symptoms)

    def _heuristic_predict(self, symptoms):
        # Basic heuristic if ML fails and it's not an emergency
        symptoms_lower = [s.lower() for s in symptoms]
        
        return {
            "condition": "General Health Issue",
            "risk_level": "Moderate",
            "confidence": 60.0
        }

ml_service = MLService()
