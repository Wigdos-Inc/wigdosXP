/**
 * WigTube Firebase Migration Script
 * Migrates data from old collection structure to new map-based structure
 * 
 * OLD STRUCTURE:
 * - wigtube_data/{videoId} (collection with documents)
 * - wigtube_comments/{commentId} (collection with documents)
 * - wigtube_user_ratings/{ratingId} (collection with documents)
 * 
 * NEW STRUCTURE:
 * - wigtube/data (document with videos map)
 * - wigtube/wigtube_comments (document with comments map)
 * - wigtube/user_ratings (document with ratings map)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    deleteDoc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDqDU6p8BH1hTqox7f5Sj1ySTWifIP2818",
    authDomain: "wigdos-9aa6a.firebaseapp.com",
    databaseURL: "https://wigdos-9aa6a-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "wigdos-9aa6a",
    storageBucket: "wigdos-9aa6a.firebasestorage.app",
    messagingSenderId: "124867645389",
    appId: "1:124867645389:web:4530e19e575669f3cabe84",
    measurementId: "G-1KTKSSCJ33"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🚀 Starting WigTube migration...');

/**
 * Migrate video data from wigtube_data collection to wigtube/data document
 */
async function migrateVideoData() {
    console.log('\n📹 Migrating video data...');
    
    try {
        // Read all videos from old collection
        const videosSnapshot = await getDocs(collection(db, 'wigtube_data'));
        
        if (videosSnapshot.empty) {
            console.log('  ℹ️  No video data found in wigtube_data collection');
            return { success: true, count: 0 };
        }
        
        // Build videos map
        const videos = {};
        let count = 0;
        
        videosSnapshot.forEach(docSnap => {
            const videoId = docSnap.id;
            const videoData = docSnap.data();
            videos[videoId] = videoData;
            count++;
            console.log(`  ✓ Loaded video: ${videoId}`);
        });
        
        // Write to new structure
        const dataDocRef = doc(db, 'wigtube', 'data');
        await setDoc(dataDocRef, { videos }, { merge: true });
        
        console.log(`  ✅ Migrated ${count} videos to wigtube/data`);
        return { success: true, count };
        
    } catch (error) {
        console.error('  ❌ Error migrating video data:', error);
        return { success: false, error };
    }
}

/**
 * Migrate comments from wigtube_comments collection to wigtube/wigtube_comments document
 */
async function migrateComments() {
    console.log('\n💬 Migrating comments...');
    
    try {
        // Read all comments from old collection
        const commentsSnapshot = await getDocs(collection(db, 'wigtube_comments'));
        
        if (commentsSnapshot.empty) {
            console.log('  ℹ️  No comments found in wigtube_comments collection');
            return { success: true, count: 0 };
        }
        
        // Build comments map (organized by videoId)
        const comments = {};
        let count = 0;
        
        commentsSnapshot.forEach(docSnap => {
            const commentId = docSnap.id;
            const commentData = docSnap.data();
            const videoId = commentData.videoId;
            
            if (!videoId) {
                console.warn(`  ⚠️  Comment ${commentId} has no videoId, skipping`);
                return;
            }
            
            if (!comments[videoId]) {
                comments[videoId] = [];
            }
            
            // Add comment to video's array
            comments[videoId].push({
                id: commentId,
                ...commentData
            });
            count++;
        });
        
        // Sort comments by timestamp (newest first)
        for (const videoId in comments) {
            comments[videoId].sort((a, b) => {
                const timeA = a.timestamp?.seconds || 0;
                const timeB = b.timestamp?.seconds || 0;
                return timeB - timeA;
            });
            console.log(`  ✓ Loaded ${comments[videoId].length} comments for video: ${videoId}`);
        }
        
        // Write to new structure
        const commentsDocRef = doc(db, 'wigtube', 'wigtube_comments');
        await setDoc(commentsDocRef, { comments }, { merge: true });
        
        console.log(`  ✅ Migrated ${count} comments to wigtube/wigtube_comments`);
        return { success: true, count };
        
    } catch (error) {
        console.error('  ❌ Error migrating comments:', error);
        return { success: false, error };
    }
}

/**
 * Migrate ratings from wigtube_user_ratings collection to wigtube/user_ratings document
 */
