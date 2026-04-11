"""models/autoencoder_model.py"""
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping


def build_autoencoder(input_dim: int) -> Model:
    tf.random.set_seed(42)
    inp = Input(shape=(input_dim,))
    x   = Dense(64, activation='relu')(inp)
    x   = Dropout(0.1)(x)
    x   = Dense(32, activation='relu')(x)
    x   = Dense(16, activation='relu')(x)
    b   = Dense(8,  activation='relu')(x)
    x   = Dense(16, activation='relu')(b)
    x   = Dense(32, activation='relu')(x)
    x   = Dropout(0.1)(x)
    x   = Dense(64, activation='relu')(x)
    out = Dense(input_dim, activation='linear')(x)
    m   = Model(inp, out)
    m.compile(optimizer=tf.keras.optimizers.Adam(0.001), loss='mse')
    return m


def train_autoencoder(model, X, epochs=50, batch_size=256):
    es = EarlyStopping(monitor='val_loss', patience=5,
                       restore_best_weights=True, verbose=0)
    return model.fit(X, X, epochs=epochs, batch_size=batch_size,
                     validation_split=0.1, callbacks=[es],
                     shuffle=True, verbose=0)


def compute_reconstruction_errors(model, X) -> np.ndarray:
    r = model.predict(X, verbose=0)
    return np.mean(np.power(X - r, 2), axis=1)


def compute_threshold(errors: np.ndarray, pct: int = 95) -> float:
    return float(np.percentile(errors, pct))
