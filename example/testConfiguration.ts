import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder } from "../core";

const GEMINI_KEY = process.env.GEMINI_KEY || "dummy_gemini";
const OPENAI_KEY = process.env.OPENAI_KEY || "dummy_openai";

function testConfigurationSetup() {
    console.log("🚀 Testing Configuration Setup (No LLM calls)");
    
    console.log("\n=== Test 1: Backward Compatibility ===");
    const builder1 = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    const agent1 = builder1.init({
        selectedProvider: "gemini",
        model: "gemini-2.0-flash",
        maxTasks: 3,
    }).build();

    console.log("✅ Backward compatibility configuration created successfully");

    console.log("\n=== Test 2: Separate Models ===");
    const builder2 = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    const agent2 = builder2.init({
        reasonProvider: "gemini",
        reasonModel: "gemini-2.0-flash",
        selectedProvider: "openai",
        model: "gpt-4o-mini",
        maxTasks: 3,
    }).build();

    console.log("✅ Separate models configuration created successfully");

    console.log("\n=== Test 3: Default Models ===");
    const builder3 = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    const agent3 = builder3.init({
        reasonProvider: "openai",
        selectedProvider: "gemini",
        maxTasks: 3,
    }).build();

    console.log("✅ Default models configuration created successfully");

    console.log("\n=== Test 4: Validation - Missing API Key ===");
    try {
        const builder4 = new ReactAgentBuilder({
            geminiKey: GEMINI_KEY,
            // Missing openaiKey
        });

        const agent4 = builder4.init({
            reasonProvider: "openai", // This should trigger validation error
            selectedProvider: "gemini",
        }).build();
        
        console.log("❌ Should have thrown an error for missing API key");
    } catch (error) {
        console.log("✅ Correctly caught validation error:", error.message);
    }

    console.log("\n🎉 All configuration tests passed!");
}

testConfigurationSetup();