# PlatePulse Backend (app)

This folder contains the FastAPI backend for PlatePulse.

Quick start (Windows / PowerShell):

```powershell
# From repository root
cd backend/app
python -m pip install -r ../requirements.txt
.\run-dev.ps1
```

Or using `npm` (convenience wrapper):

```powershell
cd backend/app
npm run dev
```

Notes:
- The backend is a Python FastAPI app. `npm run dev` is provided only as a convenience to invoke the Python `uvicorn` server.
- Configure environment variables or a `.env` file at the repository root to override defaults in `config.py`.
