# Backend Structure Document for proyectos-sonepar

This document outlines the backend setup for the proyectos-sonepar application, detailing architecture, database, APIs, hosting, infrastructure, security, monitoring, and maintenance. It’s written in everyday language so that everyone on the team can understand how the backend works.

---

## 1. Backend Architecture

**Overall Design**
- Serverless-first, modular approach: most of our backend is made of small, focused services (Edge Functions and Node.js scripts) rather than one big server.
- We rely on Firebase and Vercel to handle scaling automatically.

**Key Patterns & Frameworks**
- **Micro-services style**: each Vercel Edge Function (e.g., `anthropic.js`, `extract-pdf.js`) does one job.
- **ETL pipeline**: standalone Node.js scripts (Playwright + transform + Firestore load) run data scraping and preparation outside of Vercel.
- **Direct client-to-database**: the React SPA talks straight to Firestore using the Firebase SDK.

**Scalability, Maintainability, Performance**
- **Scalability**: Vercel Edge Functions auto-scale under load; Firestore handles millions of reads/writes.
- **Maintainability**: small functions and scripts with clear responsibilities make it easier to update or replace parts.
- **Performance**:
  - Edge Functions sit close to users, reducing latency for AI/chat and PDF extraction.
  - Firestore’s global CDN-backed service speeds up reads and writes.
  - Data scripts run offline, so frontend remains snappy.

---

## 2. Database Management

**Database Technology**
- **Type**: NoSQL document database
- **System**: Google Firestore
- **Auth**: Firebase Auth (Google Sign-In)

**Data Structure & Practices**
- **Hierarchical catalog**: Product data is organized into a 4-level hierarchy (Family → Brand → Gama → Tipo).
- **Denormalization**: We often duplicate small bits of parent data inside child documents to reduce lookups.
- **ETL Scripts**:
  - **Playwright scripts** scrape raw data from Sonepar’s website.
  - **Transform script** turns raw JSON into flat lists, reference indexes, and hierarchical trees.
  - **Firestore sync scripts** save the processed catalog into Firestore collections.
- **Client-side caching**: The catalog service in the SPA caches Firestore queries in memory for faster re-use.

---

## 3. Database Schema (Firestore)

Below is a human-readable overview of our main Firestore collections and document fields.

### 3.1 Collections & Documents

1. **users**  
   Documents keyed by Firebase User ID. Each `users/{uid}` document contains:
   - `displayName`: string (user’s name)
   - `email`: string
   - `photoURL`: string
   - `role`: string (e.g. “admin”, “user”)
   - `createdAt`: timestamp

2. **catalog_families**  
   Top-level product families. Each `catalog_families/{familyId}` document contains:
   - `name`: string
   - `order`: number (for sorting)

3. **catalog_brands**  
   Each `catalog_brands/{brandId}` document contains:
   - `familyId`: string (reference)
   - `name`: string
   - `order`: number

4. **catalog_gamas**  
   Each `catalog_gamas/{gamaId}` document contains:
   - `brandId`: string
   - `name`: string
   - `order`: number

5. **catalog_tipos**  
   Each `catalog_tipos/{tipoId}` document contains:
   - `gamaId`: string
   - `name`: string
   - `order`: number

6. **products**  
   Each `products/{productId}` document contains:
   - `tipoId`: string
   - `reference`: string
   - `description`: string
   - `price`: number or string (if applicable)
   - `technicalData`: map or array (key-value for datasheet fields)
   - `updatedAt`: timestamp

7. **incidents** (for Dashboard Incidencias)  
   Each `incidents/{incidentId}` contains:
   - `machine`: string
   - `description`: string
   - `status`: string (e.g. “open”/“closed”)
   - `reportedAt`: timestamp

8. **kpis** (for KPI Logístico)  
   Each `kpis/{kpiId}` contains:
   - `name`: string
   - `value`: number
   - `date`: timestamp

9. **budgets** (for Presupuestos)  
   Each `budgets/{budgetId}` contains:
   - `userId`: string
   - `lines`: array of `{ productId, quantity, unitPrice }`
   - `total`: number
   - `createdAt`: timestamp

10. **training_plans** (for Formaci)**  
   Each `training_plans/{planId}` contains:
   - `userId`: string
   - `competencies`: array of `{ skill, level, completedAt }`
   - `nextReview`: timestamp

### 3.2 Firestore Rules
- Read/write rules keyed by `request.auth.uid` and `resource.data.userId`.
- Public catalog reads allowed; writes restricted to admin roles.

