from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from ..database import get_db
from ..models.schemas import (
    UserCreate, UserResponse, LoginRequest, TokenResponse,
    OTPRequest, OTPVerifyRequest
)
from ..auth import get_password_hash, verify_password, create_access_token, ADMIN_EMAILS, ADMIN_PHONES
from ..services.otp_service import generate_otp, verify_otp
from ..services.email_service import send_otp_email

import logging
logger = logging.getLogger("platepulse.auth")

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/send-otp")
async def send_otp_endpoint(req: OTPRequest):
    email = req.email.strip().lower()
    otp = await generate_otp(email)
    
    # Log the OTP in server logs so it is readable from Render Dashboard Logs for testing/development
    logger.info(f"🔑 [OTP LOG] Generated verification code for {email}: {otp}")
    
    # Send email asynchronously or synchronously (synchronous fallback)
    sent, error_detail = send_otp_email(email, otp)
    if not sent:
        logger.warning(f"Failed to send email to {email}: {error_detail}. Falling back to master code 123456.")
        return {"message": "OTP generated. (SMTP block detected: please use bypass code 123456)", "email": email}
        
    return {"message": "OTP sent successfully to email", "email": email}

@router.post("/verify-otp")
async def verify_otp_endpoint(req: OTPVerifyRequest):
    email = req.email.strip().lower()
    is_valid = await verify_otp(email, req.otp)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")
    return {"message": "OTP verified successfully", "email": email}

@router.post("/register", response_model=UserResponse)
async def register_endpoint(user_in: UserCreate, db=Depends(get_db)):
    email = user_in.email.strip().lower()
    phone = user_in.phone.strip()
    
    # Check if user already exists
    existing = await db.users.find_one({"$or": [{"email": email}, {"phone": phone}]})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email or phone number already exists.")
        
    # Check if role is admin based on hardcoded lists
    role = user_in.role
    if email in ADMIN_EMAILS or phone in ADMIN_PHONES:
        role = "Admin"
        
    # Build user document
    user_dict = {
        "email": email,
        "phone": phone,
        "name": user_in.name,
        "role": role,
        "password": get_password_hash(user_in.password) if user_in.password else None,
        "createdAt": datetime.utcnow()
    }
    
    res = await db.users.insert_one(user_dict)
    user_dict["_id"] = res.inserted_id
    return user_dict

from pydantic import BaseModel
from typing import Optional

class GoogleLoginRequest(BaseModel):
    email: str
    name: str
    uid: str
    role: Optional[str] = "Client"

@router.post("/google-login", response_model=TokenResponse)
async def google_login_endpoint(req: GoogleLoginRequest, db=Depends(get_db)):
    email = req.email.strip().lower()
    
    # Check if user already exists
    user = await db.users.find_one({"email": email})
    
    # Determine role
    role = req.role or "Client"
    if email in ADMIN_EMAILS:
        role = "Admin"
        
    if not user:
        # Auto-create user
        user_dict = {
            "email": email,
            "phone": "8984676600" if email == "bishwaprakashrout2007@gmail.com" else ("9861216929" if email == "asitraut2006@gmail.com" else ""),
            "name": req.name,
            "role": role,
            "password": None, # Google logins do not have a password
            "createdAt": datetime.utcnow(),
            "firebaseUid": req.uid
        }
        res = await db.users.insert_one(user_dict)
        user_dict["_id"] = res.inserted_id
        user = user_dict
    else:
        # If user exists and is an admin, ensure they are synced as Admin
        if email in ADMIN_EMAILS:
            role = "Admin"
            if user.get("role") != "Admin":
                await db.users.update_one({"_id": user["_id"]}, {"$set": {"role": "Admin"}})
        else:
            role = user.get("role", "Client")
            
    # Generate token
    token = create_access_token({
        "sub": str(user["_id"]),
        "email": user["email"],
        "phone": user.get("phone", ""),
        "role": role,
        "name": user["name"]
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": role,
        "userId": str(user["_id"]),
        "name": user["name"]
    }

@router.post("/login", response_model=TokenResponse)
async def login_endpoint(req: LoginRequest, db=Depends(get_db)):
    email = req.email.strip().lower()
    
    # Find user
    user = await db.users.find_one({"email": email})
    if not user:
        # Check if email is hardcoded admin. If so, let's auto-create it with standard password so they can log in!
        # This is incredibly helpful for the user testing the application!
        if email in ADMIN_EMAILS:
            admin_dict = {
                "email": email,
                "phone": "8984676600" if email == "bishwaprakashrout2007@gmail.com" else "9861216929",
                "name": "Admin User",
                "role": "Admin",
                "password": get_password_hash("gec@2027"), # DEFAULT ADMIN PASSWORD: gec@2027
                "createdAt": datetime.utcnow()
            }
            res = await db.users.insert_one(admin_dict)
            admin_dict["_id"] = res.inserted_id
            user = admin_dict
        else:
            raise HTTPException(status_code=400, detail="Invalid email or password.")
            
    # Verify password
    is_admin_email = email in ADMIN_EMAILS
    if is_admin_email:
        if req.password != "gec@2027":
            raise HTTPException(status_code=400, detail="Invalid email or password.")
        # Ensure password and role are updated in the database if out of sync
        current_hash = user.get("password")
        if not current_hash or not verify_password("gec@2027", current_hash) or user.get("role") != "Admin":
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"password": get_password_hash("gec@2027"), "role": "Admin"}}
            )
    else:
        # Regular password check
        if user.get("password") and not verify_password(req.password, user["password"]):
            raise HTTPException(status_code=400, detail="Invalid email or password.")
        
    # Determine role (ensure hardcoded sync)
    role = user.get("role", "Client")
    if email in ADMIN_EMAILS or user.get("phone") in ADMIN_PHONES:
        role = "Admin"
        
    # Generate token
    token = create_access_token({
        "sub": str(user["_id"]),
        "email": user["email"],
        "phone": user.get("phone", ""),
        "role": role,
        "name": user["name"]
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": role,
        "userId": str(user["_id"]),
        "name": user["name"]
    }
