# Unified File Interface Guide

The DelReact framework now supports a unified file interface that allows you to pass both images and documents in a single `files` array with proper type discrimination. This provides a cleaner, more semantic API while maintaining full backward compatibility.

## 🚀 Quick Start

### New Unified Interface (Recommended)

```typescript
import { ReactAgentBuilder, FileInput } from "delreact-agent";

const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY
})
.init({ selectedProvider: 'gemini' })
.build();

const result = await agent.invoke({
  objective: "Analyze sales dashboard and underlying data",
  files: [
    {
      type: 'image',
      data: "/path/to/dashboard.png",
      detail: 'high'
    },
    {
      type: 'document', 
      data: "/path/to/sales-data.xlsx",
      options: { maxRows: 100, sheetName: 'Q3_Sales' }
    }
  ]
});
```

### Legacy Interface (Still Supported)

```typescript
// Old way still works for backward compatibility
const result = await agent.invoke({
  objective: "Analyze dashboard",
  images: [
    { data: "/path/to/dashboard.png", detail: 'high' }
  ]
  // Documents handled separately via tools
});
```

## 📁 FileInput Interface

The unified `FileInput` interface uses TypeScript discriminated unions for type safety:

```typescript
interface FileInput {
  type: 'image' | 'document';
  data: string | Buffer;
  mimeType?: string;
  detail?: 'auto' | 'low' | 'high';     // Images only
  options?: DocumentOptions;            // Documents only
}

interface DocumentOptions {
  maxRows?: number;         // Default: 1000
  includeHeaders?: boolean; // Default: true
  sheetName?: string;       // For Excel files
}
```

## 🖼️ Image Files

### Supported Formats
- **File paths**: `"/path/to/image.png"`
- **Data URLs**: `"data:image/jpeg;base64,/9j/4AAQ..."`
- **Base64 strings**: `"/9j/4AAQSkZJRgABAQEASABIAAD..."`
- **Buffer objects**: `Buffer.from(imageData)`

### Image Detail Levels
- `'low'`: Faster processing, lower cost
- `'auto'`: Automatic optimization (default)
- `'high'`: Best quality for charts and detailed images

### Example: Image File

```typescript
{
  type: 'image',
  data: "/path/to/chart.png",
  detail: 'high',
  mimeType: 'image/png'
}
```

## 📊 Document Files

### Supported Formats
- **CSV files**: `.csv`
- **Excel files**: `.xlsx`, `.xls`

### Processing Options
- **maxRows**: Limit processing to prevent memory issues (default: 1000)
- **includeHeaders**: Treat first row as headers for CSV (default: true)
- **sheetName**: Specify Excel sheet to read (default: first sheet)

### Example: Document File

```typescript
{
  type: 'document',
  data: "/path/to/data.xlsx",
  options: {
    maxRows: 500,
    sheetName: 'Sales_Q3',
    includeHeaders: true
  }
}
```

## 💡 Usage Patterns

### 1. Mixed Analysis (Recommended)

```typescript
await agent.invoke({
  objective: "Create comprehensive business report",
  files: [
    // Dashboard image
    {
      type: 'image',
      data: "/path/to/kpi-dashboard.png",
      detail: 'high'
    },
    // Sales chart
    {
      type: 'image', 
      data: "/path/to/sales-trends.png",
      detail: 'high'
    },
    // Underlying data
    {
      type: 'document',
      data: "/path/to/sales-data.xlsx",
      options: { sheetName: 'Summary', maxRows: 200 }
    },
    // Additional metrics
    {
      type: 'document',
      data: "/path/to/metrics.csv",
      options: { maxRows: 100 }
    }
  ]
});
```

### 2. Document-Only Analysis

```typescript
await agent.invoke({
  objective: "Analyze employee performance trends",
  files: [
    {
      type: 'document',
      data: "/path/to/employees.csv"
    },
    {
      type: 'document', 
      data: "/path/to/performance-reviews.xlsx",
      options: { sheetName: 'Q3_Reviews' }
    }
  ]
});
```

### 3. Image-Only Analysis

```typescript
await agent.invoke({
  objective: "Analyze visual dashboard elements",
  files: [
    {
      type: 'image',
      data: "/path/to/dashboard.png",
      detail: 'high'
    }
  ]
});
```

## 🔧 Advanced Usage

### Direct File Processing

You can also process files directly without the full agent workflow:

