/**
 * 📦 Storage Helper
 * SuperClaude Optimized for Document Management
 * 
 * Features:
 * - Supabase Storage integration
 * - File validation
 * - Automatic optimization
 * - Secure URL generation
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// File type configurations
const FILE_CONFIGS = {
  documents: {
    bucket: 'documents',
    maxSizeMB: 50,
    allowedTypes: [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.xls', '.xlsx', '.doc', '.docx'],
  },
  images: {
    bucket: 'images',
    maxSizeMB: 10,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  exports: {
    bucket: 'exports',
    maxSizeMB: 100,
    allowedTypes: [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ],
    allowedExtensions: ['.pdf', '.xls', '.xlsx', '.csv'],
  },
};

// File validation
export function validateFile(
  file: File,
  type: keyof typeof FILE_CONFIGS
): { valid: boolean; error?: string } {
  const config = FILE_CONFIGS[type];
  
  // Check file size
  const maxSizeBytes = config.maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `El archivo excede el tamaño máximo de ${config.maxSizeMB}MB`,
    };
  }
  
  // Check file type
  if (!config.allowedTypes.includes(file.type)) {
    // Fallback to extension check
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!config.allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido. Formatos aceptados: ${config.allowedExtensions.join(', ')}`,
      };
    }
  }
  
  return { valid: true };
}

// Generate unique file path
export function generateFilePath(
  companyId: string,
  operationId: string,
  documentType: string,
  originalName: string
): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop()?.toLowerCase() || 'pdf';
  const sanitizedType = documentType.replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${companyId}/${operationId}/${sanitizedType}_${timestamp}.${extension}`;
}

// Upload file to storage
export async function uploadToStorage(
  file: File,
  path: string,
  type: keyof typeof FILE_CONFIGS = 'documents'
): Promise<{ url: string; path: string; size: number }> {
  try {
    // Validate file
    const validation = validateFile(file, type);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    const bucket = FILE_CONFIGS[type].bucket;
    
    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    logger.info('File uploaded successfully', {
      bucket,
      path,
      size: file.size,
      type: file.type,
    });
    
    return {
      url: urlData.publicUrl,
      path,
      size: file.size,
    };
  } catch (error) {
    logger.error('File upload failed', error, { path, type });
    throw error;
  }
}

// Get signed URL for private access
export async function getSignedUrl(
  path: string,
  bucket: string = 'documents',
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    
    if (error) {
      throw error;
    }
    
    return data.signedUrl;
  } catch (error) {
    logger.error('Failed to generate signed URL', error, { path, bucket });
    throw error;
  }
}

// Download file from storage
export async function downloadFromStorage(
  path: string,
  bucket: string = 'documents'
): Promise<Blob> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    logger.error('File download failed', error, { path, bucket });
    throw error;
  }
}

// Delete file from storage
export async function deleteFromStorage(
  paths: string | string[],
  bucket: string = 'documents'
): Promise<void> {
  try {
    const pathArray = Array.isArray(paths) ? paths : [paths];
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove(pathArray);
    
    if (error) {
      throw error;
    }
    
    logger.info('Files deleted successfully', { paths: pathArray, bucket });
  } catch (error) {
    logger.error('File deletion failed', error, { paths, bucket });
    throw error;
  }
}

// List files in a folder
export async function listFiles(
  folder: string,
  bucket: string = 'documents',
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: 'name' | 'created_at' | 'updated_at';
  }
): Promise<Array<{
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  metadata: Record<string, any>;
}>> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: options?.limit || 100,
        offset: options?.offset || 0,
        sortBy: {
          column: options?.sortBy || 'created_at',
          order: 'desc',
        },
      });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    logger.error('Failed to list files', error, { folder, bucket });
    throw error;
  }
}

// Get storage URL (for direct access)
export function getStorageUrl(path: string, bucket: string = 'documents'): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Image optimization helper
export async function optimizeImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert canvas to blob'));
              return;
            }
            
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            resolve(optimizedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Export functions
export {
  supabase,
  FILE_CONFIGS,
};