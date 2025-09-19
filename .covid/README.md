# .covid Directory

This directory contains the COVID (Coin Operated Vibe Interactive Development) system for this project.

## Structure

```
.covid/
├── core/          # Git submodule - main COVID repository
├── package.json   # Node.js specific dependencies and scripts
├── tsconfig.json  # TypeScript configuration
└── src/           # Project-specific COVID extensions
```

## Core System

The `core/` directory is a git submodule pointing to the main COVID repository. This contains the language-agnostic COVID system including:

- BDD specifications
- Agent definitions
- Core workflows
- Payment integration
- GitHub issue management

## Node.js Integration

This directory provides Node.js/TypeScript specific tooling and extensions on top of the core COVID system.

## Usage

```bash
# Install dependencies
cd .covid && npm install

# Run COVID system
npm run covid

# Update core system
cd core && git pull origin main && cd .. && git add core
```