---

## 4. API Design and Endpoints

We mainly use two custom serverless endpoints in the `api/` folder. Other data flows go directly through the Firebase SDK.

### 4.1 Vercel Edge Functions (RESTful)

1. **POST /api/anthropic**  
   - **Purpose**: Proxy chat requests to Anthropic Claude for the SONEX assistant.  
   - **Input**: `{ messages: [{ role, content }...] }`  
   - **Output**: Streaming response of AI-generated messages.  
   - **Features**: prompt caching, streaming to avoid timeouts.

2. **POST /api/extract-pdf**  
   - **Purpose**: Accepts a PDF file (datasheet) upload and returns extracted text or structured fields.  
   - **Input**: multipart/form-data with PDF.  
   - **Output**: JSON with extracted text.

### 4.2 Firebase SDK Endpoints
- **Authentication**: client calls `firebase.auth().signInWithPopup()` for Google login.  
- **Firestore CRUD**: client reads/writes directly to collections via `firebase.firestore()`.

---

## 5. Hosting Solutions

**Frontend & Edge Functions**
- Hosted on **Vercel**. Benefits:
  - Automatic global CDN for static files.
  - Instant scaling of Edge Functions.
  - Built-in CI/CD pipelines.

**Database & Auth**
- Hosted on **Google Cloud Firebase** (Firestore & Auth). Benefits:
  - Fully managed, high-availability database.
  - End-to-end encryption and global replication.

**Data Pipeline Scripts**
- Run on developer machines or CI agents (Node.js environment). Can be scheduled via cron or GitHub Actions.

---

## 6. Infrastructure Components

**Load Balancers & CDN**
- Vercel front door acts as global load balancer. Static assets served via CDN.

**Caching**
- **Edge caching** in Vercel for API responses (e.g., prompt caching).  
- **Client-side caching** in catalogService for Firestore queries.

**Content Delivery Networks**
- All static JS/CSS/images delivered from Vercel’s CDN edge nodes.

**Data Pipeline**
- **Playwright** for scraping.  
- **Transform & sync** scripts push data into Firestore.

---

## 7. Security Measures

**Authentication & Authorization**
- Firebase Auth with Google Sign-In.  
- Firestore security rules enforce read/write per user role.

**Secrets & Environment Variables**
- API keys (Anthropic, Firebase config) stored as Vercel environment variables, never checked into code.

**Data Encryption**
- Firestore encrypts data at rest and in transit (TLS).  
- Edge Functions use HTTPS endpoints by default.

**API Key Protection**
- Edge Functions hide Anthropic API keys from the client.

**Additional Practices**
- Rate limiting can be added in Edge Functions if usage spikes.
- CORS rules locked down to the SPA domain.

---

## 8. Monitoring and Maintenance

**Performance Monitoring**
- **Vercel Analytics** for Edge Functions and page views.  
- **Firebase Performance Monitoring** for database reads/write latency.

**Error Tracking & Logging**
- Edge Functions log to Vercel’s built-in logs.  
- Consider integrating **Sentry** for centralized error reporting.

**Testing**
- **Playwright E2E** tests run in CI to catch regressions.  
- Linting via ESLint on every push.

**Maintenance Strategies**
- **Scheduled ETL runs**: update catalog nightly via cron or GitHub Actions.  
- **Dependency updates**: automated PRs for npm packages.
- **Backup & Restore**: Firestore managed backups or export to Google Cloud Storage.

---

## 9. Conclusion and Overall Backend Summary

The backend of proyectos-sonepar is a serverless, micro-services-style architecture that leverages Vercel Edge Functions, Firebase Auth, and Firestore to deliver a highly scalable, maintainable, and secure ecosystem of internal tools. The combination of focused Edge Functions for AI and PDF tasks, direct client-to-Firestore access, and offline data pipelines ensures:

- **Scalability**: Handles growing loads without manual intervention.
- **Performance**: Low latency via edge computing and CDN.
- **Maintainability**: Clear separation of responsibilities.
- **Security**: End-to-end encryption, role-based access, hidden secrets.

This setup aligns with our goals of fast internal tool delivery, easy updates, and robust data management for Sonepar’s industrial automation and logistics teams. Unique aspects such as the AI-proxy Edge Function and the Playwright-driven ETL pipeline differentiate this project by combining modern serverless patterns with advanced data processing.

---

End of document.