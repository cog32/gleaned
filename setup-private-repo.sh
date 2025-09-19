#!/bin/bash

# Setup script for creating private copies of public repositories with COVID integration
# Usage: ./setup-private-repo.sh PROJECT_NAME PUBLIC_REPO_URL COVID_TYPE
# Example: ./setup-private-repo.sh my-app https://github.com/cog32/my-public-repo.git covid-n

set -e

# Configuration
PROJECT_NAME="$1"
PUBLIC_REPO_URL="$2"
COVID_TYPE="${3:-node}"  # Default to node if not specified

# Validate inputs
if [ -z "$PROJECT_NAME" ] || [ -z "$PUBLIC_REPO_URL" ]; then
    echo "Usage: $0 PROJECT_NAME PUBLIC_REPO_URL [COVID_TYPE]"
    echo ""
    echo "PROJECT_NAME:     Name for the new private repository"
    echo "PUBLIC_REPO_URL:  URL of the public repository to sync from"
    echo "COVID_TYPE:       node, python, rust, etc."
    echo ""
    echo "Examples:"
    echo "  $0 my-app https://github.com/cog32/my-public-repo.git node"
    echo "  $0 data-viz https://github.com/cog32/public-viz.git python"
    echo "  $0 rust-cli https://github.com/cog32/public-cli.git rust"
    exit 1
fi

# COVID core repository (language agnostic)
COVID_CORE_REPO="https://github.com/cog32/covid.git"

# Supported COVID types and their specific configurations
declare -A COVID_CONFIGS=(
    ["node"]="Node.js/TypeScript"
    ["python"]="Python"
    ["rust"]="Rust"
)

COVID_CONFIG="${COVID_CONFIGS[$COVID_TYPE]}"
if [ -z "$COVID_CONFIG" ]; then
    echo "Error: Unsupported COVID type '$COVID_TYPE'"
    echo "Supported types: ${!COVID_CONFIGS[@]}"
    exit 1
fi

# Extract repo details
PUBLIC_REPO_NAME=$(basename "$PUBLIC_REPO_URL" .git)
PRIVATE_REPO_NAME="${PROJECT_NAME}-covid"
PUBLIC_REPO_OWNER=$(echo "$PUBLIC_REPO_URL" | sed -E 's|https://github.com/([^/]+)/.*|\1|')

echo "=== Setting up private repository ==="
echo "Project name: $PROJECT_NAME"
echo "Public repo: $PUBLIC_REPO_URL"
echo "Private repo: $PRIVATE_REPO_NAME"
echo "COVID type: $COVID_TYPE"
echo "COVID config: $COVID_CONFIG"
echo ""

# Create directory and initialize
mkdir -p "$PRIVATE_REPO_NAME"
cd "$PRIVATE_REPO_NAME"
git init

# Clone and copy files from public repo
echo "Copying files from public repository..."
git clone "$PUBLIC_REPO_URL" temp_public
cd temp_public

# Copy all files except .git
find . -maxdepth 1 -not -name "." -not -name ".git" -exec cp -r {} .. \;
cd ..
rm -rf temp_public

# Create Copybara configuration
cat > copy.bara.sky << EOF
"""
Copybara configuration for bidirectional sync between public $PUBLIC_REPO_NAME and private $PRIVATE_REPO_NAME repositories.

Rules:
- Sync all files that exist in public repo
- Sync tests directory if it exists in public repo
- Keep features directory in private repo if it doesn't exist in public repo
- Never sync $COVID_TYPE directory (private only)
"""

# Configuration for syncing FROM public $PUBLIC_REPO_NAME TO private $PRIVATE_REPO_NAME
public_to_private = core.workflow(
    name = "public_to_private",
    origin = git.github_origin(
        url = "$PUBLIC_REPO_URL",
        ref = "main",
    ),
    destination = git.github_destination(
        url = "https://github.com/cog32/$PRIVATE_REPO_NAME.git",
        push = "main",
    ),
    origin_files = glob(["**"], exclude = [
        ".git/**",
    ]),
    destination_files = glob(["**"], exclude = [
        # Never overwrite the .covid directory
        ".covid/**",
        # Keep any private-only features if they don't exist in public
        "features/**",
    ]),
    authoring = authoring.overwrite("Copybara <noreply@copybara.com>"),
    transformations = [
        core.move("", ""),
        metadata.replace_text(
            "Copybara import from public $PUBLIC_REPO_NAME repo",
            "🔄 Synced from public $PUBLIC_REPO_NAME repo\\n\\nCo-authored-by: Copybara <noreply@copybara.com>",
        ),
    ],
)

