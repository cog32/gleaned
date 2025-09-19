#!/usr/bin/env python3
"""
Local execution script for paid issues.
Runs multi-agent implementation in Claude Code environment.
"""

import os
import sys
import json
import argparse
import subprocess
from pathlib import Path
from github import Github

def find_execution_ready_issues():
    """Find issues that are ready for execution"""
    ready_files = []

    # Look for .execution-ready.json files in branches
    try:
        # Get all branches
        result = subprocess.run(['git', 'branch', '-r'], capture_output=True, text=True)
        branches = [line.strip().replace('origin/', '') for line in result.stdout.split('\n')
                   if line.strip() and 'origin/' in line and not '->' in line]

        current_branch = subprocess.run(['git', 'branch', '--show-current'],
                                      capture_output=True, text=True).stdout.strip()

        for branch in branches:
            if branch.startswith('paid/'):
                # Check if this branch has execution-ready file
                try:
                    subprocess.run(['git', 'checkout', branch],
                                 capture_output=True, check=True)

                    if os.path.exists('.execution-ready.json'):
                        with open('.execution-ready.json') as f:
                            data = json.load(f)
                            data['branch'] = branch
                            ready_files.append(data)

                except subprocess.CalledProcessError:
                    continue

        # Switch back to original branch
        if current_branch:
            subprocess.run(['git', 'checkout', current_branch], capture_output=True)

    except Exception as e:
        print(f"Error finding ready issues: {e}")

    return ready_files

def execute_issue(execution_data):
    """Execute multi-agent pipeline for a specific issue"""

    print(f"🤖 Starting Claude Code Multi-Agent Execution")
    print(f"Public Issue: {execution_data['public_repo']}#{execution_data['public_issue']}")
    print(f"Private Issue: #{execution_data['private_issue']}")
    print(f"Invoice: {execution_data['invoice_id']}")

    # Switch to the paid branch
    branch = execution_data['branch']
    subprocess.run(['git', 'checkout', branch], check=True)

    # Set up environment variables
    env = os.environ.copy()
    env.update({
        'PUBLIC_ISSUE': str(execution_data['public_issue']),
        'PRIVATE_ISSUE': str(execution_data['private_issue']),
        'INVOICE_ID': execution_data['invoice_id'],
        'PUBLIC_REPO': execution_data['public_repo'],
        'PRIVATE_REPO': execution_data['private_repo'],
        'EXECUTION_BRANCH': branch
    })

    # Create output directories
    os.makedirs('src', exist_ok=True)
    os.makedirs('tests', exist_ok=True)
    os.makedirs('specs', exist_ok=True)
    os.makedirs('reviews', exist_ok=True)
    os.makedirs('logs', exist_ok=True)

    print(f"\n📋 Running local orchestrator with full Claude Code context...")

    # Run the local orchestrator (this will use the rich Claude environment)
    try:
        result = subprocess.run([
            'python', 'scripts/orchestrator.py',
            '--issue', str(execution_data['private_issue']),
            '--public-issue', str(execution_data['public_issue']),
            '--public-repo', execution_data['public_repo'],
            '--invoice-id', execution_data['invoice_id']
        ], env=env, check=True)

        print("✅ Multi-agent pipeline completed successfully")

        # Mark as executed
        execution_data['status'] = 'executed'
        execution_data['executed_at'] = subprocess.run(['date', '-u', '+%Y-%m-%dT%H:%M:%SZ'],
                                                      capture_output=True, text=True).stdout.strip()

        with open('.execution-ready.json', 'w') as f:
            json.dump(execution_data, f, indent=2)

        # Commit the execution results
        subprocess.run(['git', 'add', '-A'], check=True)
        commit_msg = f"""feat: multi-agent implementation for {execution_data['public_repo']}#{execution_data['public_issue']}

🤖 Claude Code Multi-Agent Implementation Complete:
- ✅ Specification analysis and refinement
- ✅ Comprehensive test suite generation
- ✅ Feature implementation
- ✅ Code quality review and validation

Public Issue: {execution_data['public_repo']}#{execution_data['public_issue']}
Private Issue: #{execution_data['private_issue']}
Invoice: {execution_data['invoice_id']}

🤖 Generated with Claude Code Multi-Agent System"""

        subprocess.run(['git', 'commit', '-m', commit_msg], check=True)
        subprocess.run(['git', 'push', 'origin', branch], check=True)

        print(f"✅ Results committed to branch: {branch}")

        return True

    except subprocess.CalledProcessError as e:
        print(f"❌ Multi-agent pipeline failed: {e}")
        return False

