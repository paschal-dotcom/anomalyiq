"""utils/model_manager.py - Save and load trained model bundles."""
import os
import joblib
import numpy as np
import tensorflow as tf


TRAINED_DIR = os.path.join(os.path.dirname(__file__), '..', 'trained_models')
os.makedirs(TRAINED_DIR, exist_ok=True)


def model_path(dataset_type: str, filename: str) -> str:
    d = os.path.join(TRAINED_DIR, dataset_type)
    os.makedirs(d, exist_ok=True)
    return os.path.join(d, filename)


def save_models(dataset_type: str, ae_model, if_model,
                lgbm_model, lgbm_scaler,
                ae_threshold: float, feature_cols: list,
                metrics: dict):
    ae_model.save(model_path(dataset_type, 'autoencoder.keras'))
    joblib.dump(if_model,    model_path(dataset_type, 'isolation_forest.pkl'))
    joblib.dump(lgbm_model,  model_path(dataset_type, 'lightgbm.pkl'))
    joblib.dump(lgbm_scaler, model_path(dataset_type, 'lgbm_scaler.pkl'))
    joblib.dump({
        'ae_threshold': ae_threshold,
        'feature_cols': feature_cols,
        'metrics':      metrics,
        'dataset_type': dataset_type,
    }, model_path(dataset_type, 'metadata.pkl'))
    print(f"[ModelManager] Saved {dataset_type} models to {TRAINED_DIR}")


def load_models(dataset_type: str):
    base = model_path(dataset_type, '')
    ae   = tf.keras.models.load_model(model_path(dataset_type, 'autoencoder.keras'))
    ifm  = joblib.load(model_path(dataset_type, 'isolation_forest.pkl'))
    lgbm = joblib.load(model_path(dataset_type, 'lightgbm.pkl'))
    sc   = joblib.load(model_path(dataset_type, 'lgbm_scaler.pkl'))
    meta = joblib.load(model_path(dataset_type, 'metadata.pkl'))
    return ae, ifm, lgbm, sc, meta


def available_models() -> list:
    if not os.path.exists(TRAINED_DIR):
        return []
    out = []
    for d in os.listdir(TRAINED_DIR):
        meta_path = os.path.join(TRAINED_DIR, d, 'metadata.pkl')
        if os.path.exists(meta_path):
            meta = joblib.load(meta_path)
            out.append({
                'dataset_type': d,
                'metrics':      meta.get('metrics', {}),
                'feature_count': len(meta.get('feature_cols', [])),
            })
    return out


def model_exists(dataset_type: str) -> bool:
    return os.path.exists(model_path(dataset_type, 'metadata.pkl'))
