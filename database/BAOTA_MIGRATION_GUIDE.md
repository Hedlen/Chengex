# 宝塔面板数据库迁移指南

## 📋 迁移概述

本指南将帮助您将本地 `travelweb_db` 数据库（包含成都漆器、蜀锦等特色内容）完整迁移到宝塔面板的 MySQL 环境中。

## 🎯 迁移目标

- ✅ 保留所有成都本地特色内容（漆器、蜀锦、川剧等）
- ✅ 确保数据库结构完整
- ✅ 验证数据完整性
- ✅ 优化宝塔面板环境配置

## 📁 相关文件

```
database/
├── export-local-data.js          # 本地数据导出脚本
├── import-to-baota.js            # 宝塔面板导入脚本
├── validate-data.js              # 数据验证脚本
├── fix-database-user.sql         # 数据库用户权限修复
└── exports/                      # 导出文件目录
    ├── complete_database_export.sql
    ├── table_structure.sql
    └── table_data.sql
```

## 🚀 迁移步骤

### 第一步：准备本地数据导出

1. **检查本地数据库连接**
   ```bash
   # 确保本地 MySQL 服务运行
   # 确认 travelweb_db 数据库存在且包含数据
   ```

2. **配置导出脚本**
   ```javascript
   // 编辑 database/export-local-data.js
   const LOCAL_DB_CONFIG = {
       host: 'localhost',
       user: 'root',           // 修改为您的本地数据库用户
       password: '',           // 修改为您的本地数据库密码
       database: 'travelweb_db',
       charset: 'utf8mb4'
   };
   ```

3. **执行数据导出**
   ```bash
   cd d:\code\travelweb
   node database/export-local-data.js
   ```

4. **验证导出结果**
   ```bash
   # 检查导出文件
   ls database/exports/
   # 应该看到：
   # - complete_database_export.sql (完整导出)
   # - table_structure.sql (表结构)
   # - table_data.sql (表数据)
   # - chengdu_special_content.sql (成都特色内容分析)
   ```

### 第二步：配置宝塔面板数据库

1. **登录宝塔面板**
   - 访问您的宝塔面板管理界面
   - 进入 "数据库" 管理页面

2. **创建数据库**
   ```sql
   -- 数据库名称：travelweb_db
   -- 字符集：utf8mb4
   -- 排序规则：utf8mb4_unicode_ci
   ```

3. **创建数据库用户**
   ```sql
   -- 用户名：travelweb_user
   -- 密码：7481196mysql
   -- 权限：travelweb_db 数据库的所有权限
   ```

4. **修复用户权限（如果需要）**
   ```bash
   # 在宝塔面板的 phpMyAdmin 中执行
   # 或使用 database/fix-database-user.sql 脚本
   ```

### 第三步：执行数据导入

1. **上传导出文件到服务器**
   ```bash
   # 将 database/exports/ 目录上传到服务器
   # 确保文件路径正确
   ```

2. **配置导入脚本**
   ```javascript
   // 确认 database/import-to-baota.js 中的配置
   const BAOTA_DB_CONFIG = {
       host: 'localhost',
       user: 'travelweb_user',
       password: '7481196mysql',
       database: 'travelweb_db',
       charset: 'utf8mb4'
   };
   ```

3. **执行数据导入**
   ```bash
   cd /www/wwwroot/your-domain/
   node database/import-to-baota.js
   ```

4. **监控导入过程**
   ```bash
   # 导入脚本会显示详细进度：
   # ✅ 成功连接到宝塔面板数据库
   # 📋 发现 X 个表
   # 📥 导入SQL文件
   # ✅ SQL文件导入完成
   ```

### 第四步：验证迁移结果

1. **运行数据验证脚本**
   ```bash
   node database/validate-data.js
   ```

2. **检查验证结果**
   ```bash
   # 验证脚本会检查：
   # ✅ 数据库连接
   # ✅ 表结构完整性
   # ✅ 数据完整性
   # ✅ 成都特色内容
   # ✅ 外键关系
   # ✅ 查询性能
   ```

