/**
 * Comprehensive Real-World Multimodal Examples
 * 
 * This file demonstrates the power of DelReact's unified file interface
 * through practical, real-world use cases that combine visual and structured data.
 */

import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder, FileInput } from "../core";
import * as path from "path";

const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;

/**
 * Comprehensive multimodal analysis combining all file types
 */
async function runComprehensiveAnalysis() {
  console.log("🎯 Comprehensive Multimodal Analysis");
  console.log("=" .repeat(70));
  console.log("Demonstrating unified interface with multiple files and data types");

  if (!GEMINI_KEY && !OPENAI_KEY) {
    console.log("⚠️ Set GEMINI_KEY or OPENAI_KEY to run this example");
    return;
  }

  const agent = new ReactAgentBuilder({
    geminiKey: GEMINI_KEY,
    openaiKey: OPENAI_KEY,
    useEnhancedPrompt: true,
    memory: "in-memory"
  })
  .on('taskReplan', (message) => {
    console.log("📝 Agent Log:", message);
  })
  .init({
    selectedProvider: GEMINI_KEY ? 'gemini' : 'openai',
    model: GEMINI_KEY ? 'gemini-2.5-flash' : 'gpt-4o'
  })
  .build();

  try {
    // Comprehensive files array showcasing all capabilities
    const files: FileInput[] = [
      // Business dashboard image
      {
        type: 'image',
        data: generateComprehensiveDashboard(),
        detail: 'high',
        mimeType: 'image/png'
      },
      // Employee data
      {
        type: 'document',
        data: path.join(process.cwd(), 'example', 'sample-data', 'employees.csv'),
        options: {
          maxRows: 50,
          includeHeaders: true
        }
      },
      // Financial performance data
      {
        type: 'document',
        data: path.join(process.cwd(), 'example', 'sample-data', 'financial-data.csv'),
        options: {
          maxRows: 12,
          includeHeaders: true
        }
      },
      // Market analysis from Excel
      {
        type: 'document',
        data: path.join(process.cwd(), 'example', 'sample-data', 'company-data.xlsx'),
        options: {
          maxRows: 100,
          sheetName: 'Sales_Data',
          includeHeaders: true
        }
      }
    ];

    console.log("\n📊 Comprehensive Data Sources:");
    console.log("• Executive dashboard visualization (PNG)");
    console.log("• Employee performance data (CSV)");
    console.log("• Financial metrics (CSV)");
    console.log("• Market analysis data (Excel)");
    console.log(`\nTotal files: ${files.length}`);

    const result = await agent.invoke({
      objective: "Provide comprehensive business analysis across all departments and data sources",
      outputInstruction: `As Chief Data Officer, create a comprehensive report that:
        
        ## Executive Dashboard Analysis
        - Interpret the visual dashboard and key metrics shown
        - Identify trends and patterns from the visualization
        
        ## Human Resources Insights  
        - Employee performance and department distribution
        - Workforce productivity analysis
        
        ## Financial Performance Review
        - Revenue, expense, and profit trend analysis
        - Monthly financial health assessment
        
        ## Market Position Analysis
        - Sales performance across different segments
        - Competitive positioning insights
        
        ## Strategic Synthesis
        - Cross-departmental correlations and insights
        - Data-driven strategic recommendations
        
        ## Action Plan
        - Immediate priorities based on data analysis
        - Long-term strategic initiatives
        
        Format as an executive presentation with clear, actionable insights.`,
      files: files
    });

    console.log("\n✅ Comprehensive analysis completed!");
    console.log(`📋 Session ID: ${result.sessionId}`);
    console.log("\n🎯 Comprehensive Business Analysis:");
    console.log(result.conclusion);

    return result;

  } catch (error: any) {
    console.error("❌ Comprehensive analysis failed:", error.message);
    throw error;
  }
}

function generateComprehensiveDashboard(): string {
  // Mock dashboard image for demonstration
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
}

/**
 * Showcase the unified interface benefits
 */
