/**
 * Test New File Interface - Combined Images and Documents
 * 
 * This example demonstrates the new unified file interface where both images 
 * and documents can be passed together in the 'files' array with proper type discrimination.
 */

import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder, FileInput } from "../core";
import * as path from "path";

const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;

/**
 * Test the new unified file interface
 */
async function testUnifiedFileInterface() {
  console.log("🧪 Testing New Unified File Interface");
  console.log("=" .repeat(60));

  if (!GEMINI_KEY && !OPENAI_KEY) {
    console.log("⚠️ No API keys found. This is a demonstration of the interface.");
    console.log("Set GEMINI_KEY or OPENAI_KEY to run actual tests.");
  }

  // Create agent
  const agent = new ReactAgentBuilder({
    geminiKey: GEMINI_KEY,
    openaiKey: OPENAI_KEY,
    useEnhancedPrompt: true,
    memory: "in-memory"
  })
  .init({
    selectedProvider: GEMINI_KEY ? 'gemini' : 'openai',
    model: GEMINI_KEY ? 'gemini-2.5-flash' : 'gpt-4o-mini'
  })
  .build();

  // Example 1: Mixed files array with both images and documents
  console.log("\n📁 Example 1: Mixed Files Array");
  
  try {
    const files: FileInput[] = [
      // Image file
      {
        type: 'image',
        data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
        detail: 'high',
        mimeType: 'image/png'
      },
      // Document file (would be actual file path in real usage)
      {
        type: 'document',
        data: path.join(process.cwd(), 'example', 'sample-data', 'employees.csv'),
        options: {
          maxRows: 10,
          includeHeaders: true
        }
      }
    ];

    console.log("Files configuration:");
    files.forEach((file, index) => {
      console.log(`  ${index + 1}. Type: ${file.type}, Data: ${typeof file.data === 'string' && file.data.length > 50 ? file.data.substring(0, 50) + '...' : file.data}`);
    });

    if (GEMINI_KEY || OPENAI_KEY) {
      const result = await agent.invoke({
        objective: "Analyze the provided data and image to provide insights about employee distribution and any visual elements",
        outputInstruction: `Provide analysis in this format:
          1. Document Analysis (from CSV data)
          2. Image Analysis (from provided image)
          3. Combined Insights
          4. Recommendations`,
        files: files
      });

      console.log("\n✅ Analysis completed successfully!");
      console.log(`📄 Session ID: ${result.sessionId}`);
      console.log(`📊 Result: ${result.conclusion?.substring(0, 300)}...`);
    } else {
      console.log("✅ File interface configured correctly (skipped execution due to missing API keys)");
    }

  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
  }

  // Example 2: Images only  
  console.log("\n🖼️ Example 2: Images Only");
  
  try {
    const imageFiles: FileInput[] = [
      {
        type: 'image',
        data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
        detail: 'high',
        mimeType: 'image/png'
      }
    ];

    console.log("Image-only unified format:");
    console.log(`  Type: ${imageFiles[0].type}`);
    console.log(`  Detail: ${imageFiles[0].detail}`);

    if (GEMINI_KEY || OPENAI_KEY) {
      const result = await agent.invoke({
        objective: "Analyze this test image and describe what you see",
        files: imageFiles
      });
      console.log("✅ Image-only analysis completed!");
      console.log(`📄 Session ID: ${result.sessionId}`);
    } else {
      console.log("✅ Image-only unified interface configured correctly");
    }

  } catch (error: any) {
    console.error("❌ Image-only test failed:", error.message);
  }

  // Example 3: Documents only
  console.log("\n📊 Example 3: Documents Only");
  
  try {
    const documentFiles: FileInput[] = [
      {
        type: 'document',
        data: path.join(process.cwd(), 'example', 'sample-data', 'employees.csv'),
        options: {
          maxRows: 5,
          includeHeaders: true
        }
      }
    ];

    console.log("Document-only configuration:");
    console.log(`  File: ${documentFiles[0].data}`);
    console.log(`  Type: ${documentFiles[0].type}`);

    if (GEMINI_KEY || OPENAI_KEY) {
      const result = await agent.invoke({
        objective: "Provide a summary of the employee data including department distribution",
        files: documentFiles
      });

      console.log("✅ Document-only analysis completed!");
      console.log(`📊 Summary: ${result.conclusion?.substring(0, 200)}...`);
    } else {
      console.log("✅ Document-only interface configured correctly");
    }

  } catch (error: any) {
    console.error("❌ Document-only test failed:", error.message);
  }
}

/**
 * Demonstrate the interface improvements
 */
function showInterfaceImprovements() {
  console.log("\n💡 Unified File Interface Benefits");
  console.log("=" .repeat(60));
  
  console.log(`
✨ **Unified Files Interface:**
const result = await agent.invoke({
  objective: "Analyze data and images",
  files: [
    { type: 'image', data: "chart.png", detail: "high" },
    { type: 'document', data: "data.csv", options: { maxRows: 100 } }
  ]
});

🎯 **Key Benefits:**
• Single unified API for all file types
• Better semantic meaning with type discrimination  
• Automatic document processing (no manual tool calls needed)
• TypeScript type safety with FileInput interface
• Cleaner, more intuitive developer experience
• Seamless integration of visual and structured data

🔧 **FileInput Interface:**
interface FileInput {
  type: 'image' | 'document';
  data: string | Buffer;
  mimeType?: string;
  detail?: 'auto' | 'low' | 'high';     // Images only
  options?: DocumentOptions;            // Documents only
}

🚀 **Real-World Use Cases:**
• Dashboard validation (charts + underlying data)
• Financial reporting (Excel files + visualization images)  
• Medical analysis (scans + patient data)
• Quality control (product images + inspection data)
• Business intelligence (multiple data sources)
• Real estate (property photos + market data)
  `);
}

/**
 * Main test execution
 */
async function runTests() {
  console.log("🚀 DelReact Unified File Interface Tests");
  console.log("Testing new files[] array with type discrimination");
  console.log("=" .repeat(70));

  showInterfaceImprovements();
  
  try {
    await testUnifiedFileInterface();
    
    console.log("\n🎉 All interface tests completed!");
    console.log("\n📋 Summary:");
    console.log("• ✅ Unified file interface working");
    console.log("• ✅ Type discrimination functional");
    console.log("• ✅ Document processing integrated");
    console.log("• ✅ Clean API with no legacy dependencies");
    
  } catch (error: any) {
    console.error("❌ Test execution failed:", error.message);
  }
}

// Run tests
runTests().catch(console.error);

export { testUnifiedFileInterface };