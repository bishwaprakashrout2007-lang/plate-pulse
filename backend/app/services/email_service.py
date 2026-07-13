import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
import httpx
from ..config import settings

logger = logging.getLogger("platepulse.email")

def send_email(to_email: str, subject: str, body_text: str, body_html: str = None) -> tuple:
    # Check if Brevo HTTP API is configured (highly recommended for Render Free Tier to bypass SMTP block)
    if settings.BREVO_API_KEY and settings.BREVO_API_KEY.strip() != "":
        try:
            url = "https://api.brevo.com/v3/smtp/email"
            headers = {
                "accept": "application/json",
                "api-key": settings.BREVO_API_KEY,
                "content-type": "application/json"
            }
            from_addr = settings.SMTP_FROM
            if not from_addr or from_addr == "noreply@platepulse.org":
                from_addr = settings.SMTP_USER or "ardiliumplatform@gmail.com"
                
            payload = {
                "sender": {"name": "PlatePulse", "email": from_addr},
                "to": [{"email": to_email}],
                "subject": subject,
                "htmlContent": body_html or f"<p>{body_text}</p>",
                "textContent": body_text
            }
            with httpx.Client() as client:
                response = client.post(url, json=payload, headers=headers, timeout=10.0)
                if response.status_code in [200, 201, 202]:
                    logger.info(f"Email successfully sent to {to_email} via Brevo HTTP API")
                    return True, ""
                else:
                    logger.error(f"Brevo API error: {response.text}")
                    return False, f"Brevo HTTP API error: {response.text}"
        except Exception as e:
            logger.error(f"Failed to send email via Brevo HTTP API: {e}")
            return False, f"Brevo HTTP API error: {e}"

    # Fallback to logger if SMTP configuration is empty or dummy
    is_mock = (
        not settings.SMTP_USER 
        or settings.SMTP_USER == "dummy-email@gmail.com" 
        or not settings.SMTP_PASSWORD 
        or settings.SMTP_PASSWORD == "dummy-password"
    )
    if is_mock:
        logger.info(f"--- MOCK EMAIL SENT ---")
        logger.info(f"To: {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body:\n{body_text}")
        logger.info(f"-----------------------")
        return True, "Mock email sent"

    try:
        msg = MIMEMultipart("alternative")
        # Fallback to SMTP_USER if SMTP_FROM is not set or default
        from_addr = settings.SMTP_FROM
        if not from_addr or from_addr == "noreply@platepulse.org":
            from_addr = settings.SMTP_USER

        msg['From'] = f"PlatePulse <{from_addr}>"
        msg['To'] = to_email
        msg['Subject'] = subject

        # Attach plain text first, then HTML (email clients prefer HTML)
        msg.attach(MIMEText(body_text, 'plain'))
        if body_html:
            msg.attach(MIMEText(body_html, 'html'))

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
        return True, ""
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False, str(e)

def send_otp_email(to_email: str, otp: str):
    subject = "PlatePulse – Your OTP Verification Code"

    body_text = f"""Hello,

Your OTP verification code for PlatePulse is: {otp}

This code expires in 10 minutes. Do not share it with anyone.

Regards,
PlatePulse Team
"""

    body_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>OTP Verification</title>
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
              <h2 style="margin:0 0 10px;color:#1a1a1a;font-size:20px;font-weight:600;">Email Verification</h2>
              <p style="margin:0 0 28px;color:#555;font-size:14px;line-height:1.7;">
                Thank you for registering with PlatePulse! Please use the one-time password below to verify your email address and complete your registration.
              </p>

              <!-- OTP Box -->
              <div style="background:#f0fdf4;border:2px dashed #16a34a;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;color:#16a34a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;">Your OTP Code</p>
                <p style="margin:0;font-size:44px;font-weight:800;letter-spacing:12px;color:#15803d;font-family:'Courier New',monospace;">{otp}</p>
              </div>

              <p style="margin:0 0 8px;color:#888;font-size:13px;text-align:center;">
                ⏰ This code expires in <strong>10 minutes</strong>.
              </p>
              <p style="margin:0;color:#888;font-size:13px;text-align:center;">
                🔒 Never share this code with anyone.
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
                If you didn't create a PlatePulse account, you can safely ignore this email.<br/>
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

    return send_email(to_email, subject, body_text, body_html)

def send_appreciation_email(donor_name: str, donor_email: str):
    subject = "Thank You for Supporting PlatePulse 💚"
    body_text = f"""Dear {donor_name},

Thank you for your generous contribution.

Your support helps us reduce food waste and bring hope to those in need.

Together we are making a difference.

Regards,
PlatePulse NGO Team
"""

    body_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Thank You</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;">🍽️ PlatePulse</h1>
              <p style="margin:6px 0 0;color:#bbf7d0;font-size:13px;">Connecting Food. Changing Lives.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">Thank You, {donor_name}! 💚</h2>
              <p style="color:#555;font-size:14px;line-height:1.8;margin:0 0 20px;">
                Your generous contribution has been received and is making a real difference in the lives of those who need it most.
              </p>
              <p style="color:#555;font-size:14px;line-height:1.8;margin:0 0 28px;">
                Together, we are reducing food waste and spreading hope — one plate at a time. 🌱
              </p>
              <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:8px;padding:16px 20px;">
                <p style="margin:0;color:#15803d;font-size:13px;font-weight:600;">Your kindness creates ripples of change. Thank you for being part of our mission.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <p style="margin:0;color:#aaa;font-size:12px;">&copy; 2026 PlatePulse. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    return send_email(donor_email, subject, body_text, body_html)

