-- WigTube MySQL Database Schema

CREATE DATABASE IF NOT EXISTS wigtube;
USE wigtube;

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    uploader_id VARCHAR(50) NOT NULL,
    uploader_name VARCHAR(100) NOT NULL,
    upload_date BIGINT NOT NULL,
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    dislike_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    duration VARCHAR(10) NOT NULL,
    thumbnail TEXT,
    video_url TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    visibility VARCHAR(20) DEFAULT 'public',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_uploader (uploader_id),
    INDEX idx_category (category),
    INDEX idx_visibility (visibility),
    INDEX idx_upload_date (upload_date)
);

-- Video tags table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS video_tags (
    video_id VARCHAR(50),
    tag VARCHAR(50),
    PRIMARY KEY (video_id, tag),
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    INDEX idx_tag (tag)
);

-- User ratings table
CREATE TABLE IF NOT EXISTS video_ratings (
    video_id VARCHAR(50),
    user_id VARCHAR(50),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (video_id, user_id),
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS video_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    video_id VARCHAR(50),
    user_id VARCHAR(50) NOT NULL,
    username VARCHAR(100) NOT NULL,
    comment TEXT NOT NULL,
    image_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    INDEX idx_video (video_id),
    INDEX idx_user (user_id)
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    user_id VARCHAR(50),
    video_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, video_id),
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
);

-- Create a user for the application
CREATE USER IF NOT EXISTS 'wigtube_user'@'localhost' IDENTIFIED BY 'wigtube_password';
GRANT ALL PRIVILEGES ON wigtube.* TO 'wigtube_user'@'localhost';
FLUSH PRIVILEGES;

SELECT 'Database setup complete!' AS status;
