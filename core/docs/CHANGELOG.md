# ReactAgentBuilder & Workflow API Changelog

## Version 2.0.0 - Builder Pattern & Workflow Object (2025-08-06)

### � Major API Redesign

- **New builder pattern:**
  - Use `init()` for runtime config and `build()` to get a workflow object.
  - The workflow object exposes `invoke`, `config`, `runtimeConfig`, and `result`.
- **Separation of concerns:**
  - Builder is for configuration, workflow object is for execution.
- **Read-only state:**
  - `config`, `runtimeConfig`, and `result` are exposed for inspection.
- **Context-safe invoke:**
  - `invoke` is always bound to the correct context.
- **Backwards compatible:**
  - Legacy `invoke` and `compile` still work for migration.

### Example Usage

```typescript
const builder = new ReactAgentBuilder({ geminiKey: process.env.GEMINI_KEY });
const workflow = builder.init({ model: 'gemini-2.0-flash' }).build();
const result = await workflow.invoke({ objective: 'Analyze remote work benefits and challenges' });
console.log(result.conclusion);
console.log(workflow.result); // latest agent state
```

### Migration
- Replace direct `invoke` calls on the builder with `build()` and use the returned workflow object.
- All previous configuration options are still supported.

### Improvements
- Safer, more composable API for advanced and production use cases
- Easier integration with custom tools and subgraphs
- Better support for runtime overrides and session management

---

## Previous Versions

See earlier changelogs for SubgraphBuilder and legacy API details.
