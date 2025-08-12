import { aiResearchAssistant, marketingResearchAssistant } from "./cases/researchAssistant";

async function spesificResearch() {

    const result1 = await aiResearchAssistant.invoke(
        {
            objective: "Explain the key contributions of the Transformer and why self-attention replaces recurrence/convolution.",
            sessionId: "AIResearcher-Spesific",
        });


    console.log(result1);

}

async function multiResearch() {
    const result1 = await marketingResearchAssistant.invoke({
        objective: "Explain what is the relation between traditional marketing and marketing in AI era.",
        sessionId: "MarketingResearcher-Multi",
    });

    console.log(result1);

}

function main() {
    
    spesificResearch();
    multiResearch();
}

main();