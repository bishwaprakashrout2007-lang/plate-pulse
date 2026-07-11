import random
import time
from typing import Dict, Tuple

# In-memory OTP storage: email -> (otp_code, expiry_timestamp)
otp_store: Dict[str, Tuple[str, float]] = {}

# OTP expiration time (10 minutes)
OTP_EXPIRY_SECONDS = 600

def generate_otp(email: str) -> str:
    # Generate 6-digit random code
    otp = f"{random.randint(100000, 999999)}"
    expiry = time.time() + OTP_EXPIRY_SECONDS
    otp_store[email] = (otp, expiry)
    return otp

def verify_otp(email: str, otp: str) -> bool:
        
    if email not in otp_store:
        return False
        
    saved_otp, expiry = otp_store[email]
    
    # Check expiry
    if time.time() > expiry:
        del otp_store[email]
        return False
        
    # Check value
    if saved_otp == otp:
        del otp_store[email]
        return True
        
    return False
