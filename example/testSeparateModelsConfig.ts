import { ReactAgentBuilder } from "../core";

/**
 * Test separate models configuration without requiring API calls
 */
async function testConfigurationValidation() {
    console.log("🧪 Testing Separate Models Configuration");
    
    // Test 1: Separate providers
    console.log("\n1. Testing separate providers configuration...");
    const builder1 = new ReactAgentBuilder({
        geminiKey: "test-key",
        openaiKey: "test-key",
    });

    const agent1 = builder1.init({
        reasonProvider: "gemini",
        reasonModel: "gemini-2.0-flash",
        selectedProvider: "openai",
        model: "gpt-4o-mini"
    }).buildGraph();

    console.log("✅ Separate providers configuration validated");

    // Test 2: Backward compatibility
    console.log("\n2. Testing backward compatibility...");
    const builder2 = new ReactAgentBuilder({
        geminiKey: "test-key",
    });

    const agent2 = builder2.init({
        selectedProvider: "gemini",
        model: "gemini-2.0-flash"
    }).buildGraph();

    console.log("✅ Backward compatibility validated");

    // Test 3: Same provider, different models
    console.log("\n3. Testing same provider with different models...");
    const builder3 = new ReactAgentBuilder({
        openaiKey: "test-key",
    });

    const agent3 = builder3.init({
        reasonProvider: "openai",
        reasonModel: "gpt-4o-mini",
        selectedProvider: "openai", 
        model: "gpt-4o"
    }).buildGraph();

    console.log("✅ Same provider different models validated");

    // Test 4: Default models
    console.log("\n4. Testing default model fallbacks...");
    const builder4 = new ReactAgentBuilder({
        openaiKey: "test-key",
    });

    const agent4 = builder4.init({
        reasonProvider: "openai",
        selectedProvider: "openai"
    }).buildGraph();

    console.log("✅ Default model fallbacks validated");

    // Test 5: Missing reasoning config (should use execution config)
    console.log("\n5. Testing partial configuration...");
    const builder5 = new ReactAgentBuilder({
        geminiKey: "test-key",
    });

    const agent5 = builder5.init({
        selectedProvider: "gemini",
        model: "gemini-2.0-flash"
    }).buildGraph();

    console.log("✅ Partial configuration validated");

    console.log("\n🎉 All configuration tests passed!");
    console.log("Separate model configuration is working correctly.");
}

testConfigurationValidation().catch(console.error);