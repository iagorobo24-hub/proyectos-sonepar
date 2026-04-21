# Security Guidelines for proyectos-sonepar

## 1. Overview

These guidelines establish a security baseline for the proyectos-sonepar web application—a serverless Single Page Application (SPA) leveraging React, Firebase, Vercel Edge Functions, Playwright scraping scripts, and Anthropic Claude AI. They cover authentication, data protection, API security, infrastructure, and operational best practices.

## 2. Authentication & Access Control

- **Firebase Authentication**
  - Enforce Google-Sign-In only for corporate domains (`@sonepar.com`).
  - Enable Email Enumeration Protection and strong password policy for any password-based flows (min. 10 characters, mixed case, numbers, symbols).
  - Use **Auth Blocking Functions** (`beforeCreate`, `beforeSignIn`) to restrict registrations, check blacklisted IPs, and verify invite lists.
  - Integrate **Firebase App Check** (reCAPTCHA Enterprise or App Attest) to ensure only genuine app instances access Firebase services.

- **Session Management**
  - Rely on Firebase ID tokens (one-hour TTL) and refresh tokens; do not extend ID token lifetimes.
  - On logout or suspicious activity, revoke refresh tokens via the Admin SDK.
  - Use `SameSite=Strict`, `HttpOnly`, and `Secure` flags on any cookies (e.g., custom session cookies).

- **Role-Based Access Control (RBAC)**
  - Assign custom claims in Firebase Auth tokens (e.g., `role: "admin" | "user"`).
  - Enforce authorization server-side in Cloud Functions and Firestore Security Rules using `request.auth.token.role`.

## 3. Input Validation & Output Encoding

- **Server-Side Validation**
  - Treat all inputs (user forms, API payloads, scraped data) as untrusted.
  - Use JSON schema validators (e.g., Zod, Yup) in Edge Functions and Node scripts.

- **Prevent Injection**
  - Always use Firebase Admin SDK or prepared queries—no string concatenation in Firestore operations.
  - Sanitize inputs before using them in any command, file path, or script invocation to prevent command or path-traversal injection.

- **Cross-Site Scripting (XSS)**
  - In React, avoid `dangerouslySetInnerHTML` or sanitize with a vetted library (e.g., DOMPurify).
  - Implement a strict **Content Security Policy (CSP)** header via Vercel configuration: 
    ```json
    {
      "headers": [
        {
          "source": "/(.*)",
          "headers": [
            { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; object-src 'none';" }
          ]
        }
      ]
    }
    ```

- **CSRF Mitigation**
  - For any state-changing POST/PUT/DELETE via Edge Functions, require a custom anti-CSRF token or rely on secure, same-site cookies.

## 4. Data Protection & Privacy

- **Encryption in Transit & At Rest**
  - Enforce HTTPS (TLS 1.2+) for all web and API traffic.
  - Firestore data is encrypted at rest by default; ensure backups and exports are encrypted as well.

- **PII & Logging**
  - Minimize collection of Personally Identifiable Information (PII). When necessary, store only hashed or tokenized values.
  - Redact any PII or secrets in application logs and error messages.

- **Secrets Management**
  - Store all API keys, service account credentials, and tokens as **Sensitive** environment variables in Vercel.
  - Do not commit `.env` files, secret JSON, or hardcoded credentials to source control.
  - Rotate secrets regularly and integrate with a secret management system (e.g., HashiCorp Vault, AWS Secrets Manager).

## 5. API & Service Security

- **Vercel Edge Functions**
  - Mark all sensitive env vars as **Sensitive** and scope them to Production only.
  - Use OIDC-based deployments from CI/CD instead of long-lived tokens.
  - Apply per-endpoint rate limiting with Vercel WAF to critical endpoints (e.g., `/api/anthropic`, `/api/extract-pdf`).

- **CORS Policy**
  - Restrict origins to the corporate domain (e.g., `https://app.sonepar.internal`).
    ```js
    // Example middleware
    if (!allowedOrigins.includes(request.headers.get('origin'))) {
      return new Response('Forbidden', { status: 403 });
    }
    ```

- **Throttling & Quotas**
  - Client-side: implement simple debouncing or request limits for AI/API calls.
  - Server-side: enforce usage quotas and reject excessive requests gracefully.

- **API Versioning**
  - Prefix Edge Function routes with version numbers (e.g., `/api/v1/anthropic`) to manage breaking changes.

## 6. Web Scraping & Data Pipeline Security

- **Ethical & Legal Compliance**
  - Honor `robots.txt` and document compliance in logs.
  - Include a descriptive `User-Agent` string with contact information.

- **Playwright Best Practices**
  - Use adaptive rate limiting with exponential backoff and jitter on 429/503 responses.
  - Persist `browserContext.storageState()` to reuse sessions and reduce repeated logins.
  - Rotate residential proxies for sensitive scraping to avoid IP blocks.

- **Data Handling**
  - Validate and sanitize scraped fields with schemas before transformation.
  - Encrypt raw and processed data at rest (AES-256) in transit to Firestore.

- **Node Script Hardening**
  - Load service account keys from environment variables only.
  - Avoid dynamic `import()` paths or file operations without strict whitelist checks.

## 7. Web Application Security Hygiene

- **Security Headers** (via `vercel.json`)
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: no-referrer`

- **Cookie Security**
  - `Secure; HttpOnly; SameSite=Strict` on all session or refresh cookies.

- **Subresource Integrity (SRI)**
  - Include SRI hashes for any third-party scripts or stylesheets loaded from CDNs.

- **Client-Side Storage**
  - Do not store tokens or sensitive data in `localStorage` or `sessionStorage`.

## 8. Infrastructure & Configuration Management

- **Firestore Security Rules**
  - Apply least privilege: restrict read/write per-collection based on `request.auth.uid` and custom claims.
  - Example rule snippet:
    ```js
    match /products/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }
    ```

- **CI/CD & Dependency Management**
  - Use OIDC for Vercel deployments (GitHub Actions → Vercel).
  - Maintain lockfiles (`package-lock.json`, `yarn.lock`) and run automated vulnerability scans (Snyk, Dependabot).
  - Keep all frameworks, libraries, and runtimes up to date with security patches.

- **Serverless Config**
  - Disable debugging and verbose errors in production builds.
  - Limit environment access: only necessary team members may view or modify env vars.

## 9. Monitoring, Logging & Incident Response

- **Centralized Logging**
  - Ship structured logs to a SIEM or log management service (e.g., Datadog, Splunk).
  - Mask or redact any PII or secrets in logs.

- **Error Handling**
  - Catch exceptions in Edge Functions and scrapers; respond with generic messages and HTTP 500.
  - Do not leak stack traces or internal paths to end users.

- **Alerting & Response**
  - Configure alerts on anomalous traffic spikes, auth failures, or rate limit violations.
  - Define an incident response playbook, including secret rotation, token revocation, and team notification steps.

## 10. Compliance & Data Privacy

- **GDPR & CCPA**
  - Implement data retention and deletion policies for user data.
  - Provide mechanisms for data export and erasure upon user request.
  - Log user consent for any PII collection.

---

Regularly review and update these guidelines—especially after major dependency upgrades, architecture changes, or newly discovered threats—to ensure proyectos-sonepar remains secure by design.  