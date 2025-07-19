# Technical Debt Hotspot Map

## 🔴 Critical Debt Areas

### 1. Root Directory Chaos
- **Location**: Project root
- **Issue**: 20+ Python files scattered at root level
- **Impact**: High - Makes project structure confusing
- **Files**: `main.py`, `models.py`, `test_*.py`, `demo_*.py`
- **Fix Effort**: Medium - Need to reorganize into proper directories

### 2. Component Duplication
- **Location**: `src/components/` vs `src/components/ui/`
- **Issue**: Duplicate alert component with different implementations
- **Impact**: Medium - Maintenance overhead, confusion
- **Specific**: 
  - `src/components/alert.tsx` (uses CSS variables)
  - `src/components/ui/alert.tsx` (uses Tailwind classes)
- **Fix Effort**: Low - Consolidate to single implementation

### 3. Supply Chain Engine Duplication
- **Location**: Root directory
- **Issue**: Two implementations of supply chain engine
- **Files**: 
  - `supply_chain_engine.py`
  - `supply_chain_engine_enhanced.py`
- **Impact**: High - Which version to use?
- **Fix Effort**: High - Need to merge features or deprecate one

## 🟡 Medium Priority Debt

### 1. Mixed Component Concerns
- **Location**: `src/components/`
- **Issue**: Business logic mixed with UI components
- **Examples**: 
  - `CustomerSegmentation.tsx` contains analysis logic
  - `PricingOptimization.tsx` has pricing calculations
- **Impact**: Medium - Harder to test and reuse
- **Fix Effort**: Medium - Extract business logic to domain layer

### 2. No Backend Structure
- **Location**: Backend files
- **Issue**: No clear separation between API, domain, and infrastructure
- **Impact**: Medium - Harder to maintain and scale
- **Fix Effort**: Medium - Create proper backend architecture

### 3. Test File Organization
- **Location**: Root and various directories
- **Issue**: Test files mixed with source code
- **Files**: `test_*.py` files at root
- **Impact**: Low - Clutters project structure
- **Fix Effort**: Low - Move to dedicated test directories

## 🟢 Low Priority Debt

### 1. Unused Agent Protocol
- **Location**: `agent_protocol/` directory
- **Issue**: Sophisticated system that appears unused
- **Impact**: Low - Just takes up space
- **Fix Effort**: Low - Archive or remove

### 2. Development Archive
- **Location**: `development-archive/`
- **Issue**: Historical code in main branch
- **Impact**: Low - Increases repo size
- **Fix Effort**: Low - Move to separate repository

## Debt Metrics Summary

- **Total Debt Items**: 10
- **Critical Issues**: 3
- **Medium Issues**: 3
- **Low Issues**: 2
- **Estimated Total Effort**: 15-20 days
- **Risk if Unaddressed**: Architecture will become unmaintainable

## Recommended Priority Order

1. **Immediate** (Week 1)
   - Fix root directory organization
   - Consolidate duplicate components
   - Create basic backend structure

2. **Short Term** (Week 2-3)
   - Extract business logic from components
   - Merge supply chain engines
   - Organize test files

3. **Long Term** (Month 2)
   - Implement full clean architecture
   - Archive unused code
   - Optimize bundle size