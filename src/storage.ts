import type { StoredData, UploadedDataset, MinMaxConfig } from '@/types';

const STORAGE_KEY = 'supply-chain-data';

export const loadStoredData = (): StoredData | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading stored data:', error);
    return null;
  }
};

export const saveStoredData = (data: StoredData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
    throw new Error('Failed to save data. Storage may be full.');
  }
};

export const addDataset = (dataset: UploadedDataset): void => {
  const existingData = loadStoredData() || {
    inventory: [],
    sales: [],
    historical: [],
    minMaxSettings: {},
    lastUpdated: new Date().toISOString(),
    version: '1.0.0'
  };

  // Remove existing dataset of same type and add new one
  existingData.historical = existingData.historical.filter(
    d => !(d.type === dataset.type && d.filename === dataset.filename)
  );
  
  existingData.historical.push(dataset);
  existingData.lastUpdated = new Date().toISOString();

  saveStoredData(existingData);
};

export const getLatestDatasets = (): { inventory: UploadedDataset | null; sales: UploadedDataset | null } => {
  const data = loadStoredData();
  if (!data) return { inventory: null, sales: null };

  const inventory = data.historical
    .filter(d => d.type === 'inventory')
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0] || null;

  const sales = data.historical
    .filter(d => d.type === 'sales')
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0] || null;

  return { inventory, sales };
};

export const getAllDatasets = (): UploadedDataset[] => {
  const data = loadStoredData();
  return data?.historical || [];
};

export const deleteDataset = (id: string): void => {
  const data = loadStoredData();
  if (!data) return;

  data.historical = data.historical.filter(d => d.id !== id);
  data.lastUpdated = new Date().toISOString();
  
  saveStoredData(data);
};

export const updateMinMaxSettings = (productCode: string, config: MinMaxConfig): void => {
  const data = loadStoredData() || {
    inventory: [],
    sales: [],
    historical: [],
    minMaxSettings: {},
    lastUpdated: new Date().toISOString(),
    version: '1.0.0'
  };

  data.minMaxSettings[productCode] = config;
  data.lastUpdated = new Date().toISOString();
  
  saveStoredData(data);
};

export const getMinMaxSettings = (productCode: string): MinMaxConfig | null => {
  const data = loadStoredData();
  return data?.minMaxSettings[productCode] || null;
};

export const clearAllData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Swallow error
  }
};

export const exportData = (): string => {
  const data = loadStoredData();
  return JSON.stringify(data, null, 2);
};

export const importData = (jsonData: string): void => {
  try {
    const data = JSON.parse(jsonData) as StoredData;
    
    // Validate data structure
    if (!data.historical || !Array.isArray(data.historical)) {
      throw new Error('Invalid data structure');
    }

    saveStoredData(data);
  } catch (error) {
    console.error('Error importing data:', error);
    throw new Error('Invalid JSON data format');
  }
};

export const getStorageUsage = (): { used: number; available: number; percentage: number } => {
  try {
    const data = JSON.stringify(loadStoredData() || {});
    const used = new Blob([data]).size;
    const available = 5 * 1024 * 1024; // Assuming 5MB limit for localStorage
    const percentage = (used / available) * 100;

    return { used, available, percentage };
  } catch (error) {
    return { used: 0, available: 0, percentage: 0 };
  }
};