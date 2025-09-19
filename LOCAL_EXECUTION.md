# Local Multi-Agent Execution

This system separates payment processing from code execution to leverage the full Claude Code environment for implementation.

## How It Works

1. **Payment Processing** (GitHub Actions): Handles Stripe webhooks and sets up paid issues
2. **Local Execution** (This Machine): Runs multi-agent implementation with full Claude Code context

## Commands

### Execute Next Paid Issue

```bash
npm run next-issue
```

Automatically finds and executes the next available paid issue.

### List Paid Issues

```bash
npm run list-paid
```

Shows all issues that have been paid for and their execution status.

### Execute Specific Issue

```bash
npm run execute-issue 123
```

Execute a specific issue number (if it's been paid for).

## Manual Execution

You can also run the script directly:

```bash
# Execute next available issue
python scripts/execute_paid_issue.py --next

# List all paid issues
python scripts/execute_paid_issue.py --list

# Execute specific issue
python scripts/execute_paid_issue.py --issue 123
```

## Workflow

### 1. Payment Confirmed

When a Stripe payment is confirmed:

- GitHub Actions creates a `paid/` branch
- Adds `.execution-ready.json` with payment metadata
- Comments on the private issue that it's ready for execution

### 2. Local Execution

When you run `npm run next-issue`:

- Finds paid issues in `paid/` branches
- Switches to the paid branch
- Runs full multi-agent pipeline with Claude Code context
- Commits results to private repository
- Filters and pushes implementation to public repository
- Creates Pull Request in public repository

### 3. Results

- Implementation branch in private repository
- Clean, filtered implementation in public repository
- Professional Pull Request ready for review

## Environment Requirements

- `.covid/core/.venv` activated Python environment
- `GH_PAT` environment variable for GitHub access
- All dependencies from core installed

## Security

The local execution includes security filtering to:

- Remove sensitive patterns (passwords, tokens, etc.)
- Filter private repository paths
- Clean content before pushing to public repository
