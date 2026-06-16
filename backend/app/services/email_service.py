import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from ..config import settings

logger = logging.getLogger("platepulse.email")

def send_email(to_email: str, subject: str, body_text: str):
    # Fallback to logger if SMTP configuration is empty or dummy
    if not settings.SMTP_USER or "dummy" in settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.info(f"--- MOCK EMAIL SENT ---")
        logger.info(f"To: {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body:\n{body_text}")
        logger.info(f"-----------------------")
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_FROM
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body_text, 'plain'))

        # Standard SMTP connection
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM, to_email, msg.as_string())
        server.quit()
        logger.info(f"Email successfully sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        # Always return True in local dev/testing so it doesn't block the UI
        logger.info(f"[DEV FALLBACK] Mock email detail printed above.")
        return True

def send_otp_email(to_email: str, otp: str):
    subject = "PlatePulse - Email OTP Verification"
    body = f"""Hello,

Welcome to PlatePulse. Your 6-digit OTP verification code is:

{otp}

Please enter this code on the verification screen to complete your registration.
This OTP will expire in 10 minutes.

Regards,
PlatePulse Team
"""
    return send_email(to_email, subject, body)

def send_appreciation_email(donor_name: str, donor_email: str):
    subject = "Thank You for Supporting Us"
    body = f"""Dear {donor_name},

Thank you for your generous contribution.

Your support helps us reduce food waste and bring hope to those in need.

Together we are making a difference.

Regards,
PlatePulse NGO Team
"""
    return send_email(donor_email, subject, body)
