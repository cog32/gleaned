#!/usr/bin/env bash
set -euo pipefail

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
echo "Git hooks installed. Pre-commit will run tests across repo and submodules."
