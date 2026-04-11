"""models/isolation_forest_model.py"""
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import MinMaxScaler


def train_isolation_forest(X, n_estimators=200,
                            contamination=0.002, random_state=42):
    m = IsolationForest(n_estimators=n_estimators,
                        contamination=contamination,
                        random_state=random_state, n_jobs=-1)
    m.fit(X)
    return m


def compute_isolation_scores(model, X) -> np.ndarray:
    sc = MinMaxScaler()
    return sc.fit_transform(
        (-model.decision_function(X)).reshape(-1, 1)).flatten()
