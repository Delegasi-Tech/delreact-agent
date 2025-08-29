#!/usr/bin/env node

// Simple validation script for llm.txt
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const llmTxtPath = path.join(__dirname, '..', 'llm.txt');

console.log('🔍 Validating llm.txt file...');

try {
  // Check if file exists
  if (!fs.existsSync(llmTxtPath)) {
    console.error('❌ llm.txt file not found');
    process.exit(1);
  }

  // Read file content
  const content = fs.readFileSync(llmTxtPath, 'utf8');

  // Define required sections that should be present
  const requiredSections = [
    'DelReact Agent Framework',
    'Core Architecture',
    'ReactAgentBuilder',
    'Tool System',
    'MCP Integration',
    'Session Memory',
    'Unified File Interface',
    'RAG Integration',
    'Environment Variables',
    'Best Practices'
  ];

  const missingFields = [];

  // Check for required sections
  requiredSections.forEach(section => {
    if (!content.includes(section)) {
      missingFields.push(section);
    }
  });

  // Check for essential code examples
  const requiredCodePatterns = [
    'ReactAgentBuilder',
    'createAgentTool',
    'invoke({',
    'sessionId',
    'files:',
    'mcp:',
    'rag:'
  ];

  requiredCodePatterns.forEach(pattern => {
    if (!content.includes(pattern)) {
      missingFields.push(`Code pattern: ${pattern}`);
    }
  });

  // Validate file size (should be substantial)
  const fileSizeKB = content.length / 1024;
  if (fileSizeKB < 10) {
    missingFields.push('File appears too small (less than 10KB)');
  }

  // Report results
  if (missingFields.length === 0) {
    console.log('✅ llm.txt validation passed!');
    console.log(`📊 File size: ${Math.round(fileSizeKB)}KB`);
    console.log(`📝 Character count: ${content.length}`);
    console.log('🎯 All required sections and code examples found');
  } else {
    console.error('❌ llm.txt validation failed!');
    console.error('Missing required content:');
    missingFields.forEach(field => console.error(`  - ${field}`));
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Error validating llm.txt:', error.message);
  process.exit(1);
}