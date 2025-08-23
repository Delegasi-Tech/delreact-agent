import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder } from "../core";

const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;

async function demonstrateSeparateModels() {
    console.log("🎯 DelReact Separate Model Configuration Demo");
    console.log("=".repeat(60));
    
    // Example 1: Cost-Optimized Configuration
    console.log("\n💰 Example 1: Cost-Optimized Configuration");
    console.log("Using fast Gemini for reasoning, OpenAI for execution");
    
    const costOptimizedBuilder = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    const costOptimizedAgent = costOptimizedBuilder.init({
        // Fast and cheap for reasoning/planning
        reasonProvider: "gemini",
        reasonModel: "gemini-2.0-flash",
        
        // Higher quality for final execution
        selectedProvider: "openai",
        model: "gpt-4o-mini"
    }).build();

    console.log("Configuration applied - ready to process tasks efficiently!");

    // Example 2: Quality-Focused Configuration  
    console.log("\n🎯 Example 2: Quality-Focused Configuration");
    console.log("Using premium models for both reasoning and execution");
    
    const qualityBuilder = new ReactAgentBuilder({
        openaiKey: OPENAI_KEY,
    });

    const qualityAgent = qualityBuilder.init({
        reasonProvider: "openai",
        reasonModel: "gpt-4o",          // Premium reasoning
        selectedProvider: "openai", 
        model: "gpt-4o"                 // Premium execution
    }).build();

    console.log("High-quality configuration applied!");

    // Example 3: Backward Compatible (unchanged behavior)
    console.log("\n🔄 Example 3: Backward Compatible Configuration");
    console.log("Traditional single model setup - no changes needed");
    
    const traditionalBuilder = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
    });

    const traditionalAgent = traditionalBuilder.init({
        selectedProvider: "gemini",
        model: "gemini-2.0-flash"       // All agents use this model
    }).build();

    console.log("Traditional configuration applied - fully backward compatible!");

    console.log("\n✨ Key Benefits:");
    console.log("🔹 Cost Optimization: Use cheaper models for planning, premium for results");
    console.log("🔹 Provider Flexibility: Mix and match different AI providers");
    console.log("🔹 Zero Breaking Changes: Existing code works unchanged");
    console.log("🔹 Smart Defaults: Sensible fallbacks when configuration is incomplete");
    
    console.log("\n🧠 Agent Types:");
    console.log("📋 Reasoning Agents: TaskBreakdownAgent, TaskReplanningAgent, EnhancePromptAgent");
    console.log("⚡ Execution Agents: ActionAgent, CompletionAgent");
    
    console.log("\n🚀 All configurations ready! Choose based on your needs:");
    console.log("• Cost-optimized: Fast reasoning + Quality execution");
    console.log("• Quality-focused: Premium models for all agents");
    console.log("• Traditional: Single model for all agents (backward compatible)");
}

async function runQuickTest() {
    console.log("\n" + "=".repeat(60));
    console.log("🧪 Quick Test: Different Models in Action");
    console.log("=".repeat(60));
    
    const builder = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    const agent = builder.init({
        reasonProvider: "gemini",
        reasonModel: "gemini-2.0-flash",
        selectedProvider: "openai",
        model: "gpt-4o-mini"
    }).build();

    console.log("🔍 Processing: 'Create a brief marketing strategy for a new tech startup'");
    
    const result = await agent.invoke({
        objective: "Create a brief marketing strategy for a new tech startup focusing on AI productivity tools",
    });

    console.log("\n✅ Task completed using separate models!");
    console.log("📋 Final Result:", result.conclusion);
    console.log(`📊 Session ID: ${result.sessionId}`);
}

async function main() {
    try {
        // Show configuration examples
        await demonstrateSeparateModels();
        
        // Run a quick test to show it works
        await runQuickTest();
        
    } catch (error) {
        console.error("❌ Demo failed:", error);
    }
}

main();