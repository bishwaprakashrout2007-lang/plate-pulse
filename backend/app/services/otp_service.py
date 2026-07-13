import random
import time
from ..database import get_db

# OTP expiration time (10 minutes)
OTP_EXPIRY_SECONDS = 600

async def generate_otp(email: str) -> str:
    # Generate 6-digit random code
    otp = f"{random.randint(100000, 999999)}"
    expiry = time.time() + OTP_EXPIRY_SECONDS
    
    db = get_db()
    # Delete any existing OTP for this email
    await db.otps.delete_one({"email": email})
    
    # Insert new OTP record
    await db.otps.insert_one({
        "email": email,
        "otp": otp,
        "expiry": expiry
    })
    return otp

async def verify_otp(email: str, otp: str) -> bool:
    db = get_db()
    record = await db.otps.find_one({"email": email})
    if not record:
        return False
        
    saved_otp = record.get("otp")
    expiry = record.get("expiry")
    
    # Check expiry
    if time.time() > expiry:
        await db.otps.delete_one({"email": email})
        return False
        
    # Check value
    if saved_otp == otp:
        await db.otps.delete_one({"email": email})
        return True
        
    return False
