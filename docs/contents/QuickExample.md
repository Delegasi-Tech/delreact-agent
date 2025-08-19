---
id: quick-example
slug: /resources/quick-example
title: DelReact Quick Example
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This page provides a minimal, end-to-end example of using the DelReact framework to build and run an agent for itinerary planning. The code below demonstrates initialization, configuration, and execution of a simple agent workflow.

## Example: Ranukumbolo Camping Itinerary Agent

```typescript title="example/cases/quickExample.ts"
// Self commentary: Minimal DelReact agent example—initializes, configures, runs an itinerary planning task, and prints results.
import dotenv from "dotenv"; // Loads environment variables from .env file
import { ReactAgentBuilder } from "../../core"; // Import the main agent builder from DelReact core

dotenv.config(); // Initialize environment variables

// Retrieve API keys from environment variables (replace with your actual keys or set in .env)
const OPENAI_KEY = process.env.OPENAI_KEY || "<openai-key>";
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || "<brave-api-key>";

const main = async () => {
    const agent = new ReactAgentBuilder({
        openaiKey: OPENAI_KEY,
        braveApiKey: BRAVE_API_KEY,
        useEnhancedPrompt: true            // Enable prompt enhancement for deeper analysis
    })
    .init({
        selectedProvider: 'openai',        // Use OpenAI as the LLM provider
        model: 'gpt-4o-mini',         // Model name (see provider docs)
        maxTasks: 8,                       // Max steps for the workflow
    })
    .build();

    const result = await agent.invoke({
        objective: "I want to have 2-3 options for Ranukumbolo Camping itinerary for Solo Camping. Including visit around Malang too in 3 Days 2 Nights already including camping",
        outputInstruction: "Group it based on Itinerary Types. Make it itinerary chronologically by days, hours, activities i.e 'Day 1 - 14:00 - <activities>'"
    });

    // 5. Return the agent's final output (conclusion)
    return result;
}

// Run the main workflow and handle results/errors
main().then((result) => {
    console.log("Agent completed");
    console.log("Objective:", result.fullState.objective);
    console.log("Actioned Task:", result.fullState.actionedTasks);
    console.log("Conclusion:", result.conclusion);
}).catch((error) => {
    console.error("Error occurred during business analysis:", error);
});
```

---

- **File location:** `example/cases/quickExample.ts`
- **Purpose:** Demonstrates a minimal DelReact agent workflow for itinerary planning.
- **How to run:** Ensure your `.env` contains valid API keys, then run with `ts-node` or compile and execute.

---

See the [Agent Builder Reference](/ReactAgentBuilder-Quick-Reference) for more details on customizing agents and workflows.
