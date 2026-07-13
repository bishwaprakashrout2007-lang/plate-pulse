import os
import shutil
import uuid
import logging
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile
from ..config import settings

logger = logging.getLogger("platepulse.cloudinary")

# Set up local upload path
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "uploads")
try:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
except Exception as e:
    logger.warning(f"Could not create local upload directory (normal on read-only serverless filesystems): {e}")

# Initialize Cloudinary if credentials are provided
cloudinary_configured = False
if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
    if "dummy" not in settings.CLOUDINARY_CLOUD_NAME.lower():
        try:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True
            )
            cloudinary_configured = True
            logger.info("Cloudinary configured successfully.")
        except Exception as e:
            logger.error(f"Failed to configure Cloudinary: {e}")

async def upload_image(file: UploadFile, folder: str = "platepulse") -> str:
    """
    Uploads a file. If Cloudinary is configured, uploads to Cloudinary.
    Otherwise, saves locally and returns a local URL.
    """
    if cloudinary_configured:
        try:
            # Read file bytes
            contents = await file.read()
            
            # Detect file type
            file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
            is_image = file_ext in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]
            
            params = {
                "folder": folder,
                "resource_type": "auto"
            }
            if is_image:
                params["transformation"] = [
                    {"width": 800, "height": 800, "crop": "limit"},
                    {"quality": "auto"}
                ]
                
            upload_result = cloudinary.uploader.upload(contents, **params)
            return upload_result.get("secure_url")
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {e}. Falling back to local storage.")
            # reset file cursor
            await file.seek(0)

    # Fallback: Local file storage
    try:
        # Generate unique file name
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        dest_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file to disk
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return local path url served by FastAPI static mount
        local_url = f"http://localhost:{settings.PORT}/static/uploads/{unique_filename}"
        logger.info(f"File uploaded locally: {local_url}")
        return local_url
    except Exception as e:
        logger.error(f"Local file upload failed: {e}")
        # Default placeholder images in case of absolute failure
        if "ngo" in folder.lower():
            return "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600"
        return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600"
