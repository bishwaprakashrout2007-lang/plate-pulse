# PowerShell helper to run the FastAPI app in development
# Must be run from backend directory where 'app' is a valid package
Set-Location ..
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
