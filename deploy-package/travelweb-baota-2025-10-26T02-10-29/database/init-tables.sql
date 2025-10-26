-- 博客系统数据库迁移 - 完整表结构创建脚本
-- 根据技术架构文档创建15个核心数据表

-- 删除现有表（如果存在）
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS external_video_returns;
DROP TABLE IF EXISTS external_video_clicks;
DROP TABLE IF EXISTS video_plays;
DROP TABLE IF EXISTS blog_views;
DROP TABLE IF EXISTS page_views;
DROP TABLE IF EXISTS user_interactions;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS cache_management;
DROP TABLE IF EXISTS system_config;
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS videos;
DROP TABLE IF EXISTS blogs;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ==================== 用户表 ====================
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'editor', 'user') DEFAULT 'user',
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== 分类表 ====================
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_parent (parent_id),
    INDEX idx_active (is_active),
    INDEX idx_sort (sort_order),
    
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== 博客文章表 ====================
CREATE TABLE blogs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    excerpt TEXT,
    cover_image VARCHAR(500),
    category_id INT,
    author_id BIGINT,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    tags JSON,
    reading_time INT DEFAULT 0,
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_category (category_id),
    INDEX idx_author (author_id),
    INDEX idx_published_at (published_at),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== 视频内容表 ====================
CREATE TABLE videos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail VARCHAR(500),
    video_url VARCHAR(500) NOT NULL,
    platform ENUM('youtube', 'tiktok', 'bilibili', 'local') NOT NULL,
    platform_id VARCHAR(100),
    category_id INT,
    duration INT DEFAULT 0,
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    status ENUM('active', 'inactive', 'deleted') DEFAULT 'active',
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_platform (platform),
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== 评论表 ====================
CREATE TABLE comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    blog_id BIGINT NOT NULL,
    parent_id BIGINT NULL,
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_blog (blog_id),
    INDEX idx_parent (parent_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== 用户交互记录表 ====================
CREATE TABLE user_interactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(100) NOT NULL,
    content_type ENUM('blog', 'video') NOT NULL,
    content_id BIGINT NOT NULL,
    action_type ENUM('view', 'like', 'share', 'comment') NOT NULL,
    interaction_data JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_session (session_id),
    INDEX idx_content (content_type, content_id),
    INDEX idx_action (action_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== 页面浏览记录表 ====================
CREATE TABLE page_views (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    page_url VARCHAR(500) NOT NULL,
    page_title VARCHAR(255),
    referrer VARCHAR(500),
    session_id VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    view_duration INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_page_url (page_url(255)),
    INDEX idx_session (session_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== 博客浏览记录表 ====================
CREATE TABLE blog_views (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    blog_id BIGINT NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    reading_time INT DEFAULT 0,
    scroll_depth DECIMAL(5,2) DEFAULT 0,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_blog (blog_id),
    INDEX idx_session (session_id),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== 视频播放记录表 ====================
CREATE TABLE video_plays (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    video_id BIGINT NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    watch_duration INT DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    platform VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_video (video_id),
    INDEX idx_session (session_id),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== 外部视频点击记录表 ====================
CREATE TABLE external_video_clicks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    video_id BIGINT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    platform_url VARCHAR(500) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_video (video_id),
    INDEX idx_platform (platform),
    INDEX idx_session (session_id),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== 外部视频返回记录表 ====================
CREATE TABLE external_video_returns (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    video_id BIGINT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    return_duration INT DEFAULT 0,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_video (video_id),
    INDEX idx_platform (platform),
    INDEX idx_session (session_id),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== 系统配置表 ====================
CREATE TABLE system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSON NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (config_key),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== 活动日志表 ====================
CREATE TABLE activity_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id BIGINT,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== 缓存管理表 ====================
CREATE TABLE cache_management (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_tags JSON,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_key (cache_key),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== 用户偏好设置表 ====================
CREATE TABLE user_preferences (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    session_id VARCHAR(100),
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_id),
    INDEX idx_session (session_id),
    INDEX idx_key (preference_key),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preference (user_id, preference_key),
    UNIQUE KEY unique_session_preference (session_id, preference_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== 插入默认数据 ====================

-- 插入默认管理员用户
INSERT INTO users (username, email, password_hash, role, status) VALUES 
('admin', 'admin@travelweb.com', '$2b$10$defaulthashedpassword', 'admin', 'active');

-- 插入默认分类
INSERT INTO categories (name, slug, description, sort_order) VALUES 
('旅游攻略', 'travel-guide', '旅游攻略和经验分享', 1),
('美食推荐', 'food-recommendation', '各地美食推荐', 2),
('住宿体验', 'accommodation', '酒店和民宿体验分享', 3),
('交通出行', 'transportation', '交通工具和出行方式', 4),
('摄影分享', 'photography', '旅行摄影作品和技巧', 5),
('文化体验', 'culture', '当地文化和风俗体验', 6);

-- 插入默认系统配置
INSERT INTO system_config (config_key, config_value, description) VALUES 
('site_title', '"旅行博客系统"', '网站标题'),
('site_description', '"分享旅行经历，记录美好时光"', '网站描述'),
('posts_per_page', '10', '每页显示文章数量'),
('enable_comments', 'true', '是否启用评论功能'),
('cache_duration', '3600', '缓存持续时间（秒）'),
('max_upload_size', '10485760', '最大上传文件大小（字节）');

-- 显示创建结果
SELECT 'Database tables created successfully!' as status;