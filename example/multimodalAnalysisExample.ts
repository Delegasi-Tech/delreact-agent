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
 * Example 1: Dashboard Analysis with Supporting Data
 * Analyze a dashboard image along with the underlying Excel/CSV data
 */
async function dashboardAnalysisExample() {
  console.log("📊 Example 1: Dashboard Analysis with Supporting Data");
  console.log("=" .repeat(60));

  const agent = new ReactAgentBuilder({
    geminiKey: GEMINI_KEY,
    openaiKey: OPENAI_KEY,
    anthropicKey: ANTHROPIC_KEY,
    useEnhancedPrompt: true,
    memory: "in-memory"
  })
  .addTool([fileReaderToolDef]) // Add file reader tool
  .init({
    selectedProvider: 'gemini', // Gemini has excellent vision capabilities
    model: 'gemini-2.5-flash'
  })
  .build();

  try {
    const result = await agent.invoke({
      objective: "Analyze this sales dashboard image and validate the trends with the underlying sales data from the CSV file",
      outputInstruction: `Provide a comprehensive analysis including:
        1. Visual analysis of the dashboard image
        2. Data validation using the CSV file
        3. Trend analysis and insights
        4. Discrepancies (if any) between visual and data
        5. Actionable business recommendations`,
      images: [
        {
          // In real usage, this would be an actual dashboard screenshot
          data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
          detail: 'high',
          mimeType: 'image/png'
        }
      ]
      // Note: The agent will automatically use the file reader tool to access sales-data.csv
    });

    console.log("\n✅ Dashboard Analysis Completed");
    console.log(`📄 Session ID: ${result.sessionId}`);
    console.log(`📊 Analysis: ${result.conclusion}`);
    console.log(`🔄 Tasks executed: ${result.fullState.actionedTasks.length}`);

  } catch (error: any) {
    console.error("❌ Dashboard analysis failed:", error.message);
  }
}

/**
 * Example 2: Financial Report Generation
 * Process multiple data sources (Excel + images) to create comprehensive reports
 */
async function financialReportExample() {
  console.log("\n💰 Example 2: Financial Report Generation");
  console.log("=" .repeat(60));

  const agent = new ReactAgentBuilder({
    geminiKey: GEMINI_KEY,
    openaiKey: OPENAI_KEY,
    anthropicKey: ANTHROPIC_KEY,
    useEnhancedPrompt: true,
    enableToolSummary: true
  })
  .addTool([fileReaderToolDef])
  .init({
    selectedProvider: 'gemini',
    model: 'gemini-2.5-flash'
  })
  .build();

  try {
    const result = await agent.invoke({
      objective: "Create a comprehensive financial report using the company Excel data and chart images",
      outputInstruction: `Generate an executive financial report with:
        1. Executive Summary
        2. Key Financial Metrics (from Excel data)
        3. Visual Trend Analysis (from chart images)
        4. Performance Highlights
        5. Risk Assessment
        6. Strategic Recommendations
        Format as a professional business report.`,
      images: [
        {
          // Example: Quarterly performance chart
          data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
          detail: 'high'
        },
        {
          // Example: Revenue breakdown pie chart
          data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
          detail: 'high'
        }
      ]
      // Agent will read company-data.xlsx automatically when needed
    });

    console.log("\n✅ Financial Report Generated");
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
🔄 **Pattern 1: Agent Workflow (Recommended)**
const result = await agent.invoke({
  objective: "Analyze sales data and dashboard",
  images: [{ data: "/path/to/dashboard.png", detail: "high" }]
  // Agent automatically uses file reader tool for data files
});

📊 **Pattern 2: Mixed Analysis**
const agent = new ReactAgentBuilder(config)
  .addTool([fileReaderToolDef])
  .init({ selectedProvider: 'gemini' })
  .build();
  
await agent.invoke({
  objective: "Validate chart data against source files",
  images: [chartImage],
  // File reading happens automatically via tool calls
});

🛠️ **Pattern 3: Direct Tool + LLM**
const data = await fileReaderToolDef.invoke({
  filePath: '/path/to/data.xlsx',
  options: { maxRows: 100, sheetName: 'Sales' }
});

const analysis = await agentBuilder.callLLM(prompt, {
  provider: 'gemini',
  images: [dashboardImage]
});

💡 **Best Practices:**
• Use 'high' detail for charts and dashboards
• Combine related data files and images in single workflow
• Let agents orchestrate tool usage automatically
• Use vision-capable models (Gemini 2.5 Flash, GPT-4o)
• Structure objectives clearly for better results
• Leverage memory for multi-turn analysis sessions

🎯 **Common Use Cases:**
• Financial report validation (Excel + charts)
• Dashboard analysis with underlying data
• Document processing (images + extracted data)
• Business intelligence (multiple data sources)
• Quality assurance (visual + quantitative validation)
  `);
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