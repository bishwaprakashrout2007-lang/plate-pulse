from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from datetime import datetime
from typing import List, Optional
import uuid
from ..database import get_db
from ..models.schemas import DonationRequestCreate, DonationRequestResponse, ConfirmReceiptRequest
from ..auth import get_current_user, RoleChecker
from ..services.email_service import send_appreciation_email
from ..services.cloudinary_service import upload_image

router = APIRouter(prefix="/api/donations", tags=["donations"])

@router.post("/request", response_model=DonationRequestResponse)
async def create_donation_request(
    req: DonationRequestCreate,
    user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    if user.get("role") not in ["Client", "Admin"]:
        raise HTTPException(status_code=403, detail="Only Client accounts can create donation requests.")
        
    request_id = str(uuid.uuid4())
    doc = {
        "_id": request_id,
        "donorId": user["sub"],
        "donorName": req.donorName,
        "items": req.items,
        "details": req.details,
        "quantity": req.quantity,
        "address": req.address,
        "date": req.date,
        "specialInstructions": req.specialInstructions,
        "ngoId": req.ngoId, # optional reference
        "status": "Pending",
        "donorPhotoUrl": None,
        "createdAt": datetime.utcnow()
    }
    
    await db.donations.insert_one(doc)
    return doc

@router.get("/client", response_model=List[dict])
async def list_client_donations(
    user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    cursor = db.donations.find({"donorId": user["sub"]})
    donations = await cursor.to_list(length=100)
    
    # Format list
    res = []
    for d in donations:
        item = dict(d)
        item["id"] = str(d["_id"])
        res.append(item)
    return res

@router.get("/ngo", response_model=List[dict])
async def list_ngo_donations(
    user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    # Verify NGO
    ngo_id = user["sub"]
    
    # Find requests that are either assigned specifically to this NGO OR are pending public requests (no specific ngoId set)
    cursor = db.donations.find({
        "$or": [
            {"ngoId": ngo_id},
            {"ngoId": None, "status": "Pending"},
            {"ngoId": "", "status": "Pending"}
        ]
    })
    donations = await cursor.to_list(length=100)
    
    res = []
    for d in donations:
        item = dict(d)
        item["id"] = str(d["_id"])
        res.append(item)
    return res

@router.put("/{id}/status")
async def update_donation_status(
    id: str,
    status_update: dict, # {"status": "Accepted" | "Denied" | "Completed"}
    user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    new_status = status_update.get("status")
    if new_status not in ["Accepted", "Denied", "Completed"]:
        raise HTTPException(status_code=400, detail="Invalid status option.")
        
    donation = await db.donations.find_one({"_id": id})
    if not donation:
        raise HTTPException(status_code=404, detail="Donation request not found.")
        
    # Mark donation field edits
    update_data = {"status": new_status}
    
    if new_status == "Accepted":
        # NGO claims/accepts the donation request
        update_data["ngoId"] = user["sub"]
        
    elif new_status == "Completed":
        # Extract confirmation details
        donor_name = status_update.get("donorName", donation.get("donorName", "Valued Donor"))
        photo_url = status_update.get("donorPhotoUrl")
        
        update_data["donorName"] = donor_name
        if photo_url:
            update_data["donorPhotoUrl"] = photo_url
            
        # Trigger email appreciation to the donor
        donor_id = donation.get("donorId")
        donor_user = await db.users.find_one({"_id": donor_id})
        if donor_user and donor_user.get("email"):
            send_appreciation_email(donor_name, donor_user["email"])
            
    await db.donations.update_one({"_id": id}, {"$set": update_data})
    return {"message": f"Status successfully updated to {new_status}", "id": id}

@router.post("/{id}/upload-receipt")
async def upload_donation_receipt(
    id: str,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    # Upload photo of donor/receipt
    url = await upload_image(file, folder="donation_receipts")
    return {"url": url}
