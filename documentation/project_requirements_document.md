# Project Requirements Document (PRD) for `proyectos-sonepar`

## 1. Project Overview

**Paragraph 1:**
`proyectos-sonepar` is a single-page web application (SPA) built to give Sonepar employees a unified internal ecosystem of tools in industrial automation and logistics. It solves the problem of fragmented workflows by bringing product data management, AI-driven technical assistance, simulation tools, incident tracking, KPI dashboards, budgeting, and training into one secure portal. Behind the scenes, it scrapes Sonepar’s online catalog, organizes the data in Firestore, and uses AI (Anthropic Claude) to answer technical queries.

**Paragraph 2:**
The application is being built to streamline day-to-day operations, reduce manual data entry, and improve decision-making with real-time insights. Key objectives include fast user authentication via Google SSO, up-to-date product catalogs, accurate AI guidance (SONEX), reliable warehouse and incident simulators, actionable logistics KPIs, easy budget creation, and personalized training plans. Success will be measured by user adoption rates, fewer support tickets, improved KPI metrics, and faster budgeting cycles.

---

## 2. In-Scope vs. Out-of-Scope

**In-Scope (Version 1.0):**
- Secure login using Firebase Auth (Google Sign-In).
- Automated web scraping (Playwright) of the product catalog.
- ETL data pipeline: transform and store hierarchical catalog data in Firestore.
- Product technical datasheet display (fichas técnicas).
- AI technical assistant (`SONEX`) integrated via Vercel Edge Functions and Anthropic Claude API.
- Warehouse cycle simulator (`Simulador Almacén`).
- Incident management dashboard (`Dashboard Incidencias`).
- Logistics KPI module with charts and reports (`KPI Logístico`).
- Budget generation tool with catalog reference (`Presupuestos`).
- Internal training manager with competency matrices (`Formación Interna`).
- Responsive UI built in React, Vite, CSS Modules, Framer Motion.
- Deployment on Vercel with Edge Functions.
- End-to-end testing of critical flows with Playwright.

**Out-of-Scope (Phase 2+):**
- Mobile or native desktop versions.
- Multi-language support beyond Spanish (initially Spanish only).
- Offline mode or local caching for disconnected use.
- Full audit logging and role-based access control (RBAC) beyond simple user authentication.
- Integration with external ERP or CRM systems.
- Advanced analytics or predictive AI (beyond Tousex Q&A).

---

## 3. User Flow

**Paragraph 1:**
A typical user lands on the login page and signs in with their Google account via Firebase Auth. Once authenticated, they arrive at the **Dashboard Home** (AppShell). On the left, a sidebar navigation lists modules: Catalog, SONEX, Warehouse Simulator, Incidents, KPI, Budgets, and Training. The user clicks “Catalog” to view a searchable product tree (Family → Brand → Gama → Tipo). Clicking a product opens its technical datasheet.

**Paragraph 2:**
If the user has a technical question, they switch to the **SONEX** tab and enter a query in the chat widget. SONEX returns AI-generated guidance. To simulate warehouse cycles, they open **Simulador Almacén**, set parameters, and run the simulation. For incident tracking, they navigate to **Incidencias**, log new issues, update status, and review diagnostic data. In **KPI Logístico**, they filter dates to see charts and export a PDF report. **Presupuestos** lets them pick catalog items, set quantities, and generate a budget document. Finally, in **Formación Interna**, they assign training programs to team members and track progress.

---

## 4. Core Features

- **Authentication:** Google Single Sign-On via Firebase Auth. Protected routes for authenticated users only.
- **Catalog Scraper:** Playwright scripts (`.mjs`) scrape Sonepar’s public catalog, run on schedule or on-demand.
- **Data ETL Pipeline:** Node.js scripts transform raw data into flat indexes and hierarchical structures, then sync to Firestore.
- **Product Datasheets:** UI components display datasheet PDFs or structured specs; PDF extraction via Vercel function.
- **AI Assistant (SONEX):** Chat interface; messages proxied through Vercel Edge Function to Anthropic Claude; structured prompt tags for clarity.
- **Warehouse Simulator:** Form to input parameters (inventory levels, cycle time); visual simulation output in charts.
- **Incident Dashboard:** Create, read, update, delete (CRUD) interface for industrial failure reports; status tracking and filtering.
- **Logistics KPI:** Interactive charts (Recharts) showing metrics (throughput, delays); exportable executive summary.
- **Budget Tool:** Item selector tied to catalog; quantity/pricing inputs; generate budget PDF or share link.
- **Training Manager:** Competency matrix UI; assign training modules; track user completion and scores.
- **Global State:** React Contexts (Auth, Theme, Toast) and custom hooks (`useFirestoreSync`, `useSonex`, `useFichasTecnicas`).
- **Routing & Layout:** React Router for client-side navigation; AppShell with Topbar and Sidebar.

---

## 5. Tech Stack & Tools

**Frontend:**
- React (UI library)
- Vite (fast bundler)
- React Router DOM (routing)
- CSS Modules (scoped styles)
- Framer Motion (animations)
- Recharts (data visualization)
- Lucide React (icons)

**Backend & Serverless:**
- Firebase Auth (Google SSO)
- Firestore (NoSQL DB)
- Vercel Edge Functions (Anthropic proxy, PDF extraction)
- Node.js (ETL / scraping scripts)

**AI & Scraping:**
- Anthropic Claude API (AI model)
- Playwright (web scraping & E2E testing)

**Testing & Quality:**
- Playwright (end-to-end tests)
- ESLint (linting)

**Deployment & DevOps:**
- Vercel (hosting, CI/CD).

---

## 6. Non-Functional Requirements

- **Performance:** Initial page load <3s on corporate network; AI responses <2s after streaming starts.
- **Scalability:** Firestore and Vercel functions auto-scale to handle up to 500 concurrent users.
- **Security:** All API calls over HTTPS; API keys stored in Vercel env variables; least-privilege rules in Firestore.
- **Reliability:** 99.9% uptime SLA for core modules; daily backups of Firestore.
- **Usability:** Mobile-responsive layout; WCAG 2.1 AA basic compliance; keyboard-accessible navigation.
- **Compliance:** Internal data only; GDPR-compatible since no personal data beyond work email.

---

## 7. Constraints & Assumptions

- **Constraints:** Relies on stable internet, access to Sonepar’s catalog URL; Anthropic Claude availability and quotas; Vercel free-tier rate limits.
- **Assumptions:** All users have corporate Google accounts; product catalog structure remains consistent; Firestore read/write limits suffice.
- **Dependencies:** Playwright scripts run on a schedule or manually via CI; environment variables set in Vercel (Firebase config, Anthropic key).

---

## 8. Known Issues & Potential Pitfalls

- **Scraping Blocks:** The catalog site may implement anti-bot measures. Mitigation: rotate user agents, implement backoff retries, monitor failures.
- **Data Inconsistency:** Partial ETL failures may leave stale data. Mitigation: idempotent scripts, pre- and post-run checks, alert on mismatches.
- **API Rate Limits:** Anthropic Claude may throttle on high usage. Mitigation: implement exponential backoff, cache frequent queries, monitor usage metrics.
- **Cold Starts:** Vercel Edge Functions may incur latency on first call. Mitigation: keep-alive pings or warm-up endpoints.
- **Firestore Costs:** Heavy read/write workloads (KPI charts) can drive costs. Mitigation: client-side caching, batched requests, use indexes.


This PRD provides a clear foundation for all subsequent technical documents. It outlines what to build, what to avoid, how users will interact, and the exact tools and constraints involved—leaving no room for guesswork.