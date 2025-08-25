# Real-World Multimodal Examples

This directory contains comprehensive examples demonstrating the power of DelReact's unified file interface for professional multimodal workflows that combine visual and structured data analysis.

## 🚀 Featured Examples

### 1. Financial Analysis (`cases/multimodal-financial-analysis.ts`)

**Real-world scenarios:**
- **Financial Dashboard Validation**: CFO validation of Q4 reports by comparing charts with Excel data
- **Insurance Claims Processing**: Auto insurance claim validation with damage photos and repair estimates
- **Medical Report Analysis**: Comprehensive patient analysis combining medical images and vital signs data

**Industries served:**
- Financial Services & Banking
- Insurance Companies  
- Healthcare Systems

### 2. Business Intelligence (`cases/multimodal-business-intelligence.ts`)

**Real-world scenarios:**
- **Executive Business Reports**: Quarterly business review combining performance charts and employee data
- **Real Estate Market Analysis**: Property investment analysis with photos and market comparables
- **Quality Control Analysis**: Manufacturing QC with product images and inspection measurements

**Industries served:**
- Corporate Management
- Real Estate
- Manufacturing & Quality Control

### 3. Comprehensive Showcase (`multimodal-showcase.ts`)

**Features:**
- **Multi-source Analysis**: Combining 4+ different data sources (images, CSV, Excel)
- **Executive Reporting**: C-suite ready analysis and recommendations
- **Industry Demonstrations**: Examples across 6+ professional verticals

## 🎯 Unified File Interface Benefits

### Clean, Semantic API
```typescript
const files: FileInput[] = [
  { type: 'image', data: "dashboard.png", detail: "high" },
  { type: 'document', data: "sales.xlsx", options: { maxRows: 100 } },
  { type: 'document', data: "employees.csv" }
];

await agent.invoke({
  objective: "Analyze business performance across all departments",
  files: files
});
```

### Professional Capabilities
- **Type Safety**: TypeScript discriminated unions prevent runtime errors
- **Automatic Processing**: No manual tool configuration required
- **Performance Optimized**: Built-in limits for production use
- **Industry-Specific**: Ready-made workflows for common business scenarios

## 📁 Sample Data Files

All examples use realistic sample data included in the `sample-data/` directory:

- `financial-data.csv` - Monthly revenue, expenses, and profit data
- `repair-estimates.csv` - Auto insurance repair cost estimates  
- `patient-vitals.csv` - Medical patient vital signs history
- `market-data.csv` - Real estate market comparables
- `inspection-data.csv` - Manufacturing quality control measurements
- `employees.csv` - Employee performance and department data
- `company-data.xlsx` - Multi-sheet business data

## 🚀 Quick Start

### 1. Run Individual Examples

```bash
# Financial analysis examples
npx tsx example/cases/multimodal-financial-analysis.ts

# Business intelligence examples  
npx tsx example/cases/multimodal-business-intelligence.ts

# Quick demo (requires API keys)
npx tsx example/multimodal-showcase.ts --quick
```

### 2. Full Demonstration

```bash
# Complete showcase of all capabilities
npx tsx example/multimodal-showcase.ts
```

### 3. Test Interface Only

```bash
# Test unified interface without API calls
npx tsx example/testUnifiedFileInterface.ts
```

## 🔧 Setup Requirements

### API Keys (choose one)
```bash
export GEMINI_KEY="your_gemini_key"        # Recommended
export OPENAI_KEY="your_openai_key"        # Alternative
export OPENROUTER_KEY="your_openrouter_key" # Alternative
```

### Dependencies
All dependencies are included in the main project. No additional setup required.

## 🎯 Real-World Use Cases

### Financial Services
- **Dashboard Validation**: Compare financial charts with underlying Excel data
- **Risk Assessment**: Analyze loan applications with documents and verification photos
- **Audit Support**: Cross-reference visual reports with raw transaction data

### Healthcare
- **Medical Imaging**: Analyze X-rays, MRIs with patient history and vital signs
- **Clinical Research**: Combine visual observations with quantitative measurements  
- **Patient Monitoring**: Track visual symptoms alongside vital sign trends

### Insurance
- **Claims Processing**: Vehicle damage photos with repair cost estimates
- **Property Assessment**: Building photos with market valuation data
- **Fraud Detection**: Visual evidence correlation with claim documentation

### Real Estate
- **Investment Analysis**: Property photos with market comparable data
- **Portfolio Management**: Multiple properties with performance metrics
- **Market Research**: Visual property conditions with pricing trends

### Manufacturing
- **Quality Control**: Product images with measurement and inspection data
- **Process Optimization**: Visual equipment status with performance metrics
- **Compliance Reporting**: Product photos with certification documentation

### Business Intelligence
- **Executive Reporting**: Dashboard charts with underlying KPI data
- **Performance Analysis**: Employee photos with productivity metrics
- **Market Analysis**: Competitor visual content with market share data

## 💡 Best Practices

### File Organization
- **Group related files** in the same workflow for better context
- **Use descriptive objectives** that reference both visual and data elements
- **Specify processing options** for large datasets (maxRows, sheetName)

### Performance Optimization
- **Set maxRows limits** for large Excel/CSV files (default: 1000)
- **Use appropriate image detail levels** ('high' for charts, 'auto' for photos)
- **Monitor file sizes** (10MB limit for documents)

### Error Handling
- **Files are processed individually** - invalid files are skipped with warnings
- **Check file existence** before processing
- **Use try-catch blocks** for production workflows

## 🔗 Related Documentation

- [Unified File Interface Guide](../docs/Unified-File-Interface-Guide.md) - Complete API reference
- [ReactAgentBuilder Guide](../docs/contents/ReactAgentBuilder-Guide.md) - Core framework documentation
- [Quick Reference](../docs/contents/ReactAgentBuilder-Quick-Reference.md) - Fast implementation guide

## 🆘 Support

### Common Issues
- **"No API key found"**: Set at least one API key (GEMINI_KEY, OPENAI_KEY, or OPENROUTER_KEY)
- **"File not found"**: Check file paths in sample-data directory
- **"Build errors"**: Run `npm install` and `npm run build`

### Getting Help
- Check the main [README](../README.md) for installation instructions
- Review the [Contributing Guide](../CONTRIBUTING.md) for development setup
- Open an issue on GitHub for bugs or feature requests

---

## 🎉 Ready for Production

These examples demonstrate production-ready patterns for:
- Enterprise multimodal workflows
- Professional reporting and analysis
- Industry-specific use cases
- Type-safe file processing
- Scalable architecture patterns

Start with the quick demo and expand to your specific industry needs!