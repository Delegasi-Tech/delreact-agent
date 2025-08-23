/**
 * Real-World Example: Financial Dashboard Validation
 * 
 * This example demonstrates using the unified file interface to validate
 * financial dashboards by comparing visual charts with underlying Excel data.
 * Perfect for CFOs, financial analysts, and auditors.
 */

import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder, FileInput } from "../../core";
import * as path from "path";

const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;

/**
 * Financial Dashboard Validation Use Case
 * 
 * Scenario: A CFO receives a financial dashboard with revenue charts but wants to
 * verify the accuracy against the underlying Excel data. The AI agent analyzes both
 * the visual representation and raw data to identify discrepancies.
 */
async function validateFinancialDashboard() {
  console.log("💰 Financial Dashboard Validation");
  console.log("=" .repeat(60));
  console.log("Use Case: CFO validation of Q4 financial dashboard");

  if (!GEMINI_KEY && !OPENAI_KEY) {
    console.log("⚠️ Set GEMINI_KEY or OPENAI_KEY to run this example");
    return;
  }

  // Create financial analysis agent
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
    // Financial dashboard files - chart image + Excel data
    const files: FileInput[] = [
      {
        type: 'image',
        data: generateMockFinancialChart(),
        detail: 'high',
        mimeType: 'image/png'
      },
      {
        type: 'document', 
        data: path.join(process.cwd(), 'example', 'sample-data', 'financial-data.csv'),
        options: {
          maxRows: 12, // Monthly data for the year
          includeHeaders: true
        }
      }
    ];

    console.log("\n📊 Files being analyzed:");
    console.log("• Financial dashboard chart (PNG image)");
    console.log("• Q4 financial data (CSV with monthly breakdowns)");

    const result = await agent.invoke({
      objective: "Validate the financial dashboard accuracy by comparing the visual chart with underlying data",
      outputInstruction: `As a senior financial analyst, provide:
        
        1. **Chart Analysis**: Describe what the chart shows (trends, values, time periods)
        2. **Data Validation**: Compare chart values with Excel data
        3. **Discrepancy Report**: Identify any inconsistencies or errors
        4. **Financial Insights**: Key trends and business implications
        5. **Recommendations**: Actions for CFO based on findings
        
        Format as an executive summary for the CFO.`,
      files: files
    });

    console.log("\n✅ Financial validation completed!");
    console.log(`📋 Session ID: ${result.sessionId}`);
    console.log("\n📈 Executive Summary:");
    console.log(result.conclusion);

  } catch (error: any) {
    console.error("❌ Financial validation failed:", error.message);
  }
}

/**
 * Generate a mock financial chart for demonstration
 */
function generateMockFinancialChart(): string {
  // This would be a real chart image in production
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
}

/**
 * Insurance Claims Processing Use Case
 * 
 * Scenario: An insurance adjuster needs to process a car accident claim.
 * They have photos of the damage and a CSV with repair estimates.
 */
async function processInsuranceClaim() {
  console.log("\n🚗 Insurance Claims Processing");
  console.log("=" .repeat(60));
  console.log("Use Case: Auto insurance claim validation");

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
        data: generateMockDamagePhoto(),
        detail: 'high',
        mimeType: 'image/jpeg'
      },
      {
        type: 'document',
        data: path.join(process.cwd(), 'example', 'sample-data', 'repair-estimates.csv'),
        options: {
          maxRows: 50,
          includeHeaders: true
        }
      }
    ];

    console.log("\n🔍 Claim materials:");
    console.log("• Vehicle damage photos");
    console.log("• Repair shop estimates (CSV)");

    const result = await agent.invoke({
      objective: "Process this auto insurance claim by analyzing damage photos and repair estimates",
      outputInstruction: `As an experienced insurance adjuster, provide:
        
        1. **Damage Assessment**: Detailed description of visible damage
        2. **Estimate Review**: Analysis of repair costs vs. damage severity
        3. **Fraud Indicators**: Any red flags or inconsistencies
        4. **Settlement Recommendation**: Suggested claim amount
        5. **Next Steps**: Required actions for claim processing
        
        Format as a professional claims report.`,
      files: files
    });

    console.log("\n✅ Insurance claim processed!");
    console.log("\n📄 Claims Report:");
    console.log(result.conclusion);

  } catch (error: any) {
    console.error("❌ Claim processing failed:", error.message);
  }
}

function generateMockDamagePhoto(): string {
  return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";
}

/**
 * Medical Report Analysis Use Case
 * 
 * Scenario: A doctor needs to analyze medical images (X-rays, scans) along with
 * patient data from CSV files to provide comprehensive diagnosis.
 */
async function analyzeMedicalReport() {
  console.log("\n🏥 Medical Report Analysis");
  console.log("=" .repeat(60));
  console.log("Use Case: Comprehensive patient analysis");

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
        data: generateMockMedicalScan(),
        detail: 'high',
        mimeType: 'image/png'
      },
      {
        type: 'document',
        data: path.join(process.cwd(), 'example', 'sample-data', 'patient-vitals.csv'),
        options: {
          maxRows: 30, // Recent visit history
          includeHeaders: true
        }
      }
    ];

    console.log("\n🔬 Medical files:");
    console.log("• Medical imaging (X-ray/MRI scan)");
    console.log("• Patient vital signs history (CSV)");

    const result = await agent.invoke({
      objective: "Analyze medical images and patient data to provide comprehensive health assessment",
      outputInstruction: `As a medical AI assistant, provide:
        
        1. **Image Analysis**: Describe visible anatomical features and any abnormalities
        2. **Vital Signs Review**: Trends and patterns in patient data
        3. **Clinical Correlation**: How images relate to vital sign patterns
        4. **Risk Assessment**: Potential health concerns to monitor
        5. **Recommendations**: Suggested follow-up tests or treatments
        
        Note: This is for educational purposes only - not medical advice.`,
      files: files
    });

    console.log("\n✅ Medical analysis completed!");
    console.log("\n🩺 Health Assessment Report:");
    console.log(result.conclusion);

  } catch (error: any) {
    console.error("❌ Medical analysis failed:", error.message);
  }
}

function generateMockMedicalScan(): string {
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA/jBWgAAAABJRU5ErkJggg==";
}

/**
 * Main execution function
 */
async function runMultimodalExamples() {
  console.log("🚀 Real-World Multimodal Analysis Examples");
  console.log("Using DelReact's Unified File Interface");
  console.log("=" .repeat(70));

  console.log("\nThese examples show how the unified file interface enables:");
  console.log("• Seamless integration of visual and structured data");
  console.log("• Professional workflows across industries");
  console.log("• Comprehensive analysis combining multiple data types");
  console.log("• Type-safe, clean APIs for complex use cases");

  try {
    await validateFinancialDashboard();
    await processInsuranceClaim(); 
    await analyzeMedicalReport();

    console.log("\n🎉 All multimodal examples completed successfully!");
    console.log("\n💡 Key Benefits Demonstrated:");
    console.log("• Single unified API for images + documents");
    console.log("• Industry-specific analysis workflows");
    console.log("• Professional-grade output formatting");
    console.log("• Type discrimination prevents errors");

  } catch (error: any) {
    console.error("❌ Example execution failed:", error.message);
  }
}

// Export for use in other examples
export { 
  validateFinancialDashboard,
  processInsuranceClaim,
  analyzeMedicalReport,
  runMultimodalExamples
};

// Run if called directly
if (require.main === module) {
  runMultimodalExamples().catch(console.error);
}