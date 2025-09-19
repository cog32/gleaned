#!/bin/bash

# COVID-Gleaned Submodule Sync Script
# Syncs both .covid and project submodules to latest versions

set -e

echo "🔄 Syncing COVID-Gleaned submodules..."

# Update .covid (COVID-N automation framework)
echo "📦 Updating COVID-N automation framework..."
cd .covid
git fetch origin
git checkout main
git pull origin main
cd ..

# Update project (Gleaned source)
echo "🌟 Updating Gleaned project source..."
cd project
git fetch origin
git checkout main
git pull origin main
cd ..

# Update submodule references
echo "📝 Updating submodule references..."
git add .covid project
git commit -m "Update submodules: COVID-N and Gleaned to latest versions

🔄 Submodule Sync

- Updated .covid to latest COVID-N automation framework
- Updated project to latest Gleaned source code
- Ensures automation and project are in sync

🤖 Generated with COVID sync script"

echo "✅ Submodules synced successfully!"
echo ""
echo "Current versions:"
echo "  COVID-N: $(cd .covid && git rev-parse --short HEAD)"
echo "  Gleaned: $(cd project && git rev-parse --short HEAD)"