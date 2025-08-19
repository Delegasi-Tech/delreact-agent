# File Reader Tool Quick Reference

Quick reference for using the DelReact File Reader tool to process CSV and Excel files.

## Installation

```bash
npm install xlsx csv-parser
```

## Import

```typescript
import { fileReaderToolDef } from 'delreact-agent/tools';
```

## Basic Usage

### With Agent
```typescript
const agent = new ReactAgentBuilder(config)
  .addTool([fileReaderToolDef])
  .build();

await agent.invoke({
  objective: "Analyze employee salary data from CSV file",
  outputInstruction: "Calculate averages and identify trends"
});
```

### Direct Tool Usage
```typescript
// CSV file
const csvResult = await fileReaderToolDef.invoke({
  filePath: '/path/to/data.csv',
  options: { maxRows: 100, includeHeaders: true }
});

// Excel file
const excelResult = await fileReaderToolDef.invoke({
  filePath: '/path/to/data.xlsx',
  options: { maxRows: 50, sheetName: 'Sheet1' }
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `filePath` | string | required | Path to CSV or Excel file |
| `maxRows` | number | 1000 | Maximum rows to process |
| `includeHeaders` | boolean | true | Treat first row as headers (CSV) |
| `sheetName` | string | first sheet | Excel sheet name |

## Supported Formats

| Format | Extensions | Notes |
|--------|------------|-------|
| CSV | `.csv` | Comma-separated values |
| Excel | `.xlsx`, `.xls` | Multi-sheet support |

## File Size Limits

- **Maximum file size**: 10MB
- **Default row limit**: 1000 rows
- **LLM output limit**: First 100 rows

## Output Format

```json
{
  "filePath": "/path/to/file.csv",
  "fileType": "csv",
  "rowCount": 150,
  "data": [
    { "Name": "John", "Age": "28", "Salary": "75000" }
  ],
  "summary": {
    "totalRows": 150,
    "columns": ["Name", "Age", "Salary"],
    "sampleData": [...]
  }
}
```

## Common Patterns

### Employee Data Analysis
```typescript
const result = await agent.invoke({
  objective: "Analyze employee data and calculate salary statistics",
  outputInstruction: "Group by department, calculate averages, identify outliers"
});
```

### Financial Report Processing
```typescript
const result = await agent.invoke({
  objective: "Process quarterly financial data from Excel",
  outputInstruction: "Calculate profit margins, growth rates, and key metrics"
});
```

### Data Comparison
```typescript
const result = await agent.invoke({
  objective: "Compare current vs previous year sales data",
  outputInstruction: "Identify trends, growth patterns, and performance changes"
});
```

## Error Handling

```typescript
try {
  const result = await fileReaderToolDef.invoke({ filePath });
  const data = JSON.parse(result);
  
  if (data.error) {
    console.error('File error:', data.message);
  } else {
    console.log('Loaded:', data.rowCount, 'rows');
  }
} catch (error) {
  console.error('Tool error:', error);
}
```

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| File not found | Invalid path | Check file path exists |
| File too large | >10MB file | Split file or increase limit |
| Unsupported format | Wrong extension | Use .csv, .xlsx, .xls |
| Sheet not found | Invalid sheet name | Check available sheets |

## Best Practices

### Performance
```typescript
// Limit rows for large files
{ maxRows: 500 }

// Use appropriate file paths
path.join(process.cwd(), 'data', 'file.csv')
```

### Data Validation
```typescript
// Check file exists
if (!fs.existsSync(filePath)) {
  throw new Error('File not found');
}

// Validate extension
const validExts = ['.csv', '.xlsx', '.xls'];
const ext = path.extname(filePath).toLowerCase();
```

### Excel Sheets
```typescript
// List available sheets
const workbook = XLSX.readFile(filePath);
console.log(workbook.SheetNames);

// Read specific sheet
{ sheetName: 'Q1_Sales' }
```

## Sample Data Files

Create test files in `example/sample-data/`:

**employees.csv**
```csv
Name,Age,Department,Salary,Years_Experience
John Doe,28,Engineering,75000,5
Jane Smith,32,Marketing,68000,7
```

**sales-data.xlsx**
- Sales sheet: Revenue, expenses, profit by month
- Employees sheet: Performance scores, departments

## Integration Examples

### Multiple Tools
```typescript
const agent = new ReactAgentBuilder(config)
  .addTool([
    fileReaderToolDef,    // Read data files
    webSearchToolDef,     // Research context
    ragSearchToolDef      // Query knowledge
  ])
  .build();
```

### Custom Workflow
```typescript
// Read → Analyze → Report
const workflow = new SubgraphBuilder()
  .addAgent("reader", FileReaderAgent)
  .addAgent("analyzer", DataAnalysisAgent)
  .addAgent("reporter", ReportGenerator)
  .build();
```

## Troubleshooting

### ES Module Issues
```typescript
// Correct imports
import XLSX from 'xlsx';           // Default import
import { fileReaderToolDef } from 'delreact-agent/tools';
```

### Large Files
```typescript
// Process in chunks
const chunks = await processFileInChunks(filePath, 1000);
```

### Memory Issues
```typescript
// Stream processing for very large files
const stream = fs.createReadStream(filePath);
```

## Quick Commands

```bash
# Test file reader
npx tsx example/fileReaderExample.ts

# Build project
npm run build

# Generate sample Excel
npx tsx example/sample-data/createExcelSample.ts
```

---

For detailed documentation, see [File Reader Tool Guide](./File-Reader-Tool-Guide.md).