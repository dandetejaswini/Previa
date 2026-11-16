# Previa AI

**AI-Powered Supply Chain Intelligence Platform**

Previa AI is an intelligent supply chain management platform designed to help businesses monitor operations, identify potential risks, and make informed decisions. It integrates AI-powered capabilities with automated workflows to improve operational visibility and efficiency.

## Key Features

- **AI-Powered Intelligence:** Leverages AI to support supply chain analysis and decision-making.
- **Google Authentication:** Secure user registration and sign-in using Firebase Authentication.
- **Automated Welcome Emails:** Sends a personalized welcome email to newly registered users.
- **Google Sheets Integration:** Supports Google Drive and Sheets access through user-authorized OAuth.
- **Contact Management:** Handles user enquiries through a dedicated contact form and email gateway.

## Technology Stack

- **Frontend:** React, TypeScript, Vite
- **AI Integration:** Google Gemini
- **Authentication:** Firebase Authentication
- **Email Automation:** Google Apps Script
- **Google Integration:** Google Drive & Sheets API

## Email Architecture

Previa uses separate Google Apps Script gateways for different email-related operations.

- **Welcome Email Gateway:** Sends welcome emails to newly registered users.
- **Contact Gateway:** Processes contact form submissions independently.

Welcome emails are sent through the application backend, ensuring that email-sending logic remains separate from the frontend.

## Getting Started

1. Clone the repository.
2. Install project dependencies.
3. Configure the required environment variables.
4. Set up Firebase Authentication.
5. Configure Google Gemini integration.
6. Deploy the Google Apps Script gateways.
7. Start the development server.

```bash
npm install
npm run dev
```

## Security

- Firebase-based authentication.
- Server-side handling of email requests.
- Separate email gateways for independent operations.
- Validation of recipient email addresses.
- Protection of sensitive credentials and environment variables.
- User-controlled Google Drive and Sheets authorization.

## Project Objective

Previa AI aims to simplify supply chain operations through intelligent insights, secure integrations, and automated processes, helping businesses make smarter and more proactive decisions.

---

**Previa AI — Making Supply Chains Smarter and More Predictable.**
