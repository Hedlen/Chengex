-- 🚀 MySQL数据库索引优化脚本
-- 针对宝塔环境下的性能优化
-- 执行前请备份数据库！

-- ============================================
-- 博客表(blogs)索引优化
-- ============================================

-- 1. 状态索引 - 用于快速查询已发布/草稿博客
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);

-- 2. 创建时间索引 - 用于按时间排序
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC);

-- 3. 更新时间索引 - 用于查询最近更新的博客
CREATE INDEX IF NOT EXISTS idx_blogs_updated_at ON blogs(updated_at DESC);

-- 4. 分类索引 - 用于按分类查询
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);

-- 5. 复合索引 - 状态+创建时间（最常用的查询组合）
CREATE INDEX IF NOT EXISTS idx_blogs_status_created ON blogs(status, created_at DESC);

-- 6. 标题索引 - 用于搜索功能
CREATE INDEX IF NOT EXISTS idx_blogs_title ON blogs(title);

-- ============================================
-- 视频表(videos)索引优化
-- ============================================

-- 1. 状态索引
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);

-- 2. 创建时间索引
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);

-- 3. 更新时间索引
CREATE INDEX IF NOT EXISTS idx_videos_updated_at ON videos(updated_at DESC);

-- 4. 分类索引
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);

-- 5. 复合索引 - 状态+创建时间
CREATE INDEX IF NOT EXISTS idx_videos_status_created ON videos(status, created_at DESC);

-- 6. 标题索引
CREATE INDEX IF NOT EXISTS idx_videos_title ON videos(title);

-- ============================================
-- 页面浏览表(page_views)索引优化
-- ============================================

-- 1. 页面路径索引 - 用于统计特定页面浏览量
CREATE INDEX IF NOT EXISTS idx_page_views_page ON page_views(page);

-- 2. 访问时间索引 - 用于时间范围查询
CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views(timestamp DESC);

-- 3. 会话ID索引 - 用于统计独立访客
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);

-- 4. 复合索引 - 页面+时间（最常用的统计查询）
CREATE INDEX IF NOT EXISTS idx_page_views_page_timestamp ON page_views(page, timestamp DESC);

-- 5. 复合索引 - 时间+会话（用于独立访客统计）
CREATE INDEX IF NOT EXISTS idx_page_views_timestamp_session ON page_views(timestamp, session_id);

-- ============================================
-- 用户表(users)索引优化
-- ============================================

-- 1. 用户名索引 - 用于登录验证
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 2. 邮箱索引 - 用于邮箱查找
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. 状态索引 - 用于查询活跃用户
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 4. 创建时间索引
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- ============================================
-- 分类表(categories)索引优化
-- ============================================

-- 1. 名称索引 - 用于分类查找
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- 2. 类型索引 - 用于按类型查询分类
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- 3. 复合索引 - 类型+名称
CREATE INDEX IF NOT EXISTS idx_categories_type_name ON categories(type, name);

-- ============================================
-- 查看当前索引状态
-- ============================================

-- 查看所有表的索引
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    INDEX_TYPE
FROM 
    INFORMATION_SCHEMA.STATISTICS 
WHERE 
    TABLE_SCHEMA = DATABASE()
ORDER BY 
    TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- ============================================
-- 性能分析查询
-- ============================================

-- 查看表大小和行数
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'Size (MB)',
    ROUND((INDEX_LENGTH / 1024 / 1024), 2) AS 'Index Size (MB)'
FROM 
    INFORMATION_SCHEMA.TABLES 
WHERE 
    TABLE_SCHEMA = DATABASE()
ORDER BY 
    (DATA_LENGTH + INDEX_LENGTH) DESC;

-- ============================================
-- 优化建议
-- ============================================

/*
🚀 性能优化建议：

1. 定期执行 ANALYZE TABLE 来更新表统计信息：
   ANALYZE TABLE blogs, videos, page_views, users, categories;

2. 定期执行 OPTIMIZE TABLE 来整理表碎片：
   OPTIMIZE TABLE blogs, videos, page_views, users, categories;

3. 监控慢查询日志，识别需要进一步优化的查询

4. 根据实际查询模式调整索引策略

5. 考虑使用分区表来处理大量数据

6. 定期清理过期的page_views数据以保持性能
*/