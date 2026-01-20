#!/bin/bash
###############################################################################
# WigTube Bulk Video Upload Script
# Uploads multiple video files to the external repository
# 
# Usage:
#   ./bulk-upload-videos.sh <directory>
#   ./bulk-upload-videos.sh assets/videos
#
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         WigTube Bulk Video Upload                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check arguments
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Error: No directory specified${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo -e "  ${CYAN}./bulk-upload-videos.sh <directory>${NC}"
    echo ""
    echo -e "${YELLOW}Example:${NC}"
    echo -e "  ${CYAN}./bulk-upload-videos.sh assets/videos${NC}"
    echo ""
    exit 1
fi

VIDEO_DIR="$1"

# Check if directory exists
if [ ! -d "$VIDEO_DIR" ]; then
    echo -e "${RED}❌ Error: Directory not found: $VIDEO_DIR${NC}"
    exit 1
fi

# Check for GITHUB_TOKEN
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  GITHUB_TOKEN not set${NC}"
    read -sp "Enter your GitHub token: " TOKEN
    echo ""
    export GITHUB_TOKEN="$TOKEN"
fi

# Set default repository if not configured
export VIDEO_REPO_OWNER="${VIDEO_REPO_OWNER:-Danie-GLR}"
export VIDEO_REPO_NAME="${VIDEO_REPO_NAME:-Videoswigtube-EEEEEE}"
export VIDEO_REPO_BRANCH="${VIDEO_REPO_BRANCH:-main}"
export VIDEO_REPO_FOLDER="${VIDEO_REPO_FOLDER:-videos}"

# Find all video files
echo -e "${BLUE}🔍 Searching for video files in $VIDEO_DIR...${NC}"
VIDEO_FILES=$(find "$VIDEO_DIR" -type f \( -iname "*.mp4" -o -iname "*.webm" -o -iname "*.mov" -o -iname "*.avi" \))

if [ -z "$VIDEO_FILES" ]; then
    echo -e "${YELLOW}⚠️  No video files found${NC}"
    exit 0
fi

# Count files
FILE_COUNT=$(echo "$VIDEO_FILES" | wc -l)
echo -e "${GREEN}Found $FILE_COUNT video file(s)${NC}"
echo ""

# Confirm upload
echo -e "${YELLOW}Files to upload:${NC}"
echo "$VIDEO_FILES" | while read file; do
    echo -e "  📹 $(basename "$file")"
done
echo ""

read -p "Upload all these files? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Upload cancelled${NC}"
    exit 0
fi

# Upload each file
SUCCESS_COUNT=0
FAIL_COUNT=0

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Starting Bulk Upload Process      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

COUNTER=1
echo "$VIDEO_FILES" | while read file; do
    echo -e "${CYAN}[$COUNTER/$FILE_COUNT] Uploading: $(basename "$file")${NC}"
    
    if node "$SCRIPT_DIR/upload-to-external-repo.js" "$file"; then
        echo -e "${GREEN}✅ Success${NC}"
        ((SUCCESS_COUNT++))
    else
        echo -e "${RED}❌ Failed${NC}"
        ((FAIL_COUNT++))
    fi
    
    echo ""
    ((COUNTER++))
    
    # Small delay to avoid rate limiting
    sleep 1
done

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Upload Summary                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo -e "${GREEN}✅ Successful: $SUCCESS_COUNT${NC}"
echo -e "${RED}❌ Failed: $FAIL_COUNT${NC}"
echo ""
