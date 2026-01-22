// WigTube Achievements Integration
// Tracks and awards achievements for WigTube activities

console.log('WigTube Achievements: Module loading...');

window.WigTubeAchievements = (function() {
    'use strict';

    let achievementsConfig = null;

    /**
     * Load achievements configuration
     */
    async function loadAchievementsConfig() {
        if (achievementsConfig) {
            return achievementsConfig;
        }

        try {
            const response = await fetch('/scripts/global/achievements.json?t=' + Date.now());
            const data = await response.json();
            achievementsConfig = data.categories;
            return achievementsConfig;
        } catch (error) {
            console.error('Error loading achievements config:', error);
            return null;
        }
    }

    /**
     * Show achievement notification popup
     */
    function showAchievementNotification(badge) {
        // Play achievement sound
        const achievementSound = new Audio('/assets/audio/system/achievment.mp3');
        achievementSound.volume = 0.5;
        achievementSound.play().catch(err => console.log('Audio play failed:', err));
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'wigtube-achievement-notification';
        
        notification.innerHTML = `
            <div class="wigtube-achievement-content">
                <div class="wigtube-achievement-header">
                    <div class="wigtube-achievement-icon"><img src="/assets/images/icons/achievment/info.gif" alt="Achievement"></div>
                    <div class="wigtube-achievement-title">Achievement Unlocked</div>
                </div>
                <div class="wigtube-achievement-body">
                    <div class="wigtube-badge-icon"><img src="${badge.icon}" alt="${badge.name}"></div>
                    <div class="wigtube-badge-info">
                        <div class="wigtube-badge-name">${badge.name}</div>
                        <div class="wigtube-badge-desc">${badge.description}</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add styles if not already present
        if (!document.getElementById('wigtube-achievement-styles')) {
            const style = document.createElement('style');
            style.id = 'wigtube-achievement-styles';
            style.textContent = `
                .wigtube-achievement-notification {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 10000;
                    animation: slideIn 0.5s ease-out;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
                
                .wigtube-achievement-content {
                    background: linear-gradient(to bottom, #f0f0f0, #e0e0e0);
                    border: 2px solid #0054e3;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3),
                                inset 0 1px 0 rgba(255, 255, 255, 0.3);
                    width: 320px;
                    font-family: 'Tahoma', 'Segoe UI', sans-serif;
                    overflow: hidden;
                }
                
                .wigtube-achievement-header {
                    background: linear-gradient(to bottom, #0078d7, #0054e3);
                    border-bottom: 1px solid #003d99;
                    padding: 8px 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .wigtube-achievement-icon {
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .wigtube-achievement-icon img {
                    width: 16px;
                    height: 16px;
                }
                
                .wigtube-achievement-title {
                    color: #ffffff;
                    font-size: 12px;
                    font-weight: bold;
                    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
                }
                
                .wigtube-achievement-body {
                    padding: 15px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    background: linear-gradient(to bottom, #d6e8ff, #c3ddf9);
                }
                
                .wigtube-badge-icon {
                    flex-shrink: 0;
                    width: 64px;
                    height: 64px;
                    border: 2px solid #0054e3;
                    background: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5),
                                0 2px 4px rgba(0, 0, 0, 0.2);
                    border-radius: 4px;
                }
                
                .wigtube-badge-icon img {
                    max-width: 100%;
                    max-height: 100%;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                
                .wigtube-badge-info {
                    flex: 1;
                    min-width: 0;
                }
                
                .wigtube-badge-name {
                    color: #003d99;
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 6px;
                    line-height: 1.3;
                    word-wrap: break-word;
                }
                
                .wigtube-badge-desc {
                    color: #0054e3;
                    font-size: 11px;
                    line-height: 1.4;
                    word-wrap: break-word;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove notification after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease-in';
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 4000);
    }

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
            const awarded = await window.AchievementsDB.awardAchievement(achievementId, username);
            if (awarded && !silent) {
                console.log(`🏆 Achievement unlocked: ${achievementId}`);
                
                // Load config and show notification
                const config = await loadAchievementsConfig();
                if (config) {
                    // Find badge info
                    let badgeInfo = null;
                    for (const categoryKey in config) {
                        const category = config[categoryKey];
                        if (category.badges && category.badges[achievementId]) {
                            badgeInfo = category.badges[achievementId];
                            break;
                        }
                    }
                    
                    if (badgeInfo) {
                        showAchievementNotification(badgeInfo);
                    }
                }
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
