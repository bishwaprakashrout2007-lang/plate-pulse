from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from datetime import datetime
import math
import random
from typing import List, Optional
from ..database import get_db
from ..models.schemas import NGOProfileCreate, NGOResponse
from ..auth import get_current_user, RoleChecker
from ..services.cloudinary_service import upload_image
from ..services.zegocloud_service import generate_zego_token

router = APIRouter(prefix="/api/ngos", tags=["ngos"])

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Earth radius in kilometers
    R = 6371.0
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) ** 2 + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

@router.post("/register", response_model=NGOResponse)
async def register_ngo_profile(
    profile: NGOProfileCreate,
    user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    # Verify current user's role is NGO or Admin
    if user.get("role") not in ["NGO", "Admin"]:
        raise HTTPException(status_code=403, detail="Only NGO accounts can configure their profile.")
        
    ngo_id = user["sub"]
    
    # Check if NGO profile already exists
    existing = await db.ngos.find_one({"_id": ngo_id})
    
    # Use coordinates passed from frontend if available, else fall back to default coordinates
    lat = profile.latitude if profile.latitude is not None else (20.2961 + random.uniform(-0.05, 0.05))
    lng = profile.longitude if profile.longitude is not None else (85.8245 + random.uniform(-0.05, 0.05))
    
    ngo_data = {
        "_id": ngo_id,
        "fullName": user["name"],
        "email": user["email"],
        "phone": user["phone"],
        "ngoName": profile.ngoName,
        "darpanId": profile.darpanId,
        "bankAccount": profile.bankAccount,
        "ifsc": profile.ifsc,
        "address": profile.address,
        "photoUrl": profile.photoUrl,
        "description": profile.description,
        "status": "Pending",  # Redirect to Verification page next
        "rating": 4.8,
        "latitude": lat,
        "longitude": lng,
        "pincode": profile.pincode,
        "kycDocs": [],
        "createdAt": datetime.utcnow()
    }
    
    if existing:
        ngo_data["kycDocs"] = existing.get("kycDocs", [])
        ngo_data["status"] = existing.get("status", "Pending")
        if "kycDocUrl" in existing:
            ngo_data["kycDocUrl"] = existing["kycDocUrl"]
        await db.ngos.update_one({"_id": ngo_id}, {"$set": ngo_data})
    else:
        await db.ngos.insert_one(ngo_data)
        
    return ngo_data

@router.get("", response_model=List[dict])
async def list_ngos(
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    distance: Optional[float] = Query(None), # max distance in km (1, 5, 10, 20, 50)
    pickup: Optional[str] = Query(None), # today, tomorrow, this_week
    search: Optional[str] = Query(None),
    db=Depends(get_db)
):
    # Query only verified NGOs
    query = {"status": "Verified"}
    
    if search:
        query["ngoName"] = {"$regex": search, "$options": "i"}
        
    ngo_cursor = db.ngos.find(query)
    ngos = await ngo_cursor.to_list(length=100)
    
    result_list = []
    for ngo in ngos:
        # Generate mock details if fields are empty
        ngo_lat = ngo.get("latitude", 20.2961)
        ngo_lng = ngo.get("longitude", 85.8245)
        
        # Calculate distance
        calculated_dist = 0.0
        if lat is not None and lng is not None:
            calculated_dist = haversine_distance(lat, lng, ngo_lat, ngo_lng)
            
        # Apply distance filter
        if distance is not None and lat is not None and lng is not None:
            if calculated_dist > distance:
                continue
                
        # Inject standard distance and schedules
        ngo_item = dict(ngo)
        ngo_item["id"] = str(ngo["_id"])
        ngo_item["distance"] = round(calculated_dist, 2)
        
        # Mocking pickup schedule details
        ngo_item["pickupSchedule"] = ngo.get("pickupSchedule", ["Today", "Tomorrow", "This Week"])
        
        # Filter by pickup schedule if specified
        if pickup:
            normalized_pickup = pickup.replace("_", " ").lower()
            schedules = [s.lower() for s in ngo_item["pickupSchedule"]]
            if normalized_pickup not in schedules:
                continue
                
        result_list.append(ngo_item)
        
    # Sort by distance (nearest first) if location was provided
    if lat is not None and lng is not None:
        result_list.sort(key=lambda x: x["distance"])
        
    return result_list

@router.get("/{id}")
async def get_ngo_details(id: str, db=Depends(get_db)):
    ngo = await db.ngos.find_one({"_id": id})
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO profile not found.")
        
    ngo_item = dict(ngo)
    ngo_item["id"] = str(ngo["_id"])
    
    # Calculate stats for page display
    donation_count = await db.donations.count_documents({"ngoId": id, "status": "Completed"})
    ngo_item["donationStats"] = {
        "completed": donation_count,
        "peopleFed": donation_count * 15,
        "totalKg": donation_count * 8
    }
    return ngo_item

@router.post("/verify/upload-docs")
async def upload_kyc_documents(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    if user.get("role") not in ["NGO", "Admin"]:
        raise HTTPException(status_code=403, detail="Only NGO accounts can upload KYC verification documents.")
        
    url = await upload_image(file, folder="kyc_documents")
    
    # Update NGO verification status details
    ngo_id = user["sub"]
    await db.ngos.update_one(
        {"_id": ngo_id},
        {
            "$push": {"kycDocs": {"url": url, "name": file.filename, "uploadedAt": datetime.utcnow()}},
            "$set": {"kycDocUrl": url, "status": "PendingVerification"}
        }
    )
    # Update users collection in sync
    await db.users.update_one(
        {"_id": ngo_id},
        {"$set": {"status": "PendingVerification"}}
    )
    
    return {"message": "Document uploaded successfully", "url": url}

@router.get("/verify/video-token")
async def get_video_token(
    room_id: str,
    user: dict = Depends(get_current_user)
):
    token = generate_zego_token(room_id, user["sub"])
    return {"token": token, "userId": user["sub"], "userName": user["name"]}

@router.post("/verify/notify-video-call")
async def notify_video_call(
    user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    if user.get("role") not in ["NGO", "Admin"]:
        raise HTTPException(status_code=403, detail="Only NGO accounts can trigger video call notifications.")
        
    ngo_id = user["sub"]
    ngo = await db.ngos.find_one({"_id": ngo_id})
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO profile not found.")
        
    ngo_name = ngo.get("ngoName", user.get("name", "NGO Representative"))
    ngo_email = ngo.get("email", user.get("email"))
    
    from ..auth import ADMIN_EMAILS
    from ..services.email_service import send_email
    
    subject = f"PlatePulse KYC - Live Video Call Initiated by {ngo_name}"
    body = f"""Hello,

This is an automated notification from PlatePulse.

The NGO partner '{ngo_name}' has initiated a live video KYC verification call and is waiting in the chamber.

NGO Details:
- Name: {ngo_name}
- Email: {ngo_email}
- Phone: {ngo.get("phone", user.get("phone", "N/A"))}
- Darpan ID: {ngo.get("darpanId", "N/A")}

Please access the Admin Dashboard to join the video call auditing chamber.

Regards,
PlatePulse Verification Team
"""

    admin_success = True
    for admin_email in ADMIN_EMAILS:
        sent = send_email(admin_email, subject, body)
        if not sent:
            admin_success = False
            
    # Send confirmation to NGO email as well
    ngo_subject = "PlatePulse KYC - Video Call Link & Support Details"
    ngo_body = f"""Hello,

You have successfully initiated a live video KYC verification call with the PlatePulse Admin Team.

Please keep the call chamber open. An administrator will join your session shortly to verify your Darpan ID credentials.

Your Room ID for the video call is: {ngo_id}

Regards,
PlatePulse Support Team
"""
    send_email(ngo_email, ngo_subject, ngo_body)
    
    return {"message": "Notification emails successfully dispatched."}
