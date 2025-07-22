'use client';

import React from 'react';
import { Download, FileText, Database, ShoppingCart, Truck, Receipt } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface CSVTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  filename: string;
  fields: string[];
  sampleData: string;
}

const csvTemplates: CSVTemplate[] = [
  {
    id: 'inventory',
    name: 'Inventory CSV',
    description: 'Track your current stock levels, reorder points, and supplier information',
    icon: <Database className="h-6 w-6" />,
    filename: 'inventory-sample.csv',
    fields: ['SKU', 'Product_Name', 'Category', 'Current_Stock', 'Reorder_Point', 'Max_Stock', 'Unit_Cost', 'Supplier_ID', 'Last_Updated', 'Location', 'Warehouse_ID', 'Lead_Time_Days', 'Quality_Score', 'Status'],
    sampleData: `SKU,Product_Name,Category,Current_Stock,Reorder_Point,Max_Stock,Unit_Cost,Supplier_ID,Last_Updated,Location,Warehouse_ID,Lead_Time_Days,Quality_Score,Status
INV-001,Wireless Headphones,Electronics,150,50,300,89.99,SUP-001,2025-01-20,Zone A,WH-001,7,95,Active
INV-002,Bluetooth Speaker,Electronics,75,25,150,45.50,SUP-001,2025-01-20,Zone A,WH-001,5,92,Active`
  },
  {
    id: 'sales',
    name: 'Sales CSV',
    description: 'Record your sales transactions, customer data, and revenue metrics',
    icon: <ShoppingCart className="h-6 w-6" />,
    filename: 'sales-sample.csv',
    fields: ['Order_ID', 'Customer_ID', 'Product_SKU', 'Quantity', 'Sale_Price', 'Total_Amount', 'Sale_Date', 'Payment_Method', 'Sales_Rep_ID', 'Region', 'Channel', 'Discount_Applied', 'Shipping_Cost', 'Profit_Margin'],
    sampleData: `Order_ID,Customer_ID,Product_SKU,Quantity,Sale_Price,Total_Amount,Sale_Date,Payment_Method,Sales_Rep_ID,Region,Channel,Discount_Applied,Shipping_Cost,Profit_Margin
ORD-001,CUST-001,INV-001,2,89.99,179.98,2025-01-15,Credit Card,REP-001,North America,Online,0.00,12.99,45.50
ORD-002,CUST-002,INV-002,1,45.50,45.50,2025-01-15,PayPal,REP-002,Europe,Online,5.00,8.99,12.25`
  },
  {
    id: 'suppliers',
    name: 'Suppliers CSV',
    description: 'Manage your supplier relationships, performance metrics, and contact information',
    icon: <Truck className="h-6 w-6" />,
    filename: 'suppliers-sample.csv',
    fields: ['Supplier_ID', 'Supplier_Name', 'Contact_Person', 'Email', 'Phone', 'Address', 'City', 'Country', 'Payment_Terms', 'Lead_Time_Days', 'Quality_Rating', 'On_Time_Delivery_Rate', 'Cost_Rating', 'Status', 'Contract_Start_Date', 'Contract_End_Date', 'Category', 'Annual_Spend', 'Performance_Score'],
    sampleData: `Supplier_ID,Supplier_Name,Contact_Person,Email,Phone,Address,City,Country,Payment_Terms,Lead_Time_Days,Quality_Rating,On_Time_Delivery_Rate,Cost_Rating,Status,Contract_Start_Date,Contract_End_Date,Category,Annual_Spend,Performance_Score
SUP-001,TechCorp Electronics,John Smith,john.smith@techcorp.com,+1-555-0101,123 Tech Street,San Francisco,USA,Net 30,7,95,98,85,Active,2024-01-01,2025-12-31,Electronics,250000,92
SUP-002,Global Components Ltd,Sarah Johnson,sarah.j@globalcomp.com,+44-20-7123-4567,456 Industrial Ave,London,UK,Net 45,5,92,95,88,Active,2024-03-15,2025-12-31,Electronics,180000,90`
  },
  {
    id: 'invoices',
    name: 'Invoice Template',
    description: 'Standard invoice format for processing payments and tracking receivables',
    icon: <Receipt className="h-6 w-6" />,
    filename: 'invoice-template.pdf',
    fields: ['Invoice_Number', 'Customer_ID', 'Invoice_Date', 'Due_Date', 'Line_Items', 'Subtotal', 'Tax_Amount', 'Total_Amount', 'Payment_Status', 'Payment_Method'],
    sampleData: `Invoice_Number,Customer_ID,Invoice_Date,Due_Date,Line_Items,Subtotal,Tax_Amount,Total_Amount,Payment_Status,Payment_Method
INV-2025-001,CUST-001,2025-01-15,2025-02-15,"Wireless Headphones x2",179.98,14.40,194.38,Paid,Credit Card
INV-2025-002,CUST-002,2025-01-16,2025-02-16,"Bluetooth Speaker x1",45.50,3.64,49.14,Paid,PayPal`
  },
  {
    id: 'bol',
    name: 'Bill of Lading Template',
    description: 'Shipping document template for tracking shipments and deliveries',
    icon: <Truck className="h-6 w-6" />,
    filename: 'bol-template.pdf',
    fields: ['BOL_Number', 'Shipper_ID', 'Consignee_ID', 'Ship_Date', 'Expected_Delivery', 'Carrier', 'Tracking_Number', 'Items', 'Total_Weight', 'Shipping_Method'],
    sampleData: `BOL_Number,Shipper_ID,Consignee_ID,Ship_Date,Expected_Delivery,Carrier,Tracking_Number,Items,Total_Weight,Shipping_Method
BOL-2025-001,SUP-001,CUST-001,2025-01-20,2025-01-25,FedEx,794658321456,"Wireless Headphones x50",25.5kg,Express
BOL-2025-002,SUP-002,CUST-002,2025-01-21,2025-01-28,UPS,1Z999AA1234567890,"Bluetooth Speakers x25",12.3kg,Standard`
  }
];

export function CSVDownloadCenter() {
  const downloadCSV = (template: CSVTemplate) => {
    const blob = new Blob([template.sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = template.filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const downloadAll = () => {
    csvTemplates.forEach(template => {
      setTimeout(() => downloadCSV(template), 500); // Stagger downloads
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CSV Templates & Sample Data</h2>
          <p className="text-gray-600">Download sample CSV files to get started with your supply chain data</p>
        </div>
        <Button onClick={downloadAll} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download All Templates
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {csvTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {template.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Required Fields:</h4>
                <div className="flex flex-wrap gap-1">
                  {template.fields.slice(0, 5).map((field, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                  {template.fields.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.fields.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {template.filename}
                </div>
                <Button 
                  onClick={() => downloadCSV(template)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <FileText className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Getting Started Guide</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Download the CSV templates that match your data structure</li>
                <li>2. Fill in your actual data following the sample format</li>
                <li>3. Upload your CSV files through the document upload interface</li>
                <li>4. Our AI will analyze your data and provide insights</li>
                <li>5. View real-time analytics and alerts in your dashboard</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 