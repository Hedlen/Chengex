-- 旅游网站数据库初始化脚本
-- 创建时间: 2025-10-17

USE travelweb_db;

-- 博客表
CREATE TABLE IF NOT EXISTS blogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category VARCHAR(100),
    tags JSON,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    featured_image VARCHAR(500),
    author VARCHAR(100) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at),
    INDEX idx_published_at (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 视频表
CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    category VARCHAR(100),
    tags JSON,
    platform VARCHAR(50) DEFAULT 'youtube',
    platform_id VARCHAR(100),
    duration INT, -- 秒数
    status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
    featured BOOLEAN DEFAULT FALSE,
    author VARCHAR(100) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_platform (platform),
    INDEX idx_featured (featured),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 博客浏览记录表
CREATE TABLE IF NOT EXISTS blog_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blog_id INT NOT NULL,
    session_id VARCHAR(100),
    user_agent TEXT,
    ip_address VARCHAR(45),
    referrer VARCHAR(500),
    view_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reading_time INT DEFAULT 0, -- 阅读时间（秒）
    scroll_depth DECIMAL(5,2) DEFAULT 0, -- 滚动深度百分比
    FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
    INDEX idx_blog_id (blog_id),
    INDEX idx_session_id (session_id),
    INDEX idx_view_time (view_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 视频播放记录表
CREATE TABLE IF NOT EXISTS video_plays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    video_id INT NOT NULL,
    session_id VARCHAR(100),
    user_agent TEXT,
    ip_address VARCHAR(45),
    referrer VARCHAR(500),
    play_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    watch_duration INT DEFAULT 0, -- 观看时长（秒）
    completion_rate DECIMAL(5,2) DEFAULT 0, -- 完成率百分比
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    INDEX idx_video_id (video_id),
    INDEX idx_session_id (session_id),
    INDEX idx_play_time (play_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 页面浏览记录表
CREATE TABLE IF NOT EXISTS page_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_url VARCHAR(500) NOT NULL,
    page_title VARCHAR(255),
    session_id VARCHAR(100),
    user_agent TEXT,
    ip_address VARCHAR(45),
    referrer VARCHAR(500),
    view_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    stay_duration INT DEFAULT 0, -- 停留时间（秒）
    INDEX idx_page_url (page_url),
    INDEX idx_session_id (session_id),
    INDEX idx_view_time (view_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blog_id INT NOT NULL,
    parent_id INT NULL, -- 父评论ID，用于回复
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(255),
    content TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_blog_id (blog_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 活动日志表
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50), -- blog, video, comment等
    resource_id INT,
    user_name VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_action (action),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_user_name (user_name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    config_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认系统配置
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('site_name', '旅游网站', 'string', '网站名称'),
('site_description', '专业的旅游内容分享平台', 'string', '网站描述'),
('site_url', 'https://example.com', 'string', '网站URL'),
('admin_email', 'admin@example.com', 'string', '管理员邮箱'),
('max_file_size', '10485760', 'number', '最大文件大小（字节）'),
('allowed_file_types', '["jpg","jpeg","png","gif","mp4","webm"]', 'json', '允许的文件类型'),
('session_timeout', '3600', 'number', '会话超时时间（秒）'),
('enable_registration', 'false', 'boolean', '是否启用用户注册'),
('maintenance_mode', 'false', 'boolean', '维护模式')
ON DUPLICATE KEY UPDATE 
config_value = VALUES(config_value),
updated_at = CURRENT_TIMESTAMP;

-- 创建视图：博客统计
CREATE OR REPLACE VIEW blog_stats AS
SELECT 
    b.id,
    b.title,
    b.category,
    b.status,
    b.created_at,
    b.published_at,
    COUNT(DISTINCT bv.id) as total_views,
    COUNT(DISTINCT c.id) as total_comments,
    AVG(bv.reading_time) as avg_reading_time,
    AVG(bv.scroll_depth) as avg_scroll_depth
FROM blogs b
LEFT JOIN blog_views bv ON b.id = bv.blog_id
LEFT JOIN comments c ON b.id = c.blog_id AND c.status = 'approved'
GROUP BY b.id;

-- 创建视图：视频统计
CREATE OR REPLACE VIEW video_stats AS
SELECT 
    v.id,
    v.title,
    v.category,
    v.platform,
    v.status,
    v.created_at,
    COUNT(DISTINCT vp.id) as total_plays,
    AVG(vp.watch_duration) as avg_watch_duration,
    AVG(vp.completion_rate) as avg_completion_rate
FROM videos v
LEFT JOIN video_plays vp ON v.id = vp.video_id
GROUP BY v.id;

-- 创建存储过程：清理旧的分析数据
DELIMITER //
CREATE PROCEDURE CleanOldAnalyticsData(IN days_to_keep INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 删除超过指定天数的页面浏览记录
    DELETE FROM page_views 
    WHERE view_time < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    -- 删除超过指定天数的博客浏览记录
    DELETE FROM blog_views 
    WHERE view_time < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    -- 删除超过指定天数的视频播放记录
    DELETE FROM video_plays 
    WHERE play_time < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    -- 删除超过指定天数的活动日志
    DELETE FROM activity_logs 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    COMMIT;
END //
DELIMITER ;

-- 显示创建的表
SHOW TABLES;

-- 显示表结构
DESCRIBE blogs;
DESCRIBE videos;
DESCRIBE blog_views;
DESCRIBE video_plays;
DESCRIBE page_views;
DESCRIBE comments;
DESCRIBE activity_logs;
DESCRIBE system_config;