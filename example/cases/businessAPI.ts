// Example: Business Intelligence Agent with DelReact
// This script demonstrates how to use the DelReact agent framework to automate business analysis tasks, such as competitor research and market insights.

import dotenv from "dotenv"; // Loads environment variables from .env file
import { ReactAgentBuilder } from "../../core"; // Import the main agent builder from DelReact core
// import { ReactAgentBuilder } from "delreact-agent"; // (For npm package usage)

dotenv.config(); // Initialize environment variables

// Retrieve API keys from environment variables (replace with your actual keys or set in .env)
const GEMINI_KEY = process.env.GEMINI_KEY || "<gemini-key>"; 
const OPENAI_KEY = process.env.OPENAI_KEY || "<openai-key>";

/**
 * Main entry point for the business intelligence workflow.
 * Builds and runs a DelReact agent to analyze competitor pricing strategies and generate actionable insights.
 */
const main = async () => {
    // 1. Build the agent using ReactAgentBuilder
    //    - Configure LLM providers (Gemini, OpenAI)
    //    - Enable prompt enhancement for better business analysis prompts
    const agent = new ReactAgentBuilder({
        geminiKey: process.env.GEMINI_KEY, // Google Gemini API key
        openaiKey: process.env.OPENAI_KEY, // OpenAI API key (optional)
        useEnhancedPrompt: true            // Enable prompt enhancement for deeper analysis
    })
    // 2. Initialize agent with workflow options
    //    - Select LLM provider and model
    //    - Set max number of tasks (steps)
    .init({
        selectedProvider: 'openai',        // Use OpenAI as the LLM provider
        model: 'gpt-4.1-mini',         // Model name (see provider docs)
        maxTasks: 8,                       // Max steps for the workflow
    })
    // 3. Build the agent instance
    .build();

    // 4. Invoke the agent with your objective and output instructions
    //    - 'objective': What you want the agent to accomplish
    //    - 'outputInstruction': Format and style for the output
    const result = await agent.invoke({
        objective: "Analyze competitor pricing strategies in the Accounting SaaS market in Indonesia recently",
        outputInstruction: "A JSON format object with properties: summary, insights, recommendations"
    });

    // 5. Return the agent's final output (conclusion)
    return result.conclusion;
}

// Run the main workflow and handle results/errors
main().then((conclusion) => {
    console.log("Business analysis completed");
    // Print the generated business insights and recommendations
    console.log("Conclusion:", conclusion);
    /*
    {
  "summary": "The Indonesian Accounting SaaS market is led by key competitors Jurnal, Sleekr, Moka, Zahir, and Accurate. Pricing strategies vary: Jurnal and Sleekr use tiered subscription models targeting SMEs with scalable features, priced between IDR 199K-750K/month with occasional to moderate discount promotions. Moka adopts a usage-based pricing starting at IDR 150K/month with limited-time free trials appealing to startups. Zahir offers fixed monthly plans from IDR 180K to 550K focusing on budget-conscious users with intermittent discount offers. Accurate positions as a premium tiered subscription provider from IDR 300K to 700K/month, frequently using bundle promotions. Over the past 6 months, moderate price increases and more promotional activities reflect intensifying market competition.",
  "insights": "Accurate maintains market leadership through frequent promotions and comprehensive premium features. Jurnal and Sleekr effectively attract growing SMEs by offering flexible, scalable subscription tiers. Moka’s usage-based model suits startups but results in limited market share. Zahir holds a smaller, price-sensitive niche with stable pricing. Discount practices impact competitive positioning, with Accurate and Sleekr being more aggressive in promotions than others.",
  "recommendations": "To strengthen market position, competitors could tailor discount strategies to increase customer acquisition and retention. Mid-tier providers like Jurnal and Sleekr should continue enhancing scalable features to attract SMEs. Moka could expand promotion frequency to grow market share among startups. Accurate should leverage its premium positioning while monitoring tier pricing to maintain competitiveness. Zahir might explore value-added features or more frequent promotions to expand beyond its niche."
}
    */
}).catch((error) => {
    // Print any errors that occurred during agent execution
    console.error("Error occurred during business analysis:", error);
});