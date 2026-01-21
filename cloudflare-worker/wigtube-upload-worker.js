/**
 * Cloudflare Worker for WigTube Video Uploads
 * 
 * Supports both small files (<50MB via Contents API) and large files (chunked via Git Data API)
 * No CORS issues, no port forwarding, works everywhere.
 * 
 * Environment Variables (set in Cloudflare dashboard):
 * - GITHUB_TOKEN: Your GitHub Personal Access Token
 * - GITHUB_OWNER: Repository owner (e.g., "Danie-GLR")
 * - GITHUB_REPO: Repository name (e.g., "Videoswigtube-EEEEEE")
 * - GITHUB_BRANCH: Branch name (default: "main")
 */

// CORS headers for all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Chunk-Index, X-Total-Chunks, X-File-Name, X-File-Path',
};

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks (balance between speed and memory)
const SMALL_FILE_LIMIT = 50 * 1024 * 1024; // 50MB - use simple upload

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Health check endpoint
    if (request.url.endsWith('/health')) {
      return new Response(
        JSON.stringify({ status: 'ok', service: 'wigtube-upload', chunkingSupported: true }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Chunk upload endpoint (for large files)
    if (request.method === 'POST' && request.url.includes('/upload-chunk')) {
      return handleChunkUpload(request, env);
    }

    // Finalize chunked upload
    if (request.method === 'POST' && request.url.includes('/finalize-upload')) {
      return finalizeChunkedUpload(request, env);
    }

    // Simple upload endpoint (for small files)
    if (request.method === 'POST' && request.url.includes('/upload')) {
      return handleSimpleUpload(request, env);
    }

    // Delete endpoint
    if (request.method === 'DELETE' && request.url.includes('/delete/')) {
      return handleDelete(request, env);
    }

    // 404 for unknown routes
    return new Response('Not Found', { 
      status: 404, 
      headers: CORS_HEADERS 
    });
  },
};

/**
 * Handle simple upload for small files (<50MB)
 */
async function handleSimpleUpload(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const path = formData.get('path') || 'videos/';
    const repository = formData.get('repository') || `${env.GITHUB_OWNER}/${env.GITHUB_REPO}`;

    if (!file) {
      return jsonResponse({ success: false, error: 'No file provided' }, 400);
    }

    // Redirect large files to chunked upload
    if (file.size > SMALL_FILE_LIMIT) {
      return jsonResponse({ 
        success: false, 
        error: 'File too large for simple upload',
        useChunked: true,
        fileSize: file.size
      }, 413);
    }

    console.log(`Simple upload: ${file.name} (${file.size} bytes)`);

    // Get file content as ArrayBuffer
    const fileContent = await file.arrayBuffer();
    const base64Content = arrayBufferToBase64(fileContent);

    // Parse repository
    const [owner, repo] = repository.split('/');
    const branch = env.GITHUB_BRANCH || 'main';
    const fileName = sanitizeFilename(file.name);
    const filePath = `${path.replace(/\/$/, '')}/${fileName}`;

    // Upload via Contents API
    const videoUrl = await uploadViaContentsAPI(
      owner, repo, branch, filePath, fileName, base64Content, env.GITHUB_TOKEN
    );

    console.log(`✅ Uploaded: ${videoUrl}`);

    return jsonResponse({ 
      success: true, 
      fileName: fileName,
      videoUrl: videoUrl,
      path: filePath,
      size: file.size,
    });

  } catch (error) {
    console.error('Simple upload error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

/**
 * Handle chunk upload (part of large file upload)
 */
async function handleChunkUpload(request, env) {
  try {
    const chunkIndex = parseInt(request.headers.get('X-Chunk-Index'));
    const totalChunks = parseInt(request.headers.get('X-Total-Chunks'));
    const fileName = request.headers.get('X-File-Name');
    const filePath = request.headers.get('X-File-Path') || `videos/${fileName}`;

    if (isNaN(chunkIndex) || isNaN(totalChunks) || !fileName) {
      return jsonResponse({ success: false, error: 'Missing chunk headers' }, 400);
    }

    console.log(`Chunk ${chunkIndex + 1}/${totalChunks} of ${fileName}`);

    // Read chunk data
    const chunkData = await request.arrayBuffer();
    const base64Chunk = arrayBufferToBase64(chunkData);

    // Create blob in GitHub for this chunk
    const owner = env.GITHUB_OWNER;
    const repo = env.GITHUB_REPO;
    
    const blobResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'WigTube-Worker',
      },
      body: JSON.stringify({
        content: base64Chunk,
        encoding: 'base64'
      }),
    });

    if (!blobResponse.ok) {
      const errorText = await blobResponse.text();
      console.error('Blob creation error:', errorText);
      return jsonResponse({ success: false, error: 'Failed to create blob' }, 500);
    }

    const blobData = await blobResponse.json();
    
    console.log(`✅ Chunk ${chunkIndex + 1} blob: ${blobData.sha}`);

    return jsonResponse({ 
      success: true, 
      chunkIndex: chunkIndex,
      blobSha: blobData.sha,
    });

  } catch (error) {
    console.error('Chunk upload error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

/**
 * Finalize chunked upload by creating tree and commit
 */
async function finalizeChunkedUpload(request, env) {
  try {
    const body = await request.json();
    const { fileName, filePath, blobShas, fileSize } = body;

    if (!fileName || !blobShas || blobShas.length === 0) {
      return jsonResponse({ success: false, error: 'Missing finalization data' }, 400);
    }

    console.log(`Finalizing ${fileName} with ${blobShas.length} chunks`);

    const owner = env.GITHUB_OWNER;
    const repo = env.GITHUB_REPO;
    const branch = env.GITHUB_BRANCH || 'main';
    const targetPath = filePath || `videos/${sanitizeFilename(fileName)}`;

    // Concatenate all blobs into one
    const combinedBlobSha = await concatenateBlobs(owner, repo, blobShas, env.GITHUB_TOKEN);

    // Get current branch reference
    const refResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'User-Agent': 'WigTube-Worker',
      },
    });

    if (!refResponse.ok) {
      throw new Error('Failed to get branch reference');
    }

    const refData = await refResponse.json();
    const baseCommitSha = refData.object.sha;

    // Get base tree
    const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${baseCommitSha}`, {
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'User-Agent': 'WigTube-Worker',
      },
    });

    const commitData = await commitResponse.json();
    const baseTreeSha = commitData.tree.sha;

    // Create new tree with the file
    const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'WigTube-Worker',
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: [{
          path: targetPath,
          mode: '100644',
          type: 'blob',
          sha: combinedBlobSha
        }]
      }),
    });

    if (!treeResponse.ok) {
      const errorText = await treeResponse.text();
      console.error('Tree creation error:', errorText);
      throw new Error('Failed to create tree');
    }

    const treeData = await treeResponse.json();

    // Create commit
    const newCommitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'WigTube-Worker',
      },
      body: JSON.stringify({
        message: `Add video: ${fileName}`,
        tree: treeData.sha,
        parents: [baseCommitSha]
      }),
    });

    if (!newCommitResponse.ok) {
      throw new Error('Failed to create commit');
    }

    const newCommitData = await newCommitResponse.json();

    // Update branch reference
    const updateRefResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'WigTube-Worker',
      },
      body: JSON.stringify({
        sha: newCommitData.sha
      }),
    });

    if (!updateRefResponse.ok) {
      throw new Error('Failed to update branch');
    }

    const videoUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${targetPath}`;

    console.log(`✅ Finalized: ${videoUrl}`);

    return jsonResponse({ 
      success: true, 
      fileName: fileName,
      videoUrl: videoUrl,
      path: targetPath,
      size: fileSize,
    });

  } catch (error) {
    console.error('Finalize error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

/**
 * Concatenate multiple blob SHAs into a single blob
 * (GitHub doesn't directly support this, so we download and re-upload)
 */
async function concatenateBlobs(owner, repo, blobShas, token) {
  // For simplicity, we'll create a single combined blob
  // by fetching each blob's content and merging them
  
  let combinedContent = [];
  
  for (const sha of blobShas) {
    const blobResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`, {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'WigTube-Worker',
        'Accept': 'application/vnd.github.v3.raw',
      },
    });
    
    if (!blobResponse.ok) {
      throw new Error(`Failed to fetch blob ${sha}`);
    }
    
    const chunkData = await blobResponse.arrayBuffer();
    combinedContent.push(new Uint8Array(chunkData));
  }
  
  // Combine all chunks
  const totalLength = combinedContent.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of combinedContent) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  
  // Create final blob
  const base64Combined = arrayBufferToBase64(combined.buffer);
  
  const finalBlobResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'WigTube-Worker',
    },
    body: JSON.stringify({
      content: base64Combined,
      encoding: 'base64'
    }),
  });
  
  if (!finalBlobResponse.ok) {
    throw new Error('Failed to create combined blob');
  }
  
  const finalBlobData = await finalBlobResponse.json();
  return finalBlobData.sha;
}

/**
 * Upload via GitHub Contents API (for small files)
 */
async function uploadViaContentsAPI(owner, repo, branch, filePath, fileName, base64Content, token) {
  const githubUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  // Check if file exists (to get SHA for update)
  let sha = null;
  try {
    const checkResponse = await fetch(githubUrl, {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'WigTube-Worker',
      },
    });
    if (checkResponse.ok) {
      const data = await checkResponse.json();
      sha = data.sha;
    }
  } catch (e) {
    // File doesn't exist, will create new
  }

  // Create or update file
  const payload = {
    message: `Add video: ${fileName}`,
    content: base64Content,
    branch: branch,
  };

  if (sha) {
    payload.sha = sha;
  }

  const uploadResponse = await fetch(githubUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'WigTube-Worker',
    },
    body: JSON.stringify(payload),
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`GitHub API error: ${uploadResponse.status} - ${errorText}`);
  }

  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
}

/**
 * Handle file deletion
 */
async function handleDelete(request, env) {
  try {
    const urlParts = request.url.split('/delete/');
    const fileName = decodeURIComponent(urlParts[1]);
    
    if (!fileName) {
      return jsonResponse({ success: false, error: 'No filename provided' }, 400);
    }

    const owner = env.GITHUB_OWNER;
    const repo = env.GITHUB_REPO;
    const branch = env.GITHUB_BRANCH || 'main';
    const filePath = `videos/${fileName}`;

    console.log(`Deleting ${filePath}`);

    // Get file SHA
    const githubUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const checkResponse = await fetch(githubUrl, {
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'User-Agent': 'WigTube-Worker',
      },
    });

    if (!checkResponse.ok) {
      return jsonResponse({ success: false, error: 'File not found' }, 404);
    }

    const fileData = await checkResponse.json();
    
    // Delete file
    const deleteResponse = await fetch(githubUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'WigTube-Worker',
      },
      body: JSON.stringify({
        message: `Delete video: ${fileName}`,
        sha: fileData.sha,
        branch: branch,
      }),
    });

    if (!deleteResponse.ok) {
      return jsonResponse({ success: false, error: 'Delete failed' }, deleteResponse.status);
    }

    console.log(`✅ Deleted: ${filePath}`);

    return jsonResponse({ success: true, fileName: fileName });

  } catch (error) {
    console.error('Delete error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

/**
 * Helper: convert ArrayBuffer to base64 (handles large buffers)
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const CHUNK_SIZE = 32768; // Process in 32KB chunks to avoid call stack limits
  let binary = '';
  
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
    binary += String.fromCharCode.apply(null, chunk);
  }
  
  return btoa(binary);
}

/**
 * Helper: sanitize filename
 */
function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._\- ]/g, '_');
}

/**
 * Helper: create JSON response
 */
function jsonResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    { 
      status: status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
    }
  );
}
