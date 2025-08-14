import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // DelReact documentation sidebar
  tutorialSidebar: [
    'index',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'ReactAgentBuilder-Guide',
        'ReactAgentBuilder-Quick-Reference',
      ],
    },
    {
      type: 'category',
      label: 'Core Features',
      items: [
        'Tool-System-Guide',
        'Tool-System-Quick-Reference',
        'SubgraphBuilder-Guide',
        'SubgraphBuilder-Quick-Reference',
      ],
    },
    {
      type: 'category',
      label: 'Advanced Features',
      items: [
        'MCP-Integration-Guide',
        'MCP-Integration-Quick-Reference',
        'RAG-Integration-Guide',
        'RAG-Integration-Quick-Reference',
      ],
    },
    {
      type: 'category',
      label: 'Custom Workflows',
      items: [
        'ReactAgentBuilder-CustomWorkflow-Advanced-Configuration',
        'ReactAgentBuilder-CustomWorkflow-Quick-Reference',
      ],
    },
    {
      type: 'category',
      label: 'Resources',
      items: [
        'CHANGELOG',
        'COMMERCIAL-LICENSE-GUIDE',
      ],
    },
  ],
};

export default sidebars;
