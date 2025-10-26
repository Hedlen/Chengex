-- SQLite数据库结构 - 从MySQL迁移适配
-- 根据技术架构文档创建15个核心数据表（SQLite版本）

-- SQLite不支持DROP TABLE IF EXISTS的批量操作，需要逐个删除
PRAGMA foreign_keys = OFF;

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

PRAGMA foreign_keys = ON;

-- ==================== 用户表 ====================
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'editor', 'user')) DEFAULT 'user',
    status TEXT CHECK(status IN ('active', 'inactive', 'banned')) DEFAULT 'active',
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ==================== 分类表 ====================
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_categories_sort ON categories(sort_order);

-- ==================== 博客文章表 ====================
CREATE TABLE blogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    cover_image TEXT,
    category_id INTEGER,
    author_id INTEGER,
    status TEXT CHECK(status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    tags TEXT, -- JSON存储为TEXT
    reading_time INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_blogs_status ON blogs(status);
CREATE INDEX idx_blogs_category ON blogs(category_id);
CREATE INDEX idx_blogs_author ON blogs(author_id);
CREATE INDEX idx_blogs_published_at ON blogs(published_at);
CREATE INDEX idx_blogs_created_at ON blogs(created_at);

-- ==================== 视频内容表 ====================
CREATE TABLE videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    video_url TEXT NOT NULL,
    platform TEXT CHECK(platform IN ('youtube', 'tiktok', 'bilibili', 'local')) NOT NULL,
    platform_id TEXT,
    category_id INTEGER,
    duration INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('active', 'inactive', 'deleted')) DEFAULT 'active',
    tags TEXT, -- JSON存储为TEXT
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_videos_platform ON videos(platform);
CREATE INDEX idx_videos_category ON videos(category_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at);

-- ==================== 评论表 ====================
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blog_id INTEGER NOT NULL,
    parent_id INTEGER,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_blog ON comments(blog_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_status ON comments(status);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- ==================== 用户交互记录表 ====================
CREATE TABLE user_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    content_type TEXT CHECK(content_type IN ('blog', 'video')) NOT NULL,
    content_id INTEGER NOT NULL,
    action_type TEXT CHECK(action_type IN ('view', 'like', 'share', 'comment')) NOT NULL,
    interaction_data TEXT, -- JSON存储为TEXT
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_interactions_session ON user_interactions(session_id);
CREATE INDEX idx_user_interactions_content ON user_interactions(content_type, content_id);
CREATE INDEX idx_user_interactions_action ON user_interactions(action_type);
CREATE INDEX idx_user_interactions_created_at ON user_interactions(created_at);

-- ==================== 页面浏览记录表 ====================
CREATE TABLE page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_url TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    session_id TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    view_duration INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_views_url ON page_views(page_url);
CREATE INDEX idx_page_views_session ON page_views(session_id);
CREATE INDEX idx_page_views_created_at ON page_views(created_at);

-- ==================== 博客浏览记录表 ====================
CREATE TABLE blog_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blog_id INTEGER NOT NULL,
    session_id TEXT NOT NULL,
    reading_time INTEGER DEFAULT 0,
    scroll_depth REAL DEFAULT 0,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE
);

CREATE INDEX idx_blog_views_blog ON blog_views(blog_id);
CREATE INDEX idx_blog_views_session ON blog_views(session_id);
CREATE INDEX idx_blog_views_created_at ON blog_views(created_at);

-- ==================== 视频播放记录表 ====================
CREATE TABLE video_plays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER NOT NULL,
    session_id TEXT NOT NULL,
    watch_duration INTEGER DEFAULT 0,
    completion_rate REAL DEFAULT 0,
    platform TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

CREATE INDEX idx_video_plays_video ON video_plays(video_id);
CREATE INDEX idx_video_plays_session ON video_plays(session_id);
CREATE INDEX idx_video_plays_created_at ON video_plays(created_at);

-- ==================== 外部视频点击记录表 ====================
CREATE TABLE external_video_clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER NOT NULL,
    platform TEXT NOT NULL,
    platform_url TEXT NOT NULL,
    session_id TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

CREATE INDEX idx_external_video_clicks_video ON external_video_clicks(video_id);
CREATE INDEX idx_external_video_clicks_platform ON external_video_clicks(platform);
CREATE INDEX idx_external_video_clicks_session ON external_video_clicks(session_id);
CREATE INDEX idx_external_video_clicks_created_at ON external_video_clicks(created_at);

-- ==================== 外部视频返回记录表 ====================
CREATE TABLE external_video_returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER NOT NULL,
    platform TEXT NOT NULL,
    session_id TEXT NOT NULL,
    return_duration INTEGER DEFAULT 0,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

CREATE INDEX idx_external_video_returns_video ON external_video_returns(video_id);
CREATE INDEX idx_external_video_returns_platform ON external_video_returns(platform);
CREATE INDEX idx_external_video_returns_session ON external_video_returns(session_id);
CREATE INDEX idx_external_video_returns_created_at ON external_video_returns(created_at);

-- ==================== 系统配置表 ====================
CREATE TABLE system_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT NOT NULL, -- JSON存储为TEXT
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_config_key ON system_config(config_key);
CREATE INDEX idx_system_config_active ON system_config(is_active);

-- ==================== 活动日志表 ====================
CREATE TABLE activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id INTEGER,
    details TEXT, -- JSON存储为TEXT
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- ==================== 缓存管理表 ====================
CREATE TABLE cache_management (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT UNIQUE NOT NULL,
    cache_tags TEXT, -- JSON存储为TEXT
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cache_management_key ON cache_management(cache_key);
CREATE INDEX idx_cache_management_expires ON cache_management(expires_at);

-- ==================== 用户偏好设置表 ====================
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_id TEXT,
    preference_key TEXT NOT NULL,
    preference_value TEXT NOT NULL, -- JSON存储为TEXT
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_session ON user_preferences(session_id);
CREATE INDEX idx_user_preferences_key ON user_preferences(preference_key);
CREATE UNIQUE INDEX idx_user_preferences_unique_user ON user_preferences(user_id, preference_key);
CREATE UNIQUE INDEX idx_user_preferences_unique_session ON user_preferences(session_id, preference_key);

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

-- SQLite优化配置
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA foreign_keys = ON;
PRAGMA temp_store = MEMORY;

-- 显示创建结果
SELECT 'SQLite database schema created successfully!' as status;