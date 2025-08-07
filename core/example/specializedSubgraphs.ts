// src/core/example/specializedSubgraphs.ts
import { SubgraphBuilder } from "../SubgraphBuilder";
import { 
  ContentResearchAgent, 
  ContentStrategyAgent, 
  ContentCreationAgent 
} from "./specializedAgents";

// ============================================================================
// CONTENT CREATION SUBGRAPHS
// ============================================================================

/**
 * Content Creation Pipeline - Specialized for blog posts, articles, marketing content
 * 
 * Flow: Content Research → Content Strategy → Content Creation
 * 
 * This subgraph is designed for creating high-quality, research-backed content
 * that follows SEO best practices and engages target audiences effectively.
 */
export const ContentCreationSubgraph = SubgraphBuilder
  .create("ContentCreation")
  .start(ContentResearchAgent, { 
    temperature: 0.3, 
    maxTokens: 500 
  })
  .then(ContentStrategyAgent, { 
    temperature: 0.2, 
    maxTokens: 500 
  })
  .then(ContentCreationAgent, {
    temperature: 0.4,
    maxTokens: 2500
  })
  .withConfig({
    errorStrategy: "retry",
    timeout: 45000,
    retries: 2
  })
  .build(); 