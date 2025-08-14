# Contributing to DelReact

Welcome! Thank you for your interest in contributing to DelReact Agent. This guide will help you get started as a new developer and ensure a smooth onboarding process.

---

## Project Philosophy
DelReact is an open, extensible framework for building robust, multi-step AI agent workflows. We value extensible and high level abstraction to wrap AI LLM complexity from vibe/early coder while extending flexibility for advanced developer. We hope discussion and contribution thoughtful collaboration.

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
You could see in `.github/copilot-instructions.md` to be used with your preferred LLM IDE Assistant

---

## Branching & Pull Requests
- Create feature branches from `main` or the latest development branch.
- Use descriptive branch names (e.g., `feat/agent-logging`, `fix/tool-registry-bug`).
- Write clear, concise commit messages.
- Open a Pull Request (PR) with a detailed description of your changes.
- Reference related issues in your PR.
- Ensure all checks pass before requesting review.
- Ensure to have issues first to discuss before opening a PR

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
- Place new core in `core` or group it if it complex under `core` folder.
- Add new tools in `core/tools/` and register them in the tool registry.
- Follow the createAgentTool patterns (see code and docs).
- Add documentation for new core/tools in `/docs` if needed.

---

## Reporting Issues & Requesting Features
- Use [GitHub Issue](https://github.com/Delegasi-Tech/DelReAct-Agent/issues)s to report bugs or request features.
- Provide clear steps to reproduce bugs or detailed feature requirements.
- Discuss with us with your ideas

---

## Documentation & Help
- See the `/docs` folder for guides and references:
  - [ReactAgentBuilder Guide](./docs/ReactAgentBuilder-Guide.md)
  - [Tool System Guide](./docs/Tool-System-Guide.md)
  - [RAG Integration Guide](./docs/RAG-Integration-Guide.md)
- For questions, open a GitHub Issues or contact a maintainer.

---

## License & Contributor Notice
By contributing, you agree that your contributions will be licensed under the Apache License 2.0. Commercial use of DelReact requires explicit written permission from the author/company. See LICENSE and NOTICE for details.

---

Thank you for helping make DelReact-Agent better!
