// Example: Stock Market News Analysis Agent with DelReact
// This script demonstrates how to use the DelReact agent framework to automate financial news research and structured market analysis.

import dotenv from "dotenv"; // Loads environment variables from .env file
import { ReactAgentBuilder } from "../../core"; // Import the main agent builder from DelReact core
// import { ReactAgentBuilder } from "delreact-agent"; // (For npm package usage)

dotenv.config(); // Initialize environment variables

// Retrieve API keys from environment variables (replace with your actual keys or set in .env)
const GEMINI_KEY = process.env.GEMINI_KEY || "<gemini-key>"; 
const OPENAI_KEY = process.env.OPENAI_KEY || "<openai-key>";

/**
 * Main entry point for the stock news analysis workflow.
 * Builds and runs a DelReact agent to research and analyze ENRG stock news in Indonesia, outputting structured insights.
 */
const main = async () => {
    // 1. Build the agent using ReactAgentBuilder
    //    - Configure LLM providers (Gemini, OpenAI)
    //    - Enable prompt enhancement for more relevant financial analysis
    const agent = new ReactAgentBuilder({
        geminiKey: process.env.GEMINI_KEY, // Google Gemini API key
        openaiKey: process.env.OPENAI_KEY, // OpenAI API key (optional)
        useEnhancedPrompt: true            // Enable prompt enhancement for deeper market insights
    })
    // 2. Initialize agent with workflow options
    //    - Select LLM provider and model
    //    - Set max number of tasks (steps)
    .init({
        selectedProvider: 'openai',        // Use Gemini as the LLM provider
        model: 'gpt-4.1-mini',         // Model name (see provider docs)
        maxTasks: 8,                       // Max steps for the workflow
    })
    // 3. Build the agent instance
    .build();

    // 4. Invoke the agent with your financial research objective and output instructions
    //    - 'objective': The stock news or market question to analyze
    //    - 'outputInstruction': Specify structured output for financial reporting
    const result = await agent.invoke({
        objective: "Research and analyze ENRG Stock News Indonesia?",
        outputInstruction: "Present it in structured sections: Summary, Key Insights, Industry Insight, Market Impact, Future Outlook"
    });

    // 5. Return the agent's final output (conclusion)
    return result.conclusion;
}

// Run the main workflow and handle results/errors
main().then((conclusion) => {
    console.log("Stock news analysis completed");
    // Print the generated market insights and structured report
    console.log("Conclusion:", conclusion);
    /*
    Summary:  
ENRG stock in Indonesia has received extensive coverage from reputable sources such as Jakarta Globe, The Jakarta Post, Kontan.co.id, Bloomberg Indonesia, CNBC Indonesia, and Reuters. Recent developments include securing new energy contracts, forming strategic renewable energy partnerships, reporting quarterly revenue growth, expanding operations in Southeast Asia, and facing regulatory scrutiny on environmental compliance.

Key Insights:  
- ENRG’s revenue increased by 12% year-over-year with a 5% improvement in profit margins.  
- Consistent dividend payouts, moderate debt, and positive cash flow trends support financial stability.  
- Strategic partnerships and expansion efforts are key growth drivers.  
- Regulatory scrutiny presents a notable risk factor.

Industry Insight:  
The renewable energy sector in Indonesia is growing, with companies like ENRG expanding regionally and securing new contracts. Regulatory compliance remains a critical challenge affecting operational risks.

Market Impact:  
ENRG’s stock price increased by 8% in the last quarter, outperforming the Jakarta Composite Index by 6% over the past year. Positive developments have boosted investor confidence, despite some volatility linked to regulatory and geopolitical risks.

Future Outlook:  
Opportunities for growth include continued expansion in Southeast Asia and renewable energy projects. Risks from environmental regulatory scrutiny and geopolitical tensions could impact market performance moving forward. Overall, ENRG is positioned for steady growth with manageable risks.
    */
}).catch((error) => {
    // Print any errors that occurred during agent execution
    console.error("Error occurred during stock news analysis:", error);
});
