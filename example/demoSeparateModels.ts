import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder } from "../core";

const GEMINI_KEY = process.env.GEMINI_KEY || "dummy_gemini";
const OPENAI_KEY = process.env.OPENAI_KEY || "dummy_openai";

/**
 * Comprehensive demonstration of the new separate model configuration feature
 * 
 * This example shows:
 * 1. How to configure separate models for reasoning vs execution agents
 * 2. Backward compatibility with single model configuration
 * 3. Validation and error handling
 * 4. Default model behavior
 */
async function demonstrateFeature() {
    console.log("🚀 DelReact Agent Model Configuration Demo");
    console.log("==========================================\n");

    console.log("📖 New Feature: Separate Reasoning and Execution Models");
    console.log("- Reasoning Agents: TaskBreakdownAgent, TaskReplanningAgent");
    console.log("- Execution Agents: ActionAgent, CompletionAgent");
    console.log("- Enhanced Prompt Agent: Uses reasoning model configuration\n");

    // Example 1: Separate model configuration
    console.log("💡 Example 1: Separate Models for Different Agent Types");
    console.log("-----------------------------------------------------");
    const builder1 = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    const agent1 = builder1.init({
        // Reasoning agents use Gemini for fast planning
        reasonProvider: "gemini",
        reasonModel: "gemini-2.0-flash",
        
        // Execution agents use OpenAI for high-quality responses
        selectedProvider: "openai", 
        model: "gpt-4o-mini",
        
        maxTasks: 5,
    }).build();

    console.log("✅ Configuration: Reasoning=Gemini, Execution=OpenAI\n");

    // Example 2: Backward compatibility
    console.log("🔄 Example 2: Backward Compatibility - Single Model");
    console.log("------------------------------------------------");
    const builder2 = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    const agent2 = builder2.init({
        selectedProvider: "gemini",
        model: "gemini-2.0-flash", // All agents use this model
        maxTasks: 3,
    }).build();

    console.log("✅ Configuration: All agents use Gemini Flash\n");

    // Example 3: Same provider, different models
    console.log("⚖️  Example 3: Same Provider, Different Models");
    console.log("--------------------------------------------");
    const builder3 = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    const agent3 = builder3.init({
        reasonProvider: "openai",
        reasonModel: "gpt-4o-mini",      // Fast reasoning
        selectedProvider: "openai", 
        model: "gpt-4o",                 // High-quality execution
        maxTasks: 4,
    }).build();

    console.log("✅ Configuration: Both use OpenAI with different models\n");

    // Example 4: Default models
    console.log("🎯 Example 4: Default Model Behavior");
    console.log("----------------------------------");
    const builder4 = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    const agent4 = builder4.init({
        selectedProvider: "gemini", // No model specified
        maxTasks: 3,
    }).build();

    console.log("✅ Configuration: Uses default models (gpt-4o-mini)\n");

    // Example 5: Enhanced prompt with separate models
    console.log("✨ Example 5: Enhanced Prompt with Separate Models");
    console.log("------------------------------------------------");
    const builder5 = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
        useEnhancedPrompt: true, // Enable enhanced prompt
    });

    const agent5 = builder5.init({
        reasonProvider: "openai",
        reasonModel: "gpt-4o-mini",
        selectedProvider: "gemini",
        model: "gemini-2.0-flash",
        maxTasks: 4,
    }).build();

    console.log("✅ Configuration: Enhanced prompt + separate models\n");

    console.log("🎉 All examples configured successfully!");
    console.log("\n📋 Key Benefits:");
    console.log("- Optimize costs: Use fast models for planning, powerful models for execution");
    console.log("- Provider flexibility: Mix and match providers based on agent role");
    console.log("- Backward compatible: Existing code works without changes");
    console.log("- Validation: Prevents misconfiguration with helpful warnings");
    
    return {
        separateModels: agent1,
        backwardCompatible: agent2, 
        sameProvider: agent3,
        defaultModels: agent4,
        enhancedPrompt: agent5,
    };
}

demonstrateFeature().then(agents => {
    console.log("\n✅ Demo completed successfully!");
    console.log(`📊 Created ${Object.keys(agents).length} different agent configurations`);
}).catch(error => {
    console.error("❌ Demo failed:", error);
});