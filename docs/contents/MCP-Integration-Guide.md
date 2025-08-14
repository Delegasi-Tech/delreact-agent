---
sidebar_position: 8
title: MCP Integration Guide
description: Model Context Protocol integration guide
---

# User Guide

This guide explains how to integrate and use tools from external MCP servers in DelReact agents.

## Overview

DelReact supports connecting to external MCP (Model Context Protocol) servers to extend the available tools. MCP servers can provide custom tools that integrate seamlessly with the DelReact tool system.

### Key Features

- **Automatic Tool Discovery**: Connect to MCP servers and automatically discover available tools
- **Seamless Integration**: MCP tools work alongside built-in DelReact tools
- **Type Safety**: MCP tool schemas are automatically converted to TypeScript-compatible Zod schemas
- **Error Handling**: Robust error handling for MCP server connections and tool execution
- **Multiple Servers**: Support for connecting to multiple MCP servers simultaneously

## Quick Start

### 1. Basic MCP Configuration

```typescript
import { ReactAgentBuilder, McpServerConfig } from "delreact-agent";

const mcpConfig = {
  servers: [
    {
      name: "filesystem",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"],
      env: {
        // Any environment variables needed by the MCP server
      }
    },
    {
      name: "context7",
      command: "npx",
      args: ["-y", "@upstash/context7-mcp"],
    }
  ],
  autoRegister: true, // Automatically register discovered tools
  operationTimeout: 30000 // 30 second timeout for MCP operations
};

const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  openaiKey: process.env.OPENAI_KEY,
  mcp: mcpConfig // Add MCP configuration
})
.init({
  selectedProvider: 'gemini',
  model: 'gemini-2.5-flash'
})
.build();

// Use the agent - MCP tools are automatically available
const result = await agent.invoke({
  objective: "Show me documentation on creating Langgraph Build Graph",
  outputInstruction: "Provide a summary of the function"
});
```

### 2. Adding MCP Configuration After Initialization

```typescript
const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  openaiKey: process.env.OPENAI_KEY
})
.addMcpServers({
  servers: [
    {
      name: "custom-server",
      command: "/path/to/custom/mcp/server",
      args: ["--config", "/path/to/config.json"]
    }
  ]
})
.init({ selectedProvider: 'gemini' })
.build();
```

## Configuration Reference

### McpServerConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | Yes | Unique identifier for the MCP server |
| `command` | `string` | Yes | Command to start the MCP server |
| `args` | `string[]` | No | Arguments to pass to the server command |
| `env` | `Record<string, string>` | No | Environment variables for the server |
| `timeout` | `number` | No | Connection timeout in milliseconds |

### McpConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `servers` | `McpServerConfig[]` | Yes | Array of MCP server configurations |
| `autoRegister` | `boolean` | No | Auto-register discovered tools (default: true) |
| `operationTimeout` | `number` | No | Timeout for MCP operations in milliseconds |

## Tool Naming Convention

MCP tools are automatically prefixed with the server name to avoid conflicts:

```
Original MCP tool: "read_file"
DelReact tool name: "filesystem--read_file"
```

This ensures that tools from different MCP servers don't conflict with each other or with built-in DelReact tools.

## Advanced Usage

### Manual MCP Management

```typescript
import { McpClient } from "delreact-agent";

// Create and manage MCP client directly
const mcpClient = new McpClient({
  servers: [/* server configs */]
});

// Connect to servers
await mcpClient.connect();

// Check connection status
const status = mcpClient.getConnectionStatus();
console.log("Server connections:", status);

// Discover tools
const tools = await mcpClient.discoverTools();

// Add tools to agent manually
const agent = new ReactAgentBuilder(config)
  .addTool(tools)
  .build();

// Cleanup when done
await mcpClient.disconnect();
```

### Checking MCP Status

```typescript
const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  mcp: mcpConfig
}).build();

// Check MCP connection status
const mcpStatus = agent.getMcpStatus();
console.log("MCP Server Status:", mcpStatus);
// Output: { "filesystem": true, "context7": false }
```

### Cleanup

```typescript
// Important: Cleanup MCP connections when done
await agent.cleanup();
```

## Common MCP Servers

Here are some popular MCP servers you can use:

### Filesystem Server
```typescript
{
  name: "filesystem",
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
}
```

### Update Docs by Context7
```typescript
{
  name: "context7",
  command: "npx",
  args: ["-y", "@upstash/context7-mcp"],
}
```

### Custom Server
```typescript
{
  name: "custom",
  command: "python",
  args: ["/path/to/custom_mcp_server.py"],
  env: {
    "API_KEY": process.env.CUSTOM_API_KEY
  }
}
```

## Error Handling

DelReact provides robust error handling for MCP integration:

1. **Connection Failures**: If an MCP server fails to connect, other servers continue to work
2. **Tool Execution Errors**: Individual tool failures don't crash the agent
3. **Schema Conversion**: Invalid schemas are handled gracefully
4. **Timeouts**: Configurable timeouts prevent hanging operations

## Troubleshooting

### Common Issues

1. **Server Not Connecting**
   ```typescript
   // Check if the MCP server command is correct
   // Verify the server is installed and accessible
   // Check environment variables and permissions
   ```

2. **Tools Not Discovered**
   ```typescript
   // Ensure the MCP server implements the tools capability
   // Check server logs for errors
   // Verify the server is responding to listTools requests
   ```

3. **Tool Execution Failures**
   ```typescript
   // Check tool input parameters match the expected schema
   // Verify the MCP server is still connected
   // Review server-specific documentation
   ```

### Debug Mode

Enable debug logging to troubleshoot MCP issues:

```typescript
// MCP client logs connection and tool discovery information
// Check console output for detailed error messages
```

## Best Practices

1. **Resource Management**: Always call `agent.cleanup()` when done
2. **Error Handling**: Wrap MCP operations in try-catch blocks
3. **Security**: Only connect to trusted MCP servers
4. **Performance**: Use appropriate timeouts for your use case
5. **Testing**: Test MCP server connections independently before integrating

## Example: Complete MCP Integration

```typescript
import { ReactAgentBuilder } from "delreact-agent";
import dotenv from "dotenv";

dotenv.config();

async function runMcpExample() {
  const agent = new ReactAgentBuilder({
    geminiKey: process.env.GEMINI_KEY,
    mcp: {
      servers: [
        {
          name: "filesystem",
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
        }
      ],
      autoRegister: true,
      operationTimeout: 30000
    }
  })
  .init({
    selectedProvider: 'gemini',
    model: 'gemini-2.5-flash'
  })
  .build();

  try {
    const result = await agent.invoke({
      objective: "Analyze the project structure and find all TypeScript files",
      outputInstruction: "Provide a summary of the codebase structure"
    });

    console.log("Agent Response:", result.conclusion);
    
    // Check which MCP servers are connected
    const mcpStatus = agent.getMcpStatus();
    console.log("MCP Status:", mcpStatus);
    
  } finally {
    // Important: cleanup MCP connections
    await agent.cleanup();
  }
}

runMcpExample().catch(console.error);
```

This example demonstrates connecting to a filesystem MCP server, using it to analyze a project structure, and properly cleaning up connections.