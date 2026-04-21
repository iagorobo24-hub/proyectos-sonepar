# Frontend Guidelines for proyectos-sonepar

This document lays out how the frontend of **proyectos-sonepar** is built and organized, what principles guide its design, and which tools and techniques we use. It’s written in plain language so everyone—from designers to new developers—can understand how the app is put together and how to work with it.

---

## 1. Frontend Architecture

### 1.1. Core Frameworks and Libraries
- **React**: Our UI is built entirely with React functional components and hooks.  
- **Vite**: Fast dev server and build tool. It handles module bundling, HMR (hot module replacement), and optimizations for production.  
- **React Router DOM**: Client-side routing for a true Single Page Application (SPA) feel.  
- **CSS Modules**: Scoped, modular CSS so styles stay next to their components and never collide.  
- **Framer Motion**: Smooth, lightweight animations for interactive feedback.  
- **Recharts**: Charts and graphs for the KPI dashboard.  
- **Lucide React**: A consistent set of SVG icons across the whole app.

### 1.2. How the Architecture Supports Scalability, Maintainability, and Performance
- **Modular structure**: Each major feature (or “tool”) lives in its own folder under `src/tools`. You can add or remove tools without touching unrelated code.  
- **Component-based design**: Reusable UI pieces in `src/components/ui` speed up development and ensure consistency.  
- **Lazy loading & code splitting**: We wrap each tool in `React.lazy()` and `Suspense` so the initial bundle stays small. New modules download only when the user navigates to them.  
- **Separation of concerns**: Services (API calls), hooks (logic), contexts (global state), and presentation (components) live in dedicated folders. That makes it easy to find and change one piece without breaking others.  
- **Vite optimizations**: Quick hot reloads during dev and optimized bundles for production help keep load times low.

---

## 2. Design Principles

We follow these guiding principles to make sure our interface is easy to use, inclusive, and works well everywhere:

- **Usability**: Clear navigation, consistent behavior, and obvious feedback (loading spinners, success/failure messages).  
- **Accessibility**: All interactive elements have proper ARIA roles, keyboard support, and color contrasts that meet WCAG AA.  
- **Responsiveness**: Mobile-first layout with flexible grids and breakpoints to fit phones, tablets, and desktops.  
- **Clarity & Simplicity**: We avoid clutter. Each screen focuses on a single task (e.g., scraping, chatting with the AI, viewing KPIs).  
- **Consistency**: Shared styles, spacing, and typography ensure every part of the app feels like one cohesive system.

**How these are applied:**
- Buttons and inputs use a shared set of CSS variables for spacing and colors.  
- Forms include labels, hints, and error messages that assist both sighted users and screen-reader users.  
- Animations via Framer Motion are subtle (fade, slide, scale) to draw attention without distracting.

---

## 3. Styling and Theming

### 3.1. Styling Approach
- We use **CSS Modules** for component-scoped styles. Class names follow a BEM-inspired pattern for readability (e.g., `Button_module__root`, `Button_module__icon`).  
- Global variables and resets live in `src/styles/variables.css` and `src/styles/global.css`.  
- No external preprocessors—Vite handles PostCSS under the hood.

### 3.2. Theming
- A **ThemeContext** provides light/dark mode toggling.  
- CSS custom properties switch on the root element (`:root` vs. `.theme-dark`).  
- New themes can be added by extending `variables.css` and updating the context provider.

### 3.3. Visual Style
- **Overall look**: Modern, flat design with clean edges and moderate use of shadows to separate cards and modals.  
- **Animation style**: Soft easing (`ease-in-out`), quick (100–300ms), consistent across buttons, modals, and page transitions.

### 3.4. Color Palette
| Role          | Light Mode      | Dark Mode      | Usage                     |
|---------------|-----------------|----------------|---------------------------|
| Primary       | #1565C0 (blue)  | #90CAF9        | Main buttons, links       |
| Secondary     | #F58518 (orange)| #FFB74D        | Highlights, accents       |
| Success       | #28A745 (green) | #66BB6A        | Success messages, badges  |
| Warning       | #FFC107 (yellow)| #FFD54F        | Warnings, alerts          |
| Danger        | #DC3545 (red)   | #E57373        | Errors, destructive actions|
| Background    | #F5F7FA         | #2D2D2D        | Page backgrounds          |
| Surface/Card  | #FFFFFF         | #424242        | Containers, cards         |
| Text Primary  | #212529         | #ECEFF1        | Main text                 |
| Text Secondary| #6C757D         | #B0BEC5        | Helper text, hints        |

### 3.5. Typography
- **Font**: “Inter”, a versatile, humanist sans-serif.  
- **Sizes**: Base font-size 16px; scale with root `rem` units (e.g., 1.25rem for h2).  
- **Line height**: 1.5 for readability.

