#!/usr/bin/env bash
#
# push-to-github.sh — initialize git and push this project to a new GitHub repo.
#
# Usage:
#   ./push-to-github.sh <github-username> <repo-name> [public|private]
#
# Examples:
#   ./push-to-github.sh myname bible-study-bot            # defaults to private
#   ./push-to-github.sh myname bible-study-bot public
#
# Requirements (one of):
#   - GitHub CLI installed and authed:  gh auth login        (preferred — creates the repo for you)
#   - OR a repo you already created on github.com (script will just push to it)
#
set -euo pipefail

USER="${1:-}"
REPO="${2:-}"
VIS="${3:-private}"

if [[ -z "$USER" || -z "$REPO" ]]; then
  echo "Usage: ./push-to-github.sh <github-username> <repo-name> [public|private]"
  exit 1
fi

# Make sure we're in the project root (where package.json lives).
if [[ ! -f package.json ]]; then
  echo "Run this from the project folder (the one containing package.json)."
  exit 1
fi

# 1. Init git if needed.
if [[ ! -d .git ]]; then
  git init
  git branch -M main
fi

git add .
git commit -m "Bible study -> PDF Telegram bot" || echo "(nothing new to commit)"

# 2. Create the remote repo via gh if available; otherwise assume it exists.
if command -v gh >/dev/null 2>&1; then
  if gh repo view "$USER/$REPO" >/dev/null 2>&1; then
    echo "Repo $USER/$REPO already exists — pushing to it."
  else
    echo "Creating GitHub repo $USER/$REPO ($VIS)..."
    gh repo create "$USER/$REPO" --"$VIS" --source=. --remote=origin --push
    echo "Done. Repo created and pushed."
    exit 0
  fi
else
  echo "GitHub CLI (gh) not found — assuming you already created $USER/$REPO on github.com."
fi

# 3. Wire up remote + push (used when gh is absent or repo already existed).
if ! git remote | grep -q "^origin$"; then
  git remote add origin "https://github.com/$USER/$REPO.git"
fi

git push -u origin main
echo "Pushed to https://github.com/$USER/$REPO"
