# Multimodal Analysis Guide: Excel/CSV + Images

This guide demonstrates how to combine Excel/CSV file reading with image analysis in DelReact agent workflows for comprehensive business intelligence and data validation.

## 🎯 Overview

The DelReact framework supports powerful multimodal analysis by combining:
- **Structured Data**: Excel (.xlsx, .xls) and CSV files via the `read-data-file` tool
- **Visual Content**: Images (charts, dashboards, documents) via vision-capable LLMs
- **AI Analysis**: Intelligent synthesis and validation across data sources

## 🚀 Quick Start

### Basic Agent Setup with Multimodal Support

```typescript
import { ReactAgentBuilder } from "../core";
import { fileReaderToolDef } from "../core/tools/fileReader";

const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  openaiKey: process.env.OPENAI_KEY,
  useEnhancedPrompt: true,
  memory: "in-memory"
})
.addTool([fileReaderToolDef]) // Enable file reading
.init({
  selectedProvider: 'gemini', // Vision-capable model
  model: 'gemini-2.5-flash'
})
.build();
```

### Simple Multimodal Analysis

```typescript
const result = await agent.invoke({
  objective: "Analyze this sales dashboard and validate trends with underlying data",
  outputInstruction: "Provide visual analysis, data validation, and business insights",
  images: [
    {
      data: "/path/to/dashboard.png", // Dashboard image
      detail: 'high'
    }
  ]
  // Agent automatically reads relevant CSV/Excel files when needed
});
```

## 📊 Usage Patterns

### Pattern 1: Agent-Orchestrated Analysis (Recommended)

Let the agent automatically determine what data files to read based on your objective:

```typescript
const result = await agent.invoke({
  objective: "Create a comprehensive financial report using our Q3 data and performance charts",
  outputInstruction: `Generate report with:
    1. Executive Summary
    2. Key Metrics (from Excel data)
    3. Visual Trend Analysis (from charts)
    4. Recommendations`,
  images: [
    { data: "/path/to/q3-dashboard.png", detail: "high" },
    { data: "/path/to/revenue-chart.jpg", detail: "high" }
  ]
});
```

### Pattern 2: Explicit File Specification

Guide the agent to specific files when you know exactly what data to analyze:

```typescript
const result = await agent.invoke({
  objective: "Analyze employee performance using the HR spreadsheet and org chart",
  images: [
    { data: "/path/to/org-chart.png", detail: "high" }
  ]
  // Then ask agent to read specific files:
  // "Please read the employees.xlsx file from the HR-data folder"
});
```

### Pattern 3: Direct Tool + LLM Integration

For maximum control, use tools directly then pass results to LLM:

```typescript
// Step 1: Read data file
const salesData = await fileReaderToolDef.invoke({
  filePath: '/path/to/sales-Q3.xlsx',
  options: {
    maxRows: 100,
    sheetName: 'Monthly_Sales'
  }
});

// Step 2: Analyze with LLM including images
const analysis = await agentBuilder.callLLM(`
  Analyze this sales data alongside the dashboard image:
  
  Data: ${JSON.stringify(salesData, null, 2)}
  
  Provide insights on trends, accuracy, and recommendations.
`, {
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  images: [
    { data: "/path/to/dashboard.png", detail: "high" }
  ]
});
```

## 🎯 Real-World Use Cases

### 1. Dashboard Validation

Verify that visual dashboards accurately represent underlying data:

```typescript
const validation = await agent.invoke({
  objective: "Validate that this sales dashboard accurately reflects our actual sales data",
  outputInstruction: "Compare visual metrics with data metrics and report any discrepancies",
  images: [
    { data: "/path/to/sales-dashboard.png", detail: "high" }
  ]
});
```

### 2. Financial Report Generation

Combine Excel financial data with chart images for comprehensive reporting:

```typescript
const report = await agent.invoke({
  objective: "Generate executive financial report for board presentation",
  outputInstruction: `Create professional report with:
    - Executive Summary
    - Key Performance Indicators  
    - Trend Analysis (visual + data)
    - Risk Assessment
    - Strategic Recommendations`,
  images: [
    { data: "/path/to/financial-charts.png", detail: "high" },
    { data: "/path/to/kpi-dashboard.jpg", detail: "high" }
  ]
});
```

### 3. Business Intelligence Analysis

Cross-reference multiple data sources for comprehensive insights:

```typescript
const insights = await agent.invoke({
  objective: "Analyze customer satisfaction trends using survey data and visual reports",
  outputInstruction: "Identify correlation patterns and actionable improvement strategies",
  images: [
    { data: "/path/to/satisfaction-trends.png", detail: "high" },
    { data: "/path/to/feedback-summary.jpg", detail: "auto" }
  ]
});
```

