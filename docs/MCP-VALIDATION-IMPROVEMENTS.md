# MCP Configuration Validation Improvements

## Problem Statement

The initial SSE MCP implementation had a validation gap where:
- `command` field was made optional in `McpServerConfig` interface
- Validation only occurred after transport type detection
- If neither `url` nor `command` was provided, auto-detection could fail silently
- Error messages were unclear when configurations were invalid

## Solution Implemented

### 1. Early Validation (Before Transport Detection)

Added comprehensive validation at the beginning of `connectToServer()`:

```typescript
// Early validation: ensure required fields are present
if (!serverConfig.url && !serverConfig.command) {
  throw new Error(
    `Invalid MCP server configuration for '${serverConfig.name}': ` +
    `Must provide either 'url' (for SSE transport) or 'command' (for stdio transport)`
  );
}
```

### 2. Explicit Transport Validation

When `transport` is explicitly specified, validate the corresponding required field:

```typescript
if (serverConfig.transport) {
  transportType = serverConfig.transport;
  if (transportType === 'sse' && !serverConfig.url) {
    throw new Error(`SSE transport requires 'url' for server: ${serverConfig.name}`);
  }
  if (transportType === 'stdio' && !serverConfig.command) {
    throw new Error(`Stdio transport requires 'command' for server: ${serverConfig.name}`);
  }
}
```

### 3. Safe Auto-Detection

Auto-detection only happens after validation ensures at least one field is present:

```typescript
// Auto-detect transport type based on provided fields
// Safe because we validated that at least one field exists
transportType = serverConfig.url ? 'sse' : 'stdio';
```

### 4. Type Safety with Non-null Assertions

Since validation guarantees the required fields exist, we can safely use non-null assertions:

```typescript
// SSE: url is guaranteed to exist
new SSEClientTransport(new URL(serverConfig.url!), { ... });

// Stdio: command is guaranteed to exist
new StdioClientTransport({ command: serverConfig.command!, ... });
```

## Benefits

1. **Fail Fast**: Invalid configurations are caught immediately with clear error messages
2. **Better DX**: Developers get helpful error messages explaining what's missing
3. **Type Safety**: TypeScript compiler knows required fields exist after validation
4. **No Silent Failures**: All configuration errors are explicit and actionable
5. **Backward Compatible**: Existing valid configurations continue to work

## Error Messages

### Before (Unclear)
```
TypeError: Cannot read property 'url' of undefined
```

### After (Clear and Actionable)
```
Invalid MCP server configuration for 'my-server': 
Must provide either 'url' (for SSE transport) or 'command' (for stdio transport)
```

```
SSE transport requires 'url' for server: my-sse-server
```

```
Stdio transport requires 'command' for server: my-stdio-server
```

## Test Coverage

Created `example/testMcpValidation.ts` with 5 test cases:

1. ❌ Invalid: Neither url nor command
2. ❌ Invalid: SSE transport without url
3. ❌ Invalid: Stdio transport without command
4. ✅ Valid: SSE config with url
5. ✅ Valid: Stdio config with command

## Updated Files

1. **core/mcp/client.ts**
   - Enhanced `connectToServer()` with early validation
   - Added explicit transport type checking
   - Improved error messages

2. **docs/contents/MCP-Integration-Guide.md**
   - Added "Configuration Validation" section
   - Added validation examples (valid vs invalid)
   - Updated error handling documentation

3. **example/testMcpValidation.ts**
   - Comprehensive validation test suite
   - Covers all error scenarios
   - Demonstrates proper error handling

## Migration Guide

No breaking changes! All valid configurations continue to work:

```typescript
// ✅ Still works: Stdio auto-detect
{ name: "fs", command: "npx", args: [...] }

// ✅ Still works: SSE auto-detect
{ name: "api", url: "https://..." }

// ✅ Still works: Explicit transport
{ name: "fs", transport: 'stdio', command: "npx" }
{ name: "api", transport: 'sse', url: "https://..." }
```

Invalid configurations now fail with clear error messages instead of silent failures or unclear errors.
