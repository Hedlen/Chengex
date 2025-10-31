# 宝塔面板数据库配置指南

## 问题描述
当前网站无法连接数据库，错误信息：`Access denied for user 'travelweb_user'@'localhost'`

这表明数据库用户 `travelweb_user` 没有正确的访问权限。

## 解决方案

### 方法一：在宝塔面板中配置（推荐）

1. **登录宝塔面板**
2. **进入数据库管理**
3. **找到数据库 `travelweb_db`**
4. **点击"权限"或"用户管理"**
5. **添加用户或修改现有用户权限**

### 方法二：使用 SQL 命令配置

在宝塔面板的 phpMyAdmin 或数据库管理工具中执行以下 SQL 命令：

```sql
-- 1. 创建数据库用户（如果不存在）
CREATE USER IF NOT EXISTS 'travelweb_user'@'localhost' IDENTIFIED BY 'your_password_here';

-- 2. 授予用户对 travelweb_db 数据库的完全权限
GRANT ALL PRIVILEGES ON travelweb_db.* TO 'travelweb_user'@'localhost';

-- 3. 刷新权限
FLUSH PRIVILEGES;

-- 4. 验证用户权限
SHOW GRANTS FOR 'travelweb_user'@'localhost';
```

### 方法三：重置数据库用户

如果上述方法不起作用，可以重置用户：

```sql
-- 1. 删除现有用户（如果存在）
DROP USER IF EXISTS 'travelweb_user'@'localhost';

-- 2. 重新创建用户
CREATE USER 'travelweb_user'@'localhost' IDENTIFIED BY 'your_password_here';

-- 3. 授予权限
GRANT ALL PRIVILEGES ON travelweb_db.* TO 'travelweb_user'@'localhost';

-- 4. 刷新权限
FLUSH PRIVILEGES;
```

## 重要提醒

1. **密码配置**：请将 `your_password_here` 替换为您在 `.env` 文件中配置的实际密码
2. **查看当前密码**：检查 `.env` 文件中的 `DB_PASSWORD` 配置
3. **权限范围**：确保用户有 SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER 权限

## 验证配置

配置完成后，可以通过以下方式验证：

1. **在宝塔面板中测试连接**
2. **重启网站服务**：`npm start`
3. **访问健康检查接口**：`http://your-domain:3002/api/health/database`

## 常见问题

### Q: 用户已存在但仍然无法连接
A: 检查密码是否正确，或者重新设置用户密码

### Q: 权限设置后仍然报错
A: 执行 `FLUSH PRIVILEGES;` 刷新权限，并重启 MySQL 服务

### Q: 如何查看当前用户权限
A: 执行 `SHOW GRANTS FOR 'travelweb_user'@'localhost';`

## 下一步

配置完数据库权限后，需要：
1. 重启网站服务
2. 运行数据初始化脚本填充默认数据
3. 验证网站功能正常