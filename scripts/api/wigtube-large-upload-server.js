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
app.post('/large-upload/chunk', async (req, res) => {
  try {
    const chunkIndex = parseInt(req.header('X-Chunk-Index'));
    const totalChunks = parseInt(req.header('X-Total-Chunks'));
    const fileName = req.header('X-File-Name');
    const filePath = req.header('X-File-Path') || `videos/${fileName}`;

    if (Number.isNaN(chunkIndex) || Number.isNaN(totalChunks) || !fileName) {
      return res.status(400).json({ success: false, error: 'Missing chunk headers' });
    }

    if (!GITHUB_TOKEN) {
      return res.status(500).json({ success: false, error: 'Server not configured with GITHUB_TOKEN' });
    }

    console.log(`[Chunk] ${fileName} chunk ${chunkIndex + 1}/${totalChunks} -> ${filePath}`);

    const chunkBuffer = Buffer.from(req.body);
    const base64Chunk = chunkBuffer.toString('base64');

    const blobResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/blobs`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'WigTube-Large-Upload-Server',
      },
      body: JSON.stringify({
        content: base64Chunk,
        encoding: 'base64',
      }),
    });

    if (!blobResponse.ok) {
      const errorText = await blobResponse.text();
      console.error('[Chunk] Blob creation error:', errorText);
      return res.status(500).json({ success: false, error: 'Failed to create blob' });
    }

    const blobData = await blobResponse.json();
    console.log(`[Chunk] ✅ ${fileName} chunk ${chunkIndex + 1} -> ${blobData.sha}`);

    return res.json({
      success: true,
      chunkIndex,
      blobSha: blobData.sha,
    });
  } catch (err) {
    console.error('[Chunk] Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Chunk error' });
  }
});

// POST /large-upload/finalize
// Body: { fileName, filePath, chunkShas: string[] }
app.post('/large-upload/finalize', async (req, res) => {
  try {
    const { fileName, filePath, chunkShas } = req.body || {};

    if (!fileName || !filePath || !Array.isArray(chunkShas) || chunkShas.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing required data' });
    }

    if (!GITHUB_TOKEN) {
      return res.status(500).json({ success: false, error: 'Server not configured with GITHUB_TOKEN' });
    }

    console.log(`[Finalize] ${fileName} with ${chunkShas.length} chunks -> ${filePath}`);

    const owner = GITHUB_OWNER;
    const repo = GITHUB_REPO;
    const branch = GITHUB_BRANCH;

    // Combine chunk blobs into one blob in GitHub, streaming base64 JSON body
    console.log('[Finalize] Streaming chunks into final blob...');

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        (async () => {
          try {
            controller.enqueue(encoder.encode('{"content":"'));
            for (let i = 0; i < chunkShas.length; i++) {
              if (i > 0) {
                await sleep(3000);
              }
              const sha = chunkShas[i];
              console.log(`[Finalize] Fetching chunk ${i + 1}/${chunkShas.length}: ${sha}`);

              const blobResponse = await fetchWithRetry(
                `https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`,
                {
                  headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'WigTube-Large-Upload-Server',
                  },
                },
                3,
                250,
              );

              if (!blobResponse.ok) {
                const errText = await blobResponse.text();
                console.error('[Finalize] Chunk fetch error body:', errText);
                throw new Error(`Failed to fetch chunk ${i + 1} (status ${blobResponse.status})`);
              }

              const blobJson = await blobResponse.json();
              let base64Chunk = (blobJson.content || '').replace(/\n/g, '');
              if (i < chunkShas.length - 1) {
                base64Chunk = base64Chunk.replace(/=+$/g, '');
              }

              controller.enqueue(encoder.encode(base64Chunk));
            }

            controller.enqueue(encoder.encode('","encoding":"base64"}'));
            controller.close();
          } catch (err) {
            console.error('[Finalize] Stream combine error:', err);
            try {
              controller.error(err);
            } catch (innerErr) {
              console.error('[Finalize] controller.error failed:', innerErr);
            }
          }
        })();
      },
    });

    // Create final blob in GitHub
    const blobResponse = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'WigTube-Large-Upload-Server',
      },
      body: stream,
    }, 3, 250);

    if (!blobResponse.ok) {
      const errorText = await blobResponse.text();
      console.error('[Finalize] Final blob creation error:', errorText);
      throw new Error('Failed to create final blob');
    }

    const blobData = await blobResponse.json();
    console.log(`[Finalize] ✅ Final blob: ${blobData.sha}`);

    // Get current branch reference
    const refResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'WigTube-Large-Upload-Server',
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
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'WigTube-Large-Upload-Server',
      },
    });

    const commitData = await commitResponse.json();
    const baseTreeSha = commitData.tree.sha;

    // Create new tree with the file
    const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'WigTube-Large-Upload-Server',
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: [
          {
            path: filePath,
            mode: '100644',
            type: 'blob',
            sha: blobData.sha,
          },
        ],
      }),
    });

    if (!treeResponse.ok) {
      const errorText = await treeResponse.text();
      console.error('[Finalize] Tree creation error:', errorText);
      throw new Error('Failed to create tree');
    }

    const treeData = await treeResponse.json();

    // Create commit
    const newCommitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'WigTube-Large-Upload-Server',
      },
      body: JSON.stringify({
        message: `Add video: ${fileName}`,
        tree: treeData.sha,
        parents: [baseCommitSha],
      }),
    });

    if (!newCommitResponse.ok) {
      throw new Error('Failed to create commit');
    }

    const newCommitData = await newCommitResponse.json();

    // Update branch ref
    const updateRefResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'WigTube-Large-Upload-Server',
      },
      body: JSON.stringify({
        sha: newCommitData.sha,
      }),
    });

    if (!updateRefResponse.ok) {
      throw new Error('Failed to update branch');
    }

    const videoUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    console.log(`[Finalize] ✅ Video URL: ${videoUrl}`);

    return res.json({
      success: true,
      fileName,
      videoUrl,
      path: filePath,
    });
  } catch (err) {
    console.error('[Finalize] Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Finalize error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[WigTube Large Upload] Listening on port ${PORT}`);
});
