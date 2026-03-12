use lettre::{
    message::header::ContentType,
    transport::smtp::authentication::Credentials,
    AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor,
};
use std::env;

fn get_smtp_config() -> (String, u16, String, String, String) {
    let host = env::var("SMTP_HOST").unwrap_or_else(|_| "localhost".to_string());
    let port: u16 = env::var("SMTP_PORT")
        .unwrap_or_else(|_| "587".to_string())
        .parse()
        .unwrap_or(587);
    let username = env::var("SMTP_USERNAME").unwrap_or_default();
    let password = env::var("SMTP_PASSWORD").unwrap_or_default();
    let from = env::var("SMTP_FROM").unwrap_or_else(|_| "noreply@sst-monitor.local".to_string());
    (host, port, username, password, from)
}

fn get_app_url() -> String {
    env::var("APP_URL").unwrap_or_else(|_| "http://localhost:3000".to_string())
}

pub async fn send_verification_email(to_email: &str, token: &str) -> Result<(), String> {
    let (host, port, username, password, from) = get_smtp_config();
    let app_url = get_app_url();
    let verify_url = format!("{}/verify-email?token={}", app_url, token);

    let body = format!(
        r#"<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1117; color: #e4e4e7; padding: 40px;">
  <div style="max-width: 480px; margin: 0 auto; background: #1a1b23; border-radius: 12px; padding: 32px; border: 1px solid #2a2b35;">
    <h1 style="font-size: 20px; margin: 0 0 8px; color: #f4f4f5;">SST Monitor</h1>
    <p style="font-size: 13px; color: #a1a1aa; margin: 0 0 24px;">Email Verification</p>
    <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
      Thank you for registering. Please click the button below to verify your email address.
    </p>
    <a href="{verify_url}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
      Verify Email
    </a>
    <p style="font-size: 12px; color: #71717a; margin: 24px 0 0; line-height: 1.5;">
      If the button doesn't work, copy and paste this link:<br>
      <a href="{verify_url}" style="color: #6366f1;">{verify_url}</a>
    </p>
    <p style="font-size: 12px; color: #71717a; margin: 16px 0 0;">
      After verification, an admin will review and approve your account.
    </p>
  </div>
</body>
</html>"#
    );

    // If SMTP is not configured, log the verification link instead
    if username.is_empty() {
        tracing::warn!(
            "SMTP not configured. Verification link for {}: {}",
            to_email,
            verify_url
        );
        return Ok(());
    }

    let email = Message::builder()
        .from(from.parse().map_err(|e: lettre::address::AddressError| e.to_string())?)
        .to(to_email.parse().map_err(|e: lettre::address::AddressError| e.to_string())?)
        .subject("SST Monitor - Verify your email")
        .header(ContentType::TEXT_HTML)
        .body(body)
        .map_err(|e| e.to_string())?;

    let creds = Credentials::new(username, password);

    let mailer = AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&host)
        .map_err(|e| e.to_string())?
        .port(port)
        .credentials(creds)
        .build();

    mailer.send(email).await.map_err(|e| e.to_string())?;

    tracing::info!("Verification email sent to {}", to_email);
    Ok(())
}