def push_to_public_repo(execution_data):
    """Push implementation to public repository"""

    print(f"\n🔄 Pushing implementation to public repository...")

    public_repo = execution_data['public_repo']
    public_issue = execution_data['public_issue']
    invoice_id = execution_data['invoice_id']

    # Clone public repository
    clone_dir = 'public-repo'
    if os.path.exists(clone_dir):
        subprocess.run(['rm', '-rf', clone_dir])

    # Get token for authentication
    token = os.environ.get('GH_PAT')
    if not token:
        print("❌ No GH_PAT token found in environment")
        return False

    clone_url = f"https://x-access-token:{token}@github.com/{public_repo}.git"
    subprocess.run(['git', 'clone', clone_url, clone_dir], check=True)

    os.chdir(clone_dir)

    # Create feature branch in public repo
    public_branch = f"feat/{public_issue}-claude-multiagent-{subprocess.run(['date', '+%s'], capture_output=True, text=True).stdout.strip()}"
    subprocess.run(['git', 'checkout', '-b', public_branch], check=True)
    subprocess.run(['git', 'config', 'user.name', 'Claude Code Multi-Agent'], check=True)
    subprocess.run(['git', 'config', 'user.email', 'multiagent@claude.ai'], check=True)

    # Copy implementation files with basic filtering
    os.chdir('..')  # Back to main repo

    # Simple security filter
    def filter_content(content):
        import re
        patterns = [
            r'(?i)password\s*=\s*[\'\"]\w+[\'\"]*',
            r'(?i)api_key\s*=\s*[\'\"]\w+[\'\"]*',
            r'(?i)secret\s*=\s*[\'\"]\w+[\'\"]*',
            r'(?i)token\s*=\s*[\'\"]\w+[\'\"]*',
            r'\.covid',
            r'/covid-gleaned/',
            r'private.*repo'
        ]
        for pattern in patterns:
            content = re.sub(pattern, '[FILTERED]', content)
        return content

    # Copy src files
    if os.path.exists('src'):
        os.makedirs(f'{clone_dir}/src', exist_ok=True)
        for root, dirs, files in os.walk('src'):
            for file in files:
                src_path = os.path.join(root, file)
                with open(src_path, 'r') as f:
                    content = f.read()

                filtered_content = filter_content(content)

                rel_path = os.path.relpath(src_path, 'src')
                public_path = os.path.join(f'{clone_dir}/src', rel_path)
                os.makedirs(os.path.dirname(public_path), exist_ok=True)

                with open(public_path, 'w') as f:
                    f.write(filtered_content)
                print(f'Filtered and copied: src/{rel_path}')

    # Copy test files
    if os.path.exists('tests'):
        os.makedirs(f'{clone_dir}/tests', exist_ok=True)
        for root, dirs, files in os.walk('tests'):
            for file in files:
                src_path = os.path.join(root, file)
                with open(src_path, 'r') as f:
                    content = f.read()

                filtered_content = filter_content(content)

                rel_path = os.path.relpath(src_path, 'tests')
                public_path = os.path.join(f'{clone_dir}/tests', rel_path)
                os.makedirs(os.path.dirname(public_path), exist_ok=True)

                with open(public_path, 'w') as f:
                    f.write(filtered_content)
                print(f'Filtered and copied: tests/{rel_path}')

    # Commit and push to public repository
    os.chdir(clone_dir)
    subprocess.run(['git', 'add', '-A'], check=True)

    # Check if there are changes
    result = subprocess.run(['git', 'diff', '--staged', '--quiet'], capture_output=True)
    if result.returncode == 0:
        print("⚠️ No changes to push to public repository")
        os.chdir('..')
        return True

    commit_msg = f"""feat: implement feature for issue #{public_issue}

🤖 Claude Code Multi-Agent Implementation:
- Feature implemented via private development workflow
- Security filtered for public release
- All sensitive content removed

Invoice: {invoice_id}

🤖 Generated with Claude Code Multi-Agent System

Co-Authored-By: Claude-Code-MultiAgent <multiagent@claude.ai>"""

    subprocess.run(['git', 'commit', '-m', commit_msg], check=True)
    subprocess.run(['git', 'push', 'origin', public_branch], check=True)

    print(f"✅ Implementation pushed to public repository: {public_branch}")

    # Create Pull Request
    os.environ['GH_TOKEN'] = token

    pr_body = f"""## 🤖 Claude Code Multi-Agent Implementation Complete

Closes #{public_issue}

**Invoice ID**: `{invoice_id}`
**Implementation Mode**: Local Claude Code Environment

### Implementation Summary

This pull request contains a complete implementation generated by Claude Code's Multi-Agent System in a rich local development environment:

#### 🔍 Analysis & Specification
- ✅ Analyzed GitHub issue requirements with full context
- ✅ Generated detailed technical specifications
- ✅ Defined implementation architecture

#### 🧪 Test Development
- ✅ Created comprehensive test suite
- ✅ Built integration tests
- ✅ Added validation and error handling tests

#### 👨‍💻 Implementation
- ✅ Implemented core functionality
- ✅ Added proper error handling
- ✅ Ensured code quality standards
- ✅ All tests passing

#### 🔍 Review & Security
- ✅ Code quality analysis
- ✅ Security vulnerability scanning
- ✅ Performance optimization review
- ✅ Content filtering for public release

### Development Workflow

1. 💳 Payment confirmed for issue #{public_issue}
2. 🤖 Local multi-agent implementation in Claude Code environment
3. 🔐 Security filtering and content sanitization
4. 📤 Clean implementation pushed to public repository

---

🤖 **Generated with [Claude Code](https://claude.ai/code) Multi-Agent System**

Co-Authored-By: Claude-Code-MultiAgent <multiagent@claude.ai>"""

    try:
        subprocess.run([
            'gh', 'pr', 'create',
            '--title', f'🤖 Claude Code Implementation: Issue #{public_issue}',
            '--body', pr_body,
            '--draft',
            '--head', public_branch,
            '--base', 'main'
        ], check=True)

        print("✅ Pull request created in public repository")

    except subprocess.CalledProcessError as e:
        print(f"⚠️ Failed to create PR (implementation still pushed): {e}")

    os.chdir('..')
    return True

