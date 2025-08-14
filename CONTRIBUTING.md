# Contributing to DelReact

Welcome! Thank you for your interest in contributing to DelReact Agent. This guide will help you get started as a new developer and ensure a smooth onboarding process.

---

## Project Philosophy
DelReact is an open, extensible framework for building robust, multi-step AI agent workflows. We value high-level abstractions that simplify LLM complexities for most uses, while providing flexibility for advanced uses. We encourage thoughtful collaboration through discussions and contributions.

---

## Development Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Delegasi-Tech/DelReact-Agent.git
   cd DelReact-Agent
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   - Copy `.env.tmp` to `.env` and fill in required keys (see README for details).
4. **Start the demo:**
   ```bash
   npm run demo
   ```

---

## Coding Standards
- Use **TypeScript** with strict typing.
- Follow existing code style and naming conventions.
- Use `npm run lint` and `npm run format` before submitting code.
- Write clear, maintainable, and DRY code.

### LLM Instructions
You can find instructions in `.github/copilot-instructions.md` to use with your preferred LLM-powered IDE assistant

---

## Branching & Pull Requests
- Create feature branches from `main` or the latest development branch.
- Use descriptive branch names (e.g., `feat/agent-logging`, `fix/tool-registry-bug`).
- Write clear, concise commit messages.
- Open a Pull Request (PR) with a detailed description of your changes.
- Reference related issues in your PR.
- Ensure all checks pass before requesting review.
- Ensure you create an issue to discuss changes before opening a PR.  

---

## Testing
- Add or update tests for new features and bug fixes.
- Run tests locally before pushing:
  ```bash
  npm run test
  ```
- Ensure your changes do not break existing functionality.

---

## Adding New Core & Tools
- Place new core components in the `core` directory. If a component is complex, group its files within a dedicated subfolder inside `core`.
- Add new tools in `core/tools/` and register them in the tool registry.
- Follow the createAgentTool patterns (see code and docs).
- Add documentation for new core/tools in `/docs` if needed.

---

## Reporting Issues & Requesting Features
- Use [GitHub Issues](https://github.com/Delegasi-Tech/DelReact-Agent/issues) to report bugs or request features. 
- Provide clear steps to reproduce bugs or detailed feature requirements.
- Discuss your ideas with us.

---

## Documentation & Help
- See the `/docs` folder for guides and references:
  - [ReactAgentBuilder Guide](./docs/contents/ReactAgentBuilder-Guide.md)
  - [Tool System Guide](./docs/contents/Tool-System-Guide.md)
  - [RAG Integration Guide](./docs/contents/RAG-Integration-Guide.md)
- For questions, open a GitHub Issues or contact a maintainer.

---

## License & Contributor Notice
By contributing, you agree that your contributions will be licensed under the Apache License 2.0. Commercial use of DelReact requires explicit written permission from the author/company. See LICENSE and NOTICE for details.

---

Thank you for helping make DelReact-Agent better!
