# auth.py - JWT Authentication for AnomalyIQ v2.0
import sqlite3, hashlib, os
from datetime import datetime, timedelta
from pathlib import Path
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt

SECRET_KEY = os.getenv("JWT_SECRET", "anomalyiq_secret_2024_gouni")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24
DB_PATH = Path(__file__).parent / "anomalyiq.db"
bearer = HTTPBearer(auto_error=False)

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "analyst"

class LoginRequest(BaseModel):
    email: str
    password: str

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, full_name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'analyst', created_at TEXT NOT NULL, last_login TEXT)""")
    conn.execute("""CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, user_email TEXT NOT NULL, action TEXT NOT NULL, detail TEXT, timestamp TEXT NOT NULL)""")
    if not conn.execute("SELECT id FROM users WHERE email=?",("admin@anomalyiq.com",)).fetchone():
        conn.execute("INSERT INTO users (email,password,full_name,role,created_at) VALUES (?,?,?,?,?)",("admin@anomalyiq.com",hash_password("Admin@1234"),"System Administrator","admin",datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()
    print("DB ready")

def hash_password(p): return hashlib.sha256(p.encode()).hexdigest()

def create_token(email, role):
    return jwt.encode({"sub":email,"role":role,"exp":datetime.utcnow()+timedelta(hours=TOKEN_EXPIRE_HOURS),"iat":datetime.utcnow()}, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token):
    try: return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError: raise HTTPException(401,"Token expired.")
    except jwt.InvalidTokenError: raise HTTPException(401,"Invalid token.")

def log_action(email, action, detail=""):
    try:
        c=get_db(); c.execute("INSERT INTO audit_log VALUES (NULL,?,?,?,?)",(email,action,detail,datetime.utcnow().isoformat())); c.commit(); c.close()
    except: pass

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    if not credentials: raise HTTPException(401,"Not authenticated.")
    return verify_token(credentials.credentials)

def register_user(req: RegisterRequest):
    if len(req.password)<6: raise HTTPException(400,"Password too short.")
    conn=get_db()
    if conn.execute("SELECT id FROM users WHERE email=?",(req.email,)).fetchone():
        conn.close(); raise HTTPException(400,"Email already registered.")
    conn.execute("INSERT INTO users (email,password,full_name,role,created_at) VALUES (?,?,?,?,?)",(req.email,hash_password(req.password),req.full_name,req.role,datetime.utcnow().isoformat()))
    conn.commit(); conn.close(); log_action(req.email,"REGISTER")
    return {"token":create_token(req.email,req.role),"email":req.email,"full_name":req.full_name,"role":req.role}

def login_user(req: LoginRequest):
    conn=get_db(); user=conn.execute("SELECT * FROM users WHERE email=?",(req.email,)).fetchone(); conn.close()
    if not user or user["password"]!=hash_password(req.password): raise HTTPException(401,"Incorrect email or password.")
    conn=get_db(); conn.execute("UPDATE users SET last_login=? WHERE email=?",(datetime.utcnow().isoformat(),req.email)); conn.commit(); conn.close()
    log_action(req.email,"LOGIN")
    return {"token":create_token(req.email,user["role"]),"email":req.email,"full_name":user["full_name"],"role":user["role"]}

def get_profile(current_user):
    conn=get_db(); user=conn.execute("SELECT email,full_name,role,created_at,last_login FROM users WHERE email=?",(current_user["sub"],)).fetchone(); conn.close()
    if not user: raise HTTPException(404,"User not found.")
    return dict(user)

def get_audit_logs(current_user):
    if current_user.get("role")!="admin": raise HTTPException(403,"Admin only.")
    conn=get_db(); logs=conn.execute("SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 100").fetchall(); conn.close()
    return [dict(r) for r in logs]
