/**
 * =========================================================================
 * PREVIA OWNER-CONTROLLED WELCOME EMAIL GATEWAY (GOOGLE APPS SCRIPT)
 * =========================================================================
 * 
 * Purpose:
 * Sends an idempotent welcome email to newly created Previa user accounts.
 * Executes strictly under the owner account (tejaswinidande2913@gmail.com)
 * with fixed display name "Previa AI".
 * 
 * Deployment Instructions:
 * 1. Log in to Google with the owner account: tejaswinidande2913@gmail.com
 * 2. Visit https://script.google.com and click "New project".
 * 3. Name the project: "PreviaWelcomeEmailGateway".
 * 4. Paste this code into Code.gs (replacing any boilerplate code).
 * 5. Click "Deploy" > "New deployment".
 * 6. Select type: "Web app" (click the gear icon > Web app).
 * 7. Configuration:
 *    - Description: "Previa Welcome Email Dispatch Gateway"
 *    - Execute as: "Me (tejaswinidande2913@gmail.com)"  <-- MANDATORY!
 *    - Who has access: "Anyone" (allows Previa backend / app to trigger welcome dispatch)
 * 8. Click "Deploy" and complete the one-time authorization using tejaswinidande2913@gmail.com.
 * 9. Copy the generated Web App URL (ending in /exec).
 * 10. Set the environment variable in Previa:
 *     PREVIA_WELCOME_EMAIL_APPS_SCRIPT_URL="https://script.google.com/macros/s/.../exec"
 * =========================================================================
 */

// Owner Sender Identity Configuration
const FIXED_SENDER_EMAIL = "tejaswinidande2913@gmail.com";
const FIXED_SENDER_DISPLAY_NAME = "Previa AI";
const EXPECTED_API_TOKEN = "PREVIA_WELCOME_GATEWAY_SEC_2026";

// Fixed Welcome Email Template
const WELCOME_EMAIL_SUBJECT = "Welcome to Previa AI";

function buildWelcomeBody(displayName) {
  var name = displayName && displayName.trim() ? displayName.trim() : "Operator";
  return (
    "Hello " + name + ",\n\n" +
    "Welcome to Previa AI.\n\n" +
    "Your account has been successfully created.\n\n" +
    "Previa AI helps teams identify supply-chain risks early, understand potential disruption impact, and take proactive action before disruptions occur.\n\n" +
    "You can now access your Previa AI workspace and explore the platform.\n\n" +
    "Regards,\n" +
    "Previa AI\n" +
    "Resilience & Disruption Engine"
  );
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Wait up to 10 seconds for script lock to prevent race conditions
    lock.waitLock(10000);

    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: "Missing payload in request." }, 400);
    }

    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({ success: false, error: "Invalid JSON format in payload." }, 400);
    }

    // Optional shared token check
    if (body.token && body.token !== EXPECTED_API_TOKEN) {
      return jsonResponse({ success: false, error: "Unauthorized gateway credential." }, 401);
    }

    // 1. Whitelist Allowed Incoming Fields strictly
    var allowedFields = ["recipientEmail", "displayName", "uid", "token"];
    var incomingKeys = Object.keys(body);
    for (var i = 0; i < incomingKeys.length; i++) {
      if (allowedFields.indexOf(incomingKeys[i]) === -1) {
        return jsonResponse({ success: false, error: "Unexpected field: " + incomingKeys[i] }, 400);
      }
    }

    // 2. Validate & Sanitize Recipient Email
    var recipientEmail = (body.recipientEmail || "").toString().trim().toLowerCase();
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipientEmail || !emailRegex.test(recipientEmail)) {
      return jsonResponse({ success: false, error: "Invalid or missing recipient email address." }, 400);
    }
    if (recipientEmail.length > 120) {
      return jsonResponse({ success: false, error: "Recipient email exceeds 120 character limit." }, 400);
    }

    // 3. Validate & Sanitize User UID
    var uid = (body.uid || "").toString().trim();
    if (!uid) {
      return jsonResponse({ success: false, error: "Missing Firebase user UID." }, 400);
    }
    if (uid.length > 128) {
      return jsonResponse({ success: false, error: "UID exceeds character limit." }, 400);
    }

    // 4. Validate & Sanitize Display Name
    // Strip newlines/carriage returns to prevent email header injection
    var rawDisplayName = (body.displayName || "").toString().replace(/[\r\n\t]/g, " ").trim();
    if (rawDisplayName.length > 120) {
      rawDisplayName = rawDisplayName.substring(0, 120);
    }
    // Prevent formula injection
    if (rawDisplayName.charAt(0) === "=" || rawDisplayName.charAt(0) === "+" || rawDisplayName.charAt(0) === "-" || rawDisplayName.charAt(0) === "@") {
      rawDisplayName = rawDisplayName.substring(1).trim();
    }
    var sanitizedDisplayName = rawDisplayName || recipientEmail.split("@")[0];

    // 5. Enforce Idempotency (Prevent Duplicate Welcome Emails per user UID)
    var properties = PropertiesService.getScriptProperties();
    var idempotencyKey = "welcome_sent_" + uid;
    var existingSentTimestamp = properties.getProperty(idempotencyKey);
    if (existingSentTimestamp) {
      return jsonResponse({
        success: true,
        message: "Welcome email already sent for this user account (idempotent).",
        recipient: recipientEmail,
        alreadySent: true,
        originalSentAt: existingSentTimestamp
      }, 200);
    }

    // 6. Construct Fixed Email Content (Sender & Templates are non-negotiable)
    var emailBody = buildWelcomeBody(sanitizedDisplayName);

    // 7. Send Email via Google Workspace / GmailApp using Owner Account
    // The sender display name is explicitly set to "Previa AI"
    GmailApp.sendEmail(recipientEmail, WELCOME_EMAIL_SUBJECT, emailBody, {
      name: FIXED_SENDER_DISPLAY_NAME,
      noReply: false
    });

    var sentTimestamp = new Date().toISOString();
    // Record idempotency token in Script Properties
    properties.setProperty(idempotencyKey, sentTimestamp);

    return jsonResponse({
      success: true,
      message: "Welcome email successfully dispatched to " + recipientEmail,
      recipient: recipientEmail,
      sender: FIXED_SENDER_DISPLAY_NAME + " <" + FIXED_SENDER_EMAIL + ">",
      sentAt: sentTimestamp
    }, 200);

  } catch (err) {
    return jsonResponse({
      success: false,
      error: "Apps Script failed to dispatch welcome email: " + err.message
    }, 500);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return jsonResponse({
    service: "Previa Welcome Email Gateway",
    status: "active",
    mode: "owner-executed",
    sender: FIXED_SENDER_DISPLAY_NAME + " <" + FIXED_SENDER_EMAIL + ">",
    subject: WELCOME_EMAIL_SUBJECT
  });
}

function jsonResponse(data, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