function showcaseUnifiedInterface() {
  console.log("\n💡 Unified File Interface Benefits");
  console.log("=" .repeat(70));
  
  console.log(`
🚀 **What Makes This Powerful:**

1. **Single API for All Data Types**
   - Images, CSV files, Excel spreadsheets all handled uniformly
   - No need for separate tools or processing steps
   - Type-safe discrimination prevents errors

2. **Real-World Professional Workflows**
   - Financial dashboard validation
   - Insurance claims processing  
   - Medical report analysis
   - Business intelligence reporting
   - Quality control analysis

3. **Enterprise-Grade Features**
   - Professional output formatting
   - Executive-ready reports
   - Industry-specific analysis
   - Comprehensive data integration

4. **Developer Experience**
   - Clean, intuitive API design
   - TypeScript type safety
   - Automatic file processing
   - No manual tool configuration

🔧 **Simple Yet Powerful Interface:**
\`\`\`typescript
const files: FileInput[] = [
  { type: 'image', data: "dashboard.png", detail: "high" },
  { type: 'document', data: "sales.xlsx", options: { sheetName: 'Q4' } },
  { type: 'document', data: "employees.csv", options: { maxRows: 100 } }
];

await agent.invoke({
  objective: "Analyze company performance",
  files: files
});
\`\`\`

🎯 **Key Industries Served:**
• Financial Services (dashboard validation, risk analysis)
• Healthcare (medical imaging + patient data)  
• Insurance (claims photos + damage assessments)
• Real Estate (property photos + market data)
• Manufacturing (product images + quality data)
• Retail (sales charts + inventory data)
  `);
}

/**
 * Main demonstration function
 */
async function demonstrateMultimodalCapabilities() {
  console.log("🚀 DelReact Multimodal Analysis Showcase");
  console.log("Unified File Interface for Professional Workflows");
  console.log("=" .repeat(80));

  console.log("\nThis demonstration shows how DelReact's unified file interface");
  console.log("enables powerful multimodal analysis for real-world business scenarios.");

  showcaseUnifiedInterface();

  try {
    console.log("\n📋 Running Example Categories:"); 
    console.log("1. Comprehensive Multi-Source Analysis");

    // Run all example categories
    await runComprehensiveAnalysis();

    console.log("\n🎉 All Multimodal Examples Completed Successfully!");
    console.log("\n🏆 Capabilities Demonstrated:");
    console.log("• ✅ Unified API for images and documents");
    console.log("• ✅ Professional workflow automation");
    console.log("• ✅ Industry-specific analysis patterns");
    console.log("• ✅ Executive-ready reporting");
    console.log("• ✅ Type-safe file processing");
    console.log("• ✅ Comprehensive data integration");

  } catch (error: any) {
    console.error("❌ Demonstration failed:", error.message);
    process.exit(1);
  }
}

/**
 * Quick demo for testing purposes
 */
async function quickDemo() {
  console.log("⚡ Quick Multimodal Demo");
  console.log("=" .repeat(40));

  if (!GEMINI_KEY && !OPENAI_KEY) {
    console.log("⚠️ Set GEMINI_KEY or OPENAI_KEY to run demo");
    return;
  }

  const agent = new ReactAgentBuilder({
    geminiKey: GEMINI_KEY,
    openaiKey: OPENAI_KEY,
    useEnhancedPrompt: true
  })
  .on('taskReplan', (message) => {
    console.log("📝 Agent Log:", message);
  })
  .init({
    selectedProvider: GEMINI_KEY ? 'gemini' : 'openai',
    model: GEMINI_KEY ? 'gemini-2.5-flash' : 'gpt-4o-mini'
  })
  .build();

  try {
    const files: FileInput[] = [
      {
        type: 'image',
        data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
        detail: 'high'
      },
      {
        type: 'document',
        data: path.join(process.cwd(), 'example', 'sample-data', 'employees.csv'),
        options: { maxRows: 5 }
      }
    ];

    const result = await agent.invoke({
      objective: "Analyze the provided files and summarize key insights",
      files: files
    });

    console.log("✅ Quick demo completed!");
    console.log(`Summary: ${result.conclusion}`);

  } catch (error: any) {
    console.error("❌ Quick demo failed:", error.message);
  }
}

// Export functions for external use
export {
  demonstrateMultimodalCapabilities,
  runComprehensiveAnalysis,
  quickDemo
};

// Run full demonstration if called directly
quickDemo().catch(console.error);
// demonstrateMultimodalCapabilities().catch(console.error);