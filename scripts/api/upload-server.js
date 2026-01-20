#!/usr/bin/env node

/**
 * Simple file upload server for WigTube videos
 * Saves uploaded files and automatically commits to git repository
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Port is now configurable via environment variable (defaults to 3001)
const PORT = parseInt(process.env.UPLOAD_SERVER_PORT || '3001', 10);
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max file size (GitHub Codespaces limit)

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
function moveToExternalRepoAndCommit(fileName, repositoryName = null, folderName = 'videos') {
    try {
        // Determine the external repository path
        let repoPath = EXTERNAL_REPO_PATH;
        if (repositoryName) {
            // Extract repository name from format "owner/repo"
            const repoNameOnly = repositoryName.split('/').pop();
            repoPath = path.join('/workspaces', repoNameOnly);
        }
        
        const sourcePath = path.join(UPLOAD_DIR, fileName);
        let destPath = path.join(repoPath, folderName, fileName);
        let finalFileName = fileName;
        
        // Check for duplicate file names and append number if needed
        if (fs.existsSync(destPath)) {
            console.log(`⚠️  File already exists: ${destPath}`);
            const fileExt = path.extname(fileName);
            const fileBase = path.basename(fileName, fileExt);
            let counter = 1;
            
            // Find next available filename
            while (fs.existsSync(destPath)) {
                finalFileName = `${fileBase} (${counter})${fileExt}`;
                destPath = path.join(repoPath, folderName, finalFileName);
                counter++;
            }
            console.log(`✨ Using unique filename: ${finalFileName}`);
        }
        
        console.log(`\n========================================`);
        console.log(`📦 AUTO-COMMIT: Moving ${finalFileName} to external repository...`);
        console.log(`   Repository: ${repoPath}`);
        console.log(`   Folder: ${folderName}`);
        console.log(`   Source: ${sourcePath}`);
        console.log(`   Dest: ${destPath}`);
        
        // Check if source file exists
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Source file not found: ${sourcePath}`);
        }
        
        // Get source file size for verification
        const sourceStats = fs.statSync(sourcePath);
        console.log(`   Source file size: ${sourceStats.size} bytes`);
        
        // Ensure destination directory exists
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            console.log(`📁 Creating directory: ${destDir}`);
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Copy file to external repo using copyFile instead of copyFileSync for better reliability
        fs.copyFileSync(sourcePath, destPath);
        
        // Verify the copy was successful
        if (!fs.existsSync(destPath)) {
            throw new Error(`Failed to copy file to: ${destPath}`);
        }
        
        const destStats = fs.statSync(destPath);
        console.log(`✅ File copied to: ${destPath}`);
        console.log(`   Destination file size: ${destStats.size} bytes`);
        
        if (destStats.size !== sourceStats.size) {
            throw new Error(`File size mismatch after copy: source=${sourceStats.size}, dest=${destStats.size}`);
        }
        
        // Git operations - commit locally (push may fail due to Codespaces permissions)
        console.log(`📝 Running git commands...`);
        
        // First, pull any remote changes to avoid conflicts
        console.log(`🔄 Pulling remote changes first...`);
        try {
            const pullOutput = execSync(`cd "${repoPath}" && git pull origin main --no-edit`, {
                stdio: 'pipe',
                encoding: 'utf8',
                timeout: 15000
            });
            console.log(`✅ Pull successful:\n${pullOutput}`);
        } catch (pullError) {
            console.warn(`⚠️  Pull failed or not needed: ${pullError.message}`);
            // Continue anyway - might be first commit or already up to date
        }

        const commitCommands = [
            `cd "${repoPath}"`,
            `git add "${folderName}/${finalFileName}"`,
            `git commit -m "Add video: ${finalFileName}"`
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
                const pushOutput = execSync(`cd "${repoPath}" && git push origin main`, {
                    stdio: 'pipe',
                    encoding: 'utf8',
                    timeout: 15000
                });
                console.log(`✅ Push successful!`);
                
                // Pull after push to sync local repo with remote
                console.log(`🔄 Pulling to sync local repo with remote...`);
                try {
                    const pullAfterPushOutput = execSync(`cd "${repoPath}" && git pull origin main --no-edit`, {
                        stdio: 'pipe',
                        encoding: 'utf8',
                        timeout: 15000
                    });
                    console.log(`✅ Pull after push successful - repo synced!`);
                } catch (pullAfterError) {
                    console.warn(`⚠️  Pull after push failed: ${pullAfterError.message}`);
                    // Not critical - push was successful
                }
                
                console.log(`========================================\n`);
                
                // Remove temp file after successful push
                try {
                    fs.unlinkSync(sourcePath);
                    console.log(`🗑️  Removed temp file: ${sourcePath}`);
                } catch (unlinkError) {
                    console.warn(`⚠️  Could not remove temp file: ${unlinkError.message}`);
                }
                return { success: true, finalFileName };
            } catch (pushError) {
                console.warn(`⚠️  Push failed: ${pushError.message}`);
                console.log(`📋 Manual push required:`);
                console.log(`   cd ${repoPath}`);
                console.log(`   git push origin main`);
                console.log(`========================================\n`);
                
                // Keep temp file since push failed, but file is still in external repo
                return { success: true, finalFileName }; // Return true because file is in external repo, just not pushed
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
        return { success: false, finalFileName: fileName };
    }
}

/**
 * Delete file from external repository and commit
 */
