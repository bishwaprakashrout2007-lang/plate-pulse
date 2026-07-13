from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    phone: str
    name: str

class UserCreate(UserBase):
    password: Optional[str] = None
    role: str = "Client"  # "Client", "NGO", "Admin"

class UserResponse(UserBase):
    id: str = Field(..., alias="_id")
    role: str
    createdAt: datetime

    class Config:
        populate_by_name = True

# NGO Schemas
class NGOProfileCreate(BaseModel):
    ngoName: str
    darpanId: str
    bankAccount: str
    ifsc: str
    address: str
    photoUrl: str
    description: str

class NGOResponse(NGOProfileCreate):
    id: str = Field(..., alias="_id")
    fullName: str
    email: str
    phone: str
    status: str = "Unverified"  # "Unverified", "Pending", "Verified", "Suspended", "DocumentsApproved", "PendingVerification"
    rating: float = 5.0
    createdAt: datetime
    approvedByAdmin: Optional[str] = None
    documentsApprovedAt: Optional[datetime] = None
    verifiedByAdmin: Optional[str] = None
    verifiedAt: Optional[datetime] = None

    class Config:
        populate_by_name = True

# Donation Request Schemas
class DonationRequestCreate(BaseModel):
    donorName: str
    items: List[str]  # e.g., ["Food", "Clothes", "Money", "Other"]
    details: Optional[str] = None  # for money selection or other description
    quantity: str
    address: str
    date: str
    specialInstructions: Optional[str] = None
    ngoId: Optional[str] = None  # Specific NGO or auto-match

class DonationRequestResponse(DonationRequestCreate):
    id: str = Field(..., alias="_id")
    donorId: str
    status: str = "Pending"  # "Pending", "Accepted", "Completed", "Denied"
    donorPhotoUrl: Optional[str] = None
    createdAt: datetime

    class Config:
        populate_by_name = True

class ConfirmReceiptRequest(BaseModel):
    donorPhotoUrl: str
    donorName: str

# Blog Schemas
class BlogCreate(BaseModel):
    title: str
    content: str
    imageUrl: str

class BlogResponse(BlogCreate):
    id: str = Field(..., alias="_id")
    author: str
    createdAt: datetime

    class Config:
        populate_by_name = True

# Gallery Schemas
class GalleryCreate(BaseModel):
    imageUrl: str
    description: str

class GalleryResponse(GalleryCreate):
    id: str = Field(..., alias="_id")
    createdAt: datetime

    class Config:
        populate_by_name = True

# Feedback Schemas
class FeedbackCreate(BaseModel):
    userName: str
    email: EmailStr
    message: str
    rating: int = Field(5, ge=1, le=5)

class FeedbackResponse(FeedbackCreate):
    id: str = Field(..., alias="_id")
    createdAt: datetime

    class Config:
        populate_by_name = True

# Authentication Schemas
class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    userId: str
    name: str

class OTPRequest(BaseModel):
    email: str
    phone: Optional[str] = None

class OTPVerifyRequest(BaseModel):
    email: str
    otp: str
