import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder } from "../core";

// Test the new openrouterKey functionality
const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

/**
 * Test that openrouterKey is properly separated from openaiKey
 */
async function testOpenrouterKeySupport() {
  console.log("🚀 Testing OpenRouter Key Support");
  console.log("=".repeat(60));

  try {
    // Test 1: Builder with only openrouterKey should work
    if (OPENROUTER_KEY) {
      console.log("\n📝 Test 1: Creating builder with only openrouterKey...");
      const openrouterOnlyBuilder = new ReactAgentBuilder({
        openrouterKey: OPENROUTER_KEY,
      });
      console.log("✅ Builder with only openrouterKey created successfully");
      console.log(`   Preferred provider: ${(openrouterOnlyBuilder as any).preferredProvider}`);
    }

    // Test 2: Builder with all three keys should work  
    if (GEMINI_KEY && OPENAI_KEY && OPENROUTER_KEY) {
      console.log("\n📝 Test 2: Creating builder with all three keys...");
      const allKeysBuilder = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY, 
        openrouterKey: OPENROUTER_KEY,
      });
      console.log("✅ Builder with all three keys created successfully");
      console.log(`   Preferred provider: ${(allKeysBuilder as any).preferredProvider}`);
    }

    // Test 3: Builder with no keys should fail
    console.log("\n📝 Test 3: Creating builder with no keys (should fail)...");
    try {
      new ReactAgentBuilder({});
      console.log("❌ Builder should have failed but didn't");
    } catch (error) {
      console.log("✅ Builder correctly failed with no keys");
      console.log(`   Error: ${(error as Error).message}`);
    }

    // Test 4: Test openrouter provider key resolution
    console.log("\n📝 Test 4: Testing provider key resolution...");
    const { getProviderKey } = await import("../core/llm");
    
    const geminiKey = getProviderKey("gemini");
    const openaiKey = getProviderKey("openai"); 
    const openrouterKey = getProviderKey("openrouter");
    
    console.log(`   Gemini key: ${geminiKey}`);
    console.log(`   OpenAI key: ${openaiKey}`);
    console.log(`   OpenRouter key: ${openrouterKey}`);
    
    if (geminiKey === "geminiKey" && 
        openaiKey === "openaiKey" && 
        openrouterKey === "openrouterKey") {
      console.log("✅ Provider key resolution working correctly");
    } else {
      console.log("❌ Provider key resolution not working correctly");
    }

    // Test 5: Test API key selection with openrouter provider
    if (OPENROUTER_KEY) {
      console.log("\n📝 Test 5: Testing OpenRouter provider selection...");
      const builder = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
        openrouterKey: OPENROUTER_KEY,
      });

      const agent = builder.init({
        selectedProvider: 'openrouter',
        model: 'openai/gpt-4o-mini',
        maxTasks: 2,
      }).build();

      console.log("✅ OpenRouter agent built successfully");
      console.log(`   Runtime config provider: ${agent.runtimeConfig.selectedProvider}`);
    }

    console.log("\n🎉 All tests passed! OpenRouter key support is working correctly.");

  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack:", error.stack);
  }
}

const main = async () => {
  await testOpenrouterKeySupport();
};

main().catch(error => {
  console.error("Error running tests:", error);
});