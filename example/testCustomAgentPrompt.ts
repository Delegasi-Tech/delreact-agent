import { ReactAgentBuilder, TaskBreakdownParams, ActionAgentParams, SummarizerAgentParams } from "../core";
import dotenv from "dotenv";
dotenv.config();

const GEMINI_KEY = process.env.GEMINI_KEY || "<your-gemini-key>";
const OPENAI_KEY = process.env.OPENAI_KEY || "<your-openai-key>";


async function testCustomPrompt() {
    console.log("💼 Job Hunting Assistant Example\n");

    const builder = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
        prompts: {
            taskBreakdown: (params: TaskBreakdownParams) => {
                return `You are a career advisor specializing in the Indonesian job market. Break down this objective into practical, actionable steps:

Objective: ${params.objective}

Focus on local opportunities and Indonesian job market trends. Create a step-by-step plan for job hunting.`;
            },

            actionAgent: (params: ActionAgentParams) => {
                return `You are a job search specialist. Research and provide specific information about job opportunities in Indonesia.

Current Task: ${params.currentTask || 'Research job opportunities'}

Include:
- Salary ranges
- Required skills and qualifications
- Top companies hiring
- Application tips
- Job market insights`;
            },

            summarizerAgent: (params: SummarizerAgentParams) => {
                return `You are a career summary expert. Create a clear summary of the job search results.

Results to summarize: ${params.actionResults.length > 0 ? JSON.stringify(params.actionResults) : 'No results available'}

Provide:
- Key job opportunities found
- Required qualifications summary
- Actionable next steps for job seekers
- Salary insights and market trends`;
            },
        }
    }).init({
        selectedProvider: 'gemini',
        model: 'gemini-2.0-flash',
        debug: true,
    });

    console.log(`Configured Prompts : `)
    console.log(builder.getConfiguredPrompts());

    const result = await builder.build().invoke({
        objective: "Find high-demand tech jobs in Indonesia, including software developer, data analyst, and digital marketing positions. Research salary ranges, required skills, and top companies hiring.",
    });

    console.log("✅ Job Research Completed!");
    console.log("📝 Result:", result);
}


async function testDefaultPrompts() {
    console.log("🔄 Testing Default Prompts...\n");

    const builder = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    }).init({
        selectedProvider: 'gemini',
        model: 'gemini-2.0-flash',
        debug: true,
    });

    console.log(`Configured Prompts : `)
    console.log(builder.getConfiguredPrompts());

    const result = await builder.build().invoke({
        objective: "Find high-demand tech jobs in Indonesia, including software developer, data analyst, and digital marketing positions. Research salary ranges, required skills, and top companies hiring.",
    });

    console.log("✅ Default Job Search Completed!");
    console.log("📝 Result:", result);
}

async function main() {
    try {
        console.log("🚀 Job Hunting Assistant Examples\n");
        console.log("=".repeat(50) + "\n");

        console.log("\n" + "=".repeat(50) + "\n");

        // Test 1: Default prompts for comparison
        await testDefaultPrompts();

        // Test 2: Custom job hunting prompts
        await testCustomPrompt();

        console.log("\n" + "=".repeat(50) + "\n");
        console.log("✅ All job hunting examples completed!");

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

// Run the example
main();