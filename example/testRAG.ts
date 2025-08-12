import { aiResearchAssistant, marketingResearchAssistant } from "./cases/researchAssistant";

async function specificResearch() {
    const resultResearch = await aiResearchAssistant.invoke(
        {
            objective: "Explain the key contributions of the Transformer and why self-attention replaces recurrence/convolution.",
            sessionId: "AIResearcher-Specific",
        });

    console.log(resultResearch);
}

async function multiResearch() {
    const resultResearch = await marketingResearchAssistant.invoke({
        objective: "Explain what is the relation between traditional marketing and marketing in AI era.",
        sessionId: "MarketingResearcher-Multi",
    });

    console.log(resultResearch);
}

async function main() {
    await specificResearch();
    await multiResearch();
}

main();