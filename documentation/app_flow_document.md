# Application Flow Document for proyectos-sonepar

## Onboarding and Sign-In/Sign-Up

A new user visits the application landing page, which displays the Sonepar logo, a brief introduction to the suite of internal tools, and a prominent button labeled "Sign in with Google." When the user clicks this button, a Google OAuth popup appears, prompting the user to select or enter their Google account credentials. Once authentication is successful, Firebase Auth issues a secure token, and the user is redirected into the application’s main dashboard. If for any reason Google sign-in fails—such as an expired session, network interruption, or revoked access—the user sees an inline error message explaining the issue and can click to retry. Since authentication is handled exclusively via Google, there is no traditional email-and-password flow or password recovery page. To sign out, the user clicks their avatar in the top bar, selects “Sign Out” from the dropdown, and is returned to the landing page. If a user attempts to navigate directly to a secure route without being authenticated, they are automatically redirected back to the landing page and prompted to sign in again.

## Main Dashboard or Home Page

After signing in, the user arrives on the Dashboard, which serves as the central hub of the SPA. At the top, a fixed header shows the Sonepar logo on the left, a search input, a theme toggle control, and the user’s avatar on the right. Down the left side is a collapsible sidebar menu listing each of the core tools: Product Catalog, SONEX Technical Assistant, Warehouse Simulator, Incident Management, Logistics KPI, Budget Generation, and Internal Training. The main content area presents a grid of cards or widgets that mirror the sidebar options, giving quick access to each tool. Hovering over a widget reveals a brief description and a button to launch that module. Clicking any sidebar item or widget uses React Router to navigate to the selected tool’s primary page while keeping the header and sidebar in view.

## Detailed Feature Flows and Page Transitions

### Product Catalog Management

When the user selects Product Catalog from the sidebar, they arrive on the catalog page. On this page, a left pane shows a collapsible tree with Families at the top level. Expanding a Family reveals Brands, which expand to show Gamas, which expand to reveal Types. Selecting any Type loads a grid of individual products in the central area. Above the grid are filter controls for attributes like stock status or region. Clicking a product card opens a details pane on the right that displays product images, specifications, and pricing information. Within this details pane is a button labeled "View Technical Datasheet." When clicked, the app calls an Edge Function to fetch or generate the datasheet and then renders it inline as a PDF or interactive card. If generation takes time, an animated spinner appears until the content is ready.

### AI-Powered Technical Assistant (SONEX)

Navigating to the SONEX module brings up a chat interface. At the top is a "New Conversation" button that clears the chat history in the main pane. The user types a question into the input field at the bottom and presses Enter or clicks the send icon. The request is proxied through a Vercel Edge Function that interacts with the Anthropic Claude API. While the AI is generating a response, a typing indicator appears. When the response arrives from Claude, it is appended to the conversation. The user can scroll through past messages, copy content, or click a "Reference Product" button to attach context from the current catalog item. Each conversation is stored in Firestore so that when the user returns, they can resume where they left off.

### Warehouse Simulation (Simulador Almacén)

Accessing the Warehouse Simulator presents a form where the user inputs parameters such as number of pickers, shelf layout dimensions, and order arrival rate. Once the parameters are complete, clicking "Run Simulation" triggers a Web Worker or asynchronous process that simulates order cycles. A progress bar animates across the top while the simulation runs. When finished, the page displays interactive charts and tables showing throughput, idle time, and bottleneck areas. The user can adjust inputs and rerun the simulation or click "Export Results" to download a CSV or PDF summary.

### Incident Management (Dashboard Incidencias)

The Incident Management tool loads a list of existing incidents along with status badges and timestamps. A prominent "Create Incident" button opens a modal form where the user enters a title, description, location, and category. Submitting the form writes a new record to Firestore and refreshes the list automatically. The user selects an incident to open a detail view, which shows full description, attached images, and a comments section. The user can add new comments or change the incident status to "Resolved." Once resolved, the incident remains in the list but appears with a faded style and can still be reopened if needed.

### Logistics KPI (KPI Logístico)

