// src/core/fileUtils.ts
import { readFileSync, existsSync, statSync } from "fs";
import { extname } from "path";
import XLSX from 'xlsx';
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

  const fileType = getDocumentFileType(filePath);
  let data: any[] = [];
  let metadata: ProcessedDocument['metadata'];

  const options = file.options || {};

  switch (fileType) {
    case 'csv':
      const csvResult = await parseCSVFile(filePath, options);
      data = csvResult.data;
      metadata = csvResult.metadata;
      break;
    case 'excel':
      const excelResult = await parseExcelFile(filePath, options);
      data = excelResult.data;
      metadata = excelResult.metadata;
      break;
    default:
      throw new Error(`Unsupported document file type. Supported formats: CSV (.csv), Excel (.xlsx, .xls)`);
  }

  return {
    filePath,
    fileType,
    data,
    metadata
  };
}

/**
 * Parse CSV file and return structured data
 */
async function parseCSVFile(filePath: string, options: DocumentOptions = {}): Promise<{
  data: any[];
  metadata: ProcessedDocument['metadata'];
}> {
  const { maxRows = 1000, includeHeaders = true } = options;
  
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return { data: [], metadata: { rowCount: 0, columns: [] } };
  }
  
  // Parse CSV with proper quote handling
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };
  
  const headers = includeHeaders ? parseCSVLine(lines[0]) : null;
  const dataStartIndex = includeHeaders ? 1 : 0;
  const rowsToProcess = Math.min(maxRows, lines.length - dataStartIndex);
  
  const data: any[] = [];
  
  for (let i = dataStartIndex; i < dataStartIndex + rowsToProcess; i++) {
    if (i >= lines.length) break;
    
    const values = parseCSVLine(lines[i]);
    
    if (headers) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    } else {
      data.push(values);
    }
  }
  
  return {
    data,
    metadata: {
      rowCount: data.length,
      columns: headers || [],
    }
  };
}

/**
 * Parse Excel file and return structured data
 */
async function parseExcelFile(filePath: string, options: DocumentOptions = {}): Promise<{
  data: any[];
  metadata: ProcessedDocument['metadata'];
}> {
  const { maxRows = 1000, sheetName } = options;
  
  // Read the Excel file
  const workbook = XLSX.readFile(filePath);
  
  // Get sheet name - use provided name or first sheet
  const targetSheet = sheetName || workbook.SheetNames[0];
  
  if (!workbook.Sheets[targetSheet]) {
    throw new Error(`Sheet '${targetSheet}' not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
  }
  
  const worksheet = workbook.Sheets[targetSheet];
  
  // Convert to JSON with headers
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1, // Use first row as headers
    defval: '', // Default value for empty cells
    raw: false // Return formatted strings
  });
  
  if (jsonData.length === 0) {
    return { data: [], metadata: { rowCount: 0, columns: [], sheetName: targetSheet } };
  }
  
  // Get headers from first row
  const headers = jsonData[0] as string[];
  const dataRows = jsonData.slice(1) as any[][];
  
  // Convert to objects and limit rows
  const result: any[] = [];
  const rowsToProcess = Math.min(maxRows, dataRows.length);
  
  for (let i = 0; i < rowsToProcess; i++) {
    const row = dataRows[i] || [];
    const rowObject: any = {};
    
    headers.forEach((header, index) => {
      rowObject[header] = row[index] || '';
    });
    
    result.push(rowObject);
  }
  
  return {
    data: result,
    metadata: {
      rowCount: result.length,
      columns: headers,
      sheetName: targetSheet
    }
  };
}

/**
 * Determine document file type based on extension
 */
function getDocumentFileType(filePath: string): 'csv' | 'excel' | 'unknown' {
  const ext = extname(filePath).toLowerCase();
  
  if (ext === '.csv') return 'csv';
  if (['.xlsx', '.xls'].includes(ext)) return 'excel';
  return 'unknown';
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

// Backward compatibility functions
export { processImageFile as processImageInput };
export async function processImageInputs(imageInputs: any[]): Promise<ProcessedImage[]> {
  const fileInputs: FileInput[] = imageInputs.map(img => ({
    type: 'image' as const,
    data: img.data,
    mimeType: img.mimeType,
    detail: img.detail
  }));
  
  const result = await processFileInputs(fileInputs);
  return result.images;
}