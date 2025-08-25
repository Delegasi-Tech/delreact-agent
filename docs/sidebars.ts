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
        {
          type: 'doc',
          id: 'quick-install',
          label: 'Quick Install'
        },
        {
          type: 'doc',
          id: 'quick-example',
          label: 'Quick Example (Agent)'
        },
        'ReactAgentBuilder-Quick-Reference',
        'Unified-File-Interface-Guide',
        'Tool-System-Quick-Reference',
        'MCP-Integration-Quick-Reference',
      ],
    },
    {
      type: 'category',
      label: 'Advanced Features',
      items: [
        'RAG-Integration-Quick-Reference',
        'ReactAgentBuilder-CustomWorkflow-Quick-Reference',
      ],
    },
    {
      type: 'category',
      label: 'Complete Guide',
      items: [
        'ReactAgentBuilder-Guide',
        'Tool-System-Guide',
        'MCP-Integration-Guide',
        'Session-Memory-Guide',
        'Separate-Models-Guide',
        'RAG-Integration-Guide',
        'ReactAgentBuilder-CustomWorkflow-Guide',
      ],
    },
    {
      type: 'category',
      label: 'Resources',
      items: [
        'WHAT-IS-AI-AGENT',
        'COMMERCIAL-LICENSE-GUIDE',
      ],
    },
  ],
};

export default sidebars;
