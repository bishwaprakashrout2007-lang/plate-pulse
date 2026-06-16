from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from datetime import datetime
import uuid
from typing import List
from ..database import get_db
from ..models.schemas import BlogCreate, BlogResponse, FeedbackCreate, FeedbackResponse, GalleryCreate, GalleryResponse
from ..auth import get_current_user, RoleChecker
from ..services.cloudinary_service import upload_image

router = APIRouter(prefix="/api/public", tags=["public"])

# --- Blogs Endpoints ---
@router.get("/blogs", response_model=List[dict])
async def list_blogs(db=Depends(get_db)):
    cursor = db.blogs.find({})
    blogs = await cursor.to_list(length=100)
    res = []
    for b in blogs:
        item = dict(b)
        item["id"] = str(b["_id"])
        res.append(item)
        
    # Inject default mock blogs if collection is empty for beautiful display
    if not res:
        res = [
            {
                "id": "1",
                "title": "5 Ways to Reduce Food Waste at Home",
                "content": "Reducing food waste is one of the easiest ways to save money and help the environment. Start by planning your meals, storing food correctly, and understanding expiration dates...",
                "author": "PlatePulse Team",
                "imageUrl": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600",
                "createdAt": datetime.utcnow()
            },
            {
                "id": "2",
                "title": "NGO Spotlights: Bringing Hope to Bhubaneswar",
                "content": "Our partner NGOs are working day and night to distribute surplus food to local shelters and community centers. Read about their incredible impact this month...",
                "author": "PlatePulse Team",
                "imageUrl": "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600",
                "createdAt": datetime.utcnow()
            }
        ]
    return res

@router.post("/blogs", response_model=BlogResponse)
async def create_blog(
    blog: BlogCreate,
    user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    # Admin only
    if user.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="Only Admins can write blogs.")
        
    blog_id = str(uuid.uuid4())
    doc = {
        "_id": blog_id,
        "title": blog.title,
        "content": blog.content,
        "author": user["name"],
        "imageUrl": blog.imageUrl,
        "createdAt": datetime.utcnow()
    }
    
    await db.blogs.insert_one(doc)
    return doc

# --- Gallery Endpoints ---
@router.get("/gallery", response_model=List[dict])
async def list_gallery_images(db=Depends(get_db)):
    cursor = db.gallery.find({})
    items = await cursor.to_list(length=100)
    res = []
    for i in items:
        item = dict(i)
        item["id"] = str(i["_id"])
        res.append(item)
        
    # Inject defaults if empty
    if not res:
        res = [
            {
                "id": "1",
                "imageUrl": "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600",
                "description": "Food drive at local orphanage",
                "createdAt": datetime.utcnow()
            },
            {
                "id": "2",
                "imageUrl": "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600",
                "description": "Volunteer distribution network",
                "createdAt": datetime.utcnow()
            },
            {
                "id": "3",
                "imageUrl": "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600",
                "description": "Sharing meals, spreading smiles",
                "createdAt": datetime.utcnow()
            }
        ]
    return res

@router.post("/gallery", response_model=GalleryResponse)
async def upload_gallery_image(
    req: GalleryCreate,
    user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    gallery_id = str(uuid.uuid4())
    doc = {
        "_id": gallery_id,
        "imageUrl": req.imageUrl,
        "description": req.description,
        "createdAt": datetime.utcnow()
    }
    await db.gallery.insert_one(doc)
    return doc

# --- Feedback/Testimonials Endpoints ---
@router.get("/feedback", response_model=List[dict])
async def list_feedback(db=Depends(get_db)):
    cursor = db.feedback.find({})
    feedbacks = await cursor.to_list(length=100)
    res = []
    for f in feedbacks:
        item = dict(f)
        item["id"] = str(f["_id"])
        res.append(item)
        
    # Inject defaults
    if not res:
        res = [
            {
                "id": "1",
                "userName": "Anjali Sharma",
                "email": "anjali@gmail.com",
                "message": "PlatePulse has made food donation so easy! I used to throw away extra food from my restaurant, but now it feeds 20 people every day.",
                "rating": 5,
                "createdAt": datetime.utcnow()
            },
            {
                "id": "2",
                "userName": "Ramesh Kumar",
                "email": "ramesh@gmail.com",
                "message": "Excellent verification process. As a donor, I feel confident knowing the NGOs on this platform are fully audited and verified.",
                "rating": 5,
                "createdAt": datetime.utcnow()
            }
        ]
    return res

@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    req: FeedbackCreate,
    db=Depends(get_db)
):
    feedback_id = str(uuid.uuid4())
    doc = {
        "_id": feedback_id,
        "userName": req.userName,
        "email": req.email,
        "message": req.message,
        "rating": req.rating,
        "createdAt": datetime.utcnow()
    }
    await db.feedback.insert_one(doc)
    return doc

# Helper upload routes
@router.post("/upload")
async def public_upload(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    url = await upload_image(file, folder="public_uploads")
    return {"url": url}
