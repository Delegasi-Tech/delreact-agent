---
sidebar_position: 8
title: MCP Integration Guide
description: Model Context Protocol integration guide
---

# User Guide

This guide explains how to integrate and use tools from external MCP servers in DelReact agents.

## Overview

DelReact supports connecting to external MCP (Model Context Protocol) servers to extend the available tools. MCP servers can provide custom tools that integrate seamlessly with the DelReact tool system.

DelReact supports **two types of MCP transports**:
- **Stdio**: Traditional command-line based MCP servers (local processes)
- **SSE (Server-Sent Events)**: HTTP-based MCP servers (remote services)

### Key Features

- **Automatic Tool Discovery**: Connect to MCP servers and automatically discover available tools
- **Dual Transport Support**: Support for both stdio (local) and SSE (remote) MCP servers
- **Seamless Integration**: MCP tools work alongside built-in DelReact tools
- **Type Safety**: MCP tool schemas are automatically converted to TypeScript-compatible Zod schemas
- **Error Handling**: Robust error handling for MCP server connections and tool execution
- **Multiple Servers**: Support for connecting to multiple MCP servers simultaneously

## Quick Start

### 1. Basic MCP Configuration (Stdio)

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

### 2. SSE MCP Configuration (Remote Servers)

```typescript
const mcpConfig = {
  servers: [
    {
      name: "yfinance",
      transport: 'sse',  // Specify SSE transport
      url: "https://your-mcp-server.example.com/sse",
      headers: {
        // Optional: Add custom headers if needed
        // "Authorization": "Bearer YOUR_TOKEN"
      }
    }
  ],
  autoRegister: true,
  operationTimeout: 30000
};

const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  mcp: mcpConfig
})
.init({
  selectedProvider: 'gemini',
  model: 'gemini-2.0-flash-exp'
})
.build();

// Use SSE MCP tools
const result = await agent.invoke({
  objective: "Get stock information for AAPL",
  outputInstruction: "Provide current price and analysis"
});
```

### 3. Mixed Transport Configuration

You can use both stdio and SSE servers simultaneously:

```typescript
const mcpConfig = {
  servers: [
    // Stdio server (local)
    {
      name: "filesystem",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()]
    },
    // SSE server (remote)
    {
      name: "yfinance",
      transport: 'sse',
      url: "https://your-mcp-server.example.com/sse"
    }
  ],
  autoRegister: true
};
```

### 4. Adding MCP Configuration After Initialization

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
| `transport` | `'stdio' \| 'sse'` | No | Transport type (default: auto-detected from `url` or `command`) |
| `command` | `string` | Conditional | Command to start the MCP server (required for stdio) |
| `args` | `string[]` | No | Arguments to pass to the server command (stdio only) |
| `env` | `Record<string, string>` | No | Environment variables for the server (stdio only) |
| `url` | `string` | Conditional | SSE server URL (required for SSE transport) |
| `headers` | `Record<string, string>` | No | Custom HTTP headers (SSE only) |
| `timeout` | `number` | No | Connection timeout in milliseconds |

**Transport Auto-Detection:**
- If `url` is provided → SSE transport
- If `command` is provided → stdio transport
- Explicitly set `transport` to override auto-detection

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

### Stdio Servers

#### Filesystem Server
```typescript
{
  name: "filesystem",
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
}
```

#### Context7 Documentation Server
```typescript
{
  name: "context7",
  command: "npx",
  args: ["-y", "@upstash/context7-mcp"],
}
```

#### Custom Python Server
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

### SSE Servers

#### Custom SSE Server with Authentication
```typescript
{
  name: "custom-api",
  transport: 'sse',
  url: "https://your-mcp-server.example.com/sse",
  headers: {
    "Authorization": "Bearer YOUR_API_TOKEN",
    "X-Custom-Header": "value"
  }
}
```

## Error Handling

DelReact provides robust error handling for MCP integration:

1. **Configuration Validation**: Early validation of server configurations before connection attempts
   - Ensures either `url` (SSE) or `command` (stdio) is provided
   - Validates required fields based on transport type
   - Provides clear error messages for missing or invalid configurations
