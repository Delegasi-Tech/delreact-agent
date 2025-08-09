import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder } from "./core";

const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPEN_AI_KEY;

async function singleBasicAgent() {
    const builder = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
    });

    const agent = builder.init({
        selectedProvider: "gemini",
        model: "gemini-2.0-flash",
    }).build();

    const result = await agent.invoke({
        objective: "What is the capital of France?",
    });

    console.log(result);
}

async function multipleBasicAgent() {
    const builder = new ReactAgentBuilder({
        geminiKey: GEMINI_KEY,
        openaiKey: OPENAI_KEY,
    });

    const agentA = builder.init({
        selectedProvider: "gemini",
        model: "gemini-2.0-flash",
    }).build();


    const agentB = builder.init({
        selectedProvider: "openai",
        model: "gpt-4.1-mini",
    }).build();

    const objective = "What is the capital of France?";

    const result = await Promise.all([
        agentA.invoke({ objective }),
        agentB.invoke({ objective })
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