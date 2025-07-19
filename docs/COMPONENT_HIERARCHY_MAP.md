# Component Hierarchy and Dependencies Map

## 1. Application Root Structure

```
app/
├── layout.tsx (Root Layout)
│   └── ClerkProvider
│       └── ErrorBoundary
│           └── {children}
│
├── page.tsx (Landing Page)
├── sign-in/[[...sign-in]]/page.tsx
├── sign-up/[[...sign-up]]/page.tsx
├── onboarding/page.tsx
│
└── dashboard/
    ├── page.tsx (Main Dashboard)
    │   └── MainDashboard
    ├── sales/page.tsx
    │   └── SalesDashboard
    ├── finance/page.tsx
    │   └── FinanceDashboard
    ├── procurement/page.tsx
    │   └── ProcurementDashboard
    ├── inventory/page.tsx
    │   └── InventoryDashboard
    └── agents/page.tsx
        └── AgentManagement
```

## 2. Component Hierarchy

### A. Main Dashboard Components

```
MainDashboard
├── Quick Stats Cards (4 cards)
├── OrganicDashboard (Living Interface)
│   ├── LivingScore (Overall + 4 Component Scores)
│   ├── FlowingTimeline (5 Processing Steps)
│   ├── GrowingMetrics (4 Metric Cards)
│   └── Organic Insights (Dynamic List)
└── Navigation Cards (6 Role-based Dashboards)
```

### B. Business Intelligence Components (15 Total)

#### Q1: Sales Intelligence (5 Components)
```
SalesDashboard
├── CustomerSegmentation
│   ├── Customer Table with filtering
│   ├── Segment Distribution Chart
│   └── Growth Analysis
├── GeographicSalesMap
│   ├── SVG World Map
│   ├── Region Cards
│   └── Market Penetration Metrics
├── PricingOptimization
│   ├── Product Pricing Table
│   ├── Price Elasticity Chart
│   └── AI Recommendations
├── MarketAnalysis
│   └── Competitor Analysis Dashboard
└── SalesForecasting
    ├── Forecast Chart
    └── Scenario Planning
```

#### Q2: Financial Intelligence (5 Components)
```
FinanceDashboard
├── CashConversionCycle
│   ├── Timeline Visualization
│   └── Optimization Opportunities
├── TrappedCashAnalysis
│   ├── Root Cause Analysis
│   └── Actionable Recommendations
├── PaymentTermsCalculator
│   ├── Impact Simulator
│   └── Optimization Scenarios
├── WorkingCapitalSimulator
│   ├── Scenario Modeling
│   └── Seasonal Variations
└── FinancialDrillDown
    ├── Hierarchical Metrics
    └── Variance Analysis
```

#### Q3: Supply Chain Intelligence (5 Components)
```
ProcurementDashboard
├── PredictiveReordering
│   ├── AI Recommendations
│   └── Batch Processing
├── SupplierHealthScoring
│   ├── Performance Monitoring
│   └── Risk Assessment
├── LeadTimeIntelligence
│   ├── AI Analysis
│   └── Disruption Monitoring
├── SupplierComparison
│   ├── Multi-Supplier Analysis
│   └── Custom Scoring
└── SupplyChainRiskVisualization
    ├── Risk Heatmaps
    └── Mitigation Planning
```

### C. Living Interface System

```
DocumentIntelligence/
├── OrganicDashboard (Main Container)
│   ├── Breathing Header with Scores
│   ├── Upload Modal (Organic animations)
│   └── Insights with Growing Vines
├── LivingScore
│   └── Animated circular progress
├── FlowingTimeline
│   └── Water-like flow animation
├── GrowingMetrics
│   └── Plant-growth animations
└── MagicInteractions
    └── Particle effects
```

### D. Psychology Flow System

```
psychology/
├── PsychologyDashboard (Enhanced MainDashboard)
│   ├── Psychology State Indicator
│   ├── KPIEvolutionCard (4 instances)
│   └── Psychology-aware Navigation
├── TrustExecutiveDashboard
├── ConfidenceFinanceDashboard
├── IntelligenceOperationalDashboard
└── LivingOrganismDemo
```

### E. Agent Management System

```
agents/
├── AgentMonitoringDashboard
├── AgentCreationWizard
├── AgentConfigurationPanel
├── AgentPerformanceAnalytics
└── AgentLogsInterface
```

