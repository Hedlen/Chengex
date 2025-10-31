-- 🚀 宝塔环境MySQL性能优化脚本
-- 专门针对宝塔面板环境的数据库性能优化
-- 执行前请备份数据库！

-- ============================================
-- 1. 检查当前数据库状态
-- ============================================

-- 查看当前数据库大小
SELECT 
    SCHEMA_NAME as '数据库名',
    ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as '总大小(MB)',
    ROUND(SUM(DATA_LENGTH) / 1024 / 1024, 2) as '数据大小(MB)',
    ROUND(SUM(INDEX_LENGTH) / 1024 / 1024, 2) as '索引大小(MB)'
FROM 
    INFORMATION_SCHEMA.SCHEMATA s
    LEFT JOIN INFORMATION_SCHEMA.TABLES t ON s.SCHEMA_NAME = t.TABLE_SCHEMA
WHERE 
    s.SCHEMA_NAME = DATABASE()
GROUP BY 
    s.SCHEMA_NAME;

-- ============================================
-- 2. 宝塔环境专用索引优化
-- ============================================

-- 博客表核心索引（针对宝塔环境常见查询）
CREATE INDEX IF NOT EXISTS idx_blogs_status_created_desc ON blogs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_category_status ON blogs(category, status);

-- 视频表核心索引
CREATE INDEX IF NOT EXISTS idx_videos_status_created_desc ON videos(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_category_status ON videos(category, status);

-- 页面浏览表优化索引（重要！）
CREATE INDEX IF NOT EXISTS idx_pageviews_timestamp_desc ON page_views(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_pageviews_page_timestamp ON page_views(page, timestamp);

-- ============================================
-- 3. 宝塔环境MySQL配置优化建议
-- ============================================

/*
🔧 宝塔面板MySQL配置优化建议：

1. 在宝塔面板 -> 软件商店 -> MySQL -> 设置 -> 配置修改中添加以下配置：

[mysqld]
# 🚀 连接优化
max_connections = 200
max_connect_errors = 10000
connect_timeout = 10
wait_timeout = 600
interactive_timeout = 600

# 🚀 缓存优化
query_cache_type = 1
query_cache_size = 64M
query_cache_limit = 2M

# 🚀 InnoDB优化
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
innodb_log_buffer_size = 16M
innodb_flush_log_at_trx_commit = 2

# 🚀 临时表优化
tmp_table_size = 64M
max_heap_table_size = 64M

# 🚀 排序优化
sort_buffer_size = 2M
read_buffer_size = 2M
read_rnd_buffer_size = 2M

2. 重启MySQL服务使配置生效
*/

-- ============================================
-- 4. 清理和优化现有表
-- ============================================

-- 分析表统计信息
ANALYZE TABLE blogs;
ANALYZE TABLE videos;
ANALYZE TABLE page_views;
ANALYZE TABLE users;
ANALYZE TABLE categories;

-- 优化表结构（清理碎片）
OPTIMIZE TABLE blogs;
OPTIMIZE TABLE videos;
OPTIMIZE TABLE page_views;
OPTIMIZE TABLE users;
OPTIMIZE TABLE categories;

-- ============================================
-- 5. 性能监控查询
-- ============================================

-- 查看慢查询状态
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';

-- 查看连接状态
SHOW STATUS LIKE 'Connections';
SHOW STATUS LIKE 'Max_used_connections';
SHOW STATUS LIKE 'Threads_connected';

-- 查看缓存命中率
SHOW STATUS LIKE 'Qcache%';

-- ============================================
-- 6. 宝塔环境专用清理脚本
-- ============================================

-- 清理30天前的页面浏览记录（保持性能）
DELETE FROM page_views 
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 清理无效的会话数据
DELETE FROM page_views 
WHERE session_id IS NULL OR session_id = '';

-- ============================================
-- 7. 定期维护建议
-- ============================================

/*
📅 定期维护计划（建议在宝塔面板计划任务中设置）：

每日维护（凌晨2点执行）：
- 清理过期的页面浏览记录
- 更新表统计信息

每周维护（周日凌晨3点执行）：
- 优化表结构
- 检查索引使用情况
- 备份数据库

每月维护：
- 全面性能分析
- 索引优化评估
- 配置参数调整

宝塔面板计划任务示例：
名称：数据库日常维护
执行周期：每天 02:00
脚本内容：
mysql -u用户名 -p密码 数据库名 < /www/wwwroot/your-site/database/daily-maintenance.sql
*/

-- ============================================
-- 8. 应急性能优化
-- ============================================

-- 如果网站突然变慢，立即执行以下查询：

-- 1. 检查当前运行的查询
SHOW PROCESSLIST;

-- 2. 检查锁定的表
SHOW OPEN TABLES WHERE In_use > 0;

-- 3. 检查InnoDB状态
SHOW ENGINE INNODB STATUS;

-- 4. 强制刷新查询缓存
FLUSH QUERY CACHE;

-- 5. 重置连接
FLUSH HOSTS;

SELECT '🚀 宝塔环境MySQL优化脚本执行完成！' as '状态';
SELECT '请重启MySQL服务以使配置生效' as '提示';
SELECT '建议设置定期维护计划任务' as '建议'