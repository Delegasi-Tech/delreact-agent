import dotenv from "dotenv";
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ReactAgentBuilder } from '../../core';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

const builder = new ReactAgentBuilder({
    openaiKey: process.env.OPENAI_KEY || '<your-openai-api-key>',
});

// Agent for Specific Paper Research
export const aiResearchAssistant = builder
  .init({
    debug: true,
    rag: {
      vectorFiles: [
        join(__dirname, '../asset/attention-is-all-you-need.json'),
      ],
      embeddingModel: 'text-embedding-3-small',
      topK: 5,
      threshold: 0.5,
    },
  })
  .build();

export const marketingResearchAssistant = builder
  .init({
    debug: true,
    rag: {
      vectorFiles: [
        join(__dirname, '../asset/color-palletes-in-marketing.json'),
        join(__dirname, '../asset/relation-traditional-marketing.json'),
      ],
      embeddingModel: 'text-embedding-3-small',
      topK: 5,
      threshold: 0.5,
    },
  })
  .build();