function deleteFromExternalRepo(fileName, repositoryName = null, folderName = 'videos') {
    try {
        // Determine the external repository path
        let repoPath = EXTERNAL_REPO_PATH;
        if (repositoryName) {
            // Extract repository name from format "owner/repo"
            const repoNameOnly = repositoryName.split('/').pop();
            repoPath = path.join('/workspaces', repoNameOnly);
        }
        
        const filePath = path.join(repoPath, folderName, fileName);
        
        console.log(`\n========================================`);
        console.log(`🗑️  AUTO-DELETE: Removing ${fileName} from external repository...`);
        console.log(`   Repository: ${repoPath}`);
        console.log(`   Folder: ${folderName}`);
        console.log(`   Path: ${filePath}`);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File not found: ${filePath}`);
            console.log(`========================================\n`);
            return { success: false, error: 'File not found' };
        }
        
        // Delete the file
        fs.unlinkSync(filePath);
        console.log(`✅ File deleted: ${filePath}`);
        
        // Git operations - commit and push
        console.log(`📝 Running git commands...`);
        
        const commitCommands = [
            `cd "${repoPath}"`,
            `git add "${folderName}/${fileName}"`,
            `git commit -m "Delete video: ${fileName}"`
        ].join(' && ');
        
        try {
            const commitOutput = execSync(commitCommands, { 
                stdio: 'pipe',
                encoding: 'utf8'
            });
            console.log(`✅ Git commit successful:\n${commitOutput}`);
            
            // Try to push
            console.log(`📤 Attempting to push to remote...`);
            try {
                const pushOutput = execSync(`cd "${repoPath}" && git push origin main`, {
                    stdio: 'pipe',
                    encoding: 'utf8',
                    timeout: 10000
                });
                console.log(`✅ Push successful!`);
                console.log(`========================================\n`);
                return { success: true };
            } catch (pushError) {
                console.warn(`⚠️  Push failed (Codespaces token limitation): ${pushError.message}`);
                console.log(`📋 Manual push required:`);
                console.log(`   cd ${repoPath}`);
                console.log(`   git push origin main`);
                console.log(`========================================\n`);
                return { success: true, needsManualPush: true };
            }
        } catch (commitError) {
            console.error(`❌ Git commit failed: ${commitError.message}`);
            throw new Error(`Git commit failed: ${commitError.message}`);
        }
        
    } catch (error) {
        console.error(`\n❌❌❌ ERROR in deleteFromExternalRepo ❌❌❌`);
        console.error(`File: ${fileName}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Stack trace:`, error.stack);
        console.error(`========================================\n`);
        return { success: false, error: error.message };
    }
}

const server = http.createServer((req, res) => {
    // Enable CORS for all origins (needed for Codespaces with different ports)
    const origin = req.headers.origin || req.headers.referer;
    
    // Always set CORS headers FIRST, before any other logic
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Log request for debugging
    console.log(`${req.method} ${req.url} - Origin: ${origin || 'none'}`);

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS, HEAD',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
            'Access-Control-Max-Age': '86400'
        });
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/upload') {
        console.log('📡 POST /upload endpoint called');
        console.log('   Content-Type:', req.headers['content-type']);
        console.log('   Content-Length:', req.headers['content-length']);
        console.log('   Origin:', req.headers.origin);
        
        const chunks = [];
        let fileName = '';
        let boundary = '';
        let totalSize = 0;

        // Get boundary from content-type
        const contentType = req.headers['content-type'];
        if (contentType && contentType.includes('multipart/form-data')) {
            boundary = contentType.split('boundary=')[1];
        }

        req.on('data', chunk => {
            totalSize += chunk.length;
            
            // Check file size limit - but don't destroy connection yet, wait for end event
            if (totalSize > MAX_FILE_SIZE) {
                // Set flag to reject later with proper response
                req.fileTooLarge = true;
            }
            
            chunks.push(chunk);
        });

        req.on('end', () => {
            console.log('📦 Request complete. Total size received:', totalSize, 'bytes (', Math.round(totalSize / 1024 / 1024 * 100) / 100, 'MB)');
            console.log('   Max allowed:', MAX_FILE_SIZE, 'bytes (', Math.round(MAX_FILE_SIZE / 1024 / 1024), 'MB)');
            
            // Check if file was too large
            if (req.fileTooLarge) {
                console.error(`❌ Upload rejected: File too large (${totalSize} bytes, max ${MAX_FILE_SIZE})`);
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: 'File too large',
                    maxSize: MAX_FILE_SIZE,
                    receivedSize: totalSize,
                    maxSizeMB: Math.round(MAX_FILE_SIZE / 1024 / 1024),
                    receivedSizeMB: Math.round(totalSize / 1024 / 1024)
                }));
                return;
            }
            
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

                // Parse form fields
                let uploadedFileName = '';
                let uploadedFileData = null;
                let repositoryName = null;
                let uploadPath = null;
                
                // Find the file part and other form fields
                for (const part of parts) {
                    const headerEnd = part.indexOf('\r\n\r\n');
                    if (headerEnd === -1) continue;
                    
                    const headers = part.slice(0, headerEnd).toString();
                    console.log('📋 Part headers:', headers.substring(0, 200)); // Debug log
                    
                    const filenameMatch = headers.match(/filename="([^"]+)"/);
                    const nameMatch = headers.match(/name="([^"]+)"/);
                    
                    if (filenameMatch) {
                        // File field
                        const originalFileName = filenameMatch[1];
                        console.log('📄 Original filename from browser:', originalFileName);
                        // Sanitize filename - keep spaces and common chars, just remove dangerous ones
                        uploadedFileName = originalFileName.replace(/[\/:*?"<>|]/g, '_');
                        console.log('✨ Sanitized filename:', uploadedFileName);
                        uploadedFileData = part.slice(headerEnd + 4, part.length - 2); // Remove trailing \r\n
                        console.log('📦 File data size:', uploadedFileData.length, 'bytes');
                    } else if (nameMatch) {
                        // Text field
                        const fieldName = nameMatch[1];
                        const fieldValue = part.slice(headerEnd + 4, part.length - 2).toString().trim();
                        
                        if (fieldName === 'repository') {
                            repositoryName = fieldValue;
                            console.log(`📦 Repository specified: ${repositoryName}`);
                        } else if (fieldName === 'path') {
                            uploadPath = fieldValue;
                            console.log(`📁 Path specified: ${uploadPath}`);
                        }
                    }
                }
                
                // Validate we have a file
                if (!uploadedFileName || !uploadedFileData) {
                    throw new Error('No file found in upload');
                }
                
                fileName = uploadedFileName;
                const fileData = uploadedFileData;
                const filePath = path.join(UPLOAD_DIR, fileName);
                
                // Write file synchronously to ensure it's saved before proceeding
                fs.writeFileSync(filePath, fileData, { flag: 'w' });
                
                // Verify file was written correctly
                const stats = fs.statSync(filePath);
                console.log(`✅ Uploaded: ${fileName} (${fileData.length} bytes, verified: ${stats.size} bytes)`);
                
                if (stats.size !== fileData.length) {
                    throw new Error(`File size mismatch: expected ${fileData.length}, got ${stats.size}`);
                }
                
                // Extract folder name from path if provided
                let folderName = 'videos';
                if (uploadPath) {
                    // Path is like "videos/filename.mp4", extract the folder part
                    const pathParts = uploadPath.split('/');
                    if (pathParts.length > 1) {
                        folderName = pathParts[0];
                    }
                }
                
                // Move to external repo immediately and wait for it to complete
                const moveResult = moveToExternalRepoAndCommit(fileName, repositoryName, folderName);
                const finalFileName = moveResult.finalFileName || fileName;
                
                // CORS headers already set at top level
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    fileName: finalFileName,
                    originalFileName: fileName !== finalFileName ? fileName : undefined,
                    path: `${folderName}/${finalFileName}`,
                    size: fileData.length,
                    movedToRepo: moveResult.success,
                    renamed: fileName !== finalFileName
                }));

            } catch (error) {
                console.error('❌ Upload error:', error);
                // CORS headers already set at top level
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });

    } else if (req.method === 'GET' && req.url === '/health') {
        // CORS headers already set at top level
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', uploadDir: UPLOAD_DIR }));
    } else if (req.method === 'DELETE' && req.url.startsWith('/delete/')) {
        // Extract filename from URL: /delete/filename.mp4
        const fileName = decodeURIComponent(req.url.substring(8));
        
        console.log(`🗑️  DELETE request for: ${fileName}`);
        
        // Sanitize filename for security
        if (!fileName || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Invalid filename' }));
            return;
        }
        
        // Delete from external repository (async operation)
        setImmediate(() => {
            const result = deleteFromExternalRepo(fileName);
            if (!result.success) {
                console.error(`❌ Failed to delete ${fileName}: ${result.error}`);
            }
        });
        
        // Respond immediately (CORS headers already set at top level)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            message: `Deletion of ${fileName} initiated`,
            fileName
        }));
    } else {
        // CORS headers already set at top level
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Upload server running on http://localhost:${PORT}`);
    console.log(`📁 Saving files to: ${UPLOAD_DIR}`);
    console.log(`📡 Listening on all network interfaces (0.0.0.0:${PORT})`);
    console.log(`💡 Port configured via UPLOAD_SERVER_PORT environment variable (current: ${PORT})`);
});
