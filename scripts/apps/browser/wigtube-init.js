// WigTube Database Initialization Script
// Run this once to populate Firestore with initial video data (all at 0 views/ratings)

/**
 * Initialize WigTube database with videos at 0 views and 0 ratings
 * This should be run once when setting up the app
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
    
    // Video definitions with metadata (from wigtube-player.js)
    const videosToInit = [
        {
            id: 'epic-minecraft-castle-build',
            title: 'Epic Minecraft Castle Build',
            description: 'I, AM STEVE',
            uploaderId: 'wigcraft_user',
            uploaderName: 'WigCraft',
            duration: '10:24',
            thumbnail: 'assets/images/thumbnail/steve.png',
            videoUrl: 'assets/videos/steve.mp4',
            category: 'gaming',
            tags: ['minecraft', 'building', 'castle', 'gaming']
        },
        {
            id: 'yo Darren',
            title: 'Yo Darren',
            description: 'YO DARREN MY N',
            uploaderId: 'codemittens_user',
            uploaderName: 'Codemittens',
            duration: '01:41',
            thumbnail: 'assets/images/thumbnail/yodarren.png',
            videoUrl: 'assets/videos/dingaling.mp4',
            category: 'gaming',
            tags: ['funny', 'gaming', 'meme']
        },
        {
            id: 'fredrick-fazbear-touches-youtubers-dingalings',
            title: 'Fredrick Fazbear Touches Youtubers Dingalings',
            description: 'The rival of mrPenis strikes once again',
            uploaderId: 'fredbear_user',
            uploaderName: 'fredbear',
            duration: '04:37',
            thumbnail: 'assets/images/thumbnail/dingaling.png',
            videoUrl: 'assets/videos/nightguard.mp4',
            category: 'gaming',
            tags: ['fnaf', 'horror', 'gaming', 'funny']
        },
        {
            id: 'fnaf-squid-games-real',
            title: 'Fnaf squid games real',
            description: 'The true fnaf experience',
            uploaderId: 'mrpenis_user',
            uploaderName: 'MrPenis',
            duration: '00:56',
            thumbnail: 'assets/images/thumbnail/mr.png',
            videoUrl: 'assets/videos/fnaf.mp4',
            category: 'comedy',
            tags: ['fnaf', 'squid game', 'parody', 'funny']
        },
        {
            id: 'blackman',
            title: 'freddy fazbear is about to get his dingaling touched',
            description: '',
            uploaderId: 'fredbear_user',
            uploaderName: 'fredbear',
            duration: '22:15',
            thumbnail: 'assets/images/thumbnail/blackman.png',
            videoUrl: 'assets/videos/blackman.mp4',
            category: 'comedy',
            tags: ['fnaf', 'comedy']
        },
        {
            id: 'jolly',
            title: 'jolly flight',
            description: 'flight felt a bit jolly this year',
            uploaderId: 'santa_user',
            uploaderName: 'Santa Claus',
            duration: '8:59',
            thumbnail: 'assets/images/thumbnail/santa.png',
            videoUrl: 'assets/videos/jolly.mp4',
            category: 'comedy',
            tags: ['christmas', 'holiday', 'funny']
        },
        {
            id: 'chill-beats-mix-vol-12',
            title: 'Chill Beats Mix Vol. 12',
            description: 'Relaxing beats for studying and chilling',
            uploaderId: 'wigbeats_user',
            uploaderName: 'WigBeats',
            duration: '3:47',
            thumbnail: 'assets/images/thumbnail/beats.png',
            videoUrl: '',
            category: 'music',
            tags: ['music', 'beats', 'chill', 'lofi']
        },
        {
            id: 'c418',
            title: 'hagstorm',
            description: 'nostalgia is a curse',
            uploaderId: 'c418_user',
            uploaderName: 'c418',
            duration: '00:15',
            thumbnail: 'assets/images/thumbnail/nostalgia.png',
            videoUrl: 'assets/album/hagstorm.mp4',
            category: 'music',
            tags: ['minecraft', 'music', 'c418', 'nostalgia']
        },
        {
            id: 'c4182',
            title: 'wethands',
            description: 'nostalgia is a curse',
            uploaderId: 'c418_user',
            uploaderName: 'c418',
            duration: '00:15',
            thumbnail: 'assets/images/thumbnail/nostalgia.png',
            videoUrl: 'assets/album/wet.mp4',
            category: 'music',
            tags: ['minecraft', 'music', 'c418']
        },
        {
            id: 'c4183',
            title: 'dryhands',
            description: 'nostalgia is a curse',
            uploaderId: 'c418_user',
            uploaderName: 'c418',
            duration: '00:15',
            thumbnail: 'assets/images/thumbnail/nostalgia.png',
            videoUrl: 'assets/album/dry.mp4',
            category: 'music',
            tags: ['minecraft', 'music', 'c418']
        },
        {
            id: 'c4184',
            title: 'moogcity',
            description: 'nostalgia is a curse',
            uploaderId: 'c418_user',
            uploaderName: 'c418',
            duration: '00:15',
            thumbnail: 'assets/images/thumbnail/nostalgia.png',
            videoUrl: 'assets/album/moog.mp4',
            category: 'music',
            tags: ['minecraft', 'music', 'c418']
        },
        {
            id: 'c4185',
            title: 'sweden',
            description: 'nostalgia is a curse',
            uploaderId: 'c418_user',
            uploaderName: 'c418',
            duration: '00:15',
            thumbnail: 'assets/images/thumbnail/nostalgia.png',
            videoUrl: 'assets/album/sweden.mp4',
            category: 'music',
            tags: ['minecraft', 'music', 'c418']
        },
        {
            id: 'schlaubum1',
            title: 'jschlatt — Santa Claus Is Coming To Town',
            description: 'Schlaubman sings a festive tune',
            uploaderId: 'schlatt_user',
            uploaderName: 'schlatt & Co',
            duration: '00:15',
            thumbnail: 'assets/images/thumbnail/schlatt.png',
            videoUrl: 'assets/album/album1.mp4',
            category: 'music',
            tags: ['christmas', 'jschlatt', 'music', 'holiday']
        },
        {
            id: 'schlaubum2',
            title: 'jschlatt — The Christmas Song',
            description: 'A jolly holiday song by Schlaubman',
            uploaderId: 'schlatt_user',
            uploaderName: 'schlatt & Co',
            duration: '00:20',
            thumbnail: 'assets/images/thumbnail/schlatt.png',
            videoUrl: 'assets/album/album2.mp4',
            category: 'music',
            tags: ['christmas', 'jschlatt', 'music', 'holiday']
        },
        {
            id: 'schlaubum3',
            title: 'jschlatt — Let It Snow! Let It Snow! Let It Snow!',
            description: 'Another festive track from Schlaubman',
            uploaderId: 'schlatt_user',
            uploaderName: 'schlatt & Co',
            duration: '00:18',
            thumbnail: 'assets/images/thumbnail/schlatt.png',
            videoUrl: 'assets/album/album3.mp4',
            category: 'music',
            tags: ['christmas', 'jschlatt', 'music', 'holiday']
        },
        {
            id: 'schlaubum4',
            title: 'jschlatt — Baby It\'s Cold Outside',
            description: 'Schlaubman brings the holiday spirit',
            uploaderId: 'schlatt_user',
            uploaderName: 'schlatt & Co',
            duration: '00:25',
            thumbnail: 'assets/images/thumbnail/schlatt.png',
            videoUrl: 'assets/album/album4.mp4',
            category: 'music',
            tags: ['christmas', 'jschlatt', 'music', 'holiday']
        },
        {
            id: 'schlaubum5',
            title: 'jschlatt — Happy Holiday',
            description: 'The grand finale of the Schlaubum',
            uploaderId: 'schlatt_user',
            uploaderName: 'schlatt & Co',
            duration: '00:30',
            thumbnail: 'assets/images/thumbnail/schlatt.png',
            videoUrl: 'assets/album/album5.mp4',
            category: 'music',
            tags: ['christmas', 'jschlatt', 'music', 'holiday']
        }
    ];
    
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
