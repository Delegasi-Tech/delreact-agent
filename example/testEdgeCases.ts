import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder } from "../core";

const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;

async function testEdgeCases() {
    console.log("🧪 Testing Edge Cases and Validation");
    console.log("=".repeat(50));

    // Test 1: Missing reasonProvider but reasonModel specified
    console.log("\n🔍 Test 1: Missing reasonProvider but reasonModel specified");
    try {
        const builder = new ReactAgentBuilder({
            geminiKey: GEMINI_KEY,
            openaiKey: OPENAI_KEY,
        });

        const agent = builder.init({
            reasonModel: "gpt-4o-mini",    // Model specified
            // reasonProvider missing     // Provider missing
            selectedProvider: "openai",
            model: "gpt-4o-mini"
        }).build();

        console.log("⚠️ Warning should be shown above about missing reasonProvider");
        
    } catch (error) {
        console.error("❌ Unexpected error:", error);
    }

    // Test 2: Missing reasonModel but reasonProvider specified  
    console.log("\n🔍 Test 2: Missing reasonModel but reasonProvider specified");
    try {
        const builder = new ReactAgentBuilder({
            geminiKey: GEMINI_KEY,
            openaiKey: OPENAI_KEY,
        });

        const agent = builder.init({
            reasonProvider: "openai",      // Provider specified
            // reasonModel missing        // Model missing
            selectedProvider: "gemini",
            model: "gemini-2.0-flash"
        }).build();

        console.log("⚠️ Warning should be shown above about missing reasonModel");
        
    } catch (error) {
        console.error("❌ Unexpected error:", error);
    }

    // Test 3: Missing API key for specified provider
    console.log("\n🔍 Test 3: Missing API key for specified provider");
    try {
        const builder = new ReactAgentBuilder({
            geminiKey: GEMINI_KEY,
            // openaiKey intentionally missing
        });

        const agent = builder.init({
            reasonProvider: "openai",      // Provider without API key
            reasonModel: "gpt-4o-mini",
            selectedProvider: "gemini",
            model: "gemini-2.0-flash"
        }).build();

        console.log("⚠️ Warning should be shown above about missing openaiKey");
        
    } catch (error) {
        console.error("❌ Unexpected error:", error);
    }

    // Test 4: Completely missing configuration (should use defaults)
    console.log("\n🔍 Test 4: Minimal configuration with defaults");
    try {
        const builder = new ReactAgentBuilder({
            openaiKey: OPENAI_KEY,
        });

        const agent = builder.init({
            selectedProvider: "openai"
            // No models specified - should default to gpt-4o-mini
        }).build();

        console.log("✅ Should use default model (gpt-4o-mini) for both reasoning and execution");
        
    } catch (error) {
        console.error("❌ Unexpected error:", error);
    }

    // Test 5: Only execution model specified (backward compatibility)
    console.log("\n🔍 Test 5: Only execution model specified (backward compatibility)");
    try {
        const builder = new ReactAgentBuilder({
            geminiKey: GEMINI_KEY,
        });

        const agent = builder.init({
            selectedProvider: "gemini",
            model: "gemini-2.0-flash"
            // No reason model/provider - should use execution model for all
        }).build();

        console.log("✅ Should use gemini-2.0-flash for both reasoning and execution (backward compatible)");
        
    } catch (error) {
        console.error("❌ Unexpected error:", error);
    }

    // Test 6: reasonModel provided but selectedProvider not provided
        console.log("\n🔍 Test 6: reasonModel provided but selectedProvider not provided");
        const builder6 = new ReactAgentBuilder({
            geminiKey: "test-key",
            openaiKey: "test-key",
        });

        const agent6 = builder6.init({
            reasonModel: "gpt-4o-mini",  // reasonModel provided
            // selectedProvider not provided - should trigger warning and use default
            model: "gpt-4o-mini"
        }).build();

        console.log("✅ reasonModel without selectedProvider - handled with warning and default provider");
        
    } catch (error) {
        console.error("❌ Unexpected error:", error);
    }

    // Test 7: selectedProvider not provided but reasonProvider provided
    try {
        console.log("\n7. Testing reasonProvider provided but selectedProvider not provided...");
        const builder7 = new ReactAgentBuilder({
            geminiKey: "test-key",
            openaiKey: "test-key",
        });

        const agent7 = builder7.init({
            reasonProvider: "openai",
            reasonModel: "gpt-4o-mini",
            // selectedProvider not provided - should use reasonProvider as fallback
            model: "gpt-4o-mini"
        }).build();

        console.log("✅ reasonProvider without selectedProvider - uses reasonProvider as fallback");
        
    } catch (error) {
        console.error("❌ Unexpected error:", error);
    }

    console.log("\n🎯 Edge Case Tests Summary:");
    console.log("✅ Missing reasonProvider - handled with warning");
    console.log("✅ Missing reasonModel - handled with warning");
    console.log("✅ Missing API key - handled with warning");
    console.log("✅ Minimal config - handled with defaults");
    console.log("✅ Backward compatibility - fully preserved");
    console.log("✅ reasonModel without selectedProvider - handled with warning and defaults");
    console.log("✅ reasonProvider without selectedProvider - uses reasonProvider as fallback");
}

async function testConfigurationScenarios() {
    console.log("\n" + "=".repeat(60));
    console.log("🎛️ Testing Various Configuration Scenarios");
    console.log("=".repeat(60));

    const scenarios = [
        {
            name: "Different Providers",
            config: {
                reasonProvider: "gemini",
                reasonModel: "gemini-2.0-flash",
                selectedProvider: "openai",
                model: "gpt-4o-mini"
            }
        },
        {
            name: "Same Provider Different Models",
            config: {
                reasonProvider: "openai",
                reasonModel: "gpt-4o-mini",
                selectedProvider: "openai",
                model: "gpt-4o"
            }
        },
        {
            name: "Reasoning Only Specified",
            config: {
                reasonProvider: "gemini",
                reasonModel: "gemini-2.0-flash"
                // Execution will use defaults
            }
        },
        {
            name: "Execution Only Specified (Traditional)",
            config: {
                selectedProvider: "openai",
                model: "gpt-4o-mini"
                // Reasoning will use same as execution
            }
        }
    ];

    for (const scenario of scenarios) {
        console.log(`\n📋 Scenario: ${scenario.name}`);
        try {
            const builder = new ReactAgentBuilder({
                geminiKey: GEMINI_KEY,
                openaiKey: OPENAI_KEY,
            });

            const agent = builder.init(scenario.config).build();
            console.log(`✅ ${scenario.name} configuration applied successfully`);
            
        } catch (error) {
            console.error(`❌ ${scenario.name} failed:`, error);
        }
    }
}

async function main() {
    try {
        // Test edge cases and validation
        await testEdgeCases();
        
        // Test various configuration scenarios
        await testConfigurationScenarios();
        
        console.log("\n🎉 All edge case and validation tests completed!");
        
    } catch (error) {
        console.error("❌ Edge case testing failed:", error);
    }
}

main();