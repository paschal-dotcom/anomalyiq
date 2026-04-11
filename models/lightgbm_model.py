"""models/lightgbm_model.py"""
import numpy as np
from lightgbm import LGBMClassifier
from sklearn.preprocessing import MinMaxScaler
from imblearn.over_sampling import SMOTE


def train_lightgbm(X_full, y_full, ae_errors_full,
                   if_scores_full, random_state=42):
    sc      = MinMaxScaler()
    ae_norm = sc.fit_transform(ae_errors_full.reshape(-1, 1)).flatten()
    X_meta  = np.column_stack([X_full, ae_norm, if_scores_full])

    smote   = SMOTE(random_state=random_state, k_neighbors=5)
    X_res, y_res = smote.fit_resample(X_meta, y_full)

    lgbm = LGBMClassifier(
        n_estimators=500,
        learning_rate=0.03,
        max_depth=7,
        num_leaves=63,
        min_child_samples=20,
        reg_alpha=0.1,
        reg_lambda=0.1,
        class_weight='balanced',
        random_state=random_state,
        n_jobs=-1,
        verbose=-1,
    )
    lgbm.fit(X_res, y_res)
    return lgbm, sc


def predict_lightgbm(lgbm, scaler, X_test,
                     ae_errors_test, if_scores_test) -> np.ndarray:
    ae_norm = scaler.transform(ae_errors_test.reshape(-1, 1)).flatten()
    X_meta  = np.column_stack([X_test, ae_norm, if_scores_test])
    return lgbm.predict_proba(X_meta)[:, 1]
