import dotenv from "dotenv";
import { ReactAgentBuilder } from "../../core";
// import { ReactAgentBuilder } from "delreact-agent";
dotenv.config();

const GEMINI_KEY = process.env.GEMINI_KEY || "<gemini-key>"; 
const OPENAI_KEY = process.env.OPENAI_KEY || "<openai-key>";

const builder = new ReactAgentBuilder({
    geminiKey: GEMINI_KEY,
    openaiKey: OPENAI_KEY,
});


const GateQuestionAgent = builder.createAgent({
    name: "GateQuestion",
    model: "gemini-2.0-flash",
    provider: "gemini",
    description: "Analyze the user's intent. If the user wants to start a support session, your final output must be exactly the single word: 'yes'. Otherwise, output exactly: 'no'. Do not provide any additional explanation or text.",
});

const IdentifyIssueAgent = builder.createAgent({
    name: "IdentifyIssue",
    model: "gpt-4.1-mini",
    provider: "openai",
    description: "Analyze the customer's problem and categorize it into: 'billing' (invoices, payments, charges), 'technical' (software, hardware, connectivity), 'account' (login, profile, permissions), or 'general' (other inquiries). Output exactly one word.",
});

const BillingSupportAgent = builder.createAgent({
    name: "BillingSupport",
    model: "gpt-4o-mini",
    provider: "openai",
    description: "Provide professional billing assistance. Explain charges, help resolve invoice discrepancies, guide payment processes, and offer account balance information. Be helpful and provide actionable next steps."
});

const TechnicalSupportAgent = builder.createAgent({
    name: "TechnicalSupport",
    model: "gemini-2.0-flash-lite",
    provider: "gemini",
    description: "Provide technical troubleshooting assistance. Offer step-by-step solutions for software issues, hardware problems, connectivity troubles, or system errors. Include diagnostic steps when appropriate."
});

const AccountSupportAgent = builder.createAgent({
    name: "AccountSupport",
    model: "gpt-4o-mini",
    provider: "openai",
    description: "Assist with account-related issues including login problems, profile updates, permission changes, password resets, and account security. Provide clear guidance and security best practices."
});

const GeneralSupportAgent = builder.createAgent({
    name: "GeneralSupport",
    model: "gpt-4o-mini",
    provider: "openai",
    description: "Handle general inquiries, product information requests, policy questions, and other non-specialized support needs. Provide helpful information and direct to appropriate resources when needed."
});

const RequestFeedbackAgent = builder.createAgent({
    name: "RequestFeedback",
    model: "gpt-4o-mini",
    provider: "openai",
    description: "Politely request feedback from the customer who declined further assistance. Ask what could be improved, express appreciation for their time, and offer alternative ways to get help if they change their mind."
});

const SummarizeInteractionAgent = builder.createAgent({
    name: "SummarizeInteraction",
    model: "gpt-4o-mini",
    provider: "openai",
    description: "You are a customer service agent. Provide a professional summary to the customer. Recap the customer's issue, the assistance provided, key outcomes, and next steps. Thank the customer and offer continued support availability."
});

export {
    builder,
    GateQuestionAgent,
    IdentifyIssueAgent,
    BillingSupportAgent,
    TechnicalSupportAgent,
    AccountSupportAgent,
    GeneralSupportAgent,
    RequestFeedbackAgent,
    SummarizeInteractionAgent,
}