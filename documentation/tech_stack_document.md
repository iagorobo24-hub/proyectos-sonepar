# Tech Stack Document for Proyectos-Sonepar

This document explains, in simple terms, all the technologies used to build and deploy the Proyectos-Sonepar application. It covers the tools and services that power the user interface, the behind-the-scenes data management, the hosting setup, third-party connections, and how we keep everything secure and fast.

## Frontend Technologies
These are the tools that run in your web browser and shape what you see and interact with.

- **React**: A popular library for building user interfaces. It lets us break the app into small, reusable pieces called components.
- **Vite**: A build tool that helps start the app quickly during development and produces fast, optimized files for production.
- **React Router DOM**: Manages navigation between different parts of the app without full page reloads, making transitions feel smooth.
- **CSS Modules**: A way to write styles so they only apply to the component they belong to, preventing style conflicts.
- **Framer Motion**: Adds animations to elements, improving visual feedback (for example, sliding menus or fade-in buttons).
- **Recharts**: A charting library for displaying data visuals like graphs and bars—used mainly in the KPI dashboards.
- **Lucide React**: Provides a consistent set of icons throughout the interface.

How this improves the user experience:

- Consistency and reusability: Components and styles stay organized, making the UI predictable.
- Speed: Fast development reloads and optimized production code keep the app snappy.
- Visual polish: Animations and charts help users digest information more naturally.

## Backend Technologies
These technologies handle data storage, user accounts, server-side logic, and AI services.

- **Firebase Authentication (Google Sign-In)**: Manages user login securely, so employees can sign in with their Google accounts.
- **Firestore (NoSQL database)**: Stores all application data—product catalogs, user profiles, incident reports, budgets, etc.—in a flexible, scalable format.
- **Vercel Edge Functions**: Small, serverless pieces of code that run on demand. They act as a safe middleman when:
  - Fetching AI responses from the Anthropic Claude API
  - Extracting and processing PDF content
  - Hiding private API keys from the browser
- **Anthropic Claude API**: Powers the SONEX technical assistant, allowing users to ask questions and get AI-driven answers.
- **Node.js scripts**: Automated scripts (.mjs files) for web scraping (using Playwright) and for transforming and loading catalog data into Firestore.

How they work together:

1. Users log in via Firebase Auth.
2. Frontend requests data or AI responses through Vercel Edge Functions.
3. Edge Functions fetch or process data (catalog info, PDF details, AI chat) and return it.
4. All structured data lives in Firestore, where the app reads and writes efficiently.

## Infrastructure and Deployment
This section describes where the application lives, how updates get deployed, and how we manage versions.

- **Vercel**: The hosting platform for both the frontend and serverless functions. It automatically builds and deploys whenever new code is pushed.
- **Git & GitHub**: Version control system where all code changes are tracked, reviewed, and stored.
- **CI/CD Pipeline**:
  - **Automatic builds**: On each push, Vercel runs build checks and deploys the latest version if everything passes.
  - **Preview environments**: Every pull request gets its own live preview to test changes before merging.
- **Environment Variables**: Keys and secrets (like Firebase and Anthropic credentials) are stored securely and injected at build or runtime.

Benefits of these choices:

- **Reliability**: Vercel’s global network keeps the app available and fast.
- **Scalability**: Serverless functions and Firestore automatically scale with usage.
- **Developer efficiency**: Automated deployments and previews speed up testing and releases.

## Third-Party Integrations
These services enhance the application by adding functionality without building everything from scratch.

- **Google (Firebase Auth)**: Simplifies secure sign-in for employees.
- **Anthropic Claude**: Brings AI-driven chat and technical assistance to the app.
- **Playwright**: While not an external service, this library automates browser actions for scraping product data from Sonepar’s public catalog.
- **PDF Extraction**: A small Edge Function that parses PDFs so the app can display technical datasheets.

Why these matter:

- Reduces development time by leveraging mature, proven services.
- Ensures high quality in specialized areas (authentication, AI, scraping).

## Security and Performance Considerations
This section outlines how we keep data safe and the app performing well.

**Security Measures:**

- **Serverless Proxy**: Edge Functions hide private API keys from the browser.
- **Firebase Rules**: Firestore has fine-grained security rules so each user only sees and edits what they’re allowed.
- **HTTPS Everywhere**: All communication is encrypted in transit.
- **Role-Based Access**: Protected routes in the app ensure only logged-in users reach sensitive pages.

**Performance Optimizations:**

- **Lazy Loading**: Only load the code for each tool when the user navigates to it, reducing initial load time.
- **Caching**: Catalog data is cached in memory or local storage to avoid unnecessary database reads.
- **Code Splitting**: Separates the application into smaller bundles, so updates are faster and the browser has less to download.
- **E2E Testing (Playwright)**: Automated tests verify key user flows and responsiveness on different screen sizes.

## Conclusion and Overall Tech Stack Summary

Proyectos-Sonepar brings together a modern, serverless-first approach and a React-based frontend to deliver a fast, modular, and secure set of internal tools. Here’s a quick recap:

- Frontend built with React, Vite, CSS Modules, and animation/chart libraries for a polished user interface.
- Backend powered by Firebase Auth, Firestore, Vercel Edge Functions, and Anthropic Claude for data, authentication, and AI.
- Data pipeline using Playwright and Node.js scripts to scrape, transform, and load product catalogs.
- Hosted on Vercel with Git-based CI/CD for easy deployments and preview environments.
- Strong security (serverless proxies, Firestore rules) and performance (lazy loading, caching) strategies.

Together, these technologies meet Sonepar’s needs for an integrated, scalable ecosystem of tools—providing employees with a reliable, user-friendly experience and giving the development team a solid foundation for ongoing enhancements.