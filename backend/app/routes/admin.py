from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from typing import List
from ..database import get_db
from ..auth import get_current_user, RoleChecker

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Protect all routes in this file to Admin only
admin_check = Depends(RoleChecker(["Admin"]))

@router.get("/stats", dependencies=[admin_check])
async def get_admin_dashboard_stats(db=Depends(get_db)):
    total_ngos = await db.ngos.count_documents({})
    total_donors = await db.users.count_documents({"role": "Client"})
    total_donations = await db.donations.count_documents({"status": "Completed"})
    pending_verifications = await db.ngos.count_documents({"status": {"$in": ["Pending", "PendingVerification", "DocumentsApproved"]}})
    
    # Simple weekly analytics chart generator: last 7 days donation count
    today = datetime.utcnow()
    chart_data = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%a") # e.g. Mon, Tue
        # Create start/end for day
        start_of_day = datetime(day.year, day.month, day.day)
        end_of_day = start_of_day + timedelta(days=1)
        
        count = await db.donations.count_documents({
            "status": "Completed",
            "createdAt": {"$gte": start_of_day, "$lt": end_of_day}
        })
        # Only inject mock values if running in-memory mock database
        from app.database import is_mock
        if count == 0 and is_mock:
            import random
            count = random.randint(2, 10)
            
        chart_data.append({"day": day_str, "donations": count})
        
    total_visitors = await db.visitors.count_documents({})
    desktop_visitors = await db.visitors.count_documents({"deviceType": "Desktop"})
    mobile_visitors = await db.visitors.count_documents({"deviceType": "Mobile"})
    tablet_visitors = await db.visitors.count_documents({"deviceType": "Tablet"})
    
    if total_visitors == 0:
        total_visitors = 1
        desktop_visitors = 1
        
    return {
        "totalNgos": total_ngos,
        "totalDonors": total_donors,
        "totalDonations": total_donations,
        "pendingVerifications": pending_verifications,
        "chartData": chart_data,
        "visitors": {
            "total": total_visitors,
            "desktop": desktop_visitors,
            "mobile": mobile_visitors,
            "tablet": tablet_visitors
        }
    }

@router.get("/ngos", dependencies=[admin_check])
async def list_all_ngos_for_admin(db=Depends(get_db)):
    cursor = db.ngos.find({})
    ngos = await cursor.to_list(length=100)
    
    res = []
    for n in ngos:
        item = dict(n)
        item["id"] = str(n["_id"])
        res.append(item)
    return res

@router.get("/donations", dependencies=[admin_check])
async def list_all_donations_for_admin(db=Depends(get_db)):
    cursor = db.donations.find({})
    donations = await cursor.to_list(length=100)
    
    res = []
    for d in donations:
        item = dict(d)
        item["id"] = str(d["_id"])
        res.append(item)
    return res

@router.put("/ngos/{id}/status")
async def update_ngo_verification_status(
    id: str,
    status_update: dict, # {"status": "Verified" | "Rejected" | "Suspended" | "Unverified" | "DocumentsApproved" | "PendingVerification"}
    user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    if user.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="Admin permissions required.")
        
    new_status = status_update.get("status")
    if new_status not in ["Verified", "Rejected", "Suspended", "Unverified", "DocumentsApproved", "PendingVerification"]:
        raise HTTPException(status_code=400, detail="Invalid status action.")
        
    ngo = await db.ngos.find_one({"_id": id})
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO profile not found.")
        
    # Update NGO status and log admin details
    update_data = {"status": new_status}
    if new_status == "DocumentsApproved":
        update_data["approvedByAdmin"] = user["email"]
        update_data["documentsApprovedAt"] = datetime.utcnow()
    elif new_status == "Verified":
        update_data["verifiedByAdmin"] = user["email"]
        update_data["verifiedAt"] = datetime.utcnow()
        
    await db.ngos.update_one({"_id": id}, {"$set": update_data})
    
    # Keep users collection status in sync
    await db.users.update_one({"_id": id}, {"$set": {"status": new_status}})
    
    return {"message": f"NGO status successfully set to {new_status}", "id": id}

@router.delete("/users/{id}", dependencies=[admin_check])
async def delete_user_account(id: str, db=Depends(get_db)):
    # Delete from Users collection
    user_res = await db.users.delete_one({"_id": id})
    # Delete from NGOs collection if it exists
    ngo_res = await db.ngos.delete_one({"_id": id})
    
    if user_res.deleted_count == 0 and ngo_res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found.")
        
    return {"message": "Account deleted successfully", "id": id}

@router.post("/cleanup-fake-ngos")
async def cleanup_fake_ngos(user: dict = Depends(get_current_user), db=Depends(get_db)):
    if user.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="Admin permissions required.")
        
    fake_identifiers = ["test", "dummy", "fake", "mock", "example.com", "sample"]
    delete_count = 0
    
    cursor = db.ngos.find({})
    ngos = await cursor.to_list(length=300)
    for ngo in ngos:
        ngo_id = ngo["_id"]
        email = ngo.get("email", "").lower()
        ngo_name = ngo.get("ngoName", "").lower()
        darpan = ngo.get("darpanId", "").lower()
        
        is_fake = False
        if any(f in email for f in fake_identifiers):
            is_fake = True
        elif any(f in ngo_name for f in fake_identifiers):
            is_fake = True
        elif any(f in darpan for f in fake_identifiers) or darpan in ["12345", "123456", "or/2026/0123456"]:
            is_fake = True
            
        if is_fake:
            await db.ngos.delete_one({"_id": ngo_id})
            await db.users.delete_one({"_id": ngo_id})
            delete_count += 1
            
    return {"message": f"Successfully deleted {delete_count} fake NGO accounts."}
