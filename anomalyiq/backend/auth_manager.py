"""
AnomalyIQ - Authentication Manager
SQLite-backed user database with JWT and role-based access control

Roles:
  admin              - Full system access
  compliance_officer - View results, SHAP, export reports
  data_analyst       - Upload, train, detect, view SHAP

Default users (change passwords after first login):
  admin      / admin123        -> role: admin
  compliance / comply123       -> role: compliance_officer
  analyst    / analyst123      -> role: data_analyst
"""

import os
import sqlite3
import hashlib
import secrets
import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

# ─── Config ─────────────────────────────────────────────────────────────────
SECRET_KEY         = os.environ.get(
    "ANOMALYIQ_SECRET", "anomalyiq-secret-key-change-in-production")
ALGORITHM          = "HS256"
TOKEN_EXPIRE_HOURS = 72
DB_PATH            = os.path.join(os.path.dirname(__file__), "anomalyiq_users.db")

# ─── Role permission map ─────────────────────────────────────────────────────
ROLE_PERMISSIONS = {
    "admin": [
        "manage_users",
        "upload_dataset",
        "train_model",
        "run_detection",
        "view_results",
        "view_shap",
        "view_logs",
        "export_reports",
    ],
    "compliance_officer": [
        "view_results",
        "view_shap",
        "view_logs",
        "export_reports",
    ],
    "data_analyst": [
        "upload_dataset",
        "train_model",
        "run_detection",
        "view_results",
        "view_shap",
    ],
}

ROLE_LABELS = {
    "admin":              "Administrator",
    "compliance_officer": "Compliance Officer",
    "data_analyst":       "Data Analyst",
}

# FIX: map friendly label strings → internal role keys
# The register form sends "Data Analyst" — this maps it to "data_analyst"
ROLE_LABEL_TO_KEY = {
    "administrator":      "admin",
    "admin":              "admin",
    "compliance officer": "compliance_officer",
    "compliance_officer": "compliance_officer",
    "data analyst":       "data_analyst",
    "data_analyst":       "data_analyst",
}

security = HTTPBearer()


