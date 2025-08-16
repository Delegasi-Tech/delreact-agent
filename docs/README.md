# DelReact Agent Documentation website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Installation

```bash
npm install
```

## Local Development

```bash
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deploy

The documentation is automatically deployed to GitHub Pages using GitHub Actions.

### Automatic Deployment
- **Trigger**: Automatically deploys when files in `docs/` directory are pushed to `main` branch
- **Workflow**: Uses `.github/workflows/deploy-docs.yml`
- **Process**: Builds Docusaurus site and deploys to GitHub Pages
- **No manual intervention required**

### Manual Deployment (if needed)
If you need to deploy without pushing code:
1. Go to Actions tab in GitHub
2. Select "Deploy Docusaurus to GitHub Pages" workflow
3. Click "Run workflow" button

### Deployment Details
- **Environment**: GitHub Pages
- **Node Version**: 18
- **Build Command**: `npm run build`
- **Output Directory**: `docs/build/`
- **Concurrency**: Prevents multiple deployments running simultaneously

## Documentation Structure

This documentation covers:
- **ReactAgentBuilder**: Main agent orchestration and workflow management
- **SubgraphBuilder**: Context-safe execution with method chaining
- **Tool System**: Registry-based tool management with MCP integration
- **RAG Integration**: Vector search and retrieval capabilities
- **MCP Integration**: Model Context Protocol server support
- **Memory Systems**: In-memory, PostgreSQL, and Redis support

## Contributing

### How to Contribute to Documentation

1. **Make Changes**: Edit markdown files in the `docs/` directory
2. **Test Locally**: Run `npm start` to preview changes
3. **Commit & Push**: Push to `main` branch
4. **Auto-Deploy**: GitHub Actions automatically builds and deploys

### What You Can Contribute

- **New Guides**: Add comprehensive documentation for new features
- **Quick References**: Create cheat sheets for common tasks
- **Examples**: Add code examples and use cases
- **Troubleshooting**: Document common issues and solutions
- **Updates**: Keep existing docs current with framework changes

### Documentation Standards

- Use clear, concise language
- Include practical code examples
- Add links between related documents
- Test all code snippets before committing
- Follow the existing markdown structure

## Local Testing

Before pushing changes, test locally:
```bash
npm start          # Start development server
npm run build      # Test build process
npm run serve      # Test built site locally
```


