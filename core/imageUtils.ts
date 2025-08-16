// src/core/imageUtils.ts
import { readFileSync, existsSync } from "fs";
import { ImageInput, ProcessedImage } from "./index";

/**
 * Convert various image input formats to base64 data URLs
 */
export async function processImageInputs(images: ImageInput[]): Promise<ProcessedImage[]> {
  if (!images || images.length === 0) {
    return [];
  }

  const processedImages: ProcessedImage[] = [];

  for (const image of images) {
    try {
      const processedImage = await processImageInput(image);
      processedImages.push(processedImage);
    } catch (error: any) {
      console.warn(`Failed to process image:`, error.message);
      // Skip invalid images rather than failing the entire request
    }
  }

  return processedImages;
}

/**
 * Process a single image input into a base64 data URL
 */
export async function processImageInput(image: ImageInput): Promise<ProcessedImage> {
  let base64Data: string;
  let mimeType: string;

  if (typeof image.data === 'string') {
    if (isBase64DataUrl(image.data)) {
      // Already a data URL
      return {
        url: image.data,
        detail: image.detail || 'auto'
      };
    } else if (isBase64String(image.data)) {
      // Plain base64 string
      base64Data = image.data;
      mimeType = image.mimeType || 'image/jpeg';
    } else if (isFilePath(image.data)) {
      // File path
      if (!existsSync(image.data)) {
        throw new Error(`Image file not found: ${image.data}`);
      }
      
      const fileBuffer = readFileSync(image.data);
      mimeType = image.mimeType || inferMimeTypeFromPath(image.data);
      base64Data = fileBuffer.toString('base64');
    } else {
      // Fallback: assume it's a base64 string
      base64Data = image.data;
      mimeType = image.mimeType || 'image/jpeg';
    }
  } else if (Buffer.isBuffer(image.data)) {
    // Buffer
    base64Data = image.data.toString('base64');
    mimeType = image.mimeType || 'image/jpeg';
  } else {
    throw new Error('Invalid image data format. Expected string (file path or base64) or Buffer.');
  }

  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  return {
    url: dataUrl,
    detail: image.detail || 'auto'
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
 * Infer MIME type from file extension
 */
function inferMimeTypeFromPath(filePath: string): string {
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