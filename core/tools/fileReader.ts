import { tool } from "@langchain/core/tools";
import z from "zod";
import * as fs from 'fs';
import { parseDataFile } from '../utils/fileParser';

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
    
    // Use shared parser
    const result = await parseDataFile(filePath, {
      maxRows: options.maxRows,
      includeHeaders: options.includeHeaders,
      sheetName: options.sheetName
    });
    
    const response = {
      filePath,
      fileType: result.metadata.sheetName ? 'excel' : 'csv',
      rowCount: result.data.length,
      maxRowsProcessed: options.maxRows || 1000,
      data: result.data.slice(0, Math.min(100, result.data.length)), // Return first 100 rows for LLM
      summary: {
        totalRows: result.data.length,
        columns: result.metadata.columns,
        sampleData: result.data.slice(0, 3), // First 3 rows as sample
        sheetName: result.metadata.sheetName
      }
    };
    
    return JSON.stringify(response, null, 2);
    
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
    description: "Read and parse CSV or Excel files to extract structured data for analysis. Supports CSV (.csv) and Excel (.xlsx) formats. Returns parsed data in JSON format with metadata about the file structure.",
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