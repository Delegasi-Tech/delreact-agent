/**
 * Real-World Example: Business Intelligence Dashboard
 * 
 * This example shows how to use the unified file interface for comprehensive
 * business intelligence analysis combining sales charts, performance data,
 * and market analysis.
 */

import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder, FileInput } from "../../core";
import * as path from "path";

const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;

/**
 * Executive Business Intelligence Analysis
 * 
 * Scenario: CEO needs comprehensive business review combining:
 * - Sales performance charts
 * - Employee productivity data  
 * - Market analysis spreadsheets
 */
async function generateExecutiveReport() {
  console.log("📊 Executive Business Intelligence Report");
  console.log("=" .repeat(60));
  console.log("Use Case: Quarterly business review for executive team");

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
  .init({
    selectedProvider: GEMINI_KEY ? 'gemini' : 'openai',
    model: GEMINI_KEY ? 'gemini-2.5-flash' : 'gpt-4o'
  })
  .build();

  try {
    const files: FileInput[] = [
      {
        type: 'image',
        data: generateMockBusinessChart(),
        detail: 'high',
        mimeType: 'image/png'
      },
      {
        type: 'document',
        data: path.join(process.cwd(), 'example', 'sample-data', 'employees.csv'),
        options: {
          maxRows: 100,
          includeHeaders: true
        }
      },
      {
        type: 'document',
        data: path.join(process.cwd(), 'example', 'sample-data', 'company-data.xlsx'),
        options: {
          maxRows: 50,
          sheetName: 'Sales_Data',
          includeHeaders: true
        }
      }
    ];

    console.log("\n📈 Business Intelligence Data:");
    console.log("• Q4 Performance Dashboard (chart image)");
    console.log("• Employee productivity data (CSV)");
    console.log("• Sales performance data (Excel)");

    const result = await agent.invoke({
      objective: "Create comprehensive executive business intelligence report analyzing performance across all departments",
      outputInstruction: `As a senior business analyst, create an executive report with:
        
        ## Executive Summary
        - Key performance highlights and concerns
        - Overall business health assessment
        
        ## Visual Analysis
        - Description of trends shown in performance charts
        - Key metrics and their implications
        
        ## Department Performance 
        - Employee productivity insights
        - Top performers and improvement areas
        
        ## Sales Analysis
        - Revenue trends and growth patterns
        - Market opportunities and challenges
        
        ## Strategic Recommendations
        - Immediate action items for leadership
        - Long-term strategic priorities
        
        Format for C-suite consumption with clear action items.`,
      files: files
    });

    console.log("\n✅ Executive report generated!");
    console.log(`📋 Session ID: ${result.sessionId}`);
    console.log("\n📊 Executive Business Intelligence Report:");
    console.log(result.conclusion);

  } catch (error: any) {
    console.error("❌ Executive report generation failed:", error.message);
  }
}

function generateMockBusinessChart(): string {
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
}

/**
 * Real Estate Market Analysis
 * 
 * Scenario: Real estate agent analyzing property listings with photos
 * and market data to provide client recommendations.
 */
async function analyzeRealEstateMarket() {
  console.log("\n🏘️ Real Estate Market Analysis");
  console.log("=" .repeat(60));
  console.log("Use Case: Property investment analysis for clients");

  if (!GEMINI_KEY && !OPENAI_KEY) {
    console.log("⚠️ Set API keys to run this example");
    return;
  }

  const agent = new ReactAgentBuilder({
    geminiKey: GEMINI_KEY,
    openaiKey: OPENAI_KEY,
    useEnhancedPrompt: true
  })
  .init({
    selectedProvider: GEMINI_KEY ? 'gemini' : 'openai',
    model: GEMINI_KEY ? 'gemini-2.5-flash' : 'gpt-4o'
  })
  .build();

  try {
    const files: FileInput[] = [
      {
        type: 'image',
        data: generateMockPropertyPhoto(),
        detail: 'high',
        mimeType: 'image/jpeg'
      },
      {
        type: 'document',
        data: path.join(process.cwd(), 'example', 'sample-data', 'market-data.csv'),
        options: {
          maxRows: 200,
          includeHeaders: true
        }
      }
    ];

    console.log("\n🏡 Property Analysis Data:");
    console.log("• Property photos and listings");
    console.log("• Local market data and comparables (CSV)");

    const result = await agent.invoke({
      objective: "Analyze property photos and market data to provide investment recommendation",
      outputInstruction: `As a real estate investment advisor, provide:
        
        ## Property Visual Assessment
        - Description of property condition and features
        - Curb appeal and maintenance observations
        
        ## Market Analysis
        - Comparable property prices in the area
        - Market trends and price movements
        
        ## Investment Evaluation
        - Estimated property value based on market data
        - Potential ROI and rental income projections
        
        ## Risk Assessment
        - Market volatility factors
        - Property-specific risks
        
        ## Recommendation
        - Buy/hold/pass recommendation with reasoning
        - Suggested negotiation strategy if applicable`,
      files: files
    });

    console.log("\n✅ Real estate analysis completed!");
    console.log("\n🏠 Investment Analysis Report:");
    console.log(result.conclusion);

  } catch (error: any) {
    console.error("❌ Real estate analysis failed:", error.message);
  }
}