async function migrateRatings() {
    console.log('\n⭐ Migrating ratings...');
    
    try {
        // Read all ratings from old collection
        const ratingsSnapshot = await getDocs(collection(db, 'wigtube_user_ratings'));
        
        if (ratingsSnapshot.empty) {
            console.log('  ℹ️  No ratings found in wigtube_user_ratings collection');
            return { success: true, count: 0 };
        }
        
        // Build ratings map (organized by videoId)
        const ratings = {};
        let count = 0;
        
        ratingsSnapshot.forEach(docSnap => {
            const ratingId = docSnap.id;
            const ratingData = docSnap.data();
            const videoId = ratingData.videoId;
            const userId = ratingData.userId || 'anonymous';
            const rating = ratingData.rating;
            
            if (!videoId || rating === undefined) {
                console.warn(`  ⚠️  Rating ${ratingId} missing videoId or rating value, skipping`);
                return;
            }
            
            if (!ratings[videoId]) {
                ratings[videoId] = {};
            }
            
            // Store rating by userId
            ratings[videoId][userId] = rating;
            count++;
        });
        
        // Log rating counts
        for (const videoId in ratings) {
            const ratingCount = Object.keys(ratings[videoId]).length;
            console.log(`  ✓ Loaded ${ratingCount} ratings for video: ${videoId}`);
        }
        
        // Write to new structure
        const ratingsDocRef = doc(db, 'wigtube', 'user_ratings');
        await setDoc(ratingsDocRef, { ratings }, { merge: true });
        
        console.log(`  ✅ Migrated ${count} ratings to wigtube/user_ratings`);
        return { success: true, count };
        
    } catch (error) {
        console.error('  ❌ Error migrating ratings:', error);
        return { success: false, error };
    }
}

/**
 * Delete old collections after successful migration
 */
async function deleteOldCollections() {
    console.log('\n🗑️  Deleting old collections...');
    
    const collections = [
        'wigtube_data',
        'wigtube_comments', 
        'wigtube_user_ratings'
    ];
    
    for (const collectionName of collections) {
        try {
            console.log(`  Deleting ${collectionName}...`);
            const snapshot = await getDocs(collection(db, collectionName));
            
            if (snapshot.empty) {
                console.log(`  ℹ️  ${collectionName} is already empty`);
                continue;
            }
            
            // Delete in batches (max 500 per batch)
            const batch = writeBatch(db);
            let count = 0;
            
            snapshot.forEach(docSnap => {
                batch.delete(docSnap.ref);
                count++;
            });
            
            await batch.commit();
            console.log(`  ✅ Deleted ${count} documents from ${collectionName}`);
            
        } catch (error) {
            console.error(`  ❌ Error deleting ${collectionName}:`, error);
        }
    }
}

/**
 * Main migration function
 */
async function migrate() {
    console.log('═══════════════════════════════════════════');
    console.log('  WigTube Firebase Migration Script');
    console.log('═══════════════════════════════════════════');
    
    // Step 1: Migrate video data
    const videoResult = await migrateVideoData();
    
    // Step 2: Migrate comments
    const commentsResult = await migrateComments();
    
    // Step 3: Migrate ratings
    const ratingsResult = await migrateRatings();
    
    // Check if all migrations succeeded
    const allSuccess = videoResult.success && commentsResult.success && ratingsResult.success;
    
    console.log('\n═══════════════════════════════════════════');
    console.log('  Migration Summary');
    console.log('═══════════════════════════════════════════');
    console.log(`Videos:   ${videoResult.success ? '✅' : '❌'} ${videoResult.count || 0} migrated`);
    console.log(`Comments: ${commentsResult.success ? '✅' : '❌'} ${commentsResult.count || 0} migrated`);
    console.log(`Ratings:  ${ratingsResult.success ? '✅' : '❌'} ${ratingsResult.count || 0} migrated`);
    
    if (allSuccess) {
        console.log('\n✅ All migrations completed successfully!');
        
        // Ask for confirmation before deleting
        console.log('\n⚠️  Ready to delete old collections...');
        console.log('   Press Ctrl+C to cancel or wait 5 seconds to proceed...');
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        await deleteOldCollections();
        
        console.log('\n🎉 Migration complete! Old collections have been deleted.');
    } else {
        console.log('\n⚠️  Some migrations failed. Old collections will NOT be deleted.');
        console.log('   Please fix the errors and run the migration again.');
    }
    
    console.log('═══════════════════════════════════════════\n');
}

// Run migration
migrate().catch(error => {
    console.error('💥 Fatal error during migration:', error);
    process.exit(1);
});
