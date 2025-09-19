#!/usr/bin/env python3
"""
Simplified version of extract_feature_from_issue.py for GitHub Actions workflow.
Extracts feature description from a GitHub issue.
"""

import sys
import os
import argparse
from github import Github

def main():
    parser = argparse.ArgumentParser(description='Extract feature from GitHub issue')
    parser.add_argument('--issue', type=int, required=True, help='Issue number')
    args = parser.parse_args()

    # Get GitHub token from environment
    token = os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN')
    if not token:
        print("Error: No GitHub token found in environment", file=sys.stderr)
        sys.exit(1)

    # Initialize GitHub client
    g = Github(token)

    # Get the current repository from environment or assume covid-gleaned
    repo_name = os.environ.get('GITHUB_REPOSITORY', 'cog32/covid-gleaned')
    repo = g.get_repo(repo_name)

    # Get the issue
    try:
        issue = repo.get_issue(args.issue)
    except Exception as e:
        print(f"Error getting issue #{args.issue}: {e}", file=sys.stderr)
        sys.exit(1)

    # Extract feature content
    feature_content = f"""Feature: {issue.title}

{issue.body or ''}

# Labels: {', '.join([label.name for label in issue.labels])}
# Issue URL: {issue.html_url}
# Created: {issue.created_at}
"""

    print(feature_content)

if __name__ == '__main__':
    main()