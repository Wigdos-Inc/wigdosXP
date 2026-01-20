#!/bin/bash
###############################################################################
# WigTube Video Upload Script
# Uploads video files to the external WigTube video repository
# 
# Usage:
#   ./upload-video.sh <video-file>
#   ./upload-video.sh assets/videos/myvideo.mp4
#
# Requirements:
#   - Node.js installed
#   - GITHUB_TOKEN environment variable set
#
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         WigTube Video Upload to External Repo             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if file argument is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Error: No video file specified${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo -e "  ${CYAN}./upload-video.sh <video-file>${NC}"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  ${CYAN}./upload-video.sh assets/videos/myvideo.mp4${NC}"
    echo -e "  ${CYAN}./upload-video.sh /path/to/Sigma_Origin_Story.mp4${NC}"
    echo ""
    exit 1
fi

VIDEO_FILE="$1"

# Check if file exists
if [ ! -f "$VIDEO_FILE" ]; then
    echo -e "${RED}❌ Error: File not found: $VIDEO_FILE${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed${NC}"
    echo -e "${YELLOW}Please install Node.js to use this script${NC}"
    exit 1
fi

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Warning: GITHUB_TOKEN environment variable not set${NC}"
    echo ""
    echo -e "${CYAN}To set your GitHub token:${NC}"
    echo -e "  ${YELLOW}export GITHUB_TOKEN=your_token_here${NC}"
    echo ""
    echo -e "${CYAN}Get a token from:${NC}"
    echo -e "  ${BLUE}https://github.com/settings/tokens${NC}"
    echo ""
    echo -e "${CYAN}Required scopes: ${YELLOW}repo${NC}"
    echo ""
    read -p "Do you want to enter your token now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -sp "Enter your GitHub token: " TOKEN
        echo ""
        export GITHUB_TOKEN="$TOKEN"
    else
        echo -e "${RED}Cannot proceed without GitHub token${NC}"
        exit 1
    fi
fi

# Set default repository if not configured
export VIDEO_REPO_OWNER="${VIDEO_REPO_OWNER:-Danie-GLR}"
export VIDEO_REPO_NAME="${VIDEO_REPO_NAME:-Videoswigtube-EEEEEE}"
export VIDEO_REPO_BRANCH="${VIDEO_REPO_BRANCH:-main}"
export VIDEO_REPO_FOLDER="${VIDEO_REPO_FOLDER:-videos}"

# Run the Node.js upload script
echo -e "${BLUE}🚀 Starting upload process...${NC}"
echo ""

node "$SCRIPT_DIR/upload-to-external-repo.js" "$VIDEO_FILE"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✨ Upload completed successfully!${NC}"
    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo -e "  1. The video is now in the repository"
    echo -e "  2. Use the raw GitHub URL in your WigTube database"
    echo -e "  3. The video will be accessible immediately"
    echo ""
else
    echo -e "${RED}❌ Upload failed with exit code $EXIT_CODE${NC}"
    exit $EXIT_CODE
fi
