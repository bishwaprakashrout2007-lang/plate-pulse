import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from ..config import settings

logger = logging.getLogger("platepulse.email")

def send_email(to_email: str, subject: str, body_text: str):
    # Fallback to logger if SMTP configuration is empty or dummy
    is_mock = not settings.SMTP_USER or "dummy" in settings.SMTP_USER.lower() or not settings.SMTP_PASSWORD
    if is_mock:
        logger.info(f"--- MOCK EMAIL SENT ---")
        logger.info(f"To: {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body:\n{body_text}")
        logger.info(f"-----------------------")
        return True

    try:
        msg = MIMEMultipart()
        # Fallback to SMTP_USER if SMTP_FROM is not set or default
        from_addr = settings.SMTP_FROM
        if not from_addr or from_addr == "noreply@platepulse.org":
            from_addr = settings.SMTP_USER

        msg['From'] = from_addr
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body_text, 'plain'))

        # SMTP SSL or STARTTLS connection based on port
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            server.starttls()
            
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(from_addr, to_email, msg.as_string())
        server.quit()
        logger.info(f"Email successfully sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        # When real SMTP is configured and fails, return False so the API can report it.
        return False

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
