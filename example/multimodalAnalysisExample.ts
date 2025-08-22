/**
 * Multimodal Analysis Example - Excel/CSV + Images
 * 
 * This example demonstrates how to use both Excel/CSV file reading and image analysis
 * together in a single agent workflow for comprehensive business intelligence.
 */

import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder } from "../core";
import { fileReaderToolDef } from "../core/tools/fileReader";
import * as path from "path";

const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;

/**
 * Example 1: Dashboard Analysis with Supporting Data - Using New Files Interface
 * Analyze a dashboard image along with the underlying Excel/CSV data
 */
async function dashboardAnalysisExample() {
  console.log("📊 Example 1: Dashboard Analysis (New Files Interface)");
  console.log("=" .repeat(60));

  const agent = new ReactAgentBuilder({
    geminiKey: GEMINI_KEY,
    openaiKey: OPENAI_KEY,
    anthropicKey: ANTHROPIC_KEY,
    useEnhancedPrompt: true,
    memory: "in-memory"
  })
  .init({
    selectedProvider: 'gemini', // Gemini has excellent vision capabilities
    model: 'gemini-2.5-flash'
  })
  .build();

  try {
    const result = await agent.invoke({
      objective: "Analyze this sales dashboard and validate against the underlying sales data",
      outputInstruction: `Provide a comprehensive analysis including:
        1. Visual analysis of the dashboard image
        2. Data validation using the CSV file
        3. Trend analysis and insights
        4. Discrepancies (if any) between visual and data
        5. Actionable business recommendations`,
      files: [
        // Dashboard image
        {
          type: 'image',
          data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
          detail: 'high',
          mimeType: 'image/png'
        },
        // Sales data file
        {
          type: 'document',
          data: path.join(process.cwd(), 'example', 'sample-data', 'company-data.xlsx'),
          options: {
            maxRows: 100,
            sheetName: 'Sales'
          }
        }
      ]
    });

    console.log("\n✅ Dashboard Analysis Completed (New Interface)");
    console.log(`📄 Session ID: ${result.sessionId}`);
    console.log(`📊 Analysis: ${result.conclusion}`);
    console.log(`🔄 Tasks executed: ${result.fullState.actionedTasks.length}`);

  } catch (error: any) {
    console.error("❌ Dashboard analysis failed:", error.message);
  }
}

/**
 * Example 2: Financial Report Generation - Using New Files Interface
 * Process multiple data sources (Excel + images) to create comprehensive reports
 */
async function financialReportExample() {
  console.log("\n💰 Example 2: Financial Report Generation (New Interface)");
  console.log("=" .repeat(60));

  const agent = new ReactAgentBuilder({
    geminiKey: GEMINI_KEY,
    openaiKey: OPENAI_KEY,
    anthropicKey: ANTHROPIC_KEY,
    useEnhancedPrompt: true,
    enableToolSummary: true
  })
  .init({
    selectedProvider: 'gemini',
    model: 'gemini-2.5-flash'
  })
  .build();

  try {
    const result = await agent.invoke({
      objective: "Create a comprehensive financial report using company data and chart images",
      outputInstruction: `Generate an executive financial report with:
        1. Executive Summary
        2. Key Financial Metrics (from Excel data)
        3. Visual Trend Analysis (from chart images)
        4. Performance Highlights
        5. Risk Assessment
        6. Strategic Recommendations
        Format as a professional business report.`,
      files: [
        // Quarterly performance chart
        {
          type: 'image',
          data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
          detail: 'high'
        },
        // Revenue breakdown pie chart
        {
          type: 'image',
          data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
          detail: 'high'
        },
        // Company financial data
        {
          type: 'document',
          data: path.join(process.cwd(), 'example', 'sample-data', 'company-data.xlsx'),
          options: {
            maxRows: 200,
            sheetName: 'Financial'
          }
        }
      ]
    });

    console.log("\n✅ Financial Report Generated (New Interface)");
    console.log(`📄 Report Preview: ${result.conclusion.substring(0, 200)}...`);

  } catch (error: any) {
    console.error("❌ Financial report generation failed:", error.message);
  }
}

