import numpy as np

try:
    import tensorflow as tf
    from tensorflow.keras.models import Model
    from tensorflow.keras.layers import Input, Dense, Dropout
    from tensorflow.keras.callbacks import EarlyStopping
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

from sklearn.neural_network import MLPRegressor

def build_autoencoder(input_dim):
    if TF_AVAILABLE:
        tf.random.set_seed(42)
        i = Input(shape=(input_dim,))
        x = Dense(64, activation='relu')(i)
        x = Dropout(0.1)(x)
        x = Dense(32, activation='relu')(x)
        x = Dense(16, activation='relu')(x)
        b = Dense(8,  activation='relu')(x)
        x = Dense(16, activation='relu')(b)
        x = Dense(32, activation='relu')(x)
        x = Dropout(0.1)(x)
        x = Dense(64, activation='relu')(x)
        o = Dense(input_dim, activation='linear')(x)
        m = Model(i, o)
        m.compile(optimizer=tf.keras.optimizers.Adam(0.001), loss='mse')
        return m
    else:
        # Fallback: sklearn MLP autoencoder
        return MLPRegressor(
            hidden_layer_sizes=(64, 32, 16, 8, 16, 32, 64),
            activation='relu',
            max_iter=50,
            random_state=42,
            verbose=False
        )

def train_autoencoder(model, X, epochs=50, batch_size=256):
    if TF_AVAILABLE and hasattr(model, 'fit') and hasattr(model, 'compile'):
        from tensorflow.keras.callbacks import EarlyStopping
        es = EarlyStopping(monitor='val_loss', patience=5,
                           restore_best_weights=True, verbose=0)
        return model.fit(X, X, epochs=epochs, batch_size=batch_size,
                         validation_split=0.1, callbacks=[es],
                         shuffle=True, verbose=0)
    else:
        model.fit(X, X)
        return model

def compute_reconstruction_errors(model, X):
    r = model.predict(X)
    return np.mean(np.power(X - r, 2), axis=1)

def compute_threshold(errs, pct=95):
    return float(np.percentile(errs, pct))