import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder } from "../core";

const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;

async function singleBasicAgent() {
    console.log("🚀 Testing Single Basic Agent");
    const builder = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
    });

    const agent = builder.init({
        selectedProvider: "gemini",
        model: "gemini-2.0-flash",
    }).build();

    const result = await agent.invoke({
        objective: "What is the biggest football club in capital of France?",
    });

    console.log(result);
}

async function multipleBasicAgent() {
    console.log("🚀 Testing Multiple Basic Agent");
    const builder = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    const agentA = builder.init({
        selectedProvider: "gemini",
        model: "gemini-2.0-flash",
        maxTasks: 5,
    }).build();


    const agentB = builder.init({
        selectedProvider: "openai",
        model: "gpt-4.1-mini",
        maxTasks: 3,
    }).build();

    const objectiveA = "What is the biggest football club in capital of France?";
    const objectiveB = "What is the biggest football club in capital of Spain?";

    const result = await Promise.all([
        agentA.invoke({ objective: objectiveA }),
        agentB.invoke({ objective: objectiveB })
    ]);

    console.log(result);
}


async function main() {

    /**
     * ✅ Single Basic Agent
     */
    await singleBasicAgent();

    /**
     * ✅ Multiple Basic Agent
     */
    await multipleBasicAgent();
}

main();