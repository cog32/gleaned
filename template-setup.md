# Private Repository Template Setup

## Option 1: GitHub Template Repository (Easiest)

### Setup Once:
1. Create a template repository: `cog32/private-project-template`
2. Include:
   - `copy.bara.sky` (parameterized)
   - `sync-scripts.sh`
   - `.gitmodules` with covid-n submodule
   - `setup-private-repo.sh` script

### For Each New Project:
1. Click "Use this template" on GitHub
2. Run: `./setup-private-repo.sh PROJECT_NAME PUBLIC_REPO_URL`
3. Script automatically:
   - Updates Copybara config with correct URLs
   - Copies files from public repo
   - Initializes submodules
   - Makes initial commit

## Option 2: GitHub CLI Script (Most Flexible)

### One command setup:
```bash
./create-private-copy.sh my-project https://github.com/cog32/my-public-repo.git
```

## Option 3: GitHub Actions Workflow (Automated)

### Trigger:
- Manual dispatch
- Webhook from public repo updates
- Scheduled sync

### Benefits:
- Fully automated syncing
- No local Copybara installation needed
- Configurable sync schedules