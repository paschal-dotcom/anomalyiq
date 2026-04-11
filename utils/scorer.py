"""utils/scorer.py"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)


def combine_scores(ae_errors, if_scores, lgbm_proba,
                   w_ae=0.20, w_if=0.20, w_lgbm=0.60):
    sc      = MinMaxScaler()
    ae_norm = sc.fit_transform(ae_errors.reshape(-1, 1)).flatten()
    combined = w_ae * ae_norm + w_if * if_scores + w_lgbm * lgbm_proba
    return np.clip(combined, 0.0, 1.0)


def assign_risk(score: float) -> str:
    if score >= 0.85: return 'High'
    if score >= 0.70: return 'Medium'
    if score >= 0.50: return 'Low'
    return 'Normal'


def build_results_df(ae_errors, if_scores, lgbm_proba,
                     combined_scores, y_test=None):
    d = {
        'reconstruction_error':   np.round(ae_errors,       6),
        'isolation_score':        np.round(if_scores,        6),
        'lgbm_fraud_probability': np.round(lgbm_proba,       6),
        'combined_anomaly_score': np.round(combined_scores,  6),
        'is_anomaly':             (combined_scores >= 0.50).astype(int),
        'risk_level':             [assign_risk(s) for s in combined_scores],
    }
    if y_test is not None:
        d['true_label'] = y_test
    df = pd.DataFrame(d)
    df.index.name = 'transaction_id'
    df.index += 1
    return df


def compute_metrics(y_true, y_pred, y_scores) -> dict:
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()
    return {
        'precision':        round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        'recall':           round(float(recall_score(y_true, y_pred, zero_division=0)),    4),
        'f1_score':         round(float(f1_score(y_true, y_pred, zero_division=0)),        4),
        'auc_roc':          round(float(roc_auc_score(y_true, y_scores)),                  4),
        'true_positives':   int(tp),
        'true_negatives':   int(tn),
        'false_positives':  int(fp),
        'false_negatives':  int(fn),
    }
