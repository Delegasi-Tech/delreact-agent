import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder } from "../core";

const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;

async function testSeparateModels() {
    console.log("🧠⚡ Testing Separate Models for Reasoning and Execution");
    
    const builder = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    // Use different models: fast Gemini for reasoning, high-quality OpenAI for execution
    const agent = builder.init({
        // Fast reasoning for planning
        reasonProvider: "gemini",
        reasonModel: "gemini-2.0-flash",
        
        // High-quality execution for final outputs
        selectedProvider: "openai",
        model: "gpt-4o-mini"
    }).build();

    const result = await agent.invoke({
        objective: "Analyze the benefits of renewable energy and create a detailed comparison with fossil fuels",
    });

    console.log("✅ Separate models test completed");
    console.log("Conclusion:", result.conclusion);
}

async function testBackwardCompatibility() {
    console.log("🔄 Testing Backward Compatibility (Single Model)");
    
    const builder = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
    });

    // Traditional single model configuration - should work unchanged
    const agent = builder.init({
        selectedProvider: "gemini",
        model: "gemini-2.0-flash"
    }).build();

    const result = await agent.invoke({
        objective: "What are the main advantages of electric vehicles?",
    });

    console.log("✅ Backward compatibility test completed");
    console.log("Conclusion:", result.conclusion);
}

async function testSameProviderDifferentModels() {
    console.log("🎯 Testing Same Provider with Different Models");
    
    const builder = new ReactAgentBuilder({
        openaiKey: OPENAI_KEY,
    });

    // Same provider but different models for different purposes
    const agent = builder.init({
        reasonProvider: "openai",
        reasonModel: "gpt-4o-mini",     // Fast reasoning
        selectedProvider: "openai", 
        model: "gpt-4o"                 // High-quality execution
    }).build();

    const result = await agent.invoke({
        objective: "Compare artificial intelligence frameworks and recommend the best one for a startup",
    });

    console.log("✅ Same provider different models test completed");
    console.log("Conclusion:", result.conclusion);
}

async function testDefaultModels() {
    console.log("⚙️ Testing Default Model Configuration");
    
    const builder = new ReactAgentBuilder({
        openaiKey: OPENAI_KEY,
    });

    // Only specify providers, let models default to gpt-4o-mini
    const agent = builder.init({
        reasonProvider: "openai",
        selectedProvider: "openai"
    }).build();

    const result = await agent.invoke({
        objective: "Explain quantum computing in simple terms",
    });

    console.log("✅ Default models test completed");
    console.log("Conclusion:", result.conclusion);
}

async function main() {
    try {
        console.log("🧪 Starting Separate Model Configuration Tests\n");

        /**
         * Test 1: Different providers for reasoning vs execution
         */
        await testSeparateModels();
        console.log("\n" + "=".repeat(80) + "\n");

        /**
         * Test 2: Backward compatibility with single model
         */
        await testBackwardCompatibility();
        console.log("\n" + "=".repeat(80) + "\n");

        /**
         * Test 3: Same provider, different models
         */
        await testSameProviderDifferentModels();
        console.log("\n" + "=".repeat(80) + "\n");

        /**
         * Test 4: Default model configuration
         */
        await testDefaultModels();

        console.log("\n🎉 All tests completed successfully!");

    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

main();