2. **Connection Failures**: If an MCP server fails to connect, other servers continue to work
3. **Tool Execution Errors**: Individual tool failures don't crash the agent
4. **Schema Conversion**: Invalid schemas are handled gracefully
5. **Timeouts**: Configurable timeouts prevent hanging operations

### Configuration Validation Examples

```typescript
// ❌ Invalid: Neither url nor command provided
{
  name: "invalid-server"
  // Error: Must provide either 'url' or 'command'
}

// ❌ Invalid: SSE transport without url
{
  name: "invalid-sse",
  transport: 'sse'
  // Error: SSE transport requires 'url'
}

// ❌ Invalid: Stdio transport without command
{
  name: "invalid-stdio",
  transport: 'stdio'
  // Error: Stdio transport requires 'command'
}

// ✅ Valid: SSE with url
{
  name: "valid-sse",
  transport: 'sse',
  url: "https://example.com/sse"
}

// ✅ Valid: Stdio with command
{
  name: "valid-stdio",
  command: "npx",
  args: ["-y", "mcp-server"]
}
```

## Troubleshooting

### Common Issues

1. **Stdio Server Not Connecting**
   ```typescript
   // Check if the MCP server command is correct
   // Verify the server is installed and accessible
   // Check environment variables and permissions
   ```

2. **SSE Server Not Connecting**
   ```typescript
   // Verify the URL is accessible
   // Check network connectivity and firewall settings
   // Ensure proper CORS headers if needed
   // Validate authentication headers if required
   ```

3. **Tools Not Discovered**
   ```typescript
   // Ensure the MCP server implements the tools capability
   // Check server logs for errors
   // Verify the server is responding to listTools requests
   // For SSE: Check browser dev tools or server logs for HTTP errors
   ```

4. **Tool Execution Failures**
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
6. **Transport Selection**: Use stdio for local tools, SSE for remote/cloud services
7. **Authentication**: Store API tokens in environment variables, not in code

## Examples

### Example 1: Stdio MCP Integration (Local Filesystem)

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

### Example 2: SSE MCP Integration (Remote Stock Data)

```typescript
import { ReactAgentBuilder } from "delreact-agent";
import dotenv from "dotenv";

dotenv.config();

async function runSseMcpExample() {
  const agent = new ReactAgentBuilder({
    geminiKey: process.env.GEMINI_KEY,
    mcp: {
      servers: [
        {
          name: "yfinance",
          transport: 'sse',
          url: "https://your-mcp-server.example.com/sse"
        }
      ],
      autoRegister: true,
      operationTimeout: 30000
    }
  })
  .init({
    selectedProvider: 'gemini',
    model: 'gemini-2.0-flash-exp'
  })
  .build();

  try {
    // Check MCP connection status
    const mcpStatus = agent.getMcpStatus();
    console.log("MCP Server Status:", mcpStatus);

    const result = await agent.invoke({
      objective: "Get stock information for BBCA.JK and analyze its performance",
      outputInstruction: "Provide current price, market metrics, and brief analysis"
    });

    console.log("Agent Response:", result.conclusion);
    
  } finally {
    // Important: cleanup MCP connections
    await agent.cleanup();
  }
}

runSseMcpExample().catch(console.error);
```

This example demonstrates connecting to an SSE-based MCP server for remote stock data access, using the tools, and properly cleaning up connections.

### Example 3: Mixed Transport Configuration

```typescript
const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  mcp: {
    servers: [
      // Local filesystem access (stdio)
      {
        name: "filesystem",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()]
      },
      // Remote stock data (SSE)
      {
        name: "yfinance",
        transport: 'sse',
        url: "https://your-mcp-server.example.com/sse"
      }
    ],
    autoRegister: true
  }
})
.init({ selectedProvider: 'gemini' })
.build();

// Agent can now use both local file operations and remote stock data
const result = await agent.invoke({
  objective: "Read financial data from ./data/portfolio.csv and compare with current BBCA.JK stock price",
  outputInstruction: "Provide analysis with recommendations"
});
```

This example shows how to combine both stdio (local) and SSE (remote) MCP servers in a single configuration for maximum flexibility.