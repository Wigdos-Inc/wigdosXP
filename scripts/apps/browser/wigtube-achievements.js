// WigTube Achievements Integration
// Tracks and awards achievements for WigTube activities

console.log('WigTube Achievements: Module loading...');

window.WigTubeAchievements = (function() {
    'use strict';

    /**
     * Check and award achievement
     */
    async function checkAndAward(achievementId, silent = false) {
        if (typeof window.AchievementsDB === 'undefined') {
            console.warn('AchievementsDB not loaded');
            return false;
        }

        const username = localStorage.getItem('username');
        if (!username || username.toLowerCase() === 'guest') {
            return false;
        }

        try {
            const awarded = await window.AchievementsDB.awardBadge(username, achievementId);
            if (awarded && !silent) {
                console.log(`🏆 Achievement unlocked: ${achievementId}`);
            }
            return awarded;
        } catch (error) {
            console.error('Error awarding achievement:', error);
            return false;
        }
    }

    /**
     * Check view count achievements
     */
    async function checkViewAchievements(totalViews) {
        if (totalViews >= 100) {
            await checkAndAward('wigtube_noticed');
        } else if (totalViews >= 10) {
            await checkAndAward('wigtube_seen');
        }
    }

    /**
     * Check subscriber achievements
     */
    async function checkSubscriberAchievements(subscriberCount) {
        if (subscriberCount >= 10) {
            await checkAndAward('wigtube_big_leagues');
        } else if (subscriberCount >= 1) {
            await checkAndAward('wigtube_ohio_impressed');
        }
    }

    /**
     * Check comment achievements
     */
    async function checkCommentAchievements(commentCount) {
        if (commentCount >= 10) {
            await checkAndAward('wigtube_reviewer');
        } else if (commentCount >= 1) {
            await checkAndAward('wigtube_moistcritical');
        }
    }

    /**
     * Check video upload achievements
     */
    async function checkUploadAchievements(uploadCount) {
        if (uploadCount >= 10) {
            await checkAndAward('wigtube_one_who_tubes');
        } else if (uploadCount >= 1) {
            await checkAndAward('wigtube_wigtuber');
        }
    }

    /**
     * Award playlist creation achievement
     */
    async function awardPlaylistAchievement() {
        await checkAndAward('wigtube_not_lucio');
    }

    /**
     * Award channel customization achievement
     */
    async function awardChannelCustomizationAchievement() {
        await checkAndAward('wigtube_fabulious');
    }

    /**
     * Get total views across all user's videos
     */
    async function getTotalViews(username) {
        if (typeof window.WigTubeDB === 'undefined') {
            return 0;
        }

        try {
            const videos = await window.WigTubeDB.getVideosByUploader(username);
            return videos.reduce((total, video) => total + (video.viewCount || 0), 0);
        } catch (error) {
            console.error('Error calculating total views:', error);
            return 0;
        }
    }

    /**
     * Get total comments posted by user
     */
    async function getTotalComments(username) {
        // Get from localStorage as a simple counter
        const key = `wigtube_comment_count_${username}`;
        try {
            return parseInt(localStorage.getItem(key) || '0', 10);
        } catch (error) {
            return 0;
        }
    }

    /**
     * Increment comment counter
     */
    function incrementCommentCount() {
        const username = localStorage.getItem('username');
        if (!username || username.toLowerCase() === 'guest') {
            return 0;
        }

        const key = `wigtube_comment_count_${username}`;
        try {
            const currentCount = parseInt(localStorage.getItem(key) || '0', 10);
            const newCount = currentCount + 1;
            localStorage.setItem(key, newCount.toString());
            return newCount;
        } catch (error) {
            console.error('Error incrementing comment count:', error);
            return 0;
        }
    }

    /**
     * Get total videos uploaded by user
     */
    async function getTotalUploads(username) {
        if (typeof window.WigTubeDB === 'undefined') {
            return 0;
        }

        try {
            const videos = await window.WigTubeDB.getVideosByUploader(username);
            return videos.length;
        } catch (error) {
            console.error('Error counting uploads:', error);
            return 0;
        }
    }

    /**
     * On comment posted
     */
    async function onCommentPosted() {
        const count = incrementCommentCount();
        await checkCommentAchievements(count);
    }

    /**
     * On video uploaded
     */
    async function onVideoUploaded() {
        const username = localStorage.getItem('username');
        if (!username || username.toLowerCase() === 'guest') {
            return;
        }

        const count = await getTotalUploads(username);
        await checkUploadAchievements(count);
    }

    /**
     * On subscriber gained
     */
    async function onSubscriberGained(channelName) {
        if (typeof window.WigTubeDB === 'undefined') {
            return;
        }

        try {
            const count = await window.WigTubeDB.getSubscriberCount(channelName);
            await checkSubscriberAchievements(count);
        } catch (error) {
            console.error('Error checking subscriber achievements:', error);
        }
    }

    /**
     * On video view
     */
    async function onVideoViewed(uploaderName) {
        if (!uploaderName) return;

        const totalViews = await getTotalViews(uploaderName);
        await checkViewAchievements(totalViews);
    }

    /**
     * On public playlist created
     */
    async function onPublicPlaylistCreated() {
        await awardPlaylistAchievement();
    }

    /**
     * On channel customized
     */
    async function onChannelCustomized() {
        await awardChannelCustomizationAchievement();
    }

    // Public API
    return {
        // Event handlers
        onCommentPosted,
        onVideoUploaded,
        onSubscriberGained,
        onVideoViewed,
        onPublicPlaylistCreated,
        onChannelCustomized,

        // Manual checks
        checkViewAchievements,
        checkSubscriberAchievements,
        checkCommentAchievements,
        checkUploadAchievements,

        // Utilities
        getTotalViews,
        getTotalComments,
        getTotalUploads
    };
})();

console.log('WigTube Achievements: Module loaded');
