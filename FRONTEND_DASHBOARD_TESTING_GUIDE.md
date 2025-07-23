# 🎨 Frontend Dashboard Testing Guide

## 🚀 Quick Start - Test Frontend Dashboards

### **Option 1: Next.js Development Server** (Recommended)

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser
http://localhost:3000

# 4. Navigate to dashboard
http://localhost:3000/dashboard
```

### **Option 2: Production Build Testing**

```bash
# 1. Build for production
npm run build

# 2. Start production server
npm run start

# 3. Test in browser
http://localhost:3000
```

### **Option 3: Static Testing (No Backend)**

```bash
# Test with mock data and no API calls
NEXT_PUBLIC_API_URL=mock npm run dev
```

---

## 📋 Dashboard Testing Checklist

### **Core Dashboard Features**
- [ ] **Dashboard Loads**: Main dashboard page renders without errors
- [ ] **Tab Navigation**: All 7 tabs are accessible (Overview, Analytics, Sales, Finance, Procurement, Upload, Alerts)
- [ ] **CSV Upload Tab**: New upload tab with EnhancedUploadWizard component
- [ ] **Responsive Design**: Dashboard works on desktop, tablet, and mobile
- [ ] **Authentication**: Clerk authentication working (if enabled)

### **Upload Wizard Testing**
- [ ] **Step 1 - Upload Inventory**: File picker and validation
- [ ] **Step 2 - Upload Sales**: File picker and data matching
- [ ] **Step 3 - Confirm Data**: Preview of merged dataset
- [ ] **Step 4 - Process**: Analytics generation and display
- [ ] **Error Handling**: Proper error messages for invalid files
- [ ] **Progress Indicators**: Loading states and progress bars

### **Business Intelligence Components**
- [ ] **Sales Intelligence**: Customer segmentation, geographic sales, pricing optimization
- [ ] **Financial Intelligence**: Cash flow analysis, trapped cash insights
- [ ] **Supply Chain Intelligence**: Predictive reordering, supplier health
- [ ] **Chart Interactions**: Charts respond to user interactions
- [ ] **Data Filtering**: Advanced filters work correctly

---

## 🧪 Testing Scripts

Let me create automated testing scripts for you: