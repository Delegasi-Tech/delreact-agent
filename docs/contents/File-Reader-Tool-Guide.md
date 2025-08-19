# File Reader Tool Guide

The DelReact framework includes a powerful `fileReader` tool that enables AI agents to read and analyze CSV and Excel files. This tool provides seamless integration for processing structured data from various file formats.

## Overview

The File Reader Tool (`read-data-file`) supports:
- **CSV files** (`.csv`) - Comma-separated values with automatic header detection
- **Excel files** (`.xlsx`, `.xls`) - Microsoft Excel workbooks with multi-sheet support
- **Performance optimization** - Configurable row limits and streaming processing
- **Error handling** - Graceful handling of invalid files and formats
- **LLM integration** - Structured data output optimized for AI analysis

## Installation

The file reader tool requires additional dependencies:

```bash
npm install xlsx csv-parser
```

## Features

### Supported File Formats
- **CSV files** (`.csv`)
- **Excel files** (`.xlsx`, `.xls`)

### Key Capabilities
- **Header detection** - Automatic header row recognition for CSV files
- **Sheet selection** - Choose specific sheets in Excel workbooks
- **Row limiting** - Process only a specified number of rows for performance
- **Data validation** - File size limits and format validation
- **Structured output** - JSON format with metadata and summary information

### Performance Considerations
- **File size limit**: 10MB maximum file size
- **Row limit**: Default 1000 rows (configurable)
- **Memory efficient**: Streaming processing for large CSV files
- **Sample data**: Returns first 100 rows for LLM processing

## Usage

### Basic Usage with ReactAgentBuilder

```typescript
import { ReactAgentBuilder } from 'delreact-agent';
import { fileReaderToolDef } from 'delreact-agent/tools';

const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  useEnhancedPrompt: true,
  memory: "in-memory"
})
.addTool([fileReaderToolDef])
.init({
  selectedProvider: 'gemini',
  model: 'gemini-2.5-flash'
})
.build();

// Analyze CSV data
const result = await agent.invoke({
  objective: "Analyze the employee data and provide salary insights by department",
  outputInstruction: "Calculate average salaries, identify trends, and recommend actions"
});
```

### Direct Tool Usage

```typescript
import { fileReaderToolDef } from 'delreact-agent/tools';

// Read CSV file
const csvData = await fileReaderToolDef.invoke({
  filePath: '/path/to/employees.csv',
  options: {
    maxRows: 100,
    includeHeaders: true
  }
});

// Read Excel file (specific sheet)
const excelData = await fileReaderToolDef.invoke({
  filePath: '/path/to/financial-data.xlsx',
  options: {
    maxRows: 50,
    sheetName: 'Q1_Sales'
  }
});
```

## Configuration Options

### FileReaderInput Interface

```typescript
interface FileReaderInput {
  filePath: string;              // Path to the file
  options?: {
    maxRows?: number;            // Maximum rows to process (default: 1000)
    includeHeaders?: boolean;    // Treat first row as headers (default: true)
    sheetName?: string;          // Excel sheet name (default: first sheet)
  };
  agentConfig?: any;            // Agent configuration (passed automatically)
}
```

### Output Format

The tool returns a JSON string with the following structure:

```json
{
  "filePath": "/path/to/file.csv",
  "fileType": "csv",
  "rowCount": 150,
  "maxRowsProcessed": 1000,
  "data": [
    {
      "Name": "John Doe",
      "Age": "28",
      "Department": "Engineering",
      "Salary": "75000"
    }
  ],
  "summary": {
    "totalRows": 150,
    "columns": ["Name", "Age", "Department", "Salary"],
    "sampleData": [...]
  }
}
```

## Examples

### Example 1: Employee Salary Analysis

```typescript
// Sample CSV structure: Name,Age,Department,Salary,Years_Experience
const salaryAnalysis = await agent.invoke({
  objective: "Analyze employee salaries and identify compensation trends",
  outputInstruction: `
    1. Calculate average salary by department
    2. Identify highest and lowest paid employees
    3. Analyze salary vs experience correlation
    4. Recommend salary adjustments
  `
});
```

### Example 2: Financial Data Processing

```typescript
// Sample Excel with Sales and Expenses sheets
const financialReport = await agent.invoke({
  objective: "Generate quarterly financial report from Excel data",
  outputInstruction: `
    1. Calculate total revenue and profit margins
    2. Compare performance across quarters
    3. Identify growth trends
    4. Highlight areas of concern
  `
});
```

### Example 3: Multi-File Comparison

```typescript
const comparison = await agent.invoke({
  objective: `
    Compare employee performance data (CSV) with financial results (Excel)
    to identify correlations between team performance and business outcomes
  `,
  outputInstruction: `
    1. Link employee departments to revenue streams
    2. Analyze performance scores vs financial results
    3. Identify top-performing teams
    4. Recommend resource allocation
  `
});
```

## Sample Data

The framework includes sample data files for testing:

### employees.csv
```csv
Name,Age,Department,Salary,Years_Experience
John Doe,28,Engineering,75000,5
Jane Smith,32,Marketing,68000,7
Mike Johnson,45,Engineering,95000,15
```

