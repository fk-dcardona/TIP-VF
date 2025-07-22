# Supply Chain Intelligence Dashboard

A comprehensive web application for supply chain analytics and inventory management, built with React, TypeScript, and modern data visualization tools.

## 🚀 Features

### 📊 **Dashboard Overview**
- **KPI Cards**: Supply Chain Health Score, Total Revenue, Critical Alerts, Average Gross Margin
- **Revenue Trend Chart**: Visualize historical revenue with forecasting
- **Stock Status Distribution**: Pie chart showing inventory health across all products
- **Product Groups Performance**: Bar chart comparing revenue and margins by product category

### 🚨 **Critical Alerts System**
- Real-time monitoring of inventory levels
- Color-coded urgency levels (Critical, High, Medium)
- Filterable alerts by priority, type, and product group
- Actionable recommendations with PO creation triggers
- Export capabilities for alert reports

### 📈 **Advanced Analytics**
- **Stock Efficiency Matrix**: Scatter plot analysis of turnover rate vs. margin
- **Cash Flow Analysis**: Inventory investment and ROI calculations
- **Procurement Recommendations**: AI-driven purchase suggestions
- **Product Performance Tables**: Sortable, searchable product analysis
- **Top Performers & Underperformers**: Automated identification of high/low performing products

### 📤 **Data Upload System**
- **4-Step Upload Wizard**:
  1. Upload Inventory CSV
  2. Upload Sales CSV  
  3. Data Confirmation & Preview
  4. Auto-Calculate Min/Max Levels
- CSV validation and error handling
- Progress tracking with chunked file processing
- Data persistence with localStorage

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts library
- **Icons**: Lucide React
- **CSV Processing**: PapaParse
- **State Management**: React hooks + localStorage
- **Build Tool**: Vite

## 📋 Data Requirements

### Inventory CSV Format
```csv
k_sc_codigo_articulo,sc_detalle_articulo,sc_detalle_grupo,sc_detalle_subgrupo,n_saldo_anterior,n_entradas,n_salidas,n_saldo_actual,n_costo_promedio,n_ultimo_costo,sc_tipo_unidad
```

### Sales CSV Format  
```csv
k_sc_codigo_fuente,n_numero_documento,ka_nl_movimiento,d_fecha_documento,sc_nombre,n_nit,sc_telefono_ppal,sc_telefono_alterno,sc_nombre_fuente,MARCA,k_sc_codigo_articulo,sc_detalle_articulo,n_cantidad,n_valor,V. BRUTA,n_iva,n_descuento,DESCUENTO,V. NETA,sc_detalle_grupo,sc_signo_inventario,zona,ka_nl_tercero,nombre_vendedor
```

**Date Format**: M/D/YYYY (e.g., 1/2/2025)

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd supply-chain-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

## 🧮 Business Logic

### **Min/Max Level Calculation**
```typescript
// Lead time by product category
leadTimeDays = product.group.includes('PAÑITOS') ? 7 : 
               product.group.includes('DETERGENTE') ? 10 : 14;

// Average monthly sales calculation
avgMonthlySales = historicalSales.reduce(sum) / months;

// Safety stock calculation  
leadTimeDemand = (avgMonthlySales / 30) * leadTimeDays;
safetyStock = leadTimeDemand * 0.5;

// Final levels
minimum = leadTimeDemand + safetyStock;
maximum = avgMonthlySales * 2; // 2 months supply
```

### **Supply Chain Health Score**
```typescript
const healthScore = (stockHealth - overstockPenalty + marginBonus);
// Where:
// stockHealth = (totalProducts - outOfStock - lowStock) / totalProducts * 100
// overstockPenalty = (overStock / totalProducts) * 30
// marginBonus = avgGrossMargin > 20 ? 10 : 0
```

## 🎯 Getting Started

1. **Start the development server**: `npm run dev`
2. **Upload your data**: Click "Upload Data" and follow the 4-step wizard
3. **Explore dashboards**: Navigate through Overview, Alerts, and Analytics tabs
4. **Analyze insights**: Use filters and time ranges to drill down into your data

## ✅ Success Criteria

✅ **Functional file upload** with 4-step wizard  
✅ **Real-time dashboard** with live filtering and responsive design  
✅ **Accurate business calculations** for min/max inventory levels  
✅ **Persistent data storage** across browser sessions  
✅ **Mobile-responsive interface** for all screen sizes  
✅ **Export capabilities** for reports and analytics  
✅ **Performance optimized** for large datasets  
✅ **Production-ready** deployment configuration

---

**Version**: 1.0.0  
**Built with** ❤️ **for supply chain professionals**