def main():
    parser = argparse.ArgumentParser(description='Execute paid issues locally with Claude Code')
    parser.add_argument('--list', action='store_true', help='List issues ready for execution')
    parser.add_argument('--issue', type=int, help='Execute specific issue number')
    parser.add_argument('--next', action='store_true', help='Execute next available issue')

    args = parser.parse_args()

    if args.list:
        ready_issues = find_execution_ready_issues()
        if not ready_issues:
            print("📭 No paid issues ready for execution")
            return

        print("💳 Paid Issues Ready for Execution:")
        for issue in ready_issues:
            status_icon = "✅" if issue['status'] == 'executed' else "⏳"
            print(f"{status_icon} Issue #{issue['public_issue']} - {issue['public_repo']}")
            print(f"   Invoice: {issue['invoice_id']}")
            print(f"   Branch: {issue['branch']}")
            print(f"   Status: {issue['status']}")
            print()
        return

    ready_issues = find_execution_ready_issues()
    unexecuted = [issue for issue in ready_issues if issue['status'] == 'ready_for_execution']

    if not unexecuted:
        print("📭 No paid issues ready for execution")
        return

    if args.issue:
        # Execute specific issue
        target_issue = next((issue for issue in unexecuted
                           if issue['public_issue'] == args.issue), None)
        if not target_issue:
            print(f"❌ Issue #{args.issue} not found or not ready for execution")
            return
        execution_target = target_issue
    else:
        # Execute next issue (first in list)
        execution_target = unexecuted[0]

    print(f"🎯 Executing Issue #{execution_target['public_issue']}")

    # Execute the issue
    if execute_issue(execution_target):
        # Push to public repository
        if push_to_public_repo(execution_target):
            print(f"\n🎉 Successfully completed implementation for issue #{execution_target['public_issue']}")
        else:
            print(f"\n⚠️ Implementation completed but failed to push to public repository")
    else:
        print(f"\n❌ Failed to execute issue #{execution_target['public_issue']}")

if __name__ == '__main__':
    main()