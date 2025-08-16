import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder } from "../core";

const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;

async function testSeparateModels() {
    console.log("🚀 Testing Separate Models for Reasoning vs Execution Agents");
    
    if (!GEMINI_KEY || !OPENAI_KEY) {
        console.log("⚠️  Skipping test - both GEMINI_KEY and OPENAI_KEY are required for this test");
        return;
    }

    const builder = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    // Test separate model configuration
    const agent = builder.init({
        // Reasoning agents (TaskBreakdown, TaskReplanning) use Gemini
        reasonProvider: "gemini",
        reasonModel: "gemini-2.0-flash",
        
        // Execution agents (Action, Completion) use OpenAI
        selectedProvider: "openai",
        model: "gpt-4o-mini",
        
        maxTasks: 3,
    }).build();

    const result = await agent.invoke({
        objective: "What is 2 + 2? Then explain why this calculation is correct.",
    });

    console.log("✅ Separate models test completed");
    console.log("Result:", result.conclusion);
    return result;
}

async function testBackwardCompatibility() {
    console.log("🚀 Testing Backward Compatibility - Single Model for All Agents");
    
    const builder = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    // Test backward compatibility - only specify model, not reasonModel/reasonProvider
    const agent = builder.init({
        selectedProvider: "gemini",
        model: "gemini-2.0-flash",
        maxTasks: 3,
    }).build();

    const result = await agent.invoke({
        objective: "What is 3 + 3?",
    });

    console.log("✅ Backward compatibility test completed");
    console.log("Result:", result.conclusion);
    return result;
}

async function testDefaultModels() {
    console.log("🚀 Testing Default Models");
    
    const builder = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    // Test with only providers specified, should use default models
    const agent = builder.init({
        reasonProvider: "openai",
        selectedProvider: "gemini",
        maxTasks: 3,
    }).build();

    const result = await agent.invoke({
        objective: "What is 1 + 1?",
    });

    console.log("✅ Default models test completed");
    console.log("Result:", result.conclusion);
    return result;
}

async function main() {
    try {
        await testBackwardCompatibility();
        console.log("\n" + "=".repeat(50) + "\n");
        
        await testDefaultModels();
        console.log("\n" + "=".repeat(50) + "\n");
        
        await testSeparateModels();
    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

main();