/**
 * Example 3: Employee Performance Analysis
 * Combine HR data (CSV) with organizational charts/photos for comprehensive analysis
 */
async function employeeAnalysisExample() {
  console.log("\n👥 Example 3: Employee Performance Analysis");
  console.log("=" .repeat(60));

  const agent = new ReactAgentBuilder({
    geminiKey: GEMINI_KEY,
    openaiKey: OPENAI_KEY,
    useEnhancedPrompt: true
  })
  .addTool([fileReaderToolDef])
  .init({
    selectedProvider: 'gemini',
    model: 'gemini-2.5-flash'
  })
  .build();

  try {
    const result = await agent.invoke({
      objective: "Analyze employee performance using HR data and organizational structure images",
      outputInstruction: `Provide HR insights including:
        1. Department performance analysis
        2. Salary distribution insights
        3. Organizational structure assessment
        4. Team composition analysis
        5. Recommendations for HR strategy`,
      images: [
        {
          // Example: Organizational chart
          data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
          detail: 'high'
        }
      ]
      // Agent will automatically read employees.csv for data analysis
    });

    console.log("\n✅ Employee Analysis Completed");
    console.log(`👥 HR Insights: ${result.conclusion.substring(0, 200)}...`);

  } catch (error: any) {
    console.error("❌ Employee analysis failed:", error.message);
  }
}

/**
 * Example 4: Direct Multimodal Tool Usage
 * Show how to use file reader and images directly without full agent workflow
 */
async function directMultimodalExample() {
  console.log("\n🛠️ Example 4: Direct Multimodal Tool Usage");
  console.log("=" .repeat(60));

  const agentBuilder = new ReactAgentBuilder({
    geminiKey: GEMINI_KEY,
    openaiKey: OPENAI_KEY
  });

  try {
    // Step 1: Read data file directly
    console.log("📊 Step 1: Reading CSV data...");
    const employeeData = await fileReaderToolDef.invoke({
      filePath: path.join(process.cwd(), 'example', 'sample-data', 'employees.csv'),
      options: {
        maxRows: 10,
        includeHeaders: true
      }
    });
    
    console.log("Employee data preview:");
    console.log(JSON.stringify(employeeData, null, 2));

    // Step 2: Direct LLM call with both data and images
    console.log("\n🤖 Step 2: Combined analysis with LLM...");
    
    const analysisPrompt = `
    Based on the following employee data and the organizational chart image:
    
    Employee Data:
    ${JSON.stringify(employeeData, null, 2)}
    
    Please provide:
    1. Summary of employee distribution
    2. Analysis of the organizational structure from the image
    3. Recommendations for improvement
    `;

    const result = await agentBuilder.callLLM(analysisPrompt, {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      images: [
        {
          data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
          detail: 'high'
        }
      ]
    });

    console.log("Direct analysis result:");
    console.log(result.substring(0, 300) + "...");

  } catch (error: any) {
    console.error("❌ Direct multimodal example failed:", error.message);
  }
}

/**
 * Usage patterns and best practices
 */
