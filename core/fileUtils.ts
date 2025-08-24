// src/core/fileUtils.ts
import { existsSync, statSync } from "fs";
import { parseDataFile, getFileType } from "./utils/fileParser";
import { FileInput, DocumentOptions } from "./index";
import { ProcessedImage, ProcessedDocument } from "./agentState";

/**
 * Process various file inputs (images and documents) into their respective processed formats
 */
export async function processFileInputs(files: FileInput[]): Promise<{
  images: ProcessedImage[];
  documents: ProcessedDocument[];
}> {
  if (!files || files.length === 0) {
    return { images: [], documents: [] };
  }

  const images: ProcessedImage[] = [];
  const documents: ProcessedDocument[] = [];

  for (const file of files) {
    try {
      if (file.type === 'image') {
        const processedImage = await processImageFile(file);
        images.push(processedImage);
      } else if (file.type === 'document') {
        const processedDocument = await processDocumentFile(file);
        documents.push(processedDocument);
      }
    } catch (error: any) {
      console.warn(`Failed to process ${file.type} file:`, error.message);
      // Skip invalid files rather than failing the entire request
    }
  }

  return { images, documents };
}

/**
 * Process a single image file input
 */
export async function processImageFile(file: FileInput): Promise<ProcessedImage> {
  if (file.type !== 'image') {
    throw new Error('Expected image file type');
  }

  let base64Data: string;
  let mimeType: string;

  if (typeof file.data === 'string') {
    if (isBase64DataUrl(file.data)) {
      // Already a data URL
      return {
        url: file.data,
        detail: file.detail || 'auto'
      };
    } else if (isBase64String(file.data)) {
      // Plain base64 string
      base64Data = file.data;
      mimeType = file.mimeType || 'image/jpeg';
    } else if (isFilePath(file.data)) {
      // File path
      if (!existsSync(file.data)) {
        throw new Error(`Image file not found: ${file.data}`);
      }
      
      const fileBuffer = readFileSync(file.data);
      mimeType = file.mimeType || inferImageMimeTypeFromPath(file.data);
      base64Data = fileBuffer.toString('base64');
    } else {
      // Fallback: assume it's a base64 string
      base64Data = file.data;
      mimeType = file.mimeType || 'image/jpeg';
    }
  } else if (Buffer.isBuffer(file.data)) {
    // Buffer
    base64Data = file.data.toString('base64');
    mimeType = file.mimeType || 'image/jpeg';
  } else {
    throw new Error('Invalid image data format. Expected string (file path or base64) or Buffer.');
  }

  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  return {
    url: dataUrl,
    detail: file.detail || 'auto'
  };
}

/**
 * Process a single document file input
 */
export async function processDocumentFile(file: FileInput): Promise<ProcessedDocument> {
  if (file.type !== 'document') {
    throw new Error('Expected document file type');
  }

  if (typeof file.data !== 'string') {
    throw new Error('Document files must be provided as file paths (string)');
  }

  const filePath = file.data;

  // Validate file exists
  if (!existsSync(filePath)) {
    throw new Error(`Document file not found: ${filePath}`);
  }

  // Check file size (limit to 10MB for safety)
  const stats = statSync(filePath);
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (stats.size > maxSize) {
    throw new Error(`File too large. Maximum size allowed: ${maxSize / (1024 * 1024)}MB`);
  }

  const fileType = getFileType(filePath);
  const options = file.options || {};

  // Use shared parser for all file types
  const result = await parseDataFile(filePath, {
    maxRows: options.maxRows,
    includeHeaders: options.includeHeaders,
    sheetName: options.sheetName
  });

  return {
    filePath,
    fileType,
    data: result.data,
    metadata: result.metadata
  };
}

/**
 * Check if a string is a base64 data URL
 */
function isBase64DataUrl(str: string): boolean {
  return str.startsWith('data:image/') && str.includes(';base64,');
}

/**
 * Check if a string is likely a base64 string
 */
function isBase64String(str: string): boolean {
  // Base64 strings contain only alphanumeric characters, +, /, and = for padding
  // and are typically longer than file paths
  return /^[A-Za-z0-9+/=]+$/.test(str) && str.length > 20;
}

/**
 * Check if a string looks like a file path
 */
function isFilePath(str: string): boolean {
  // Simple heuristic: contains file extension or path separators
  return str.includes('/') || str.includes('\\') || /\.[a-z]{2,4}$/i.test(str);
}

/**
 * Infer MIME type from image file extension
 */
function inferImageMimeTypeFromPath(filePath: string): string {
  const extension = filePath.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'bmp':
      return 'image/bmp';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'image/jpeg'; // Default fallback
  }
}

// No backward compatibility - use unified FileInput interface only