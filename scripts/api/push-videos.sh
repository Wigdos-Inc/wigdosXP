#!/bin/bash
# Script to push videos to GitHub when Codespaces token doesn't have write access
# This happens because GITHUB_TOKEN has read-only access to external repositories

REPO_PATH="/workspaces/Videoswigtube-EEEEEE"

echo "🔍 Checking for unpushed video commits..."
cd "$REPO_PATH"

# Check if there are commits to push
if git status | grep -q "ahead of"; then
    echo "📦 Found unpushed commits:"
    git log origin/main..HEAD --oneline
    
    echo ""
    echo "⚠️  CODESPACES LIMITATION:"
    echo "The GITHUB_TOKEN in Codespaces has read-only access to external repositories."
    echo ""
    echo "To push these videos, you need to:"
    echo "1. Create a Personal Access Token (PAT) at: https://github.com/settings/tokens"
    echo "   - Select scopes: 'repo' (Full control of private repositories)"
    echo "2. Run these commands:"
    echo ""
    echo "   cd $REPO_PATH"
    echo "   git remote set-url origin https://YOUR_PAT@github.com/Danie-GLR/Videoswigtube-EEEEEE.git"
    echo "   git push origin main"
    echo ""
    echo "OR use GitHub CLI with a PAT:"
    echo "   gh auth login --with-token < YOUR_PAT_FILE"
    echo "   cd $REPO_PATH && git push"
    echo ""
else
    echo "✅ No unpushed commits. All videos are synchronized!"
fi
