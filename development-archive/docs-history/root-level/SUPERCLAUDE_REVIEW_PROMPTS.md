# 🧠 SuperClaude `/review --evidence --ultrathink` Power Prompts
*Tailored for Supply Chain B2B SaaS - Living Interface Edition*

## 🎯 Deployment-Critical Review Prompts

### 1. **The "Show Me The Bodies" Security Audit**
```bash
/review --evidence --ultrathink --security --critical
"Find every unprotected endpoint in this multi-tenant system. I need:
1. Exact line numbers where org_id validation is missing
2. API routes callable without Clerk authentication  
3. SQLAlchemy queries that could leak cross-tenant data
4. Evidence of SQL injection vulnerabilities
Priority: models.py, routes/*.py, document_processor.py
Output: CVE severity scores with proof-of-concept"
```

### 2. **Living Interface Performance Forensics**
```bash
/review --evidence --ultrathink --performance --measure
"The breathing UI is beautiful but is it killing our performance? Analyze:
1. useBreathing hook: Show actual CPU usage over 60 seconds
2. OrganicDashboard: Memory allocation patterns with 50 components
3. FlowingTimeline: Frame drops on mid-tier mobile (show DevTools data)
4. Bundle impact: Framer Motion tree-shaking effectiveness
Baseline: iPhone 12, 4G connection, 10 document scenario"
```

### 3. **The "It's 2 AM and Production is Down" Review**
```bash
/review --evidence --ultrathink --production --emergency
"What will break at 3 AM on Monday when we're asleep? Find:
1. Every unhandled promise rejection in async document processing
2. Memory leaks in document_processor.py batch operations
3. Database connection pool exhaustion scenarios
4. Agent Astra API timeout cascading failures
Show me the exact stack traces that will wake me up"
```

### 4. **Triangle → Square Analytics Data Integrity**
```bash
/review --evidence --ultrathink --data-flow --forensic
"Trace a single document from upload to Triangle score. Prove:
1. No data loss between Flask upload and ProcessedData storage
2. Harmonic mean calculation preserves mathematical accuracy
3. Multi-tenant boundaries hold during parallel processing
4. Document Intelligence scores integrate without corrupting Triangle
Test case: 3 orgs uploading 100 docs simultaneously"
```

### 5. **The "VC Demo in 10 Minutes" Stability Check**
```bash
/review --evidence --ultrathink --demo-critical --rapid
"CEO demos to VCs Monday at 9 AM. What could embarrass us? Check:
1. Race conditions in real-time document processing UI updates
2. Breathing animations janking during screen share
3. Upload failures that show raw Python stack traces
4. Triangle calculations returning NaN or Infinity
5. Clerk auth redirect loops on corporate networks
Priority: User-visible failures only"
```

## 🔬 Deep Technical Analysis Prompts

### 6. **Async/Await Archaeological Dig**
```bash
/review --evidence --ultrathink --async --archaeology
"Document processor uses 2024's async patterns. Are they correct?
1. Find every 'await' without try/catch - list with line numbers
2. Identify Promise.all() that should be Promise.allSettled()
3. Show event loop blocking operations (>16ms)
4. Prove connection cleanup in error paths
Include: aiohttp session lifecycle, asyncio.gather exception handling"
```

### 7. **The "Scale to 10,000 Users" Architecture Review**
```bash
/review --evidence --ultrathink --architecture --scale
"Current architecture serves 10 users. What breaks at 10,000?
1. SQLAlchemy N+1 queries (show query logs)
2. Missing database indexes (EXPLAIN ANALYZE output)
3. Frontend API calls without pagination
4. WebSocket connections for breathing UI updates
5. Document processing queue bottlenecks
Provide: Specific bottleneck measurements + Amdahl's Law analysis"
```

### 8. **Living Interface Accessibility Audit**
```bash
/review --evidence --ultrathink --accessibility --wcag
"Beautiful breathing UI - but can screen readers use it?
1. Framer Motion animations vs prefers-reduced-motion
2. Color contrast ratios during opacity breathing (show calculations)
3. Keyboard navigation through FlowingTimeline
4. ARIA labels for dynamic score updates
5. Focus management in modal transitions
Evidence: Axe DevTools scores + NVDA screen reader transcripts"
```

## 🚀 Deployment-Specific Reviews

### 9. **The "Localhost Grep of Doom"**
```bash
/review --evidence --ultrathink --deployment --forensic
"Find every hardcoded value that will break in production:
1. localhost, 127.0.0.1, :3000, :5000 (with context)
2. Hardcoded API keys (even in comments)
3. Development-only console.logs with sensitive data
4. SQLite-specific queries that break on PostgreSQL
5. File paths assuming local filesystem
Output: sed commands to fix each instance"
```

