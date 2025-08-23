// Example: Multi-Provider LLM Prompt Comparison Agent with DelReact
// This script demonstrates how to use the DelReact agent framework to generate and compare creative prompts from multiple LLM providers for the same task.

import dotenv from "dotenv"; // Loads environment variables from .env file
import { ReactAgentBuilder } from "../../core"; // Import the main agent builder from DelReact core
// import { ReactAgentBuilder } from "delreact-agent"; // (For npm package usage)

dotenv.config(); // Initialize environment variables

// Retrieve API keys from environment variables (replace with your actual keys or set in .env)
const GEMINI_KEY = process.env.GEMINI_KEY || "<gemini-key>";
const OPENAI_KEY = process.env.OPENAI_KEY || "<openai-key>";
const OPENROUTER_KEY = process.env.OPENROUTER_KEY || "<openrouter-key>";

/**
 * Main entry point for the multi-provider prompt comparison workflow.
 * Builds and runs DelReact agents with different LLM providers/models to generate and compare creative prompts for image generation.
 */
const main = async () => {
    // 1. Build the agent builder with API keys for all supported providers
    //    - Configure Gemini and OpenRouter (OpenAI-compatible) providers
    //    - Enable prompt enhancement for richer, more detailed outputs
    const agentBuilder = new ReactAgentBuilder({
        openaiKey: OPENAI_KEY, // OpenAI API key
        geminiKey: GEMINI_KEY, // Google Gemini API key
        openrouterKey: OPENROUTER_KEY, // OpenRouter API key (now using dedicated key)
        useEnhancedPrompt: true   // Enable prompt enhancement for creative prompt generation
    })

    // 2. Initialize and build agents for each provider/model you want to compare
    //    - openaiAgent: OpenAI GPT-4.1-mini
    //    - gemini25Agent: Google Gemini 2.5 Flash (via OpenRouter)
    //    - gemini20Agent: Google Gemini 2.0 Flash (native Gemini)
    const openaiAgent = agentBuilder.init({
        selectedProvider: 'openai',        // Use OpenAI as the LLM provider
        model: 'gpt-4.1-mini',         // Model name (see provider docs)
        maxTasks: 8,                          // Max steps for the workflow
    }).build();

    const gemini25Agent = agentBuilder.init({
        selectedProvider: 'openrouter',        // Use OpenRouter as the LLM provider
        model: 'google/gemini-2.5-flash',     // Gemini 2.5 via OpenRouter
        maxTasks: 8,
    }).build();

    const gemini20Agent = agentBuilder.init({
        selectedProvider: 'gemini',            // Use Gemini native API
        model: 'gemini-2.0-flash',            // Gemini 2.0 Flash
        maxTasks: 8,
    }).build();

    // 3. Define the creative prompt generation task
    //    - 'objective': What you want the LLMs to generate (a detailed image prompt)
    //    - 'outputInstruction': How the output should be structured (detailed, context-rich)
    const agentParams = {
        objective: "Generate a descriptive prompt for LLM Image Generation for a 'Female Model use Jeans Casual'",
        outputInstruction: "Make it detailed prompt for LLM know context, settings and visual"
    }

    // 4. Run all agents in parallel to get outputs from each provider/model
    const researches = await Promise.all([
        openaiAgent.invoke(agentParams),
        gemini25Agent.invoke(agentParams),
        gemini20Agent.invoke(agentParams)
    ]);

    // 5. Collect and label results for easy comparison
    const results = [
        { provider: 'OpenAI (native)', conclusion: researches[0].conclusion },
        { provider: 'Gemini 2.5 (via OR)', conclusion: researches[1].conclusion },
        { provider: 'Gemini 2.0 (native)', conclusion: researches[2].conclusion }
    ]

    // 6. Return the array of results for review/comparison
    return results;
}

// Run the main workflow and handle results/errors
main().then((conclusion) => {
        console.log("Multi-provider prompt review completed");
        // Print the generated prompts from each LLM provider/model for comparison
        console.log("Conclusion:", conclusion);
        /*
        Conclusion: [
        {
            provider: 'OpenAI (native)',
            conclusion: 'Create an image of a confident young woman with medium-length wavy brown hair and light makeup, wearing slim-fit, mid-rise blue denim jeans with slight distressing and rolled cuffs. She stands with one hand in her pocket, a slight hip tilt, and a relaxed smile, embodying a natural, relaxed expression. The setting is an urban street featuring graffiti walls, illuminated by soft natural daylight with warm tones and gentle shadows. She wears a white fitted t-shirt, a light denim jacket draped over her shoulders, and white low-top sneakers. The overall mood is relaxed and confident, blending urban cool with effortless, casual style.'
        },
        {
            provider: 'Gemini 2.5 (via OR)',
            conclusion: 'Prompt for LLM Image Generator:\n' +
            '\n' +
            '**Context:** Female model, 20-30 years old, brunette, athletic build.\n' +
            '**Outfit:** High-waisted, light wash skinny jeans with a white crop top.\n' +
            '**Pose:** Standing, leaning against a brick wall, hands in pockets.\n' +
            '**Setting:** Urban alleyway, daytime.\n' +
            '**Visual Style:** Realistic photograph.\n' +
            '\n' +
            '**Full Prompt:** A realistic photograph of a 20-30 year old female model with brunette hair and an athletic build. She is wearing high-waisted, light wash skinny jeans and a white crop top. The model is standing, leaning against a brick wall with her hands in her pockets, in an urban alleyway during the daytime.'
        },
        {
            provider: 'Gemini 2.0 (native)',
            conclusion: 'A full-body photograph of a young female model casually leaning against a weathered red brick wall in a sunlit urban alleyway. The model has a slightly tilted head, relaxed smile, one hand in her light wash distressed jeans (slight fading on thighs, small rip at the knee) pocket, and the other resting on the wall. She wears a soft cotton, slightly loose-fitting white t-shirt with rolled-up sleeves and classic, slightly worn but clean, white canvas sneakers. The alleyway features sunlight streaks, shadows, some graffiti, and a visible trash can. Golden hour lighting provides a warm, soft glow, with a shallow depth of field, focusing on the model and softly blurring the background. The overall image should convey effortless style and youthful energy, enhanced by her natural pose, relaxed expression, and slightly messy hair.\n'
        }
        ]

        */
}).catch((error) => {
        // Print any errors that occurred during agent execution
        console.error("Error occurred during multi-provider prompt review:", error);
});
