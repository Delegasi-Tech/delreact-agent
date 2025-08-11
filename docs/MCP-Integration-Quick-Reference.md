# MCP Integration Quick Reference

Quick reference for using MCP (Model Context Protocol) servers with DelReact agents.

## Basic Setup

```typescript
import { ReactAgentBuilder } from "delreact-agent";

const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  mcp: {
    servers: [
      {
        name: "filesystem",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
      }
    ]
  }
}).build();
```

## Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `servers` | `McpServerConfig[]` | Array of MCP server configurations |
| `autoRegister` | `boolean` | Auto-register tools (default: true) |
| `operationTimeout` | `number` | Timeout in milliseconds |

## Server Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | ✅ | Unique server identifier |
| `command` | `string` | ✅ | Command to start server |
| `args` | `string[]` | ❌ | Command arguments |
| `env` | `object` | ❌ | Environment variables |
| `timeout` | `number` | ❌ | Connection timeout |

## Common Servers

### Filesystem
```typescript
{
  name: "filesystem",
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
}
```

### Git
```typescript
{
  name: "git", 
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-git", "/repo/path"]
}
```

### SQLite
```typescript
{
  name: "sqlite",
  command: "npx", 
  args: ["-y", "@modelcontextprotocol/server-sqlite", "/db/path"]
}
```

## Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `addMcpServers(config)` | Add MCP configuration | `ReactAgentBuilder` |
| `getMcpStatus()` | Get connection status | `Record<string, boolean>` |
| `cleanup()` | Disconnect all servers | `Promise<void>` |

## Tool Naming

MCP tools are prefixed with server name:
- Original: `read_file`
- DelReact: `filesystem--read_file`

## Example Usage

```typescript
// 1. Configure agent with MCP
const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  mcp: { servers: [/* configs */] }
}).build();

// 2. Use agent (MCP tools auto-available)
const result = await agent.invoke({
  objective: "List and analyze project files"
});

// 3. Check status
console.log("MCP Status:", agent.getMcpStatus());

// 4. Cleanup
await agent.cleanup();
```

## Error Handling

- Connection failures don't break other servers
- Tool execution errors are isolated
- Timeouts prevent hanging operations
- Invalid schemas handled gracefully

## Best Practices

1. ✅ Always call `cleanup()` when done
2. ✅ Use appropriate timeouts
3. ✅ Only connect to trusted servers
4. ✅ Test connections independently
5. ✅ Handle errors gracefully