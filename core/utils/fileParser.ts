import { readFileSync, existsSync, statSync } from "fs";
import { extname } from "path";
import ExcelJS from 'exceljs';
import Papa from 'papaparse';

export interface FileParserOptions {
  maxRows?: number;
  includeHeaders?: boolean;
  sheetName?: string; // For Excel files
}

export interface ParsedFileResult {
  data: any[];
  metadata: {
    rowCount: number;
    columns: string[];
    sheetName?: string;
  };
}

/**
 * Determine file type based on extension
 */
export function getFileType(filePath: string): 'csv' | 'excel' | 'xls_unsupported' | 'unknown' {
  const ext = extname(filePath).toLowerCase();
  
  if (ext === '.csv') return 'csv';
  if (ext === '.xlsx') return 'excel';
  if (ext === '.xls') return 'xls_unsupported';
  return 'unknown';
}

/**
 * Parse CSV file and return structured data
 */
export async function parseCSVFile(filePath: string, options: FileParserOptions = {}): Promise<ParsedFileResult> {
  const { maxRows = 1000, includeHeaders = true } = options;
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    if (!content.trim()) {
      return { 
        data: [], 
        metadata: { rowCount: 0, columns: [] }
      };
    }
    
    // Use papaparse for robust CSV parsing
    const parseResult = Papa.parse(content, {
      header: includeHeaders,
      skipEmptyLines: true,
      trimHeaders: true,
      dynamicTyping: true
    });
    
    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing warnings:', parseResult.errors);
    }
    
    // Limit rows if specified
    const data = parseResult.data.slice(0, maxRows);
    
    // Extract column names
    const columns = data.length > 0 && includeHeaders 
      ? Object.keys(data[0]) 
      : [];
    
    return {
      data,
      metadata: {
        rowCount: data.length,
        columns
      }
    };
  } catch (error) {
    throw new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse Excel file and return structured data
 */
export async function parseExcelFile(filePath: string, options: FileParserOptions = {}): Promise<ParsedFileResult> {
  const { maxRows = 1000, sheetName } = options;
  
  try {
    // Read the Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    // Get sheet name - use provided name or first sheet
    const targetSheet = sheetName || workbook.worksheets[0]?.name;
    
    if (!targetSheet) {
      throw new Error('No worksheets found in the Excel file');
    }
    
    const worksheet = workbook.getWorksheet(targetSheet);
    
    if (!worksheet) {
      const availableSheets = workbook.worksheets.map(ws => ws.name);
      throw new Error(`Sheet '${targetSheet}' not found. Available sheets: ${availableSheets.join(', ')}`);
    }
    
    // Extract data from worksheet
    const headers: string[] = [];
    const dataRows: any[][] = [];
    
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) {
        // Header row
        row.eachCell((cell, colIndex) => {
          headers.push(cell.value?.toString() || '');
        });
      } else {
        // Data rows
        const rowData: any[] = [];
        row.eachCell({ includeEmpty: true }, (cell, colIndex) => {
          rowData[colIndex - 1] = cell.value?.toString() || '';
        });
        dataRows.push(rowData);
      }
    });
    
    if (headers.length === 0) {
      return { 
        data: [], 
        metadata: { rowCount: 0, columns: [], sheetName: targetSheet }
      };
    }
    
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
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Main file parsing function that handles both CSV and Excel files
 */
export async function parseDataFile(filePath: string, options: FileParserOptions = {}): Promise<ParsedFileResult> {
  // Validate file exists
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  // Check file size (limit to 10MB for safety)
  const stats = statSync(filePath);
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (stats.size > maxSize) {
    throw new Error(`File too large. Maximum size allowed: ${maxSize / (1024 * 1024)}MB`);
  }
  
  const fileType = getFileType(filePath);
  
  switch (fileType) {
    case 'csv':
      return parseCSVFile(filePath, options);
    case 'excel':
      return parseExcelFile(filePath, options);
    case 'xls_unsupported':
      throw new Error(`Legacy Excel .xls format is not supported. Please convert your file to .xlsx format. Supported formats: CSV (.csv), Excel (.xlsx)`);
    default:
      throw new Error(`Unsupported file type. Supported formats: CSV (.csv), Excel (.xlsx)`);
  }
}