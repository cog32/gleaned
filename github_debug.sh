# From *inside* the repo
pwd
git remote -v
git rev-parse --is-inside-work-tree

# Show *where* each setting came from
git config --show-origin --list

# Show repo-only, then global config
git config --local -l
git config --global -l

# Which Git binary your shell uses
which git
git --version

# SSH: which keys are loaded?
echo "$SSH_AUTH_SOCK"
ssh-add -l 2>/dev/null || echo "no keys in agent"

# How ssh would connect to GitHub (dry-run of config resolution)
#ssh -G github.com | sed -n '1,120p'

# Test your auth to GitHub (won't mutate anything)
#ssh -T git@github.com -v 2>&1 | sed -n '1,60p'