### 4. Quality Assurance

Compare visual reports with source data for accuracy verification:

```typescript
const qa = await agent.invoke({
  objective: "Perform quality assurance on our monthly KPI report",
  outputInstruction: "Verify data accuracy, identify inconsistencies, and suggest corrections",
  images: [
    { data: "/path/to/kpi-report.pdf", detail: "high" }
  ]
});
```

## 🔧 Technical Configuration

### Image Input Options

```typescript
interface ImageInput {
  data: string | Buffer;     // File path, base64, or Buffer
  mimeType?: string;         // 'image/jpeg', 'image/png', etc.
  detail?: 'auto' | 'low' | 'high'; // Processing detail level
}

// Examples:
const images = [
  { data: "/path/to/chart.png", detail: "high" },                    // File path
  { data: "data:image/jpeg;base64,/9j/4AAQ...", detail: "auto" },   // Data URL
  { data: "/9j/4AAQSkZJRgABAQEASABIAAD...", detail: "low" },       // Base64 string
  { data: Buffer.from(imageData), mimeType: "image/png" }           // Buffer
];
```

### File Reader Options

```typescript
interface FileReaderOptions {
  maxRows?: number;      // Max rows to read (default: 1000)
  includeHeaders?: boolean; // Include headers (default: true)
  sheetName?: string;    // Excel sheet name (default: first sheet)
}

// Examples:
await fileReaderToolDef.invoke({
  filePath: '/path/to/data.xlsx',
  options: {
    maxRows: 500,
    sheetName: 'Q3_Sales',
    includeHeaders: true
  }
});
```

## 📈 Best Practices

### Image Quality & Detail Levels

- **High Detail** (`'high'`): Use for charts, dashboards, detailed graphs
- **Auto Detail** (`'auto'`): Balanced processing for general images  
- **Low Detail** (`'low'`): Quick processing for simple recognition

### File Size Optimization

- **Images**: Max 20MB recommended, optimize resolution for analysis needs
- **Data Files**: 10MB limit, use `maxRows` to control data volume
- **Multiple Files**: Process in batches for large datasets

### Model Selection

```typescript
// Recommended models for multimodal analysis:
.init({
  selectedProvider: 'gemini',
  model: 'gemini-2.5-flash'  // Excellent vision + fast processing
})

// Alternative:
.init({
  selectedProvider: 'openai', 
  model: 'gpt-4o-mini'       // Good vision + cost-effective
})
```

### Error Handling

```typescript
try {
  const result = await agent.invoke({
    objective: "Analyze financial data and charts",
    images: [{ data: "/path/to/chart.png", detail: "high" }]
  });
} catch (error) {
  if (error.message.includes('file not found')) {
    console.log('Check file paths and permissions');
  } else if (error.message.includes('API')) {
    console.log('Verify API keys and model availability');
  }
}
```

## 🔍 Troubleshooting

### Common Issues

1. **File Not Found**: Verify file paths are absolute and files exist
2. **Image Format**: Ensure images are in supported formats (PNG, JPEG, etc.)
3. **API Limits**: Check model context limits for large files
4. **Memory Usage**: Use `maxRows` to limit data processing for large files

### Debug Tips

```typescript
// Enable detailed logging
const agent = new ReactAgentBuilder({
  // ... config
  enableToolSummary: true  // Get detailed tool execution summaries
})

// Check file accessibility
const testData = await fileReaderToolDef.invoke({
  filePath: '/path/to/test.csv',
  options: { maxRows: 5 }
});
console.log('File accessible:', testData);
```

## 📚 Complete Example

See `/example/multimodalAnalysisExample.ts` for comprehensive examples including:
- Dashboard analysis with data validation
- Financial report generation
- Employee performance analysis  
- Direct tool usage patterns

```bash
# Run the complete example
npx tsx example/multimodalAnalysisExample.ts
```

## 🎉 Summary

The DelReact multimodal analysis capabilities enable powerful workflows that combine the precision of structured data with the insights from visual content. This approach is perfect for:

- **Business Intelligence**: Comprehensive analysis across data sources
- **Quality Assurance**: Validation of reports and dashboards
- **Executive Reporting**: Professional insights with visual and quantitative backing
- **Decision Support**: Data-driven recommendations with visual context

By leveraging both Excel/CSV processing and image analysis in a single workflow, you can create sophisticated AI-powered business intelligence solutions that provide both depth and breadth of analysis.