Choosing Logistics KPI from the sidebar presents an executive dashboard with a date-range picker at the top and multiple chart panels below. Line charts show trends in delivery times, bar charts compare on-time performance across regions, and donut charts illustrate stock utilization. Hovering over any data point opens a tooltip, and clicking on a segment drills down into a detailed table view. A "Download Report" button at the top right compiles the visible charts into a high-resolution PDF via a serverless function and prompts the user to save or share.

### Budget Generation (Presupuestos)

In the Budget Generation tool, the user starts a new budget or opens an existing one from a list. Creating a new budget displays a blank form with a table for line items. The user searches the product catalog by typing keywords into a search field. Matching products appear in a dropdown, and selecting one adds it to the budget table where the user specifies quantity and custom notes. Unit prices auto-populate from the catalog. A summary section below updates in real time to show total cost. Clicking "Generate Budget" locks the form, saves the budget in Firestore, and reveals actions to export as PDF or email the document directly from the interface. Saved budgets remain accessible in the list view for later editing or duplication.

### Internal Training (Formación Interna)

The Internal Training module loads a competency matrix table that lists employees in rows and skill areas in columns. The user can filter by department or job role. Clicking on any cell opens a sidebar form where the user assigns a training course and sets a target completion date. Each assigned course appears in the employee’s personal training plan, which the user can view by selecting the employee from a dropdown at the top. The plan interface allows marking modules as completed, adding notes, and downloading the training plan as a PDF. Changes are saved immediately to Firestore and reflected in the competency matrix.

## Settings and Account Management

Clicking the user avatar in the header opens a settings dropdown where the user can navigate to their Profile page. The Profile page displays the user’s name, email, and role. Editable fields include phone number and a toggle for email notifications. A separate section on this page offers a theme switch between light and dark modes. Changing any setting and clicking "Save Changes" updates the user profile in Firestore and shows a toast notification confirming success. From this same dropdown menu, the user can also select "Sign Out" to end their session. After updating settings, the user clicks the Sonepar logo in the header or the "Back to Dashboard" link to return to the main flow.

## Error States and Alternate Paths

If a network interruption occurs while a user is on any page, a banner appears at the top of the screen stating "Offline mode: Some features may not work." Attempts to fetch data display an inline error message such as "Failed to load catalog data. Please retry." Once connectivity is restored, the banner disappears and the user can click "Retry" on any failed component. When a form submission fails due to validation errors—such as a missing required field—a red error message appears below the relevant input. If a user without permission somehow tries to navigate to an admin-only tool, they see an "Access Denied" page with a button to return to the Dashboard. Any unknown route in the URL triggers a 404 page that explains "Page not found" and provides a link back to the home screen.

## Conclusion and Overall App Journey

A Sonepar employee begins by signing in with their Google account and lands on the Dashboard where all tools are visible at a glance. From there they can drill into the Product Catalog to find and review products, consult SONEX for AI-driven technical support, test warehouse layouts with the Simulator, track industrial incidents in the Incident Dashboard, monitor logistics metrics with KPI charts, build detailed budgets based on catalog data, and manage internal training plans. At any time they can update personal preferences in Settings or sign out to end the session. The flow is seamless and intuitive, guiding the user to their goal—whether that is generating a budget, resolving an incident, or completing a training assignment—without ever leaving the single-page experience.

```text
+---------------+        +--------------------------+        +--------------+
| Landing Page  | -----> | Sign-In with Google Auth | -----> | Dashboard    |
+---------------+        +--------------------------+        +------+-------+
                                                                      |
          +-----------------------------------------------------------+---------------------------------------------------+
          |                           |                          |                         |                        |
     +---------+                +---------+             +-------------+           +-------------+          +---------------+
     | Catalog |                | SONEX   |             | Simulator   |           | Incidents   |          | KPI Dashboard |
     +---------+                +---------+             +-------------+           +-------------+          +---------------+
          |                           |                          |                         |                        |
     [Product Details]       [Chat Interface]           [Simulation Form]       [Incident List]           [Chart Panels]
          |                                                                                
       +---------------+                +-----------------
       | Settings Menu | <-------------------------------------------------------------
       +---------------+                +-----------------
              |
              v
       +--------------+
       | Sign Out     |
       +--------------+
```