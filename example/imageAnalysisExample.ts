import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder } from "../core";

const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;

/**
 * Example demonstrating image analysis capabilities with DelReact
 * This example shows how to use the new multimodal features
 */
async function exampleImageAnalysis() {
  console.log("🖼️ DelReact Image Analysis Example");
  console.log("=" .repeat(50));

  const agentBuilder = new ReactAgentBuilder({
    geminiKey: GEMINI_KEY, 
    openaiKey: OPENAI_KEY,
    useEnhancedPrompt: true // Enhanced prompt helps with image analysis
  });

  const agent = agentBuilder.init({
    selectedProvider: 'gemini', // Gemini has excellent vision capabilities
    model: 'gemini-2.5-flash',
  }).build();

  try {
    // Example 1: Direct LLM call with image
    console.log("\n🔍 Example 1: Direct LLM call with image");
    
    const visionResult = await agentBuilder.callLLM(
      "Analyze this chart and provide key insights about the data trends",
      {
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        images: [
          {
            data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
            detail: 'high'
          }
        ]
      }
    );
    
    console.log("Direct LLM result:", visionResult.substring(0, 100) + "...");

    // Example 2: Full agent workflow with images
    console.log("\n🤖 Example 2: Full agent workflow with multimodal input");
    
    const result = await agent.invoke({
      objective: "Analyze the provided images and create a comprehensive report",
      outputInstruction: "Provide structured analysis including: visual description, key elements identified, data insights (if applicable), and actionable recommendations",
      images: [
        {
          data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", // Red pixel
          detail: 'high'
        },
        {
          data: Buffer.from("fake-image-data"), // Example buffer
          mimeType: 'image/jpeg',
          detail: 'auto'
        }
      ]
    });

    console.log("\n✅ Agent workflow completed");
    console.log(`📄 Session ID: ${result.sessionId}`);
    console.log(`📊 Conclusion: ${result.conclusion}`);
    console.log(`🔄 Tasks executed: ${result.fullState.actionedTasks.length}`);

    // Example 3: Business use case - Document analysis
    console.log("\n📋 Example 3: Business document analysis");
    
    const docAnalysis = await agent.invoke({
      objective: "Extract key information from business documents and create an executive summary",
      outputInstruction: "Format as: Executive Summary, Key Metrics, Action Items, Risk Assessment",
      images: [
        {
          // In real usage, this would be a actual document image
          data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
          detail: 'high'
        }
      ]
    });

    console.log(`📈 Document analysis completed: ${docAnalysis.conclusion.substring(0, 150)}...`);

  } catch (error: any) {
    console.error("❌ Example failed:", error.message);
    
    // Check if it's an API key issue
    if (error.message.includes("API key")) {
      console.log("\n💡 Note: Make sure to set your API keys in the .env file:");
      console.log("GEMINI_KEY=your_gemini_api_key");
      console.log("OPENAI_KEY=your_openai_api_key");
    }
  }
}

/**
 * Supported image formats and best practices
 */
function showImageSupportInfo() {
  console.log("\n📖 Image Support Information");
  console.log("=" .repeat(40));
  
  console.log("\n🖼️ Supported Input Formats:");
  console.log("• File paths: '/path/to/image.jpg'");
  console.log("• Data URLs: 'data:image/jpeg;base64,/9j/4AAQ...'");
  console.log("• Base64 strings: '/9j/4AAQSkZJRgABAQEASABIAAD...'");
  console.log("• Buffers: Buffer.from(imageData)");
  
  console.log("\n🎯 Image Detail Levels:");
  console.log("• 'low': Fast processing, lower quality");
  console.log("• 'auto': Balanced processing (default)");
  console.log("• 'high': Detailed analysis, slower processing");
  
  console.log("\n📊 Supported MIME Types:");
  console.log("• image/jpeg, image/jpg");
  console.log("• image/png");
  console.log("• image/gif");
  console.log("• image/webp");
  console.log("• image/bmp");
  console.log("• image/svg+xml");
  
  console.log("\n🚀 Best Practices:");
  console.log("• Use 'high' detail for charts, diagrams, and text-heavy images");
  console.log("• Use 'auto' or 'low' for simple object recognition");
  console.log("• Optimize image size before processing (max 20MB recommended)");
  console.log("• Provide clear, high-contrast images for better analysis");
  console.log("• Use vision-capable models like 'gemini-2.5-flash' or 'gpt-4o-mini'");
}

const main = async () => {
  showImageSupportInfo();
  
  if (GEMINI_KEY || OPENAI_KEY) {
    await exampleImageAnalysis();
  } else {
    console.log("\n⚠️ No API keys found. Set GEMINI_KEY or OPENAI_KEY to run examples.");
  }
};

main().catch(error => {
  console.error("Error running examples:", error);
});