### company-data.xlsx
- **Sales Sheet**: Monthly revenue, expenses, profit data
- **Employees Sheet**: Employee IDs, names, departments, performance scores

## Error Handling

The tool provides comprehensive error handling:

```json
{
  "error": true,
  "message": "File not found: /invalid/path.csv",
  "filePath": "/invalid/path.csv"
}
```

Common error scenarios:
- **File not found**: Invalid file path
- **Unsupported format**: Non-CSV/Excel files
- **File too large**: Exceeds 10MB limit
- **Invalid Excel sheet**: Sheet name doesn't exist
- **Corrupted file**: Unable to parse file content

## Best Practices

### 1. File Organization
```typescript
// Organize data files in a structured directory
const dataPath = path.join(process.cwd(), 'data');
const csvFile = path.join(dataPath, 'employees.csv');
const excelFile = path.join(dataPath, 'financials.xlsx');
```

### 2. Performance Optimization
```typescript
// Limit rows for large files
const options = {
  maxRows: 500,  // Process only first 500 rows
  includeHeaders: true
};
```

### 3. Error Handling
```typescript
try {
  const result = await fileReaderToolDef.invoke({
    filePath: filePath,
    options: { maxRows: 100 }
  });
  
  const parsedResult = JSON.parse(result);
  if (parsedResult.error) {
    console.error('File reading error:', parsedResult.message);
    return;
  }
  
  // Process successful result
  console.log('Loaded', parsedResult.rowCount, 'rows');
} catch (error) {
  console.error('Tool invocation error:', error);
}
```

### 4. Data Validation
```typescript
// Validate file exists before processing
if (!fs.existsSync(filePath)) {
  throw new Error(`File not found: ${filePath}`);
}

// Check file extension
const validExtensions = ['.csv', '.xlsx', '.xls'];
const ext = path.extname(filePath).toLowerCase();
if (!validExtensions.includes(ext)) {
  throw new Error(`Unsupported file type: ${ext}`);
}
```

## Integration with Other Tools

The File Reader tool works seamlessly with other DelReact tools:

```typescript
const agent = new ReactAgentBuilder(config)
  .addTool([
    fileReaderToolDef,        // Read files
    webSearchToolDef,         // Research context
    ragSearchToolDef          // Query knowledge base
  ])
  .build();

// Combined workflow
await agent.invoke({
  objective: `
    Read sales data from Excel file, search for industry benchmarks,
    and compare our performance against market standards
  `,
  outputInstruction: "Provide comprehensive market analysis with recommendations"
});
```

## Advanced Usage

### Custom Processing Logic

```typescript
// Create custom tool that uses fileReader internally
const customAnalyzer = tool(
  async ({ filePath, analysisType }) => {
    const fileData = await fileReaderToolDef.invoke({
      filePath,
      options: { maxRows: 1000 }
    });
    
    const parsed = JSON.parse(fileData);
    
    // Custom analysis logic based on analysisType
    switch (analysisType) {
      case 'financial':
        return analyzeFinancialData(parsed.data);
      case 'employee':
        return analyzeEmployeeData(parsed.data);
      default:
        return generalAnalysis(parsed.data);
    }
  },
  {
    name: "custom-data-analyzer",
    description: "Analyze data files with custom logic",
    schema: z.object({
      filePath: z.string(),
      analysisType: z.enum(['financial', 'employee', 'general'])
    })
  }
);
```

### Batch File Processing

```typescript
const batchProcessor = async (filePaths: string[]) => {
  const results = await Promise.all(
    filePaths.map(path => fileReaderToolDef.invoke({
      filePath: path,
      options: { maxRows: 100 }
    }))
  );
  
  return results.map(result => JSON.parse(result));
};
```

## Troubleshooting

### Common Issues

1. **ES Module Import Errors**
   ```typescript
   // Use default import for xlsx
   import XLSX from 'xlsx';
   // Not: import * as XLSX from 'xlsx';
   ```

2. **Large File Processing**
   ```typescript
   // Increase maxRows gradually for large files
   const options = {
     maxRows: 10000  // Start small, increase as needed
   };
   ```

3. **Excel Sheet Names**
   ```typescript
   // List available sheets first
   const workbook = XLSX.readFile(filePath);
   console.log('Available sheets:', workbook.SheetNames);
   ```

### Performance Tips

- Use `maxRows` parameter to limit processing for large files
- Consider file size before processing (10MB limit)
- Use streaming processing for very large CSV files
- Cache processed results when possible

## API Reference

### Function Signature

```typescript
fileReaderToolDef.invoke(input: {
  filePath: string;
  options?: {
    maxRows?: number;
    includeHeaders?: boolean;
    sheetName?: string;
  };
  agentConfig?: any;
}): Promise<string>
```

### Return Value

Returns a JSON string containing:
- `filePath`: Original file path
- `fileType`: 'csv' or 'excel'
- `rowCount`: Number of rows processed
- `maxRowsProcessed`: Maximum rows configuration
- `data`: Array of row objects (limited to first 100 for LLM)
- `summary`: Metadata including total rows, columns, and sample data
- `error`: Boolean indicating if an error occurred
- `message`: Error message if error is true

The File Reader tool enables powerful data analysis workflows within the DelReact framework, making it easy for AI agents to process and reason about structured data from CSV and Excel files.