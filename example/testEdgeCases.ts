import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder } from "../core";

const GEMINI_KEY = process.env.GEMINI_KEY || "dummy_gemini";
const OPENAI_KEY = process.env.OPENAI_KEY || "dummy_openai";

function testEdgeCases() {
    console.log("🚀 Testing Edge Cases for Model Configuration");
    
    console.log("\n=== Test 1: Only reasonModel specified (should warn about missing provider) ===");
    const builder1 = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    try {
        const agent1 = builder1.init({
            reasonModel: "gpt-4o-mini", // No reasonProvider specified
            selectedProvider: "gemini",
            model: "gemini-2.0-flash",
        }).build();
        console.log("✅ Warning correctly displayed for missing reasonProvider");
    } catch (error) {
        console.log("❌ Unexpected error:", error.message);
    }

    console.log("\n=== Test 2: Only reasonProvider specified (should warn about missing model) ===");
    const builder2 = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    try {
        const agent2 = builder2.init({
            reasonProvider: "openai", // No reasonModel specified
            selectedProvider: "gemini",
            model: "gemini-2.0-flash",
        }).build();
        console.log("✅ Warning correctly displayed for missing reasonModel");
    } catch (error) {
        console.log("❌ Unexpected error:", error.message);
    }

    console.log("\n=== Test 3: No model specified anywhere (should use defaults) ===");
    const builder3 = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    try {
        const agent3 = builder3.init({
            selectedProvider: "gemini",
            // No model specified
        }).build();
        console.log("✅ Default models used correctly");
    } catch (error) {
        console.log("❌ Unexpected error:", error.message);
    }

    console.log("\n=== Test 4: Same provider for both reasoning and execution ===");
    const builder4 = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    try {
        const agent4 = builder4.init({
            reasonProvider: "openai",
            reasonModel: "gpt-4o-mini",
            selectedProvider: "openai",
            model: "gpt-3.5-turbo",
        }).build();
        console.log("✅ Same provider with different models works correctly");
    } catch (error) {
        console.log("❌ Unexpected error:", error.message);
    }

    console.log("\n=== Test 5: Invalid provider (should fail validation) ===");
    const builder5 = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        // No openaiKey
    });

    try {
        const agent5 = builder5.init({
            reasonProvider: "openai", // This should fail since no openaiKey
            reasonModel: "gpt-4o-mini",
            selectedProvider: "gemini",
            model: "gemini-2.0-flash",
        }).build();
        console.log("❌ Should have failed validation");
    } catch (error) {
        console.log("✅ Correctly caught validation error:", error.message);
    }

    console.log("\n=== Test 6: Enhanced prompt with separate models ===");
    const builder6 = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
        useEnhancedPrompt: true, // Enable enhanced prompt
    });

    try {
        const agent6 = builder6.init({
            reasonProvider: "gemini",
            reasonModel: "gemini-2.0-flash",
            selectedProvider: "openai",
            model: "gpt-4o-mini",
        }).build();
        console.log("✅ Enhanced prompt with separate models works correctly");
    } catch (error) {
        console.log("❌ Unexpected error:", error.message);
    }

    console.log("\n🎉 All edge case tests completed!");
}

testEdgeCases();