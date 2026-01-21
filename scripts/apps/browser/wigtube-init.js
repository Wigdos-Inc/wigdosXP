// WigTube Database Initialization Script
// Run this once to populate Firestore with initial video data (all at 0 views/ratings)

/**
 * Initialize WigTube database with videos at 0 views and 0 ratings
 * This should be run once when setting up the app
 * Now loads data from wigtube-data.json to avoid duplication
 */
async function initializeWigTubeDatabase() {
    console.log('Starting WigTube database initialization...');
    
    if (typeof WigTubeDB === 'undefined') {
        console.error('WigTubeDB not loaded! Make sure wigtube-db.js is included.');
        return;
    }
    
    if (!WigTubeDB.isOnline()) {
        console.error('Firestore not available! Check your Firebase configuration.');
        return;
    }
    
    // Load video data from JSON file (single source of truth)
    console.log('📦 Loading video data from wigtube-data.json...');
    let videoDataJson;
    try {
        const response = await fetch('../../scripts/apps/browser/wigtube-data.json');
        videoDataJson = await response.json();
        console.log(`✅ Loaded ${videoDataJson.videos.length} videos from JSON file`);
    } catch (error) {
        console.error('❌ Failed to load wigtube-data.json:', error);
        console.error('Make sure the file exists at: scripts/apps/browser/wigtube-data.json');
        return;
    }
    
    // Convert JSON video data to Firestore format
    const videosToInit = videoDataJson.videos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description || '',
        uploaderId: video.uploader || 'anonymous',
        uploaderName: video.uploader || video.author || 'Anonymous',
        duration: video.duration || '0:00',
        thumbnail: video.thumbnail || '',
        videoUrl: video.videoFile || '',
        category: video.category || 'other',
        tags: video.tags || [],
        isMusic: video.isMusic || false,
        album: video.album || '',
        artist: video.artist || '',
        year: video.year || new Date().getFullYear().toString(),
        genre: video.genre || ''
    }));
    
    let successCount = 0;
    let errorCount = 0;
    
    console.log(`Initializing ${videosToInit.length} videos...`);
    
    for (const video of videosToInit) {
        try {
            // Check if video already exists
            const existing = await WigTubeDB.getVideoById(video.id);
            
            if (existing && existing.viewCount !== undefined) {
                console.log(`⏭️  Skipping "${video.title}" - already exists in database`);
                continue;
            }
            
            // Create video with 0 views and empty ratings
            await WigTubeDB.createVideo({
                ...video,
                visibility: 'public'
            });
            
            console.log(`✅ Created "${video.title}" with 0 views and 0 ratings`);
            successCount++;
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error(`❌ Error creating "${video.title}":`, error);
            errorCount++;
        }
    }
    
    console.log('\n=== Initialization Complete ===');
    console.log(`✅ Successfully created: ${successCount} videos`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`⏭️  Skipped: ${videosToInit.length - successCount - errorCount} (already exist)`);
    console.log('\nAll videos start with:');
    console.log('  - 0 views');
    console.log('  - 0 ratings (☆☆☆☆☆)');
    console.log('  - 0 comments');
}

// Auto-run if this script is loaded directly
if (typeof window !== 'undefined') {
    console.log('WigTube Init Script Loaded');
    console.log('To initialize the database, run: initializeWigTubeDatabase()');
    console.log('Or open browser console and type: initializeWigTubeDatabase()');
    
    // Make function available globally
    window.initializeWigTubeDatabase = initializeWigTubeDatabase;
}
