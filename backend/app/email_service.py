import smtplib
import ssl
import json
import logging
import re
import html
from typing import Optional, Dict, Any
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from sqlalchemy.orm import Session
from .config import settings
from .models import SystemSetting

logger = logging.getLogger("entiq.email")
logger.setLevel(logging.INFO)

SETTING_KEY = "smtp_config"

def get_active_email_config(db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Retrieves the active SMTP configuration, checking the database first,
    then falling back to environment settings.
    """
    config = {
        "smtp_host": settings.SMTP_HOST,
        "smtp_port": settings.SMTP_PORT,
        "smtp_user": settings.SMTP_USER,
        "smtp_password": settings.SMTP_PASSWORD,
        "smtp_from_email": settings.SMTP_FROM_EMAIL or settings.SMTP_USER,
        "smtp_from_name": settings.SMTP_FROM_NAME,
        "frontend_url": settings.FRONTEND_URL,
    }

    if db:
        try:
            setting = db.query(SystemSetting).filter(SystemSetting.key == SETTING_KEY).first()
            if setting and setting.value:
                db_config = json.loads(setting.value)
                for k, v in db_config.items():
                    if v is not None and (k != "smtp_password" or v != ""):
                        config[k] = v
        except Exception as e:
            logger.warning(f"Failed to read smtp_config from database: {e}")

    # Fallback from_email to user if empty
    if not config["smtp_from_email"]:
        config["smtp_from_email"] = config["smtp_user"]

    config["is_configured"] = bool(config["smtp_host"] and config["smtp_user"] and config["smtp_password"])
    return config

def save_email_config(db: Session, config_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Saves or updates the SMTP configuration in the SQLite database.
    """
    existing = get_active_email_config(db)
    
    # Merge values
    for k in ["smtp_host", "smtp_port", "smtp_user", "smtp_from_email", "smtp_from_name", "frontend_url"]:
        if k in config_data and config_data[k] is not None:
            existing[k] = config_data[k]
    
    # Only update password if a new non-empty value was provided
    if config_data.get("smtp_password"):
        existing["smtp_password"] = config_data["smtp_password"]

    setting = db.query(SystemSetting).filter(SystemSetting.key == SETTING_KEY).first()
    if not setting:
        setting = SystemSetting(key=SETTING_KEY, value=json.dumps(existing))
        db.add(setting)
    else:
        setting.value = json.dumps(existing)
    
    db.commit()
    return get_active_email_config(db)

import socket

def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        s.connect(('1.1.1.1', 80))
        ip = s.getsockname()[0]
        s.close()
        if not ip.startswith('169.254.') and not ip.startswith('127.'):
            return ip
    except Exception:
        pass

    try:
        for ip in socket.gethostbyname_ex(socket.gethostname())[2]:
            if not ip.startswith('169.254.') and not ip.startswith('127.'):
                return ip
    except Exception:
        pass
    return "127.0.0.1"

def build_invitation_html(
    client_name: str,
    service: str,
    invite_link: str,
    from_name: str = "Grow Advisory Group",
    expires: str = "14 days",
    lan_link: Optional[str] = None
) -> str:
    """
    Renders an elegant, modern, and mobile-friendly HTML email for client invitations with multi-device support.
    """
    multi_device_box = ""
    if lan_link and ("localhost" in lan_link or "127.0.0.1" in lan_link or "192.168." in invite_link or "10." in invite_link):
        multi_device_box = f"""
              <!-- Multi-Device Access Options -->
              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 16px; margin: 20px 0; text-align: left;">
                <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 8px; display: flex; align-items: center;">
                  <span>Device &amp; Network Access Options:</span>
                </div>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 12px; line-height: 1.6;">
                  <tr>
                    <td style="padding: 4px 0; color: #475569;">
                      <strong>💻 On this Computer (Local):</strong><br>
                      <a href="{lan_link}" style="color: #2855A6; text-decoration: underline; font-family: monospace; font-size: 11px; word-break: break-all;">{lan_link}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0 2px 0; color: #475569; border-top: 1px dashed #e2e8f0;">
                      <strong>📱 On Mobile / Wi-Fi Network:</strong><br>
                      <a href="{invite_link}" style="color: #2855A6; text-decoration: underline; font-family: monospace; font-size: 11px; word-break: break-all;">{invite_link}</a>
                      <div style="font-size: 10px; color: #64748b; margin-top: 2px;"><em>(Ensure phone is connected to the same local Wi-Fi router)</em></div>
                    </td>
                  </tr>
                </table>
              </div>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Onboarding Invitation — {from_name}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #2855A6; padding: 28px 32px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: #ffffff; color: #2855A6; font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 4px; letter-spacing: 0.05em; margin-bottom: 8px;">ENTIQ START</div>
                    <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; line-height: 1.3;">{from_name}</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0; color: #334155;">
                Dear <strong>{client_name}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; color: #475569;">
                You have been invited by <strong>{from_name}</strong> to complete your digital client onboarding and engagement setup for:
              </p>

              <!-- Service Highlight Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2855A6; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 4px;">Service Scope</div>
                <div style="font-size: 15px; font-weight: 700; color: #0f172a;">{service}</div>
              </div>

              <!-- Steps List -->
              <div style="margin-bottom: 28px;">
                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 12px;">What to expect (takes ~5 minutes):</div>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="28" valign="top" style="padding-bottom: 10px;">
                      <div style="background-color: #eef2fa; color: #2855A6; width: 20px; height: 20px; border-radius: 50%; text-align: center; font-size: 11px; font-weight: 700; line-height: 20px;">1</div>
                    </td>
                    <td style="padding-bottom: 10px; font-size: 13px; color: #334155;">
                      <strong>Identity Verification</strong>: Quick biometric or photo ID check via EnTIQ KYC
                    </td>
                  </tr>
                  <tr>
                    <td width="28" valign="top" style="padding-bottom: 10px;">
                      <div style="background-color: #eef2fa; color: #2855A6; width: 20px; height: 20px; border-radius: 50%; text-align: center; font-size: 11px; font-weight: 700; line-height: 20px;">2</div>
                    </td>
                    <td style="padding-bottom: 10px; font-size: 13px; color: #334155;">
                      <strong>Entity Details</strong>: Verify your contact, ABN/ACN, and tax residency info
                    </td>
                  </tr>
                  <tr>
                    <td width="28" valign="top;">
                      <div style="background-color: #eef2fa; color: #2855A6; width: 20px; height: 20px; border-radius: 50%; text-align: center; font-size: 11px; font-weight: 700; line-height: 20px;">3</div>
                    </td>
                    <td style="font-size: 13px; color: #334155;">
                      <strong>Engagement Letter</strong>: Review terms and apply your secure digital signature
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Bulletproof CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 20px 0;">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{invite_link}" style="height:50px;v-text-anchor:middle;width:260px;" arcsize="10%" stroke="f" fillcolor="#2855A6">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Start Onboarding &rarr;</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" bgcolor="#2855A6" style="border-radius: 6px; background-color: #2855A6;">
                          <a href="{invite_link}" target="_blank" rel="noopener noreferrer" style="display: block; background-color: #2855A6; border-top: 14px solid #2855A6; border-bottom: 14px solid #2855A6; border-left: 36px solid #2855A6; border-right: 36px solid #2855A6; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: bold; color: #ffffff !important; text-decoration: none; text-align: center; line-height: 1.2; -webkit-text-size-adjust: none;">
                            <span style="color: #ffffff !important; text-decoration: none;">Start Onboarding &rarr;</span>
                          </a>
                        </td>
                      </tr>
                    </table>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <!-- Direct Link Fallback -->
              <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0 0 16px 0; text-align: center;">
                If the button above does not open in your browser, tap or copy this direct link:<br>
                <a href="{invite_link}" target="_blank" rel="noopener noreferrer" style="color: #2855A6; word-break: break-all; font-size: 11px; text-decoration: underline;">{invite_link}</a>
              </p>
{multi_device_box}

              <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px;">
                <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.5;">
                  &bull; This invitation link is secure and valid until {expires}.<br>
                  &bull; For your privacy and security, please do not forward this email to others.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
              <p style="font-size: 11px; color: #64748b; margin: 0 0 4px 0;">
                <strong>{from_name}</strong> &bull; Level 12, 101 Collins Street, Melbourne VIC 3000
              </p>
              <p style="font-size: 10px; color: #94a3b8; margin: 0;">
                Powered by EnTIQ Start &bull; Australian Professional Practice Compliance & Onboarding
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

def dispatch_smtp_message(
    config: Dict[str, Any],
    recipient_email: str,
    subject: str,
    html_body: str
) -> Dict[str, Any]:
    """
    Connects to the configured SMTP server and dispatches an HTML email.
    """
    host = config.get("smtp_host", "smtp.gmail.com")
    port = int(config.get("smtp_port", 587))
    user = config.get("smtp_user", "")
    password = config.get("smtp_password", "")
    from_email = config.get("smtp_from_email") or user
    from_name = config.get("smtp_from_name") or "Grow Advisory Group"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = recipient_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        if port == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, context=context, timeout=12) as server:
                server.login(user, password)
                server.sendmail(from_email, recipient_email, msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=12) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(user, password)
                server.sendmail(from_email, recipient_email, msg.as_string())

        logger.info(f"Successfully delivered email to {recipient_email} via {host}:{port}")
        return {
            "status": "sent",
            "delivered": True,
            "message": f"Successfully delivered email to {recipient_email} via {host}:{port}"
        }
    except smtplib.SMTPAuthenticationError as e:
        error_msg = f"SMTP Authentication failed. Please verify your email and password (for Gmail, use a 16-character App Password): {e}"
        logger.error(error_msg)
        return {"status": "error", "delivered": False, "message": error_msg}
    except Exception as e:
        error_msg = f"SMTP dispatch failed ({host}:{port}): {e}"
        logger.error(error_msg)
        return {"status": "error", "delivered": False, "message": error_msg}

def send_invitation_email(
    db: Optional[Session],
    recipient_email: str,
    client_name: str,
    service: str,
    inv_id: str,
    expires: str = "14 days"
) -> Dict[str, Any]:
    """
    Sends an invitation email. If SMTP is not configured, safely logs the simulated email.
    """
    config = get_active_email_config(db)
    raw_url = (config.get("frontend_url") or "http://localhost:5173").strip().rstrip("/")
    
    local_ip = get_local_ip()
    is_local_target = (
        "localhost" in raw_url 
        or "127.0.0.1" in raw_url 
        or bool(re.search(r"://(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)", raw_url))
    )
    if is_local_target and local_ip not in ["127.0.0.1", "localhost"]:
        port_match = re.search(r":(\d+)", raw_url)
        port = port_match.group(1) if port_match else "5173"
        invite_link = f"http://{local_ip}:{port}/onboard?id={inv_id}"
        lan_link = f"http://localhost:{port}/onboard?id={inv_id}"
    else:
        invite_link = f"{raw_url}/onboard?id={inv_id}"
        lan_link = None

    if not config.get("is_configured"):
        logger.info(f"[SIMULATED INVITATION EMAIL] To: {recipient_email} | Client: {client_name} | Service: {service} | Link: {invite_link}")
        return {
            "status": "simulated",
            "delivered": False,
            "simulated": True,
            "link": invite_link,
            "lanLink": lan_link,
            "message": "SMTP not configured. Link logged for local testing."
        }

    subject = f"Invitation: Client Onboarding for {service} — {config.get('smtp_from_name', 'Grow Advisory Group')}"
    html_body = build_invitation_html(
        client_name=client_name,
        service=service,
        invite_link=invite_link,
        from_name=config.get("smtp_from_name", "Grow Advisory Group"),
        expires=expires,
        lan_link=lan_link
    )

    result = dispatch_smtp_message(config, recipient_email, subject, html_body)
    result["link"] = invite_link
    if lan_link:
        result["lanLink"] = lan_link
    return result

def send_test_email(to_email: str, custom_config: Optional[Dict[str, Any]] = None, db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Sends a test verification email to confirm SMTP connectivity.
    """
    config = get_active_email_config(db)
    if custom_config:
        for k, v in custom_config.items():
            if v is not None and (k != "smtp_password" or v != ""):
                config[k] = v

    if not config.get("smtp_user") or not config.get("smtp_password"):
        return {
            "status": "error",
            "delivered": False,
            "message": "Cannot test SMTP: Username and Password/App Password are required."
        }

    subject = "EnTIQ Start — SMTP Email Connection Verification"
    html_body = f"""<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 24px; color: #1e293b; background: #f8fafc;">
  <div style="max-width: 500px; margin: auto; background: white; padding: 28px; border-radius: 8px; border: 1px solid #e2e8f0;">
    <h3 style="color: #2855A6; margin-top: 0;">&check; SMTP Connection Successful!</h3>
    <p>This test email confirms that your outgoing mail server is properly connected and delivering emails from <strong>EnTIQ Start</strong>.</p>
    <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 12px; font-family: monospace;">
      Host: {config.get('smtp_host')}<br>
      Port: {config.get('smtp_port')}<br>
      Sender: {config.get('smtp_from_email')}<br>
      Recipient: {to_email}
    </div>
    <p style="font-size: 12px; color: #64748b; margin-top: 20px;">All future client invitations will be dispatched automatically via this mail server.</p>
  </div>
</body>
</html>"""

    return dispatch_smtp_message(config, to_email, subject, html_body)

def build_info_request_html(
    client_name: str,
    case_id: str,
    service: str,
    message: str,
    from_name: str = "Grow Advisory Group",
    requested_by: str = "J. Okafor"
) -> str:
    escaped_msg = html.escape(message).replace("\n", "<br>")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Information Request — {case_id}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #2855A6; padding: 28px 32px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: #ffffff; color: #2855A6; font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 4px; letter-spacing: 0.05em; margin-bottom: 8px;">ENTIQ START &bull; CASE {case_id}</div>
                    <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; line-height: 1.3;">{from_name}</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0; color: #334155;">
                Dear <strong>{client_name}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; color: #475569;">
                Our team is currently processing your onboarding file for <strong>{service}</strong>. To proceed, we require the following additional information or documentation:
              </p>

              <!-- Requested Details Box -->
              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #2855A6; border-radius: 6px; padding: 18px 20px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #2855A6; letter-spacing: 0.05em; margin-bottom: 8px;">Requested Items / Details</div>
                <div style="font-size: 14px; line-height: 1.6; color: #0f172a; font-weight: 500;">
                  {escaped_msg}
                </div>
              </div>

              <!-- Case Reference Info -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; background-color: #f1f5f9; border-radius: 6px; padding: 12px 16px; font-size: 12px;">
                <tr>
                  <td style="color: #64748b; padding: 4px 0;">Case Reference:</td>
                  <td style="font-weight: 600; color: #1e293b; text-align: right; padding: 4px 0;">{case_id}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 4px 0;">Service Scope:</td>
                  <td style="font-weight: 600; color: #1e293b; text-align: right; padding: 4px 0;">{service}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 4px 0;">Requested By:</td>
                  <td style="font-weight: 600; color: #1e293b; text-align: right; padding: 4px 0;">{requested_by}</td>
                </tr>
              </table>

              <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 12px 0;">
                You may reply directly to this email with the requested information or attachments, or reach out to your designated adviser at <strong>{from_name}</strong>.
              </p>

              <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px;">
                <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.5;">
                  &bull; This request was issued securely from the EnTIQ Start practice management platform.<br>
                  &bull; If you have already provided this information or believe you received this in error, please contact us.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
              <p style="font-size: 11px; color: #64748b; margin: 0 0 4px 0;">
                <strong>{from_name}</strong> &bull; Level 12, 101 Collins Street, Melbourne VIC 3000
              </p>
              <p style="font-size: 10px; color: #94a3b8; margin: 0;">
                Powered by EnTIQ Start &bull; Australian Professional Practice Compliance & Onboarding
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

def send_info_request_email(
    db: Optional[Session],
    recipient_email: str,
    client_name: str,
    case_id: str,
    service: str,
    message: str,
    requested_by: str = "J. Okafor"
) -> Dict[str, Any]:
    """
    Sends an information request email to the client.
    If SMTP is not configured, logs the simulated email.
    """
    config = get_active_email_config(db)
    from_name = config.get("smtp_from_name") or "Grow Advisory Group"

    if not config.get("is_configured"):
        logger.info(f"[SIMULATED INFO REQUEST EMAIL] To: {recipient_email} | Case: {case_id} | Client: {client_name} | Message: {message}")
        return {
            "status": "simulated",
            "delivered": False,
            "simulated": True,
            "message": f"SMTP not configured. Request logged for '{recipient_email}'."
        }

    subject = f"Action Required: Information Requested for {case_id} — {from_name}"
    html_body = build_info_request_html(
        client_name=client_name,
        case_id=case_id,
        service=service,
        message=message,
        from_name=from_name,
        requested_by=requested_by
    )

    return dispatch_smtp_message(config, recipient_email, subject, html_body)
