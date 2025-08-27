# llm.txt Maintenance Guide

This guide provides instructions for updating and maintaining the `llm.txt` file as DelReact features evolve.

## Purpose

The `llm.txt` file serves as a comprehensive, LLM-friendly documentation aggregation that enables AI assistants (like GitHub Copilot) to understand DelReact's architecture, features, and usage patterns. This allows developers to get accurate help and guidance when working with DelReact in their IDEs.

## Structure

The `llm.txt` file is organized in the following sections:

1. **Core Architecture** - Overview of DelReact's 5-stage workflow
2. **ReactAgentBuilder** - Main orchestration class documentation
3. **Tool System** - Built-in and custom tool development
4. **MCP Integration** - Model Context Protocol support
5. **Session Memory** - Context continuity and memory management
6. **Unified File Interface** - Multimodal file handling
7. **RAG Integration** - Vector search and retrieval
8. **Custom Workflows** - Multi-agent orchestration
9. **Examples** - Common usage patterns
10. **Configuration** - Environment variables and settings
11. **Best Practices** - Recommended approaches

## When to Update

Update `llm.txt` when:

- **New features are added** to DelReact core components
- **API changes** are made to existing functionality
- **New configuration options** are introduced
- **Breaking changes** occur that affect usage patterns
- **New example use cases** are developed
- **Documentation in `/docs/contents/` is updated** with significant changes

## How to Update

### 1. Review Source Documentation

Before updating `llm.txt`, review the source documentation files:

- `docs/contents/ReactAgentBuilder-Guide.md`
- `docs/contents/Tool-System-Guide.md`
- `docs/contents/MCP-Integration-Guide.md`
- `docs/contents/Session-Memory-Guide.md`
- `docs/contents/Unified-File-Interface-Guide.md`
- `docs/contents/RAG-Integration-Guide.md`

### 2. Update Relevant Sections

Identify which sections of `llm.txt` need updates based on the changes:

- Keep **code examples up-to-date** with current API
- Update **configuration options** when new parameters are added
- Add **new features** to appropriate sections
- Update **interface definitions** when schemas change
- Revise **best practices** based on new recommendations

### 3. Maintain LLM-Friendly Format

When updating, ensure:

- **Clear headings** for easy navigation
- **Concise explanations** without excessive prose
- **Practical code examples** that work out-of-the-box
- **Consistent formatting** throughout the document
- **Logical organization** that flows well for LLM consumption

### 4. Validate Changes

After updating `llm.txt`, run the validation script:

```bash
npm run validate-llm-txt
```

This ensures all required sections and code patterns are present.

### 5. Test with LLMs

When possible, test the updated documentation with AI assistants to ensure:

- **Accurate responses** to DelReact-related questions
- **Correct code suggestions** when developers ask for help
- **Proper understanding** of new features and changes

## Content Guidelines

### Code Examples

- Use **working examples** that developers can copy-paste
- Include **imports and setup** code where necessary
- Show **common patterns** and use cases
- Demonstrate **error handling** where appropriate

### Explanations

- Keep explanations **concise but complete**
- Focus on **practical usage** over implementation details
- Include **context** about when to use specific features
- Provide **alternatives** when multiple approaches exist

### Structure

- Use **consistent section headers** (## for major sections, ### for subsections)
- Organize content **logically** from basic to advanced
- Group **related concepts** together
- Cross-reference **related sections** when helpful

## Quality Checklist

Before committing updates to `llm.txt`, verify:

- [ ] All code examples are syntactically correct
- [ ] Configuration options are up-to-date
- [ ] New features are documented with examples
- [ ] Breaking changes are clearly noted
- [ ] Validation script passes (`npm run validate-llm-txt`)
- [ ] File size is reasonable (target: 15-25KB)
- [ ] Content is LLM-optimized (clear, structured, practical)

## Integration with Development Workflow

Consider integrating `llm.txt` maintenance into your development process:

1. **PR Review Process** - Include `llm.txt` updates in feature PRs
2. **Release Checklist** - Verify `llm.txt` is current before releases
3. **Documentation Reviews** - Update `llm.txt` when `/docs/` content changes
4. **CI/CD Pipeline** - Add validation script to automated testing

## File Location and Distribution

- **Primary location**: `/llm.txt` (repository root)
- **NPM distribution**: Included in package files array
- **Accessibility**: Available to LLMs via GitHub and NPM
- **Backup**: Consider including in documentation builds

By following this maintenance guide, the `llm.txt` file will remain an effective resource for AI-assisted DelReact development.