#!/usr/bin/env node

/**
 * Simple file upload server for WigTube videos
 * Saves uploaded files and automatically commits to git repository
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 3001;

// Use temp directory in wigdosXP for uploads (easier to access in Codespace)
const TEMP_UPLOAD_DIR = process.env.TEMP_UPLOAD_DIR || path.join(__dirname, '../../temp-uploads');
const EXTERNAL_REPO_PATH = process.env.VIDEO_REPO_PATH || '/workspaces/Videoswigtube-EEEEEE';
const UPLOAD_DIR = TEMP_UPLOAD_DIR; // Save to temp first

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    console.log('Creating upload directory:', UPLOAD_DIR);
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Move uploaded file to external repository and commit
 * Note: Push may fail in Codespaces due to token permissions
 */
function moveToExternalRepoAndCommit(fileName) {
    try {
        const sourcePath = path.join(UPLOAD_DIR, fileName);
        const destPath = path.join(EXTERNAL_REPO_PATH, 'videos', fileName);
        
        console.log(`\n========================================`);
        console.log(`📦 AUTO-COMMIT: Moving ${fileName} to external repository...`);
        console.log(`   Source: ${sourcePath}`);
        console.log(`   Dest: ${destPath}`);
        
        // Check if source file exists
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Source file not found: ${sourcePath}`);
        }
        
        // Ensure destination directory exists
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            console.log(`📁 Creating directory: ${destDir}`);
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Copy file to external repo
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ File copied to: ${destPath}`);
        
        // Git operations - commit locally (push may fail due to Codespaces permissions)
        console.log(`📝 Running git commands...`);
        
        const commitCommands = [
            `cd "${EXTERNAL_REPO_PATH}"`,
            `git add videos/${fileName}`,
            `git commit -m "Add video: ${fileName}"`
        ].join(' && ');
        
        try {
            const commitOutput = execSync(commitCommands, { 
                stdio: 'pipe',
                encoding: 'utf8'
            });
            console.log(`✅ Git commit successful:\n${commitOutput}`);
            
            // Try to push, but don't fail if it doesn't work
            console.log(`📤 Attempting to push to remote...`);
            try {
                const pushOutput = execSync(`cd "${EXTERNAL_REPO_PATH}" && git push origin main`, {
                    stdio: 'pipe',
                    encoding: 'utf8',
                    timeout: 10000
                });
                console.log(`✅ Push successful!`);
                console.log(`========================================\n`);
                
                // Remove temp file after successful push
                fs.unlinkSync(sourcePath);
                console.log(`🗑️  Removed temp file: ${sourcePath}`);
                return true;
            } catch (pushError) {
                console.warn(`⚠️  Push failed (Codespaces token limitation): ${pushError.message}`);
                console.log(`📋 Manual push required:`);
                console.log(`   cd /workspaces/Videoswigtube-EEEEEE`);
                console.log(`   git push origin main`);
                console.log(`========================================\n`);
                
                // Keep temp file since push failed
                return false;
            }
        } catch (commitError) {
            throw new Error(`Git commit failed: ${commitError.message}`);
        }
        
    } catch (error) {
        console.error(`\n❌❌❌ ERROR in moveToExternalRepoAndCommit ❌❌❌`);
        console.error(`File: ${fileName}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Stack trace:`, error.stack);
        console.error(`========================================\n`);
        return false;
    }
}

const server = http.createServer((req, res) => {
    // Enable CORS for all origins (needed for Codespaces)
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/upload') {
        const chunks = [];
        let fileName = '';
        let boundary = '';

        // Get boundary from content-type
        const contentType = req.headers['content-type'];
        if (contentType && contentType.includes('multipart/form-data')) {
            boundary = contentType.split('boundary=')[1];
        }

        req.on('data', chunk => {
            chunks.push(chunk);
        });

        req.on('end', () => {
            try {
                const buffer = Buffer.concat(chunks);
                
                // Parse multipart form data
                const boundaryBuffer = Buffer.from(`--${boundary}`);
                const parts = [];
                let start = 0;
                
                while (true) {
                    const boundaryIndex = buffer.indexOf(boundaryBuffer, start);
                    if (boundaryIndex === -1) break;
                    
                    if (start !== 0) {
                        parts.push(buffer.slice(start, boundaryIndex));
                    }
                    start = boundaryIndex + boundaryBuffer.length;
                }

                // Find the file part
                for (const part of parts) {
                    const headerEnd = part.indexOf('\r\n\r\n');
                    if (headerEnd === -1) continue;
                    
                    const headers = part.slice(0, headerEnd).toString();
                    const filenameMatch = headers.match(/filename="([^"]+)"/);
                    
                    if (filenameMatch) {
                        fileName = filenameMatch[1];
                        // Sanitize filename
                        fileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
                        
                        const fileData = part.slice(headerEnd + 4, part.length - 2); // Remove trailing \r\n
                        const filePath = path.join(UPLOAD_DIR, fileName);
                        
                        fs.writeFileSync(filePath, fileData);
                        console.log(`✅ Uploaded: ${fileName} (${fileData.length} bytes)`);
                        
                        // Try to move to external repo and commit (async, don't wait)
                        setImmediate(() => {
                            moveToExternalRepoAndCommit(fileName);
                        });
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: true, 
                            fileName,
                            path: `temp-uploads/${fileName}`,
                            size: fileData.length
                        }));
                        return;
                    }
                }

                throw new Error('No file found in upload');

            } catch (error) {
                console.error('❌ Upload error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });

    } else if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', uploadDir: UPLOAD_DIR }));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Upload server running on http://localhost:${PORT}`);
    console.log(`📁 Saving files to: ${UPLOAD_DIR}`);
    console.log(`📡 Listening on all network interfaces (0.0.0.0:${PORT})`);
});
