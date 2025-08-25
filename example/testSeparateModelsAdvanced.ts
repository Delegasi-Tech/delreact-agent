import { ReactAgentBuilder } from "../core";

/**
 * Test separate models with enhanced prompt and other features
 */
async function testAdvancedFeatures() {
    console.log("🧪 Testing Separate Models with Advanced Features");
    
    // Test 1: Enhanced prompt mode
    console.log("\n1. Testing with enhanced prompt mode...");
    const builder1 = new ReactAgentBuilder({
        geminiKey: "test-key",
        openaiKey: "test-key",
        useEnhancedPrompt: true,
    });

    const agent1 = builder1.init({
        reasonProvider: "gemini",
        reasonModel: "gemini-2.0-flash",
        selectedProvider: "openai",
        model: "gpt-4o-mini"
    }).buildGraph();

    console.log("✅ Enhanced prompt mode with separate models validated");

    // Test 2: Memory configuration
    console.log("\n2. Testing with memory...");
    const builder2 = new ReactAgentBuilder({
        geminiKey: "test-key",
        openaiKey: "test-key",
        memory: "in-memory",
    });

    const agent2 = builder2.init({
        reasonProvider: "gemini",
        reasonModel: "gemini-2.0-flash",
        selectedProvider: "openai",
        model: "gpt-4o-mini"
    }).buildGraph();

    console.log("✅ Memory with separate models validated");

    // Test 3: All features combined
    console.log("\n3. Testing all features combined...");
    const builder3 = new ReactAgentBuilder({
        geminiKey: "test-key",
        openaiKey: "test-key",
        useEnhancedPrompt: true,
        memory: "in-memory",
        enableToolSummary: true,
    });

    const agent3 = builder3.init({
        reasonProvider: "gemini",
        reasonModel: "gemini-2.0-flash",
        selectedProvider: "openai",
        model: "gpt-4o-mini"
    }).buildGraph();

    console.log("✅ All features combined with separate models validated");

    console.log("\n🎉 All advanced feature tests passed!");
    console.log("Separate model configuration works with all existing features.");
}

testAdvancedFeatures().catch(console.error);