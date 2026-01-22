// WigTube Large Upload Server - runs on Railway
// Handles chunked uploads >50MB and writes directly to GitHub via Git Data API

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // JSON body for finalize endpoint
app.use(express.raw({ type: 'application/octet-stream', limit: '100mb' })); // raw body for chunks

// Environment variables (configure in Railway)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
  console.warn('[WigTube Large Upload] Missing GitHub env vars (GITHUB_TOKEN/OWNER/REPO).');
}

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'wigtube-large-upload' });
});

// Helper: small sleep
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper: fetch with tiny retry
async function fetchWithRetry(url, options, attempts = 3, backoffMs = 250) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await sleep(backoffMs * (i + 1));
      }
    }
  }
  throw lastError || new Error('Request failed');
}

// POST /large-upload/chunk
// Headers: X-Chunk-Index, X-Total-Chunks, X-File-Name, X-File-Path
// Body: binary chunk (application/octet-stream)
// Stores each chunk as a separate file: videos/<filename>.part001, part002, etc.
app.post('/large-upload/chunk', async (req, res) => {
  try {
    const chunkIndex = parseInt(req.header('X-Chunk-Index'));
    const totalChunks = parseInt(req.header('X-Total-Chunks'));
    const fileName = req.header('X-File-Name');
    const baseFilePath = req.header('X-File-Path') || `videos/${fileName}`;

    if (Number.isNaN(chunkIndex) || Number.isNaN(totalChunks) || !fileName) {
      return res.status(400).json({ success: false, error: 'Missing chunk headers' });
    }

    if (!GITHUB_TOKEN) {
      return res.status(500).json({ success: false, error: 'Server not configured with GITHUB_TOKEN' });
    }

    // Store as separate file: videos/<filename>.part001
    const paddedIndex = String(chunkIndex + 1).padStart(3, '0');
    const chunkFilePath = `${baseFilePath}.part${paddedIndex}`;

    console.log(`[Chunk] ${fileName} chunk ${chunkIndex + 1}/${totalChunks} -> ${chunkFilePath}`);

    const chunkBuffer = Buffer.from(req.body);
    const base64Chunk = chunkBuffer.toString('base64');

    // Upload chunk as a separate file using Contents API
    const uploadResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${chunkFilePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'WigTube-Large-Upload-Server',
      },
      body: JSON.stringify({
        message: `Upload ${fileName} part ${paddedIndex}`,
        content: base64Chunk,
        branch: GITHUB_BRANCH,
      }),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[Chunk] Upload error:', errorText);
      return res.status(500).json({ success: false, error: 'Failed to upload chunk file' });
    }

    const uploadData = await uploadResponse.json();
    console.log(`[Chunk] ✅ ${fileName} chunk ${chunkIndex + 1} -> ${chunkFilePath}`);

    return res.json({
      success: true,
      chunkIndex,
      chunkPath: chunkFilePath,
      sha: uploadData.content.sha,
    });
  } catch (err) {
    console.error('[Chunk] Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Chunk error' });
  }
});

// POST /large-upload/finalize
// Body: { fileName, filePath, chunkPaths: string[], totalChunks: number, fileSize: number }
// Creates a metadata file to describe the multi-part video
app.post('/large-upload/finalize', async (req, res) => {
  try {
    const { fileName, filePath, totalChunks, fileSize } = req.body || {};

    if (!fileName || !filePath || !totalChunks) {
      return res.status(400).json({ success: false, error: 'Missing required data' });
    }

    if (!GITHUB_TOKEN) {
      return res.status(500).json({ success: false, error: 'Server not configured with GITHUB_TOKEN' });
    }

    console.log(`[Finalize] ${fileName} with ${totalChunks} parts -> metadata file`);

    // Create metadata file describing the multi-part video
    const metadataPath = `${filePath}.meta.json`;
    const metadata = {
      fileName,
      totalParts: totalChunks,
      fileSize: fileSize || 0,
      uploadedAt: new Date().toISOString(),
      isMultiPart: true,
      baseUrl: `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${filePath}`,
    };

    const metadataContent = Buffer.from(JSON.stringify(metadata, null, 2)).toString('base64');

    const uploadResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${metadataPath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'WigTube-Large-Upload-Server',
      },
      body: JSON.stringify({
        message: `Add metadata for ${fileName}`,
        content: metadataContent,
        branch: GITHUB_BRANCH,
      }),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[Finalize] Metadata upload error:', errorText);
      throw new Error('Failed to create metadata file');
    }

    const videoUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${filePath}`;
    console.log(`[Finalize] ✅ Multi-part video: ${videoUrl} (${totalChunks} parts)`);

    return res.json({
      success: true,
      fileName,
      videoUrl,
      isMultiPart: true,
      totalParts: totalChunks,
      metadataUrl: `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${metadataPath}`,
    });
  } catch (err) {
    console.error('[Finalize] Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Finalize error' });
  }
});

// GET /large-upload/reconstruct/:filename
// Reconstructs a multi-part video by fetching all parts and streaming them together
app.get('/large-upload/reconstruct/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const baseFilePath = `videos/${filename}`;
    const metadataPath = `${baseFilePath}.meta.json`;

    console.log(`[Reconstruct] Fetching metadata for ${filename}`);

    // Fetch metadata
    const metadataUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${metadataPath}`;
    const metadataResponse = await fetch(metadataUrl);

    if (!metadataResponse.ok) {
      return res.status(404).json({ success: false, error: 'Video metadata not found' });
    }

    const metadata = await metadataResponse.json();
    const totalParts = metadata.totalParts || 0;

    if (!metadata.isMultiPart || totalParts === 0) {
      return res.status(400).json({ success: false, error: 'Not a multi-part video' });
    }

    console.log(`[Reconstruct] Streaming ${totalParts} parts for ${filename}`);

    // Set headers for video streaming
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    if (metadata.fileSize) {
      res.setHeader('Content-Length', metadata.fileSize);
    }

    // Stream all parts in order
    for (let i = 1; i <= totalParts; i++) {
      const paddedIndex = String(i).padStart(3, '0');
      const partPath = `${baseFilePath}.part${paddedIndex}`;
      const partUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${partPath}`;

      console.log(`[Reconstruct] Fetching part ${i}/${totalParts}: ${partPath}`);

      const partResponse = await fetch(partUrl);
      if (!partResponse.ok) {
        console.error(`[Reconstruct] Failed to fetch part ${i}`);
        if (!res.headersSent) {
          return res.status(500).json({ success: false, error: `Failed to fetch part ${i}` });
        }
        return;
      }

      // Stream this part directly to the response
      const reader = partResponse.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }

    console.log(`[Reconstruct] ✅ Completed streaming ${filename}`);
    res.end();
  } catch (err) {
    console.error('[Reconstruct] Error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: err.message || 'Reconstruction error' });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[WigTube Large Upload] Listening on port ${PORT}`);
});
