#!/usr/bin/env node
/**
 * Upload Video to External Repository
 * Automatically uploads video files to Danie-GLR/Videoswigtube-EEEEEE repository
 * 
 * Usage:
 *   node upload-to-external-repo.js <video-file-path>
 *   GITHUB_TOKEN=your_token node upload-to-external-repo.js <video-file-path>
 * 
 * Requirements:
 *   - GitHub Personal Access Token with repo permissions
 *   - Set as GITHUB_TOKEN environment variable or pass via prompt
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration (override via env vars)
// Default: Danie-GLR/Videoswigtube-EEEEEE (can be changed via environment variables)
const REPO_OWNER = process.env.VIDEO_REPO_OWNER || process.env.GITHUB_REPO_OWNER || 'Danie-GLR';
const REPO_NAME = process.env.VIDEO_REPO_NAME || process.env.GITHUB_REPO_NAME || 'Videoswigtube-EEEEEE';
const TARGET_BRANCH = process.env.VIDEO_REPO_BRANCH || 'main';
const TARGET_FOLDER = process.env.VIDEO_REPO_FOLDER || 'videos';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Get GitHub token from environment or prompt
 */
function getGitHubToken() {
    if (process.env.GITHUB_TOKEN) {
        return process.env.GITHUB_TOKEN;
    }
    
    log('\nGitHub Personal Access Token not found in environment.', 'yellow');
    log('Please set GITHUB_TOKEN environment variable:', 'yellow');
    log('  export GITHUB_TOKEN=your_token_here\n', 'cyan');
    log('Or get a token from: https://github.com/settings/tokens', 'blue');
    log('Required scopes: repo (full control of private repositories)\n', 'blue');
    
    throw new Error('GITHUB_TOKEN not found');
}

/**
 * Make GitHub API request
 */
function githubRequest(method, path, data = null, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: path,
            method: method,
            headers: {
                'User-Agent': 'WigTube-Video-Uploader',
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        if (data) {
            const jsonData = JSON.stringify(data);
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(jsonData);
        }

        const req = https.request(options, (res) => {
            let body = '';
            
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = body ? JSON.parse(body) : {};
                    
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(response);
                    } else {
                        reject(new Error(`GitHub API error (${res.statusCode}): ${response.message || body}`));
                    }
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${e.message}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(new Error(`Request failed: ${e.message}`));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

/**
 * Check if file exists in repository
 */
async function checkFileExists(filePath, token) {
    try {
        const apiPath = `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
        const response = await githubRequest('GET', apiPath, null, token);
        return response.sha; // Return SHA if file exists
    } catch (error) {
        if (error.message.includes('404')) {
            return null; // File doesn't exist
        }
        throw error;
    }
}

/**
 * Upload file to GitHub repository
 */
async function uploadFile(localFilePath, targetPath, token) {
    log(`\n📤 Starting upload process...`, 'blue');
    
    // Check if file exists locally
    if (!fs.existsSync(localFilePath)) {
        throw new Error(`File not found: ${localFilePath}`);
    }
    
    // Get file stats
    const stats = fs.statSync(localFilePath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    log(`📁 File: ${path.basename(localFilePath)}`, 'cyan');
    log(`📊 Size: ${fileSizeMB} MB`, 'cyan');
    
    // GitHub API has a 100MB limit for file uploads
    if (stats.size > 100 * 1024 * 1024) {
        throw new Error('File is too large (>100MB). GitHub API has a 100MB limit. Use Git LFS or split the file.');
    }
    
    // Read and encode file
    log(`🔄 Reading and encoding file...`, 'yellow');
    const fileContent = fs.readFileSync(localFilePath);
    const base64Content = fileContent.toString('base64');
    
    // Check if file already exists
    log(`🔍 Checking if file exists in repository...`, 'yellow');
    const existingSha = await checkFileExists(targetPath, token);
    
    const fileName = path.basename(localFilePath);
    const commitMessage = existingSha 
        ? `Update video: ${fileName}`
        : `Add video: ${fileName}`;
    
    // Prepare upload data
    const uploadData = {
        message: commitMessage,
        content: base64Content,
        branch: TARGET_BRANCH
    };
    
    if (existingSha) {
        log(`⚠️  File already exists, will update...`, 'yellow');
        uploadData.sha = existingSha;
    }
    
    // Upload to GitHub
    log(`⬆️  Uploading to GitHub...`, 'yellow');
    const apiPath = `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${targetPath}`;
    const response = await githubRequest('PUT', apiPath, uploadData, token);
    
    return response;
}

/**
 * Main function
 */
async function main() {
    log('\n🎬 WigTube External Repository Video Uploader', 'cyan');
    log('==================================================', 'cyan');
    
    // Get command line arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        log('\n❌ Error: No file specified', 'red');
        log('\nUsage:', 'yellow');
        log('  node upload-to-external-repo.js <video-file-path>', 'cyan');
        log('\nExample:', 'yellow');
        log('  node upload-to-external-repo.js /path/to/video.mp4', 'cyan');
        log('  node upload-to-external-repo.js assets/videos/myvideo.mp4\n', 'cyan');
        process.exit(1);
    }
    
    const localFilePath = args[0];
    const fileName = path.basename(localFilePath);
    const targetPath = `${TARGET_FOLDER}/${fileName}`;
    
    log(`\n📋 Upload Configuration:`, 'yellow');
    log(`  Repository: ${REPO_OWNER}/${REPO_NAME}`, 'cyan');
    log(`  Branch: ${TARGET_BRANCH}`, 'cyan');
    log(`  Target folder: ${TARGET_FOLDER}`, 'cyan');
    log(`  Target path: ${targetPath}`, 'cyan');
    
    try {
        // Get GitHub token
        const token = getGitHubToken();
        
        // Upload file
        const response = await uploadFile(localFilePath, targetPath, token);
        
        // Success!
        log('\n✅ Upload successful!', 'green');
        log(`\n📍 Repository: ${REPO_OWNER}/${REPO_NAME}`, 'cyan');
        log(`📂 Path: ${targetPath}`, 'cyan');
        log(`🌐 URL: https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${TARGET_BRANCH}/${targetPath}`, 'blue');
        log(`\n💾 Commit SHA: ${response.commit.sha}`, 'cyan');
        log(`\n🎉 Video is now available on WigTube!\n`, 'green');
        
    } catch (error) {
        log(`\n❌ Upload failed: ${error.message}`, 'red');
        
        if (error.message.includes('GITHUB_TOKEN')) {
            log('\n💡 To fix this:', 'yellow');
            log('  1. Go to https://github.com/settings/tokens', 'cyan');
            log('  2. Generate a new token with "repo" scope', 'cyan');
            log('  3. Export it: export GITHUB_TOKEN=your_token_here', 'cyan');
            log('  4. Run the script again\n', 'cyan');
        }
        
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main().catch(error => {
        log(`\n💥 Fatal error: ${error.message}`, 'red');
        process.exit(1);
    });
}

module.exports = { uploadFile, checkFileExists };
