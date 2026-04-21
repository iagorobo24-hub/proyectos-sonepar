flowchart TD
  A[User] --> B[Login]
  B[Login] --> C[AppShell]
  C[AppShell] --> D[Sidebar]
  D[Sidebar] --> E[Select Module]
  E[Select Module] --> F1[Product Catalog Management]
  E[Select Module] --> F2[Technical Assistant SONEX]
  E[Select Module] --> F3[Warehouse Simulator]
  E[Select Module] --> F4[Incident Management Dashboard]
  E[Select Module] --> F5[Logistics KPI]
  E[Select Module] --> F6[Budget Generation]
  E[Select Module] --> F7[Internal Training]

  F1[Product Catalog Management] --> G1[Catalog Service]
  G1[Catalog Service] --> H[Firestore]
  F1[Product Catalog Management] --> I[Web Scraping Pipeline]
  I[Web Scraping Pipeline] --> J[Playwright Scripts]
  J[Playwright Scripts] --> K[Transform & Load]
  K[Transform & Load] --> H[Firestore]

  F2[Technical Assistant SONEX] --> L[Edge Function Proxy]
  L[Edge Function Proxy] --> M[Anthropic Claude API]
  L[Edge Function Proxy] --> H[Firestore]

  F3[Warehouse Simulator] --> O[Simulator Service]
  O[Simulator Service] --> H[Firestore]

  F4[Incident Management Dashboard] --> P[Incidents Service]
  P[Incidents Service] --> H[Firestore]

  F5[Logistics KPI] --> Q[KPI Service]
  Q[KPI Service] --> H[Firestore]

  F6[Budget Generation] --> R[Budget Service]
  R[Budget Service] --> H[Firestore]

  F7[Internal Training] --> S[Training Service]
  S[Training Service] --> H[Firestore]