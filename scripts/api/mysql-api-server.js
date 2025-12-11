const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'wigtube_user',
    password: 'wigtube_password',
    database: 'wigtube',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
pool.getConnection()
    .then(conn => {
        console.log('✅ Connected to MySQL database');
        conn.release();
    })
    .catch(err => {
        console.error('❌ MySQL connection error:', err);
    });

// ============================================
// VIDEO ENDPOINTS
// ============================================

// Get all public videos
app.get('/api/videos', async (req, res) => {
    try {
        const [videos] = await pool.query(`
            SELECT v.*, GROUP_CONCAT(vt.tag) as tags
            FROM videos v
            LEFT JOIN video_tags vt ON v.id = vt.video_id
            WHERE v.visibility = 'public'
            GROUP BY v.id
            ORDER BY v.upload_date DESC
        `);
        
        // Parse tags from string to array
        const videosWithTags = videos.map(video => ({
            ...video,
            tags: video.tags ? video.tags.split(',') : []
        }));
        
        res.json(videosWithTags);
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get video by ID
app.get('/api/videos/:id', async (req, res) => {
    try {
        const [videos] = await pool.query(`
            SELECT v.*, GROUP_CONCAT(vt.tag) as tags
            FROM videos v
            LEFT JOIN video_tags vt ON v.id = vt.video_id
            WHERE v.id = ?
            GROUP BY v.id
        `, [req.params.id]);
        
        if (videos.length === 0) {
            return res.status(404).json({ error: 'Video not found' });
        }
        
        const video = videos[0];
        video.tags = video.tags ? video.tags.split(',') : [];
        
        res.json(video);
    } catch (error) {
        console.error('Error fetching video:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get videos by uploader
app.get('/api/videos/uploader/:uploaderId', async (req, res) => {
    try {
        const [videos] = await pool.query(`
            SELECT v.*, GROUP_CONCAT(vt.tag) as tags
            FROM videos v
            LEFT JOIN video_tags vt ON v.id = vt.video_id
            WHERE v.uploader_id = ?
            GROUP BY v.id
            ORDER BY v.upload_date DESC
        `, [req.params.uploaderId]);
        
        const videosWithTags = videos.map(video => ({
            ...video,
            tags: video.tags ? video.tags.split(',') : []
        }));
        
        res.json(videosWithTags);
    } catch (error) {
        console.error('Error fetching videos by uploader:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create video
app.post('/api/videos', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { title, description, uploaderId, uploaderName, duration, thumbnail, videoUrl, category, tags, visibility } = req.body;
        
        const videoId = 'video_' + Date.now();
        const uploadDate = Date.now();
        
        // Insert video
        await connection.query(`
            INSERT INTO videos (id, title, description, uploader_id, uploader_name, upload_date, duration, thumbnail, video_url, category, visibility)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [videoId, title, description, uploaderId, uploaderName, uploadDate, duration, thumbnail, videoUrl, category, visibility || 'public']);
        
        // Insert tags
        if (tags && tags.length > 0) {
            const tagValues = tags.map(tag => [videoId, tag]);
            await connection.query('INSERT INTO video_tags (video_id, tag) VALUES ?', [tagValues]);
        }
        
        await connection.commit();
        
        res.json({ id: videoId, success: true });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating video:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Delete video
app.delete('/api/videos/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM videos WHERE id = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Video not found' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ error: error.message });
    }
});

// Increment view count
app.post('/api/videos/:id/view', async (req, res) => {
    try {
        await pool.query('UPDATE videos SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error incrementing view count:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// RATING ENDPOINTS
// ============================================

// Add or update rating
app.post('/api/videos/:id/rate', async (req, res) => {
    try {
        const { userId, rating } = req.body;
        
        await pool.query(`
            INSERT INTO video_ratings (video_id, user_id, rating)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE rating = ?
        `, [req.params.id, userId, rating, rating]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding rating:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get video ratings
app.get('/api/videos/:id/ratings', async (req, res) => {
    try {
        const [ratings] = await pool.query('SELECT user_id, rating FROM video_ratings WHERE video_id = ?', [req.params.id]);
        
        // Convert to userRatings object format
        const userRatings = {};
        ratings.forEach(r => {
            userRatings[r.user_id] = r.rating;
        });
        
        res.json(userRatings);
    } catch (error) {
        console.error('Error fetching ratings:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// FAVORITES ENDPOINTS
// ============================================

// Add to favorites
app.post('/api/favorites', async (req, res) => {
    try {
        const { userId, videoId } = req.body;
        
        await pool.query(`
            INSERT IGNORE INTO favorites (user_id, video_id)
            VALUES (?, ?)
        `, [userId, videoId]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({ error: error.message });
    }
});

// Remove from favorites
app.delete('/api/favorites/:userId/:videoId', async (req, res) => {
    try {
        await pool.query('DELETE FROM favorites WHERE user_id = ? AND video_id = ?', 
            [req.params.userId, req.params.videoId]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user's favorites
app.get('/api/favorites/:userId', async (req, res) => {
    try {
        const [favorites] = await pool.query('SELECT video_id FROM favorites WHERE user_id = ?', [req.params.userId]);
        
        const videoIds = favorites.map(f => f.video_id);
        res.json(videoIds);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', database: 'mysql', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WigTube MySQL API running on http://localhost:${PORT}`);
    console.log(`📊 Database: MySQL (wigtube)`);
    console.log(`📡 Listening on all network interfaces (0.0.0.0:${PORT})`);
});
