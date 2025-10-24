# MySQL 密码重置指南

## 🔐 忘记密码了？不用担心！

如果您忘记了 MySQL 数据库密码，请按照以下步骤操作：

## 📋 快速重置步骤

### 1. 重置 MySQL 密码

#### 方法一：使用 MySQL 安全模式（推荐）

```bash
# 1. 停止 MySQL 服务（以管理员身份运行）
net stop mysql

# 2. 创建密码重置文件
echo ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_password'; > reset.sql

# 3. 以安全模式启动 MySQL
mysqld --init-file=reset.sql --console

# 4. 等待启动完成后，按 Ctrl+C 停止

# 5. 重新启动 MySQL 服务
net start mysql

# 6. 删除临时文件
del reset.sql
```

#### 方法二：使用 MySQL 命令行

```bash
# 1. 尝试无密码登录
mysql -u root

# 2. 如果成功登录，执行以下 SQL 命令
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_password';
FLUSH PRIVILEGES;
EXIT;
```

### 2. 使用密码更新工具

密码重置成功后，运行我们的自动化工具来更新项目配置：

```bash
# 运行密码更新工具
node scripts/update-password.js

# 或查看帮助信息
node scripts/update-password.js --help
```

## 🛠️ 工具功能

这个密码更新工具提供以下功能：

- ✅ **交互式密码输入**：安全的密码输入（不显示明文）
- ✅ **配置文件自动更新**：自动更新 `.env` 文件中的数据库配置
- ✅ **连接测试**：验证新密码是否正确
- ✅ **错误处理**：友好的错误提示和处理
- ✅ **配置确认**：显示当前配置并确认更改

## 📖 使用示例

```bash
$ node scripts/update-password.js

🔐 MySQL 密码更新工具

当前数据库配置：
  主机: localhost
  端口: 3306
  用户: root
  密码: ***已设置***

是否需要查看密码重置指南？(y/n): n
您是否已经重置了 MySQL 密码并准备更新配置？(y/n): y
数据库主机 (当前: localhost): 
数据库端口 (当前: 3306): 
数据库用户名 (当前: root): 
请输入新的数据库密码: ********
请再次输入密码确认: ********

🔄 正在测试数据库连接...
✅ 数据库连接测试成功！
✅ .env 文件更新成功

🎉 密码更新完成！
您现在可以重启应用程序以使用新的数据库配置。
是否要重启开发服务器？(y/n): y
请手动重启您的开发服务器以应用新配置。
```

## ⚠️ 注意事项

1. **备份重要数据**：在重置密码前，建议备份重要的数据库数据
2. **管理员权限**：某些操作需要管理员权限
3. **服务重启**：密码更新后需要重启应用服务器
4. **密码安全**：请使用强密码，包含字母、数字和特殊字符

## 🔧 常见问题

### Q: MySQL 服务无法停止
**A:** 确保以管理员身份运行命令提示符，或使用服务管理器手动停止

### Q: 连接测试失败
**A:** 检查以下项目：
- MySQL 服务是否正在运行
- 密码是否正确
- 端口号是否正确
- 防火墙设置

### Q: 权限被拒绝
**A:** 确保用户有足够的权限访问数据库，可能需要重新授权：
```sql
GRANT ALL PRIVILEGES ON travelweb_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

## 📞 需要帮助？

如果遇到问题，请：
1. 运行 `node scripts/update-password.js --help` 查看详细指南
2. 检查 MySQL 错误日志
3. 确认 MySQL 服务状态：`net start | findstr mysql`

---

**提示**：建议定期更改数据库密码以确保安全性！