function showMultimodalUsagePatterns() {
  console.log("\n📚 Multimodal Usage Patterns & Best Practices");
  console.log("=" .repeat(60));
  
  console.log(`
🆕 **NEW: Unified Files Interface (Recommended)**
const result = await agent.invoke({
  objective: "Analyze sales data and dashboard",
  files: [
    { type: 'image', data: "/path/to/dashboard.png", detail: "high" },
    { type: 'document', data: "/path/to/sales.xlsx", options: { maxRows: 100 } }
  ]
});

🔄 **Legacy: Separate Images + Tools (Still Supported)**
const agent = new ReactAgentBuilder(config)
  .addTool([fileReaderToolDef])
  .init({ selectedProvider: 'gemini' })
  .build();
  
await agent.invoke({
  objective: "Validate chart data against source files",
  images: [{ data: "/path/to/chart.png", detail: "high" }]
  // File reading happens automatically via tool calls
});

📊 **Mixed Analysis Examples**
// Images + Documents together
await agent.invoke({
  objective: "Comprehensive business intelligence report",
  files: [
    { type: 'image', data: "/path/to/kpi-dashboard.png", detail: "high" },
    { type: 'image', data: "/path/to/sales-chart.png", detail: "high" },
    { type: 'document', data: "/path/to/q3-sales.xlsx", options: { sheetName: 'Summary' } },
    { type: 'document', data: "/path/to/employee-data.csv", options: { maxRows: 500 } }
  ]
});

// Documents only
await agent.invoke({
  objective: "Analyze employee performance trends",
  files: [
    { type: 'document', data: "/path/to/employees.csv" },
    { type: 'document', data: "/path/to/performance.xlsx", options: { sheetName: 'Q3' } }
  ]
});

// Images only (same as before)
await agent.invoke({
  objective: "Analyze visual dashboard elements",
  files: [
    { type: 'image', data: "/path/to/dashboard.png", detail: "high" }
  ]
});

🛠️ **Direct Tool + LLM (Advanced)**
const data = await processDocumentFile({
  type: 'document',
  data: '/path/to/data.xlsx',
  options: { maxRows: 100, sheetName: 'Sales' }
});

const analysis = await agentBuilder.callLLM(prompt, {
  provider: 'gemini',
  images: [{ url: "data:image/png;base64,...", detail: "high" }]
});

💡 **Best Practices:**
• Use unified 'files' array for cleaner, more semantic code
• Combine related data files and images in single workflow
• Use 'high' detail for charts and dashboards
• Specify sheet names for Excel files with multiple sheets
• Set appropriate maxRows for large datasets (default: 1000)
• Let agents orchestrate processing automatically
• Use vision-capable models (Gemini 2.5 Flash, GPT-4o)
• Structure objectives clearly for better results
• Leverage memory for multi-turn analysis sessions

🎯 **Common Use Cases:**
• Financial report validation (Excel + charts)
• Dashboard analysis with underlying data
• Document processing (images + extracted data)
• Business intelligence (multiple data sources)
• Quality assurance (visual + quantitative validation)
• HR analytics (employee data + organizational charts)
• Market research (survey data + visualization images)

🔧 **Interface Benefits:**
• Type-safe with TypeScript discriminated unions
• Automatic file processing (no manual tool configuration)
• Better semantic meaning: files vs. separate images/tools
• Backward compatibility maintained
• Cleaner, more intuitive developer experience
  `);
}
}

/**
 * Main execution function
 */
async function runMultimodalExamples() {
  console.log("🚀 DelReact Multimodal Analysis Examples");
  console.log("Combining Excel/CSV file reading with image analysis");
  console.log("=" .repeat(70));

  // Show usage patterns first
  showMultimodalUsagePatterns();

  // Check for API keys
  if (!GEMINI_KEY && !OPENAI_KEY && !ANTHROPIC_KEY) {
    console.log("\n⚠️ No API keys found. Please set at least one of:");
    console.log("• GEMINI_KEY=your_gemini_api_key");
    console.log("• OPENAI_KEY=your_openai_api_key");
    console.log("• ANTHROPIC_KEY=your_anthropic_api_key");
    return;
  }

  try {
    // Run examples
    await dashboardAnalysisExample();
    await financialReportExample();
    await employeeAnalysisExample();
    await directMultimodalExample();

    console.log("\n🎉 All multimodal examples completed successfully!");
    
  } catch (error: any) {
    console.error("❌ Example execution failed:", error.message);
    
    if (error.message.includes("API")) {
      console.log("\n💡 Note: Ensure your API keys are valid and have sufficient credits.");
    }
  }
}

// Export for use in other modules
export {
  dashboardAnalysisExample,
  financialReportExample,
  employeeAnalysisExample,
  directMultimodalExample
};

// Run if called directly
if (require.main === module) {
  runMultimodalExamples().catch(console.error);
}