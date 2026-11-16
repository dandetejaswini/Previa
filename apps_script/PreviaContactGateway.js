/**
 * =========================================================================
 * PREVIA OWNER-CONTROLLED GOOGLE APPS SCRIPT WEB APP
 * =========================================================================
 * 
 * Deployment Instructions:
 * 1. Open Google Sheets (or script.google.com):
 *    Spreadsheet: "Previa_AI_Contact_Details"
 *    ID: 1iFR2xisU2ZivsaftN5oBHs265kipcHgmAIChusOK6gM
 * 2. Go to Extensions > Apps Script.
 * 3. Paste this code into Code.gs.
 * 4. Click "Deploy" > "New deployment".
 * 5. Select type: "Web app".
 * 6. Configuration:
 *    - Description: "Previa Contact Form Write Gateway"
 *    - Execute as: "Me" (The script owner / deployer)  <-- CRITICAL!
 *    - Who has access: "Anyone" (allows server/Previa app to dispatch)
 * 7. Click Deploy, Authorize access once as the spreadsheet owner.
 * 8. Copy the Web App URL and set PREVIA_CONTACT_APPS_SCRIPT_URL in your environment / .env.
 * =========================================================================
 */

const TARGET_SPREADSHEET_ID = "YOUR_TARGET_SPREADSHEET_ID";
const TARGET_SHEET_NAME = "contact_data";

// Shared secret token configured between Previa server and Apps Script (optional extra security)
const EXPECTED_API_TOKEN = "PREVIA_CONTACT_GATEWAY_SEC_2026";

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Wait up to 10 seconds for concurrent write locks
    lock.waitLock(10000);

    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: "Missing payload" }, 400);
    }

    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({ success: false, error: "Invalid JSON format" }, 400);
    }

    // Optional token validation if provided in headers/payload
    if (body.token && body.token !== EXPECTED_API_TOKEN) {
      return jsonResponse({ success: false, error: "Unauthorized submission credential" }, 401);
    }

    // 1. Whitelist Allowed Fields
    var allowedFields = ["fullName", "businessEmail", "organizationName", "operationalScenario", "submissionId", "token"];
    var incomingKeys = Object.keys(body);
    for (var i = 0; i < incomingKeys.length; i++) {
      if (allowedFields.indexOf(incomingKeys[i]) === -1) {
        return jsonResponse({ success: false, error: "Unexpected field: " + incomingKeys[i] }, 400);
      }
    }

    var fullName = (body.fullName || "").toString().trim();
    var businessEmail = (body.businessEmail || "").toString().trim();
    var organizationName = (body.organizationName || "").toString().trim();
    var operationalScenario = (body.operationalScenario || "").toString().trim();
    var submissionId = (body.submissionId || "").toString().trim();

    // 2. Required Field Validation
    if (!fullName || !businessEmail || !organizationName || !operationalScenario) {
      return jsonResponse({ success: false, error: "Missing required contact fields." }, 400);
    }

    // 3. Email Validation
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(businessEmail)) {
      return jsonResponse({ success: false, error: "Invalid business email address." }, 400);
    }

    // 4. Length Limits
    if (fullName.length > 120) {
      return jsonResponse({ success: false, error: "Full name exceeds 120 character limit." }, 400);
    }
    if (businessEmail.length > 120) {
      return jsonResponse({ success: false, error: "Business email exceeds 120 character limit." }, 400);
    }
    if (organizationName.length > 150) {
      return jsonResponse({ success: false, error: "Organization name exceeds 150 character limit." }, 400);
    }
    if (operationalScenario.length < 10 || operationalScenario.length > 2500) {
      return jsonResponse({ success: false, error: "Scenario description must be between 10 and 2500 characters." }, 400);
    }

    // 5. Open Target Spreadsheet & Sheet
    var ss = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
    var sheet = ss.getSheetByName(TARGET_SHEET_NAME);
    if (!sheet) {
      return jsonResponse({ success: false, error: "Target sheet tab 'contact_data' not found." }, 500);
    }

    // 6. Idempotency / Duplicate Submission Prevention
    // Check if submissionId is tracked in Script Properties
    if (submissionId) {
      var properties = PropertiesService.getScriptProperties();
      var existing = properties.getProperty("sub_" + submissionId);
      if (existing) {
        return jsonResponse({
          success: true,
          message: "Submission already recorded (idempotent).",
          submissionId: submissionId,
          alreadyRecorded: true
        });
      }
    }

    // 7. Append Row strictly matching columns A: Full Name, B: Business Email, C: Organization / Company Name, D: Operational Scenario
    // Prevent formula injection by sanitizing leading =, +, -, @
    function sanitizeCell(val) {
      if (typeof val === "string" && (val.charAt(0) === "=" || val.charAt(0) === "+" || val.charAt(0) === "-" || val.charAt(0) === "@")) {
        return "'" + val;
      }
      return val;
    }

    var rowData = [
      sanitizeCell(fullName),
      sanitizeCell(businessEmail),
      sanitizeCell(organizationName),
      sanitizeCell(operationalScenario)
    ];

    sheet.appendRow(rowData);

    // Track submissionId for idempotency
    if (submissionId) {
      properties.setProperty("sub_" + submissionId, new Date().toISOString());
    }

    return jsonResponse({
      success: true,
      message: "Contact details successfully appended to contact_data.",
      submissionId: submissionId,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return jsonResponse({
      success: false,
      error: "Failed to write contact record to spreadsheet: " + err.message
    }, 500);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return jsonResponse({
    service: "Previa Contact Form Apps Script Gateway",
    status: "active",
    mode: "owner-executed",
    target: "Previa_AI_Contact_Details / contact_data"
  });
}

function jsonResponse(data, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
