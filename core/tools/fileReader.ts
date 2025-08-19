import { tool } from "@langchain/core/tools";
import z from "zod";
import * as fs from 'fs';
import * as path from 'path';
import XLSX from 'xlsx';

export interface FileReaderInput {
  filePath: string;
  options?: {
    maxRows?: number;
    includeHeaders?: boolean;
    sheetName?: string; // For Excel files
  };
  agentConfig?: any;
}

/**
 * Parse CSV file and return structured data using built-in parsing
 */
const parseCSVFile = async (filePath: string, options: FileReaderInput['options'] = {}): Promise<any[]> => {
  const { maxRows = 1000, includeHeaders = true } = options;
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return [];
    
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
    
    return data;
  } catch (error) {
    throw new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Parse Excel file and return structured data using xlsx library
 */
const parseExcelFile = async (filePath: string, options: FileReaderInput['options'] = {}): Promise<any[]> => {
  const { maxRows = 1000, sheetName } = options;
  
  try {
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
    
    if (jsonData.length === 0) return [];
    
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
    
    return result;
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Determine file type based on extension
 */
const getFileType = (filePath: string): 'csv' | 'excel' | 'unknown' => {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.csv') return 'csv';
  if (['.xlsx', '.xls'].includes(ext)) return 'excel';
  return 'unknown';
};

/**
 * Main file reading function
 */
const readDataFile = async ({ filePath, options = {}, agentConfig }: FileReaderInput): Promise<string> => {
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Check file size (limit to 10MB for safety)
    const stats = fs.statSync(filePath);
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (stats.size > maxSize) {
      throw new Error(`File too large. Maximum size allowed: ${maxSize / (1024 * 1024)}MB`);
    }
    
    const fileType = getFileType(filePath);
    let data: any[] = [];
    
    switch (fileType) {
      case 'csv':
        data = await parseCSVFile(filePath, options);
        break;
      case 'excel':
        data = await parseExcelFile(filePath, options);
        break;
      default:
        throw new Error(`Unsupported file type. Supported formats: CSV (.csv), Excel (.xlsx, .xls)`);
    }
    
    const result = {
      filePath,
      fileType,
      rowCount: data.length,
      maxRowsProcessed: options.maxRows || 1000,
      data: data.slice(0, Math.min(100, data.length)), // Return first 100 rows for LLM
      summary: {
        totalRows: data.length,
        columns: data.length > 0 ? Object.keys(data[0]) : [],
        sampleData: data.slice(0, 3) // First 3 rows as sample
      }
    };
    
    return JSON.stringify(result, null, 2);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return JSON.stringify({
      error: true,
      message: errorMessage,
      filePath
    }, null, 2);
  }
};

export const fileReaderToolDef = tool(
  readDataFile,
  {
    name: "read-data-file",
    description: "Read and parse CSV or Excel files to extract structured data for analysis. Supports CSV (.csv) and Excel (.xlsx, .xls) formats. Returns parsed data in JSON format with metadata about the file structure.",
    schema: z.object({
      filePath: z.string().describe("Path to the CSV or Excel file to read"),
      options: z.object({
        maxRows: z.number().optional().describe("Maximum number of rows to process (default: 1000)"),
        includeHeaders: z.boolean().optional().describe("Whether to treat first row as headers for CSV files (default: true)"),
        sheetName: z.string().optional().describe("Name of the Excel sheet to read (default: first sheet)")
      }).optional(),
      agentConfig: z.any().optional()
    }),
  }
);