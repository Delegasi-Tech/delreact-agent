#!/usr/bin/env node

/**
 * RAG Web Interface Server
 * Serves the web interface and provides API endpoints to interact with the RAG tool
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ragToolDef } from '../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

// Read the HTML file
const htmlContent = readFileSync(join(__dirname, 'rag-web-interface.html'), 'utf-8');

const server = createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlContent);
    return;
  }

  if (req.method === 'POST' && req.url === '/api/rag') {
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const params = JSON.parse(body);
          console.log('RAG API call:', params.action, params);
          
          // Call the actual RAG tool
          const result = await ragToolDef.invoke(params);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(result);
        } catch (error) {
          console.error('RAG tool error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
      });
    } catch (error) {
      console.error('Server error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Server error'
      }));
    }
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`
🧠 DelReact RAG Web Interface Server
=====================================
🌐 Server running at: http://localhost:${PORT}
📖 Open the URL above in your browser to manage your RAG knowledge base

Features:
✅ Add knowledge with optional OpenAI embeddings
✅ Search knowledge (semantic + text-based)
✅ View all knowledge items
✅ Delete individual items
✅ Clear all knowledge
✅ Live statistics and status updates

Press Ctrl+C to stop the server
`);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down RAG server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});