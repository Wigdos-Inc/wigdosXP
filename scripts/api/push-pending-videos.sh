#!/bin/bash

# Script to push any pending video commits to the external repository
# Run this if automatic push fails during upload

REPO_PATH="/workspaces/Videoswigtube-EEEEEE"

echo "🚀 Pushing pending video commits to GitHub..."
echo ""

cd "$REPO_PATH" || exit 1

# Check if there are any unpushed commits
COMMITS_AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")

if [ "$COMMITS_AHEAD" = "0" ]; then
    echo "✅ No pending commits. Everything is already pushed!"
    exit 0
fi

echo "📋 Found $COMMITS_AHEAD unpushed commit(s)"
echo ""
echo "Recent commits:"
git log --oneline origin/main..HEAD
echo ""

# Configure pull strategy if not set
git config pull.rebase false 2>/dev/null

# Pull remote changes first to avoid conflicts
echo "🔄 Pulling remote changes..."
if git pull origin main --no-edit; then
    echo "✅ Pull successful"
else
    echo "⚠️  Pull had issues, but continuing..."
fi

echo ""
echo "📤 Pushing to GitHub..."
if git push origin main; then
    echo ""
    echo "✅ Successfully pushed all videos to GitHub!"
    echo ""
    echo "🌐 View at: https://github.com/Danie-GLR/Videoswigtube-EEEEEE/tree/main/videos"
else
    echo ""
    echo "❌ Push failed. Check your GitHub permissions."
    echo ""
    echo "🔧 To fix:"
    echo "   1. Make sure you have write access to the repository"
    echo "   2. Check your git credentials"
    echo "   3. Try: gh auth refresh"
    exit 1
fi
