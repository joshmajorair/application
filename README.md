# Employee Paperwork Mobile App (MVP Starter)

This repository contains a starter implementation for a mobile workflow that:

1. Collects employee paperwork details (I-9 and W-4 metadata).
2. Captures ID photos from a phone camera.
3. Uploads files/photos to a backend service.
4. Emails a compiled submission package to HR.

## Architecture

- `mobile/` — Expo React Native app used by employees.
- `server/` — Node.js/Express API for receiving uploads and emailing submissions.

## Quick Start

### 1) Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Required environment variables:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `HR_EMAIL_TO`
- `HR_EMAIL_FROM`

### 2) Mobile app

```bash
cd mobile
npm install
npm run start
```

Set API URL in `mobile/src/config.ts`.

## Notes for production

- Add authentication (employee identity + signed session).
- Encrypt documents at rest and in transit.
- Add retention policies and secure audit logs for compliance.
- Consider e-sign integration and PDF generation.