### 10. **Docker Container Escape Room**
```bash
/review --evidence --ultrathink --docker --security
"Your Dockerfiles claim production-ready. Prove it:
1. Secret leakage in image layers (docker history analysis)
2. Running as root user vulnerabilities
3. Missing security headers in nginx/Flask
4. Exposed ports beyond necessity
5. Build cache invalidation inefficiencies
Show: Trivy scan results + specific line fixes"
```

## 💎 Advanced Compound Reviews

### 11. **The "Full Stack Trace" Review**
```bash
/review --evidence --ultrathink --fullstack --trace
"User clicks 'Upload Document' - trace EVERYTHING:
1. React event handler → API call formation
2. CORS preflight → Flask route matching  
3. File parsing → Document type detection
4. Agent Astra API → Response handling
5. Database writes → UI update via WebSocket
Show: Chrome DevTools Network + Performance tabs correlation"
```

### 12. **The "Money Leak" Financial Analysis**
```bash
/review --evidence --ultrathink --cost --financial
"Every API call costs money. Where are we bleeding?
1. Agent Astra API calls without caching ($0.001 each)
2. Unnecessary database queries in loops
3. Frontend polling instead of WebSocket
4. Large bundle served to mobile users
5. Missing CDN for Living Interface assets
Calculate: Cost per 1000 active users per month"
```

## 🎨 Living Interface Specific Reviews

### 13. **The "Organic Chemistry" Animation Audit**
```bash
/review --evidence --ultrathink --animation --organic
"Our UI breathes - but does it breathe efficiently?
1. RAF usage in useBreathing vs CSS animations benchmark
2. Simultaneous animation count impact on battery
3. Memory leaks from incomplete animation cleanup
4. Spring physics calculations per frame
5. GPU vs CPU animation distribution
Measure: Power consumption on M1 MacBook over 5 minutes"
```

### 14. **The "Semantic Versioning" Component Review**
```bash
/review --evidence --ultrathink --components --versioning
"Living Interface components - are they truly reusable?
1. Props drilling vs Context optimization
2. Memoization opportunities missed
3. Component coupling analysis (import graphs)
4. Bundle splitting effectiveness
5. TypeScript generic constraints
Output: Refactoring priority matrix with effort/impact scores"
```

## 🔮 Predictive Failure Analysis

### 15. **The "Black Swan" Chaos Engineering Review**
```bash
/review --evidence --ultrathink --chaos --predictive
"What unlikely event will definitely happen? Model:
1. Agent Astra API deprecates endpoint mid-demo
2. Clerk webhook signature changes format
3. PostgreSQL connection string expires
4. Framer Motion v13 breaks breathing animations
5. CORS policy changes in Chrome 122
For each: Blast radius + detection time + recovery plan"
```

## 💪 The Ultimate Compound Review

### 16. **The "Ship It or Skip It" Final Review**
```bash
/review --evidence --ultrathink --ship-decision --comprehensive
"It's Sunday 11 PM. Should we deploy or delay? Analyze:

SHIP IT evidence:
- Core features working % (with proof)
- Data integrity guarantees (test results)
- Rollback capability (time to recover)
- Error tracking ready (Sentry integration)

SKIP IT evidence:  
- Unhandled edge cases (severity scoring)
- Performance degradation (specific metrics)
- Security vulnerabilities (CVE equivalent)
- Missing critical features (user impact)

Output: Ship/Skip decision with confidence % + mitigation plan"
```

## 🛠️ Quick Power Combos

### **The 5-Minute Sanity Check**
```bash
/review --evidence --ultrathink --sanity --quick
"Five things that MUST work Monday morning:
1. Login flow (Clerk → Dashboard)
2. Document upload (CSV → Processing)
3. Analytics display (Triangle scores)
4. Multi-tenant isolation (Org A can't see Org B)
5. Basic error handling (No white screens)
Pass/Fail each with screenshot evidence"
```

### **The "Investor Demo" Polish Review**
```bash
/review --evidence --ultrathink --demo --polish  
"Make it shine for the demo:
1. Loading states that feel premium
2. Error messages that inspire confidence
3. Animations that impress but don't distract
4. Data that tells a growth story
5. Performance that feels instant
Rate 1-10 with specific improvements"
```

---

## 📋 How to Use These Prompts

1. **Copy-paste directly into Cursor chat**
2. **Adjust specifics** (file names, metrics) to your needs
3. **Chain prompts**: Use output from one as input to next
4. **Save results**: Each review creates actionable fix lists
5. **Prioritize**: Focus on prompts 1, 3, 9, and 16 for deployment

### **Pro Tip: The Review Pipeline**
```bash
# Run in sequence for complete coverage
/review --evidence --ultrathink --security --critical
↓
/review --evidence --ultrathink --production --emergency  
↓
/review --evidence --ultrathink --deployment --forensic
↓
/review --evidence --ultrathink --ship-decision --comprehensive
```

---

*These prompts leverage SuperClaude's evidence-based methodology to deliver actionable insights, not opinions. Each review provides specific line numbers, measurements, and fix commands.*