"""
AnomalyIQ — Backend Launcher
Works locally AND on Railway cloud deployment.

Local:    python run.py
Railway:  startCommand = python run.py (set in railway.json)
"""
import os
import uvicorn

# Railway sets PORT automatically; locally defaults to 8000
PORT = int(os.environ.get("PORT", 8000))

# Detect if running on Railway
IS_PRODUCTION = bool(os.environ.get("RAILWAY_ENVIRONMENT"))

if __name__ == "__main__":
    print(f"Starting AnomalyIQ backend on port {PORT}")
    print(f"Production mode: {IS_PRODUCTION}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=PORT,
        reload=not IS_PRODUCTION,
        # 2 GB upload limit — Railway supports this unlike Render
        h11_max_incomplete_event_size=2 * 1024 * 1024 * 1024,
    )