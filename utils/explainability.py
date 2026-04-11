"""
utils/explainability.py
-----------------------
SHAP-based per-transaction and global explainability for the LightGBM model.
"""
import numpy as np
import pandas as pd


def compute_shap_values(lgbm_model, scaler, X_test,
                        ae_errors_test, if_scores_test, feat_cols,
                        max_samples: int = 500):
    """
    Compute SHAP values for the LightGBM stage.
    Returns global feature importance and per-sample top contributors.
    """
    try:
        import shap
    except ImportError:
        return None, None

    # Build meta feature matrix (same as prediction)
    ae_norm  = scaler.transform(ae_errors_test.reshape(-1, 1)).flatten()
    X_meta   = np.column_stack([X_test, ae_norm, if_scores_test])
    all_cols = list(feat_cols) + ['ae_reconstruction_error', 'if_isolation_score']

    # Sample for speed on large datasets
    if len(X_meta) > max_samples:
        idx    = np.random.choice(len(X_meta), max_samples, replace=False)
        X_shap = X_meta[idx]
    else:
        X_shap = X_meta

    # Compute SHAP values
    explainer   = shap.TreeExplainer(lgbm_model)
    shap_values = explainer.shap_values(X_shap)

    # For binary classification shap returns list [class0, class1]
    if isinstance(shap_values, list):
        sv = shap_values[1]   # class 1 = fraud
    else:
        sv = shap_values

    # Global mean absolute SHAP importance
    mean_abs = np.abs(sv).mean(axis=0)
    n = min(len(mean_abs), len(all_cols))
    global_imp = sorted(
        [{'feature': all_cols[i], 'shap_importance': round(float(mean_abs[i]), 6)}
         for i in range(n)],
        key=lambda x: x['shap_importance'], reverse=True
    )[:15]

    return global_imp, sv, X_shap, all_cols


def explain_single_transaction(lgbm_model, scaler, X_single,
                                ae_error, if_score, feat_cols,
                                top_n: int = 8):
    """
    Explain a single transaction — returns top contributing features.
    """
    try:
        import shap
    except ImportError:
        return []

    ae_norm = float(scaler.transform([[ae_error]])[0][0])
    X_meta  = np.column_stack([X_single,
                                np.array([[ae_norm]]),
                                np.array([[if_score]])])
    all_cols = list(feat_cols) + ['ae_reconstruction_error', 'if_isolation_score']

    explainer   = shap.TreeExplainer(lgbm_model)
    shap_values = explainer.shap_values(X_meta)

    if isinstance(shap_values, list):
        sv = shap_values[1][0]
    else:
        sv = shap_values[0]

    n = min(len(sv), len(all_cols))
    contribs = sorted(
        [{'feature':    all_cols[i],
          'shap_value': round(float(sv[i]), 6),
          'direction':  'increases_risk' if sv[i] > 0 else 'decreases_risk',
          'feature_value': round(float(X_meta[0][i]), 4)}
         for i in range(n)],
        key=lambda x: abs(x['shap_value']), reverse=True
    )[:top_n]

    return contribs
