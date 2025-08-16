// Example: Content Creation Agent with DelReact
// This script demonstrates how to use the DelReact agent framework to automate content generation for social media.

import dotenv from "dotenv"; // Loads environment variables from .env file
import { ReactAgentBuilder } from "../../core"; // Import the main agent builder from DelReact core
// import { ReactAgentBuilder } from "delreact-agent"; // (For npm package usage)

dotenv.config(); // Initialize environment variables

// Retrieve API keys from environment variables (replace with your actual keys or set in .env)
const GEMINI_KEY = process.env.GEMINI_KEY || "<gemini-key>"; 
const OPENAI_KEY = process.env.OPENAI_KEY || "<openai-key>";

/**
 * Main entry point for the content creation workflow.
 * Builds and runs a DelReact agent to generate Instagram captions with emotional hooks.
 */
const main = async () => {
    // 1. Build the agent using ReactAgentBuilder
    //    - Configure LLM providers (Gemini, OpenAI)
    //    - Optionally enable prompt enhancement
    const agent = new ReactAgentBuilder({
        geminiKey: process.env.GEMINI_KEY, // Google Gemini API key
        openaiKey: process.env.OPENAI_KEY, // OpenAI API key (optional)
        useEnhancedPrompt: true           // Set to true to auto-improve prompts
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
        objective: "Create hooks and captions for Instagram Post about Indonesia Corruption regarding Indonesian StartUp Fraud.",
        outputInstruction: "1-2 paragraphs caption, with emotional hooks in markdown format Bahasa Indonesia. Just content without any discussions"
    });

    // 5. Return the agent's final output (conclusion)
    return result.conclusion;
}

// Run the main workflow and handle results/errors
main().then((conclusion) => {
    console.log("Content creation completed");
    // Print the generated Instagram caption
    console.log("Conclusion:", conclusion);
    /*
    **Startup Indonesia: Antara Inovasi dan Korupsi**  
Di balik gemerlap cerita sukses startup Indonesia, tersembunyi praktik korupsi yang merusak masa depan ekosistem wirausaha. Kasus penggelapan dana, penipuan investasi, dan penyalahgunaan dana hibah pemerintah menjadi pengingat bahwa regulasi yang lemah membuka celah bagi penipuan dan meruntuhkan kepercayaan publik. Inilah saatnya kita bersama-sama menuntut transparansi dan akuntabilitas demi melindungi inovasi dan pertumbuhan ekonomi bangsa.

Apakah kita akan diam melihat masa depan startup Indonesia hancur oleh korupsi? Mari bangkit, suarakan perubahan, dan wujudkan ekosistem bisnis yang jujur dan terpercaya. Bersama, kita bisa melawan praktik curang dan memastikan kesempatan yang adil bagi setiap inovator untuk berkembang tanpa hambatan. #StopKorupsi #StartupBersih #TransparansiIndustri
    */
}).catch((error) => {
    // Print any errors that occurred during agent execution
    console.error("Error occurred during content creation:", error);
});