# ─── Helpers ─────────────────────────────────────────────────────────────────
def _hash_password(password: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _normalise_role(role: str) -> str:
    """
    FIX: Convert any role string to its internal key.
    Accepts:  'data_analyst', 'Data Analyst', 'DATA ANALYST', etc.
    Returns:  'data_analyst'
    Raises ValueError if not recognised.
    """
    key = ROLE_LABEL_TO_KEY.get(role.strip().lower())
    if key is None:
        raise ValueError(
            f"Invalid role '{role}'. "
            f"Valid options: {list(ROLE_PERMISSIONS.keys())}"
        )
    return key


# ─── Database bootstrap ──────────────────────────────────────────────────────
def init_db():
    """Create tables and seed default users if they don't exist."""
    conn = _get_conn()
    cur  = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            username   TEXT    UNIQUE NOT NULL,
            full_name  TEXT    NOT NULL,
            email      TEXT    UNIQUE NOT NULL,
            role       TEXT    NOT NULL DEFAULT 'data_analyst',
            salt       TEXT    NOT NULL,
            password   TEXT    NOT NULL,
            is_active  INTEGER NOT NULL DEFAULT 1,
            created_at TEXT    NOT NULL,
            last_login TEXT
        )
    """)
    conn.commit()

    default_users = [
        {
            "username":  "admin",
            "full_name": "System Administrator",
            "email":     "admin@anomalyiq.local",
            "role":      "admin",
            "password":  "admin123",
        },
        {
            "username":  "compliance",
            "full_name": "Compliance Officer",
            "email":     "compliance@anomalyiq.local",
            "role":      "compliance_officer",
            "password":  "comply123",
        },
        {
            "username":  "analyst",
            "full_name": "Data Analyst",
            "email":     "analyst@anomalyiq.local",
            "role":      "data_analyst",
            "password":  "analyst123",
        },
    ]

    for u in default_users:
        existing = cur.execute(
            "SELECT id FROM users WHERE username = ?", (u["username"],)
        ).fetchone()
        if not existing:
            salt    = secrets.token_hex(16)
            pw_hash = _hash_password(u["password"], salt)
            cur.execute(
                """INSERT INTO users
                   (username, full_name, email, role, salt, password,
                    is_active, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, 1, ?)""",
                (u["username"], u["full_name"], u["email"],
                 u["role"], salt, pw_hash,
                 datetime.utcnow().isoformat()),
            )

    conn.commit()
    conn.close()


# ─── AuthManager ─────────────────────────────────────────────────────────────
class AuthManager:

    def __init__(self):
        init_db()

    # ── Login ─────────────────────────────────────────────────────────────────
    def login(self, username: str, password: str) -> dict:
        conn = _get_conn()
        cur  = conn.cursor()

        user = cur.execute(
            "SELECT * FROM users WHERE username = ? AND is_active = 1",
            (username,)
        ).fetchone()

        if not user:
            conn.close()
            return {"success": False,
                    "error": "Invalid username or password"}

        expected = _hash_password(password, user["salt"])
        if expected != user["password"]:
            conn.close()
            return {"success": False,
                    "error": "Invalid username or password"}

        cur.execute(
            "UPDATE users SET last_login = ? WHERE id = ?",
            (datetime.utcnow().isoformat(), user["id"]),
        )
        conn.commit()
        conn.close()

        token       = self._create_token(user)
        permissions = ROLE_PERMISSIONS.get(user["role"], [])

        return {
            "success": True,
            "token": token,
            "user": {
                "id":          user["id"],
                "username":    user["username"],
                "full_name":   user["full_name"],
                "email":       user["email"],
                "role":        user["role"],
                "role_label":  ROLE_LABELS.get(user["role"], user["role"]),
                "permissions": permissions,
            },
        }

    # ── Token creation ────────────────────────────────────────────────────────
    def _create_token(self, user) -> str:
        payload = {
            "sub":         user["username"],
            "user_id":     user["id"],
            "role":        user["role"],
            "full_name":   user["full_name"],
            "permissions": ROLE_PERMISSIONS.get(user["role"], []),
            "exp":         datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS),
            "iat":         datetime.utcnow(),
        }
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    # ── Token verification ────────────────────────────────────────────────────
    def verify_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return {"valid": True, "payload": payload}
        except jwt.ExpiredSignatureError:
            return {"valid": False, "error": "Token expired"}
        except jwt.InvalidTokenError:
            return {"valid": False, "error": "Invalid token"}

    # ── User management ───────────────────────────────────────────────────────
    def list_users(self) -> list:
        conn = _get_conn()
        rows = conn.execute(
            """SELECT id, username, full_name, email, role,
                      is_active, created_at, last_login
               FROM users"""
        ).fetchall()
        conn.close()
        return [
            {
                "id":          r["id"],
                "username":    r["username"],
                "full_name":   r["full_name"],
                "email":       r["email"],
                "role":        r["role"],
                "role_label":  ROLE_LABELS.get(r["role"], r["role"]),
                "is_active":   bool(r["is_active"]),
                "created_at":  r["created_at"],
                "last_login":  r["last_login"],
                "permissions": ROLE_PERMISSIONS.get(r["role"], []),
            }
            for r in rows
        ]

    def create_user(self, username: str, full_name: str, email: str,
                    role: str, password: str) -> dict:
        # FIX: normalise role so "Data Analyst" → "data_analyst" etc.
        try:
            role = _normalise_role(role)
        except ValueError as e:
            return {"success": False, "error": str(e)}

        if len(password) < 6:
            return {"success": False,
                    "error": "Password must be at least 6 characters"}

        salt    = secrets.token_hex(16)
        pw_hash = _hash_password(password, salt)
        conn    = _get_conn()

        try:
            conn.execute(
                """INSERT INTO users
                   (username, full_name, email, role, salt, password,
                    is_active, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, 1, ?)""",
                (username, full_name, email, role, salt, pw_hash,
                 datetime.utcnow().isoformat()),
            )
            conn.commit()
            return {"success": True,
                    "message": f"Account created! You can now sign in."}
        except sqlite3.IntegrityError:
            return {"success": False,
                    "error": "Username or email already exists. "
                             "Please try a different one."}
        finally:
            conn.close()

    def update_user_role(self, username: str, new_role: str) -> dict:
        try:
            new_role = _normalise_role(new_role)
        except ValueError as e:
            return {"success": False, "error": str(e)}

        conn = _get_conn()
        cur  = conn.cursor()
        cur.execute(
            "UPDATE users SET role = ? WHERE username = ?",
            (new_role, username))
        if cur.rowcount == 0:
            conn.close()
            return {"success": False,
                    "error": f"User '{username}' not found"}
        conn.commit()
        conn.close()
        return {"success": True,
                "message": f"Role updated to '{new_role}' for '{username}'"}

    def change_password(self, username: str, new_password: str) -> dict:
        if len(new_password) < 6:
            return {"success": False,
                    "error": "Password must be at least 6 characters"}
        salt    = secrets.token_hex(16)
        pw_hash = _hash_password(new_password, salt)
        conn    = _get_conn()
        cur     = conn.cursor()
        cur.execute(
            "UPDATE users SET salt = ?, password = ? WHERE username = ?",
            (salt, pw_hash, username))
        if cur.rowcount == 0:
            conn.close()
            return {"success": False,
                    "error": f"User '{username}' not found"}
        conn.commit()
        conn.close()
        return {"success": True, "message": "Password updated successfully"}

    def deactivate_user(self, username: str) -> dict:
        conn = _get_conn()
        cur  = conn.cursor()
        cur.execute(
            "UPDATE users SET is_active = 0 WHERE username = ?",
            (username,))
        if cur.rowcount == 0:
            conn.close()
            return {"success": False,
                    "error": f"User '{username}' not found"}
        conn.commit()
        conn.close()
        return {"success": True,
                "message": f"User '{username}' deactivated"}


# ─── FastAPI dependencies ────────────────────────────────────────────────────
def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    auth   = AuthManager()
    result = auth.verify_token(credentials.credentials)

    if not result["valid"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result["error"],
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = result["payload"]
    return {
        "username":    payload["sub"],
        "user_id":     payload["user_id"],
        "role":        payload["role"],
        "full_name":   payload.get("full_name", payload["sub"]),
        "permissions": payload.get("permissions", []),
    }


def require_permission(permission: str):
    """
    Route dependency — restricts access by permission string.

    Usage:
        @app.get("/api/users")
        async def list_users(
            current_user = Depends(require_permission("manage_users"))
        ):
    """
    def checker(current_user: dict = Depends(get_current_user)):
        if permission not in current_user.get("permissions", []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Your role '{current_user['role']}' does not have "
                    f"permission: '{permission}'"
                ),
            )
        return current_user
    return checker