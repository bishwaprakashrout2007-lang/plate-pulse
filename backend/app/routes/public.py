from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from datetime import datetime
import uuid
from typing import List
from ..database import get_db
from ..models.schemas import BlogCreate, BlogResponse, FeedbackCreate, FeedbackResponse, GalleryCreate, GalleryResponse
from ..auth import get_current_user, RoleChecker, ADMIN_EMAILS
from ..services.cloudinary_service import upload_image
from ..services.email_service import send_email

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
                "imageUrl": "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800",
                "description": "Volunteers carefully sorting and packing nutritious food boxes for local shelters.",
                "createdAt": datetime.utcnow()
            },
            {
                "id": "2",
                "imageUrl": "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800",
                "description": "Volunteers distributing meals and fresh fruit to children at the community shelter.",
                "createdAt": datetime.utcnow()
            },
            {
                "id": "3",
                "imageUrl": "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800",
                "description": "A bustling community donation center receiving surplus food from restaurant partners.",
                "createdAt": datetime.utcnow()
            },
            {
                "id": "4",
                "imageUrl": "https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?w=800",
                "description": "Preparing warm, home-cooked food in collaboration with certified local NGO kitchens.",
                "createdAt": datetime.utcnow()
            },
            {
                "id": "5",
                "imageUrl": "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800",
                "description": "Delivering fresh organic apples and healthy meals to low-income families.",
                "createdAt": datetime.utcnow()
            },
            {
                "id": "6",
                "imageUrl": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
                "description": "Carefully selected fresh ingredients and vegetables saved from banquet surplus.",
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
    
    # Send email notification to admins
    for admin_email in ADMIN_EMAILS:
        subject = f"PlatePulse – New Feedback/Contact Message from {req.userName}"
        body_text = f"""Hello Admin,

You have received a new contact/feedback message on PlatePulse.

Details:
Name: {req.userName}
Email: {req.email}
Rating: {req.rating}/5
Message: {req.message}

Please log in to the dashboard to review and manage user submissions.

Regards,
PlatePulse Team
"""
        body_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Feedback Message</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">🍽️ PlatePulse</h1>
              <p style="margin:6px 0 0;color:#bbf7d0;font-size:13px;">Connecting Food. Changing Lives.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 20px;">
              <h2 style="margin:0 0 10px;color:#1a1a1a;font-size:20px;font-weight:600;">New Support / Feedback Message</h2>
              <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.7;">
                A visitor has submitted a message via the Contact page.
              </p>

              <!-- Feedback details card -->
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;color:#666;font-size:13px;"><strong>Name:</strong> {req.userName}</p>
                <p style="margin:0 0 8px;color:#666;font-size:13px;"><strong>Email:</strong> <a href="mailto:{req.email}" style="color:#16a34a;text-decoration:none;">{req.email}</a></p>
                <p style="margin:0 0 12px;color:#666;font-size:13px;"><strong>Rating:</strong> {"⭐" * req.rating} ({req.rating}/5)</p>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0;" />
                <p style="margin:0;color:#333;font-size:14px;line-height:1.6;font-style:italic;">"{req.message}"</p>
              </div>

              <p style="margin:0;color:#888;font-size:13px;text-align:center;">
                Please log in to the admin panel to view all submissions.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 36px;text-align:center;">
              <p style="margin:0;color:#aaa;font-size:12px;line-height:1.6;">
                &copy; 2026 PlatePulse. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
 </body>
</html>"""
        send_email(admin_email, subject, body_text, body_html)
        
    return doc

# Helper upload routes
@router.post("/upload")
async def public_upload(
    file: UploadFile = File(...)
):
    url = await upload_image(file, folder="public_uploads")
    return {"url": url}