# Configuration for syncing FROM private $PRIVATE_REPO_NAME TO public $PUBLIC_REPO_NAME
private_to_public = core.workflow(
    name = "private_to_public",
    origin = git.github_origin(
        url = "https://github.com/cog32/$PRIVATE_REPO_NAME.git",
        ref = "main",
    ),
    destination = git.github_destination(
        url = "$PUBLIC_REPO_URL",
        push = "main",
    ),
    origin_files = glob(["**"], exclude = [
        # Never sync private-only directories
        ".covid/**",
        ".git/**",
        # Don't sync copybara config
        "copy.bara.sky",
    ]),
    destination_files = glob(["**"], exclude = [
        ".git/**",
    ]),
    authoring = authoring.overwrite("Copybara <noreply@copybara.com>"),
    transformations = [
        metadata.replace_text(
            "Copybara export to public $PUBLIC_REPO_NAME repo",
            "🔄 Synced to public $PUBLIC_REPO_NAME repo\\n\\nCo-authored-by: Copybara <noreply@copybara.com>",
        ),
    ],
)
EOF

# Create sync scripts
cat > sync-scripts.sh << 'EOF'
#!/bin/bash

# Copybara sync scripts for PROJECT_NAME_PLACEHOLDER repository
# Make sure you have Copybara installed: https://github.com/google/copybara

# Sync from public REPO_NAME_PLACEHOLDER TO private PROJECT_NAME_PLACEHOLDER
sync_from_public() {
    echo "Syncing from public REPO_NAME_PLACEHOLDER repo to private PROJECT_NAME_PLACEHOLDER..."
    copybara copy.bara.sky public_to_private --force
}

# Sync from private PROJECT_NAME_PLACEHOLDER TO public REPO_NAME_PLACEHOLDER
sync_to_public() {
    echo "Syncing from private PROJECT_NAME_PLACEHOLDER to public REPO_NAME_PLACEHOLDER repo..."
    copybara copy.bara.sky private_to_public --force
}

# Show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  from-public    Sync changes from public REPO_NAME_PLACEHOLDER repo"
    echo "  to-public      Sync changes to public REPO_NAME_PLACEHOLDER repo"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 from-public   # Pull latest changes from public repo"
    echo "  $0 to-public     # Push your changes to public repo"
}

# Main script logic
case "$1" in
    "from-public")
        sync_from_public
        ;;
    "to-public")
        sync_to_public
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        echo "Error: Unknown command '$1'"
        echo ""
        show_help
        exit 1
        ;;
esac
EOF

# Replace placeholders in sync script
sed -i "" "s/PROJECT_NAME_PLACEHOLDER/$PRIVATE_REPO_NAME/g" sync-scripts.sh
sed -i "" "s/REPO_NAME_PLACEHOLDER/$PUBLIC_REPO_NAME/g" sync-scripts.sh
chmod +x sync-scripts.sh

# Language-specific COVID configuration functions
create_node_covid_config() {
    cat > .covid/package.json << 'EOF'
{
  "name": "@cog32/covid-wrapper",
  "version": "1.0.0",
  "private": true,
  "description": "Node.js wrapper for COVID system",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "covid": "node dist/index.js",
    "test": "jest",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/jest": "^29.0.0",
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
EOF

    cat > .covid/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "core"]
}
EOF

    mkdir -p .covid/src
    cat > .covid/src/index.ts << 'EOF'
/**
 * Node.js wrapper for COVID system
 */

export interface CovidConfig {
  issueNumber?: number;
  invoiceId?: string;
  dryRun?: boolean;
}

export class CovidSystem {
  constructor(private config: CovidConfig = {}) {}

  async initialize(): Promise<void> {
    console.log('Initializing COVID system...');
  }

  async runAgent(agentName: string): Promise<void> {
    console.log(`Running agent: ${agentName}`);
  }

  async processIssue(issueNumber: number): Promise<void> {
    console.log(`Processing issue: ${issueNumber}`);
  }
}

export default CovidSystem;
EOF
}