3. **手动验证成都特色内容**
   ```sql
   -- 在 phpMyAdmin 中执行以下查询
   
   -- 检查成都漆器相关内容
   SELECT COUNT(*) FROM blogs WHERE title LIKE '%漆器%' OR content LIKE '%漆器%';
   
   -- 检查蜀锦相关内容
   SELECT COUNT(*) FROM blogs WHERE title LIKE '%蜀锦%' OR content LIKE '%蜀锦%';
   
   -- 检查川剧相关内容
   SELECT COUNT(*) FROM videos WHERE title LIKE '%川剧%' OR description LIKE '%川剧%';
   
   -- 检查所有分类
   SELECT * FROM categories;
   
   -- 检查博客总数
   SELECT COUNT(*) FROM blogs;
   
   -- 检查视频总数
   SELECT COUNT(*) FROM videos;
   ```

### 第五步：配置网站连接

1. **更新 .env 文件**
   ```env
   # 确认数据库配置
   DB_HOST=localhost
   DB_USER=travelweb_user
   DB_PASSWORD=7481196mysql
   DB_NAME=travelweb_db
   DB_PORT=3306
   ```

2. **重启网站服务**
   ```bash
   # 在宝塔面板中重启网站
   # 或使用 PM2 重启 Node.js 应用
   pm2 restart all
   ```

3. **测试网站功能**
   ```bash
   # 访问网站首页
   curl http://your-domain.com/
   
   # 测试数据库连接
   curl http://your-domain.com/api/health/database
   
   # 测试博客列表
   curl http://your-domain.com/api/blogs
   
   # 测试视频列表
   curl http://your-domain.com/api/videos
   ```

## 🔧 故障排除

### 常见问题及解决方案

1. **数据库连接失败**
   ```bash
   # 错误：Access denied for user 'travelweb_user'@'localhost'
   # 解决：执行 database/fix-database-user.sql 脚本
   ```

2. **导入文件过大**
   ```bash
   # 错误：MySQL packet too large
   # 解决：在宝塔面板中调整 MySQL 配置
   # max_allowed_packet = 64M
   ```

3. **字符编码问题**
   ```bash
   # 错误：中文显示乱码
   # 解决：确保数据库字符集为 utf8mb4
   ```

4. **成都特色内容丢失**
   ```bash
   # 检查：运行验证脚本
   node database/validate-data.js
   
   # 修复：重新导入 table_data.sql
   ```

### 性能优化建议

1. **数据库索引优化**
   ```sql
   -- 为常用查询字段添加索引
   CREATE INDEX idx_blogs_category ON blogs(category_id);
   CREATE INDEX idx_blogs_status ON blogs(status);
   CREATE INDEX idx_videos_category ON videos(category_id);
   CREATE INDEX idx_videos_status ON videos(status);
   ```

2. **MySQL 配置优化**
   ```ini
   # 在宝塔面板 MySQL 配置中添加
   [mysqld]
   innodb_buffer_pool_size = 256M
   query_cache_size = 64M
   max_connections = 200
   ```

## 📊 验证清单

迁移完成后，请确认以下项目：

- [ ] 数据库连接正常
- [ ] 所有表结构完整
- [ ] 数据记录数量正确
- [ ] 成都漆器相关内容存在
- [ ] 蜀锦相关内容存在
- [ ] 川剧相关内容存在
- [ ] 大熊猫相关内容存在
- [ ] 网站首页正常显示
- [ ] 博客列表正常显示
- [ ] 视频列表正常显示
- [ ] 管理后台正常工作
- [ ] API 接口正常响应

## 🎉 迁移完成

恭喜！您已成功将包含成都特色内容的数据库迁移到宝塔面板环境。

### 后续维护建议

1. **定期备份**
   - 在宝塔面板中设置自动备份
   - 建议每日备份数据库

2. **监控性能**
   - 定期运行验证脚本
   - 监控数据库查询性能

3. **内容更新**
   - 继续添加成都特色内容
   - 保持内容的时效性和准确性

## 📞 技术支持

如果在迁移过程中遇到问题，请：

1. 检查日志文件
2. 运行验证脚本
3. 查看故障排除部分
4. 联系技术支持团队

---

**注意：** 本指南基于成都旅游网站的特定需求编写，请根据实际情况调整配置参数。