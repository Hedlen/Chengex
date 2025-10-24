# 部署指南

本项目支持多种部署方式，包括SQLite数据库的无服务器部署和传统的MySQL部署。

## 🚀 快速部署

### SQLite部署 (推荐用于无服务器平台)

```bash
# 1. 安装依赖
npm install
cd admin-panel && npm install && cd ..

# 2. 使用部署脚本
npm run deploy:sqlite
```

### 本地部署

```bash
# 1. 安装依赖
npm install
cd admin-panel && npm install && cd ..

# 2. 构建项目
npm run build:all

# 3. 启动服务器
npm start
```

## 📋 部署配置

### 环境变量

项目提供了多个环境配置文件：

- `.env` - 默认开发环境配置
- `.env.sqlite` - SQLite生产环境配置

#### SQLite配置 (.env.sqlite)
```env
DB_TYPE=file
NODE_ENV=production
JWT_SECRET=your_production_jwt_secret_key_here
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,mp4,webm
CACHE_TYPE=memory
LOG_LEVEL=info
```

#### MySQL配置 (.env)

**重要提示：** 请根据您的实际数据库信息修改以下配置

```env
# ===========================================
# 数据库连接配置
# ===========================================
# 数据库类型 (固定为 mysql)
DB_TYPE=mysql

# 数据库服务器地址
# 本地开发: localhost
# 远程服务器: 服务器的IP地址或域名
DB_HOST=localhost

# 数据库端口 (MySQL默认端口为3306)
DB_PORT=3306

# 数据库名称 (请确保数据库已创建)
DB_NAME=travelweb_db

# 数据库用户名
DB_USER=root

# 数据库密码 (请替换 YOUR_PASSWORD 为实际密码)
# ⚠️ 重要：请确保密码安全，不要使用弱密码
DB_PASSWORD=YOUR_PASSWORD

# 连接池最大连接数
DB_CONNECTION_LIMIT=10
```

**配置说明：**
- `DB_HOST`: 数据库服务器地址，本地开发使用 `localhost`
- `DB_PORT`: 数据库端口，MySQL 默认为 `3306`
- `DB_NAME`: 数据库名称，需要提前在 MySQL 中创建
- `DB_USER`: 数据库用户名，建议创建专用用户而非使用 root
- `DB_PASSWORD`: 数据库密码，**必须替换为实际密码**



## 🗄️ 数据库设置

### SQLite数据库

SQLite数据库会自动创建和初始化：

```bash
# 手动初始化SQLite数据库
npm run init:sqlite
```

数据库文件位置：`./database/travelweb.db`

### MySQL数据库

#### 数据库准备步骤

**1. 确保 MySQL 服务器运行**
```bash
# Windows (以管理员身份运行)
net start mysql

# Linux/macOS
sudo systemctl start mysql
# 或
sudo service mysql start
```

**2. 创建数据库和用户**

登录 MySQL：
```bash
mysql -u root -p
```

执行以下 SQL 命令：
```sql
-- 创建数据库
CREATE DATABASE travelweb_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建专用用户 (推荐，比使用 root 更安全)
CREATE USER 'travelweb_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- 授予权限
GRANT ALL PRIVILEGES ON travelweb_db.* TO 'travelweb_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 退出
EXIT;
```

**3. 配置环境变量**

编辑 `.env` 文件，更新数据库连接信息：
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=travelweb_db
DB_USER=travelweb_user  # 或使用 root
DB_PASSWORD=your_secure_password  # 替换为实际密码
```

**4. 测试数据库连接**
```bash
# 测试数据库连接
npm run test:db

# 或手动测试
node -e "
const { createMySQLPool, testMySQLConnection } = require('./database/mysql-config.js');
const pool = createMySQLPool();
testMySQLConnection(pool).then(() => {
  console.log('数据库连接成功！');
  process.exit(0);
}).catch(err => {
  console.error('数据库连接失败：', err.message);
  process.exit(1);
});
"
```

**5. 初始化数据库表结构**
```bash
# 自动创建表结构
npm run init:mysql

# 或使用部署脚本
node deploy.js mysql
```

#### 常见问题解决

**连接被拒绝 (ECONNREFUSED)**
- 检查 MySQL 服务是否启动
- 确认端口号是否正确 (默认 3306)
- 检查防火墙设置

**认证失败 (Access denied)**
- 确认用户名和密码是否正确
- 检查用户是否有访问数据库的权限
- 确认主机地址是否正确

**数据库不存在**
- 确保已创建数据库 `travelweb_db`
- 检查数据库名称拼写是否正确

## 🛠️ 部署脚本

项目提供了自动化部署脚本 `deploy.js`：

```bash
# 显示帮助信息
node deploy.js --help

# SQLite部署
node deploy.js sqlite

# 本地部署
node deploy.js local
```

部署脚本会自动：

1. 复制相应的环境配置
2. 安装项目依赖
3. 构建前端和管理后台
4. 初始化数据库（SQLite模式）
5. 验证部署环境

## 🌐 平台特定部署



### Netlify部署

1. 构建项目：
   ```bash
   npm run build:all
   ```

2. 上传 `dist` 和 `admin-panel/dist` 目录

3. 配置重定向规则（_redirects文件）

### 传统服务器部署

1. 上传项目文件到服务器
2. 安装Node.js和npm
3. 运行部署脚本：
   ```bash
   npm run deploy:local
   ```

## 🔧 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查环境变量配置
   - 确认数据库服务器状态
   - 验证连接参数

2. **构建失败**
   - 清理node_modules：`rm -rf node_modules && npm install`
   - 检查TypeScript错误：`npm run check`

3. **部署后无法访问**
   - 检查端口配置
   - 验证防火墙设置
   - 查看服务器日志

### 日志查看

```bash
# 查看应用日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log
```

## 📊 性能优化

### 生产环境优化

1. **启用缓存**
   - 配置Redis缓存（可选）
   - 使用内存缓存

2. **静态资源优化**
   - 启用Gzip压缩
   - 配置CDN

3. **数据库优化**
   - 定期备份数据
   - 监控查询性能

### 监控和维护

1. **健康检查**
   - API端点：`/api/health`
   - 数据库状态检查

2. **性能监控**
   - 响应时间监控
   - 错误率统计

3. **备份策略**
   - 定期数据备份
   - 配置文件备份

## 🔐 安全配置

### 生产环境安全

1. **更新JWT密钥**
   ```bash
   # 生成安全的JWT密钥
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **配置CORS**
   - 设置允许的域名
   - 限制API访问

3. **启用HTTPS**
   - 配置SSL证书
   - 强制HTTPS重定向

4. **访问控制**
   - 配置防火墙规则
   - 限制管理后台访问

## 📞 支持

如果在部署过程中遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查项目日志文件
3. 验证环境配置
4. 确认依赖版本兼容性

---

**注意**: 在生产环境中，请务必更改默认的JWT密钥和其他敏感配置。