---

## 4. Component Structure

### 4.1. Folder Organization
```
src/
├─ components/         # Small, reusable pieces
│   ├─ ui/             # Buttons, inputs, cards
│   ├─ layout/         # AppShell, Topbar, Sidebar
│   └─ auth/           # LoginPage, ProtectedRoute
├─ tools/              # Feature modules (FichasTecnicas, Sonex, KPI, etc.)
├─ contexts/           # AuthContext, ThemeContext, ToastContext
├─ hooks/              # Custom hooks (useSonex, useFirestoreSync)
├─ services/           # API calls & caching (catalogService, anthropicService)
├─ styles/             # Global CSS & variables
└─ App.jsx             # Root component with routing
```

### 4.2. Reusability and Naming
- Components are named in **PascalCase** (e.g., `ProductCard.jsx`).  
- Files match their component name for easy import.  
- Shared logic goes into hooks or services, never duplicated in components.  

### 4.3. Benefits of Component-Based Architecture
- **Maintainability**: Fix or update one UI piece and it applies everywhere.  
- **Clarity**: New developers can locate components by purpose (ui vs layout vs tool).  
- **Scalability**: We can spin up an entirely new tool folder without rewriting shared components.

---

## 5. State Management

### 5.1. Global State with Context API
- **AuthContext**: Tracks user login state via Firebase Auth.  
- **ThemeContext**: Manages light/dark mode.  
- **ToastContext**: Queues and displays notifications.

### 5.2. Local and Shared State
- **Local state** (`useState`/`useReducer`) stays inside components or hooks for form inputs, loading flags, etc.  
- **Shared data** (catalog, user profile) is fetched by services and stored in React Context or cached in the service layer.

### 5.3. Why Not Redux?
For now, Context + custom hooks cover our needs. If global state grows too big (lots of nested updates, caching logic), we may consider lighter libraries like **Zustand** or **Jotai**.

---

## 6. Routing and Navigation

- **React Router v6** defines routes in `App.jsx`.  
- **ProtectedRoute** wrapper checks `AuthContext` before granting access to private tools.  
- **Lazy loading**: Each tool’s top-level component is wrapped with `React.lazy` so we only load what’s needed.  
- **Sidebar & Topbar**: Shared across pages via `AppShell`, letting the main content switch out without reloading the entire layout.

Example route setup:
```jsx
<Suspense fallback={<Spinner />}>  
  <Routes>  
    <Route path="/" element={<LandingPage />} />  
    <Route element={<ProtectedRoute />}>  
      <Route path="/fichas" element={<FichasTecnicas />} />  
      <Route path="/sonex" element={<Sonex />} />  
      {/* more tools */}  
    </Route>  
    <Route path="*" element={<NotFound />} />  
  </Routes>  
</Suspense>
```

---

## 7. Performance Optimization

- **Code splitting & lazy loading**: Break bundles by feature.  
- **Vite’s dev optimizations**: Pre-bundles dependencies for fast HMR.  
- **Asset handling**: Keep images under `public/`, optimize with next-gen formats (WebP) and compression.  
- **SVG icons**: Use Lucide React for tiny, scalable icons.  
- **Caching**: `catalogService` caches Firestore calls; we can add stale-while-revalidate strategies if needed.  
- **Animations**: Framer Motion animations are GPU-accelerated and run off the main thread where possible.  
- **Bundle analysis**: Use `vite build --report` to track bundle size and trim unused code.

---

## 8. Testing and Quality Assurance

### 8.1. End-to-End Tests
- **Playwright**: Scripts live in `tests/`. They cover key flows (login, navigation, module use) and responsiveness across screen sizes.

### 8.2. Linting and Formatting
- **ESLint** (with a shared config) enforces code style and catches common bugs.  
- **Prettier** for consistent formatting across JS, JSX, and CSS.

### 8.3. Recommended Additions
- **Unit tests**: Add **Jest** + **React Testing Library** for fast feedback on individual components and hooks.  
- **Accessibility tests**: Integrate **axe-core** into E2E or unit tests to catch color-contrast or missing-ARIA issues early.

---

## 9. Conclusion and Overall Frontend Summary

We’ve built a modern, modular React SPA using Vite, with a focus on performance, maintainability, and user-friendly design. Key highlights:

- A **component-based structure** and **CSS Modules** keep styles and code organized.  
- **Context API** and **custom hooks** handle global and shared logic without unnecessary complexity.  
- **Lazy loading** and **code splitting** ensure a fast initial load, while tools only download when needed.  
- **Playwright tests**, **ESLint**, and a clear folder structure make onboarding and quality assurance straightforward.  

By following these guidelines, anyone joining the project or adding new features can quickly understand how things fit together and maintain the consistency and performance standards we’ve set. Welcome aboard!