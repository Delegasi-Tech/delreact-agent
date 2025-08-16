import dotenv from "dotenv";
dotenv.config();

import { AccountSupportAgent, GeneralSupportAgent, BillingSupportAgent, TechnicalSupportAgent, builder, GateQuestionAgent, IdentifyIssueAgent, RequestFeedbackAgent, SummarizeInteractionAgent } from "./cases/customerSupport";
import { AgentState } from "../core";
/**
 * Condition Functions for Routing
 */

const shouldProceedCondition = (state: AgentState): boolean => {
    const lastResult = state.lastActionResult || '';
    const result = lastResult.toLowerCase().includes('yes');
    console.log("🔍 shouldProceedCondition - returning:", result);
    return result;
};

const issueCategoryCondition = (state: AgentState): string => {
    const lastResult = state.lastActionResult || '';
    console.log("🔍 issueCategoryCondition - lastResult:", lastResult);

    if (lastResult.toLowerCase().includes('billing')) {
        console.log("🔍 issueCategoryCondition - returning: billing");
        return 'billing';
    }
    if (lastResult.toLowerCase().includes('technical')) {
        console.log("🔍 issueCategoryCondition - returning: technical");
        return 'technical';
    }
    if (lastResult.toLowerCase().includes('account')) {
        console.log("🔍 issueCategoryCondition - returning: account");
        return 'account';
    }

    console.log("🔍 issueCategoryCondition - returning: default");
    return 'default'; // Use 'default' to match the switch case
};




/**
 * Customer Service Workflow Agents
 */
async function buildComplexWorkflow() {
    /**
     * Build and Run the Workflow using the Path-Specific Builder API
     */
    const mainFlow = builder.createWorkflow("CustomerServiceWorkflow", {
        debug: true,
        timeout: 80000,
    });

    mainFlow.start(GateQuestionAgent);

    const { ifTrue: successPath, ifFalse: feedbackPath } = mainFlow.branch({
        condition: shouldProceedCondition,
        ifTrue: IdentifyIssueAgent,
        ifFalse: RequestFeedbackAgent,
    });

    const { billing, technical, account, default: general } = successPath.switch({
        condition: issueCategoryCondition,
        cases: {
            "billing": BillingSupportAgent,
            "technical": TechnicalSupportAgent,
            "account": AccountSupportAgent,
        },
        default: GeneralSupportAgent
    });

    // The feedback path has no more steps after the initial agent.

    // Merge all endpoints back into the main flow to proceed to the final step.
    mainFlow.merge([billing, technical, account, general, feedbackPath])
        .then(SummarizeInteractionAgent);

    return mainFlow.build();
}

async function buildSimpleWorkflow() {
    return builder.createWorkflow("CustomerServiceWorkflow", {
        timeout: 40000,
        retries: 2,
        debug: true,
    })
    .start(GateQuestionAgent)
    .then(GeneralSupportAgent)
    .then(SummarizeInteractionAgent)
    .build();
}

async function main() {
    try {

        // Test different scenarios
        const scenarios = [
            "I have a problem with my latest invoice, it seems incorrect. Can you help me?",
            "I can't log into my account, how do I reset my password?",
            "The software keeps crashing when I try to export data.",
            "What are your business hours and return policy?",
            "No thanks, I'm just browsing."
        ];

        console.log("🚀 Testing Individual Agent Execution with 3-Phase Workflow");
        console.log("=" .repeat(80));
        
        // Test 1: Individual agent execution using invoke()
        const individualAgent = builder.createAgent({
            name: "CustomerSupportAgent",
            model: "gemini-1.5-flash",
            provider: "gemini",
            description: "Analyze customer issues and provide appropriate support responses",
            apiKey: process.env.GEMINI_KEY!
        });

        const individualResult = await individualAgent.invoke(scenarios[1], {
            debug: true
        });
        
        console.log("📋 Individual Agent Result:");
        console.log("  Planned Task:", individualResult.plannedTask);
        console.log("  Result:", individualResult.result);
        console.log();

        console.log("🚀 Testing Workflow Execution with Multiple Agents");
        console.log("=" .repeat(80));

        // Test 2: Simple workflow execution
        const simpleWorkflow = await buildSimpleWorkflow();
        const simpleResult = await simpleWorkflow.invoke({
            objective: scenarios[1]
        });

        console.log("📋 Simple Workflow Result:");
        console.log(simpleResult.conclusion);
        console.log();

        for (const scenario of scenarios) {
            // Test 3: Complex workflow execution (commented out but ready to use)
            console.log("🚀 Testing Complex Workflow Execution");
            console.log("=" .repeat(80));
            
            const complexWorkflow = await buildComplexWorkflow();
            const complexResult = await complexWorkflow.invoke({
                objective: scenario // Account issue to test routing and RAG knowledge retrieval
            });
            
            console.log("📋 Complex Workflow Result:");
            console.log(complexResult.conclusion);
        }

    } catch (error) {
        console.error("\n❌ An error occurred during workflow execution:", error);
    }
}

main();