## 3. Data Flow Architecture

### A. API Layer

```
lib/api-client.ts (Enhanced APIClient)
├── Retry Logic (3 attempts, exponential backoff)
├── Request Caching (5-minute TTL)
├── Error Handling (Custom error types)
└── Parallel Fetching Support

hooks/useAPIFetch.ts
├── useDashboardData()
├── useDocumentAnalytics()
└── useAPIError()
```

### B. Data Flow Pattern

```
1. Page Component (Server Component)
   ↓ auth() check
   ↓ redirect if needed
   
2. Client Component (Main Dashboard)
   ↓ useAPIFetch hook
   ↓ APIClient.fetchDashboardDataParallel()
   
3. Parallel API Calls
   ├── /api/dashboard/{userId}
   ├── /api/insights/{userId}
   └── /api/analytics/{orgId}
   
4. Data Processing
   ↓ Cache management
   ↓ Error handling with retry
   
5. Component Rendering
   ↓ Loading states (Skeleton)
   ↓ Error states (Alert with retry)
   └── Success states (Full UI)
```

## 4. Component Dependencies

### A. Shared UI Components
```
ui/
├── alert.tsx (Error states)
├── badge.tsx (Status indicators)
├── button.tsx (Actions)
├── card.tsx (Container)
├── dialog.tsx (Modals)
├── input.tsx (Forms)
├── skeleton.tsx (Loading states)
├── tabs.tsx (Navigation)
└── [other Radix UI components]
```

### B. Custom Hooks
```
hooks/
├── useAPIFetch.ts (Data fetching with retry)
├── useBreathing.ts (Organic animations)
└── [role-specific hooks]
```

### C. Utility Functions
```
lib/
├── api-client.ts (API communication)
├── utils.ts (General utilities)
└── design-system.ts (Theme constants)
```

## 5. Integration Points

### A. Frontend → Backend API

```
Frontend (Next.js)          Backend (Flask)
├── /api/* → Vercel Proxy → /api/* endpoints
├── Authentication: Clerk JWT
├── Organization Scoping
└── Multi-tenant Isolation
```

### B. Component Integration Patterns

1. **Dashboard Integration**
   - All dashboards extend base dashboard pattern
   - Shared data fetching through useAPIFetch
   - Common error/loading states

2. **Living Interface Integration**
   - OrganicDashboard embedded in MainDashboard
   - Breathing animations synchronized
   - Respects prefers-reduced-motion

3. **Psychology Flow Integration**
   - Progressive enhancement based on user journey
   - Three levels: Trust → Confidence → Intelligence
   - Visual feedback through animations

## 6. Architectural Patterns

### A. Three-Layer Architecture
```
1. Presentation Layer
   - React Components
   - Framer Motion animations
   - Tailwind CSS styling

2. Business Logic Layer
   - Custom hooks
   - Data transformation
   - State management

3. Data Layer
   - API Client
   - Caching logic
   - Error handling
```

### B. Component Composition Pattern
```
- Small, focused components
- Composition over inheritance
- Props drilling minimized
- Context for global state (Clerk)
```

### C. Error Handling Strategy
```
1. Network errors → Automatic retry
2. API errors → User-friendly messages
3. Component errors → Error boundaries
4. Timeout handling → 30s limit
```

## 7. Performance Optimizations

1. **API Response Caching**
   - 5-minute TTL for GET requests
   - Session storage for persistence
   - Cache invalidation on updates

2. **Parallel Data Fetching**
   - Dashboard + Insights + Analytics
   - Non-blocking optional data
   - Graceful degradation

3. **Component Lazy Loading**
   - Route-based code splitting
   - Dynamic imports for heavy components
   - Skeleton loaders for perceived performance

## 8. Circular Dependencies

No circular dependencies detected. The architecture follows a unidirectional data flow:
- Pages → Components → Hooks → API Client → Backend
- No components import their parent components
- Shared utilities don't import components

## 9. Areas for Improvement

1. **State Management**
   - Consider Redux/Zustand for complex state
   - Currently relies on prop drilling

2. **Type Safety**
   - Some API responses use `any` type
   - Could benefit from generated types

3. **Component Testing**
   - Limited test coverage
   - Integration tests needed

4. **Performance Monitoring**
   - No performance tracking
   - Could add analytics

5. **Accessibility**
   - Good foundation with Radix UI
   - Could add more ARIA labels