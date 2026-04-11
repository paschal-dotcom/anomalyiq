"""
utils/preprocessor.py
Handles both CreditCard and PaySim dataset formats automatically.
"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder


def detect_dataset_type(df: pd.DataFrame) -> str:
    """Auto-detect whether this is creditcard or paysim format."""
    if 'isFraud' in df.columns and 'type' in df.columns:
        return 'paysim'
    elif 'Class' in df.columns and 'V1' in df.columns:
        return 'creditcard'
    else:
        raise ValueError(
            "Unrecognised dataset format. "
            "Expected CreditCard (Class, V1-V28, Amount, Time) "
            "or PaySim (isFraud, type, amount, step) columns."
        )


def get_dataset_summary(df: pd.DataFrame, dataset_type: str) -> dict:
    if dataset_type == 'creditcard':
        label_col = 'Class'
    else:
        label_col = 'isFraud'
    total = len(df)
    fraud = int((df[label_col] == 1).sum())
    normal = total - fraud
    return {
        'total_records':  total,
        'normal_records': normal,
        'fraud_records':  fraud,
        'missing_values': int(df.isnull().sum().sum()),
        'fraud_pct':      round(fraud / total * 100, 4),
        'dataset_type':   dataset_type,
    }


def preprocess_creditcard(df: pd.DataFrame):
    """Preprocess the MLG-ULB credit card dataset."""
    df = df.copy()
    sc = StandardScaler()
    df['Amount'] = sc.fit_transform(df[['Amount']])
    df['Time']   = sc.fit_transform(df[['Time']])

    df['transaction_hour']    = (df['Time'] % 24).round(2)
    df['rolling_mean_amount'] = df['Amount'].rolling(10, min_periods=1).mean()
    df['amount_deviation']    = (df['Amount'] - df['rolling_mean_amount']).abs()

    cols  = [c for c in df.columns if c != 'Class']
    norm  = df[df['Class'] == 0][cols].reset_index(drop=True)
    frd   = df[df['Class'] == 1][cols].reset_index(drop=True)
    split = int(len(norm) * 0.8)

    X_train   = norm.iloc[:split].values.astype('float32')
    test_df   = pd.concat([norm.iloc[split:], frd], ignore_index=True)
    X_test    = test_df.values.astype('float32')
    y_test    = np.array([0] * (len(norm) - split) + [1] * len(frd))
    full_X    = df[cols].values.astype('float32')
    full_y    = df['Class'].values

    return X_train, X_test, y_test, cols, full_X, full_y


def preprocess_paysim(df: pd.DataFrame):
    """Preprocess the PaySim African mobile money dataset."""
    df = df.copy()

    # Drop non-numeric identity columns
    df = df.drop(columns=['nameOrig', 'nameDest'], errors='ignore')
    df = df.drop(columns=['isFlaggedFraud'], errors='ignore')

    # Encode transaction type
    le = LabelEncoder()
    df['type_enc'] = le.fit_transform(df['type'].astype(str))
    df = df.drop(columns=['type'])

    # Rename label column
    df = df.rename(columns={'isFraud': 'Class'})

    # Scale numeric columns
    sc = StandardScaler()
    num_cols = ['step', 'amount', 'oldbalanceOrg', 'newbalanceOrig',
                'oldbalanceDest', 'newbalanceDest']
    for c in num_cols:
        if c in df.columns:
            df[c] = sc.fit_transform(df[[c]])

    # Feature engineering
    df['balance_diff_orig'] = df['newbalanceOrig'] - df['oldbalanceOrg']
    df['balance_diff_dest'] = df['newbalanceDest'] - df['oldbalanceDest']
    df['rolling_mean_amount'] = df['amount'].rolling(10, min_periods=1).mean()
    df['amount_deviation']    = (df['amount'] - df['rolling_mean_amount']).abs()
    df['transaction_hour']    = (df['step'] % 24).round(2)

    cols  = [c for c in df.columns if c != 'Class']
    norm  = df[df['Class'] == 0][cols].reset_index(drop=True)
    frd   = df[df['Class'] == 1][cols].reset_index(drop=True)
    split = int(len(norm) * 0.8)

    # Cap training size for memory efficiency on large dataset
    max_train = 200000
    if split > max_train:
        split = max_train
        norm  = norm.sample(n=int(max_train * 1.25),
                            random_state=42).reset_index(drop=True)

    X_train   = norm.iloc[:split].values.astype('float32')
    test_norm = norm.iloc[split:].values
    test_frd  = frd.values
    X_test    = np.vstack([test_norm, test_frd]).astype('float32')
    y_test    = np.array([0] * len(test_norm) + [1] * len(frd))
    full_X    = df[cols].values.astype('float32')
    full_y    = df['Class'].values

    return X_train, X_test, y_test, cols, full_X, full_y


def preprocess(df: pd.DataFrame, dataset_type: str = None):
    """Main entry point — auto-detects format if not specified."""
    if dataset_type is None:
        dataset_type = detect_dataset_type(df)
    if dataset_type == 'creditcard':
        return preprocess_creditcard(df), dataset_type
    else:
        return preprocess_paysim(df), dataset_type