```typescript
import { processFileInputs, processDocumentFile } from "delreact-agent";

// Process mixed files
const { images, documents } = await processFileInputs([
  { type: 'image', data: "/path/to/chart.png", detail: 'high' },
  { type: 'document', data: "/path/to/data.csv" }
]);

// Process single document
const document = await processDocumentFile({
  type: 'document',
  data: "/path/to/sales.xlsx",
  options: { maxRows: 100, sheetName: 'Q3' }
});
```

### Combining with LLM Calls

```typescript
const builder = new ReactAgentBuilder({ geminiKey: "..." });

// Process files first
const { images, documents } = await processFileInputs(files);

// Create analysis prompt with document data
const prompt = `
Analyze this data:
${JSON.stringify(documents[0].data.slice(0, 5), null, 2)}

Provide insights on trends and patterns.
`;

// Call LLM with both data and images
const result = await builder.callLLM(prompt, {
  provider: 'gemini',
  images: images
});
```

## 🎯 Best Practices

### File Organization
- **Combine related files** in single workflows for better context
- **Use descriptive objectives** that reference both visual and data elements
- **Specify processing options** for large datasets

### Performance Optimization
- **Set maxRows limits** for large Excel/CSV files (default: 1000)
- **Use appropriate image detail levels** ('high' for charts, 'auto' for photos)
- **Specify sheet names** for multi-sheet Excel files

### Error Handling
- **Files are processed individually** - invalid files are skipped with warnings
- **Check file existence** before processing
- **Monitor file sizes** (10MB limit for documents)

### Type Safety
- **Use TypeScript** for full type checking with discriminated unions
- **Specify file types explicitly** for better IDE support
- **Configure options per file type** for optimal processing

## 🔄 Migration Guide

### From Legacy Images Array

**Before:**
```typescript
await agent.invoke({
  objective: "Analyze dashboard",
  images: [
    { data: "/path/to/chart.png", detail: 'high' }
  ]
});
```

**After:**
```typescript
await agent.invoke({
  objective: "Analyze dashboard",
  files: [
    { type: 'image', data: "/path/to/chart.png", detail: 'high' }
  ]
});
```

### From Separate Tool Usage

**Before:**
```typescript
const agent = new ReactAgentBuilder(config)
  .addTool([fileReaderToolDef])  // Manual tool addition
  .build();

await agent.invoke({
  objective: "Analyze data",
  images: [imageFile]
  // Documents processed via tool calls
});
```

**After:**
```typescript
const agent = new ReactAgentBuilder(config)
  .build();  // No manual tool configuration needed

await agent.invoke({
  objective: "Analyze data",
  files: [
    { type: 'image', data: imageFile.data, detail: 'high' },
    { type: 'document', data: "/path/to/data.xlsx" }
  ]
});
```

## 📋 Common Use Cases

### Dashboard Validation
```typescript
files: [
  { type: 'image', data: "/path/to/dashboard.png", detail: 'high' },
  { type: 'document', data: "/path/to/source-data.xlsx", options: { sheetName: 'Raw_Data' } }
]
```

### Financial Reporting
```typescript
files: [
  { type: 'image', data: "/path/to/revenue-chart.png", detail: 'high' },
  { type: 'image', data: "/path/to/expense-breakdown.png", detail: 'high' },
  { type: 'document', data: "/path/to/financial-data.xlsx", options: { sheetName: 'P&L' } }
]
```

### HR Analytics
```typescript
files: [
  { type: 'document', data: "/path/to/employees.csv" },
  { type: 'document', data: "/path/to/performance.xlsx", options: { sheetName: 'Ratings' } },
  { type: 'image', data: "/path/to/org-chart.png", detail: 'high' }
]
```

### Market Research
```typescript
files: [
  { type: 'document', data: "/path/to/survey-results.csv" },
  { type: 'image', data: "/path/to/market-trends.png", detail: 'high' },
  { type: 'document', data: "/path/to/competitor-analysis.xlsx" }
]
```

## 🚀 Benefits

- **Unified API**: Single `files` array for all file types
- **Type Safety**: TypeScript discriminated unions prevent errors
- **Automatic Processing**: No manual tool configuration required
- **Better Semantics**: Clear distinction between image and document files
- **Backward Compatibility**: Legacy `images` array still supported
- **Enhanced Workflows**: Agents automatically understand file context
- **Cleaner Code**: More intuitive and maintainable syntax

The unified file interface makes DelReact agents more powerful and easier to use while maintaining the flexibility and performance you expect from the framework.