function generateMockPropertyPhoto(): string {
  return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";
}

/**
 * Quality Control Analysis
 * 
 * Scenario: Manufacturing QC manager needs to analyze product images
 * along with inspection data to identify quality trends.
 */
async function performQualityControlAnalysis() {
  console.log("\n🔍 Manufacturing Quality Control");
  console.log("=" .repeat(60));
  console.log("Use Case: Product quality analysis and trend identification");

  if (!GEMINI_KEY && !OPENAI_KEY) {
    console.log("⚠️ Set API keys to run this example");
    return;
  }

  const agent = new ReactAgentBuilder({
    geminiKey: GEMINI_KEY,
    openaiKey: OPENAI_KEY,
    useEnhancedPrompt: true
  })
  .init({
    selectedProvider: GEMINI_KEY ? 'gemini' : 'openai',
    model: GEMINI_KEY ? 'gemini-2.5-flash' : 'gpt-4o'
  })
  .build();

  try {
    const files: FileInput[] = [
      {
        type: 'image',
        data: generateMockProductPhoto(),
        detail: 'high',
        mimeType: 'image/png'
      },
      {
        type: 'document',
        data: path.join(process.cwd(), 'example', 'sample-data', 'inspection-data.csv'),
        options: {
          maxRows: 1000, // Recent production runs
          includeHeaders: true
        }
      }
    ];

    console.log("\n🔧 Quality Control Data:");
    console.log("• Product images from production line");
    console.log("• Quality inspection measurements (CSV)");

    const result = await agent.invoke({
      objective: "Analyze product images and inspection data to identify quality issues and trends",
      outputInstruction: `As a quality control manager, provide:
        
        ## Visual Inspection Results
        - Product appearance and finish quality
        - Visible defects or anomalies
        - Compliance with visual standards
        
        ## Statistical Analysis
        - Quality metrics trends from inspection data
        - Defect rates and patterns
        - Process variation indicators
        
        ## Root Cause Analysis
        - Correlation between visual and measured defects
        - Potential causes of quality issues
        
        ## Corrective Actions
        - Immediate production adjustments needed
        - Long-term process improvements
        
        ## Quality Recommendations
        - Updated inspection criteria
        - Training needs for production staff`,
      files: files
    });

    console.log("\n✅ Quality control analysis completed!");
    console.log("\n🔧 Quality Control Report:");
    console.log(result.conclusion);

  } catch (error: any) {
    console.error("❌ Quality control analysis failed:", error.message);
  }
}

function generateMockProductPhoto(): string {
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA/jBWgAAAABJRU5ErkJggg==";
}

/**
 * Main execution function for business intelligence examples
 */
async function runBusinessIntelligenceExamples() {
  console.log("🚀 Business Intelligence Multimodal Examples");
  console.log("Powered by DelReact's Unified File Interface");
  console.log("=" .repeat(70));

  console.log("\nDemonstrating professional workflows that combine:");
  console.log("• Visual data (charts, photos, dashboards)");
  console.log("• Structured data (CSV files, Excel spreadsheets)");
  console.log("• AI-powered analysis and insights");
  console.log("• Executive-ready reporting");

  try {
    await generateExecutiveReport();
    await analyzeRealEstateMarket();
    await performQualityControlAnalysis();

    console.log("\n🎯 Business Intelligence Examples Completed!");
    console.log("\n💼 Enterprise Benefits Demonstrated:");
    console.log("• Unified analysis of visual and structured data");
    console.log("• Executive-level reporting and insights");
    console.log("• Industry-specific workflow automation");
    console.log("• Type-safe API prevents data processing errors");

  } catch (error: any) {
    console.error("❌ Business intelligence examples failed:", error.message);
  }
}

// Export for use in other examples
export {
  generateExecutiveReport,
  analyzeRealEstateMarket,
  performQualityControlAnalysis,
  runBusinessIntelligenceExamples
};

// Run if called directly
if (require.main === module) {
  runBusinessIntelligenceExamples().catch(console.error);
}