create_python_covid_config() {
    cat > .covid/pyproject.toml << 'EOF'
[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"

[tool.poetry]
name = "covid-wrapper"
version = "0.1.0"
description = "Python wrapper for COVID system"
authors = ["Your Name <your.email@example.com>"]
readme = "README.md"
packages = [{include = "covid_wrapper", from = "src"}]

[tool.poetry.dependencies]
python = "^3.11"

[tool.poetry.group.dev.dependencies]
pytest = "^7.0.0"
black = "^23.0.0"
flake8 = "^6.0.0"
mypy = "^1.0.0"
EOF

    mkdir -p .covid/src/covid_wrapper
    cat > .covid/src/covid_wrapper/__init__.py << 'EOF'
"""Python wrapper for COVID system"""

from typing import Optional

class CovidConfig:
    def __init__(self, issue_number: Optional[int] = None,
                 invoice_id: Optional[str] = None,
                 dry_run: bool = False):
        self.issue_number = issue_number
        self.invoice_id = invoice_id
        self.dry_run = dry_run

class CovidSystem:
    def __init__(self, config: CovidConfig = None):
        self.config = config or CovidConfig()

    async def initialize(self) -> None:
        print("Initializing COVID system...")

    async def run_agent(self, agent_name: str) -> None:
        print(f"Running agent: {agent_name}")

    async def process_issue(self, issue_number: int) -> None:
        print(f"Processing issue: {issue_number}")
EOF
}

create_rust_covid_config() {
    cat > .covid/Cargo.toml << 'EOF'
[package]
name = "covid-wrapper"
version = "0.1.0"
edition = "2021"
description = "Rust wrapper for COVID system"

[dependencies]
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[dev-dependencies]
tokio-test = "0.4"
EOF

    mkdir -p .covid/src
    cat > .covid/src/lib.rs << 'EOF'
//! Rust wrapper for COVID system

use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct CovidConfig {
    pub issue_number: Option<u32>,
    pub invoice_id: Option<String>,
    pub dry_run: bool,
}

impl Default for CovidConfig {
    fn default() -> Self {
        Self {
            issue_number: None,
            invoice_id: None,
            dry_run: false,
        }
    }
}

pub struct CovidSystem {
    config: CovidConfig,
}

impl CovidSystem {
    pub fn new(config: CovidConfig) -> Self {
        Self { config }
    }

    pub async fn initialize(&self) -> Result<(), Box<dyn std::error::Error>> {
        println!("Initializing COVID system...");
        Ok(())
    }

    pub async fn run_agent(&self, agent_name: &str) -> Result<(), Box<dyn std::error::Error>> {
        println!("Running agent: {}", agent_name);
        Ok(())
    }

    pub async fn process_issue(&self, issue_number: u32) -> Result<(), Box<dyn std::error::Error>> {
        println!("Processing issue: {}", issue_number);
        Ok(())
    }
}
EOF
}

# Create .covid directory and add core submodule
echo "Setting up .covid directory with core submodule..."
mkdir -p .covid
git submodule add "$COVID_CORE_REPO" .covid/core

# Create language-specific COVID configuration
case "$COVID_TYPE" in
    "node")
        create_node_covid_config
        ;;
    "python")
        create_python_covid_config
        ;;
    "rust")
        create_rust_covid_config
        ;;
esac

# Create initial commit
git add .
git commit -m "Initial setup of $PRIVATE_REPO_NAME private repository

- Copied core structure from public $PUBLIC_REPO_NAME repo
- Added .covid directory with core submodule for private AI coding files ($COVID_TYPE)
- Set up Copybara configuration for bidirectional sync
- Private repo includes features directory and .covid ($COVID_TYPE)
- Copybara will sync public changes while preserving private content

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Create GitHub repository
echo "Creating GitHub repository..."
gh repo create "cog32/$PRIVATE_REPO_NAME" --private --source=. --remote=origin --push

echo ""
echo "✅ Success! Private repository created:"
echo "🔗 https://github.com/cog32/$PRIVATE_REPO_NAME"
echo ""
echo "Next steps:"
echo "1. Use './sync-scripts.sh from-public' to pull changes from public repo"
echo "2. Use './sync-scripts.sh to-public' to push changes to public repo"
echo "3. Use the .covid/ directory for private AI coding files ($COVID_TYPE)"
echo ""
echo "COVID type: $COVID_TYPE"
echo "Public repo: $PUBLIC_REPO_URL"
echo "Private repo: https://github.com/cog32/$PRIVATE_REPO_NAME"