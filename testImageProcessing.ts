import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder } from "./core";

const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;

/**
 * Test image processing capabilities with DelReact
 */
async function testImageProcessing() {
  console.log("🖼️ Testing Image Processing Capabilities");
  console.log("=" .repeat(60));

  const agentBuilder = new ReactAgentBuilder({
    geminiKey: GEMINI_KEY, 
    openaiKey: OPENAI_KEY,
    useEnhancedPrompt: false
  });

  const agent = agentBuilder.init({
    selectedProvider: 'gemini', // Gemini supports vision
    model: 'gemini-2.5-flash',
  }).build();

  try {
    // Test with a simple base64 image (1x1 red pixel)
    const redPixelBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQV R42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

    console.log("\n📊 Testing image analysis workflow...");
    const result = await agent.invoke({
      objective: "Describe what you see in the provided image",
      outputInstruction: "Provide a brief description of the image content, colors, and any notable features",
      images: [
        {
          data: redPixelBase64,
          detail: 'high'
        }
      ]
    });

    console.log("✅ Image processing completed");
    console.log(`📄 Conclusion: ${result.conclusion}`);
    console.log(`🔄 Session ID: ${result.sessionId}`);

  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack:", error.stack);
  }
}

const main = async () => {
  await testImageProcessing();
};

main().catch(error => {
  console.error("Error running image tests:", error);
});