# TravelWeb - 旅游网站项目

一个现代化的全栈旅游网站，包含前端展示、管理后台和 API 服务。

## 🚀 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **管理后台**: React + TypeScript + Vite (独立部署)
- **后端**: Node.js + Express
- **数据库**: SQLite (默认) / MySQL (生产环境)
- **缓存**: Redis (可选)
- **部署**: PM2 + Nginx

## 📋 功能特性

- 🎯 响应式设计，支持多设备访问
- 🌍 国际化支持 (中文/英文)
- 📊 实时数据分析和统计
- 🎥 视频内容管理
- 📝 博客文章管理
- 💬 评论系统
- 🔐 用户认证和权限管理
- 📱 管理后台独立部署

## ⚡ 快速开始

### 环境要求

- Node.js 18+ 
- npm 或 pnpm
- MySQL 8.0+ (生产环境) 或 SQLite (开发环境)

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/Hedlen/Chengex.git
cd Chengex

# 2. 安装依赖
npm install
cd admin-panel && npm install && cd ..

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接

# 4. 初始化数据库 (SQLite)
npm run init:sqlite

# 5. 启动开发服务器
npm run dev          # 前端 (http://localhost:3000)
npm start           # API 服务器 (http://localhost:3001)
cd admin-panel && npm run dev  # 管理后台 (http://localhost:5174)
```

## 🏗️ 生产环境部署

### 方案一：SQLite 部署 (推荐用于中小型项目)

```bash
# 1. 使用自动化部署脚本
npm run deploy:sqlite

# 2. 启动服务
npm start
```

### 方案二：MySQL 部署 (推荐用于大型项目)

#### 1. 数据库准备

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库和用户
CREATE DATABASE travelweb_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'travelweb_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON travelweb_db.* TO 'travelweb_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 2. 配置环境变量

创建 `.env` 文件：

```env
# 数据库配置
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=travelweb_db
DB_USER=travelweb_user
DB_PASSWORD=your_secure_password

# 应用配置
NODE_ENV=production
JWT_SECRET=your_super_secure_jwt_secret_key
PORT=3001

# 安全配置
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_MAX=1000
TRUST_PROXY=true
```

#### 3. 部署应用

```bash
# 1. 构建项目
npm run build:all

# 2. 初始化数据库
npm run init:mysql

# 3. 使用 PM2 启动服务
pm2 start ecosystem.config.js

# 4. 设置开机自启
pm2 startup
pm2 save
```

## ☁️ 腾讯云部署指南

### 1. 服务器环境准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2 和 Nginx
sudo npm install -g pm2
sudo apt install nginx mysql-server -y
```

### 2. SSL 证书配置

```bash
# 使用 Let's Encrypt (推荐)
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com

# 设置自动续期
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 3. Nginx 配置

创建 `/etc/nginx/sites-available/travelweb`：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # API 代理
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 前端应用
    location / {
        root /var/www/travelweb/dist;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 管理后台
    location /admin/ {
        root /var/www/travelweb/admin-panel/dist;
        try_files $uri $uri/ /admin/index.html;
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/travelweb /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 环境变量配置

### 开发环境 (.env)

```env
# 数据库配置
DB_TYPE=file
DB_PATH=./database/travelweb.db

# 应用配置
NODE_ENV=development
PORT=3001
JWT_SECRET=dev_jwt_secret_key

# 开发配置
CORS_ORIGIN=*
LOG_LEVEL=debug
```

### 生产环境 (.env.production)

```env
# 数据库配置
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=travelweb_db
DB_USER=travelweb_user
DB_PASSWORD=your_secure_password

# 应用配置
NODE_ENV=production
PORT=3001
JWT_SECRET=your_super_secure_jwt_secret_key

# 安全配置
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=900000
TRUST_PROXY=true

# 文件上传配置
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,mp4,webm

# 缓存配置
CACHE_TYPE=memory
REDIS_URL=redis://localhost:6379

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

## 🛠️ 可用脚本

```bash
# 开发
npm run dev              # 启动前端开发服务器
npm start               # 启动 API 服务器
npm run check           # TypeScript 类型检查

# 构建
npm run build           # 构建前端
npm run build:all       # 构建前端和管理后台

# 部署
npm run deploy:sqlite   # SQLite 自动部署
npm run deploy:local    # 本地部署

# 数据库
npm run init:sqlite     # 初始化 SQLite 数据库
npm run init:mysql      # 初始化 MySQL 数据库

# 工具
npm run lint            # 代码检查
npm run preview         # 预览构建结果
```

## 🔍 故障排除

### 常见问题

#### 1. 数据库连接失败

```bash
# 检查数据库服务状态
sudo systemctl status mysql

# 测试数据库连接
mysql -u travelweb_user -p -h localhost travelweb_db

# 检查环境变量
cat .env | grep DB_
```

#### 2. 端口被占用

```bash
# 查看端口占用
netstat -tlnp | grep :3001
lsof -i :3001

# 杀死占用进程
sudo kill -9 <PID>
```

#### 3. 构建失败

```bash
# 清理依赖重新安装
rm -rf node_modules package-lock.json
npm install

# 检查 TypeScript 错误
npm run check
```

#### 4. PM2 进程问题

```bash
# 查看 PM2 状态
pm2 status
pm2 logs

# 重启应用
pm2 restart all

# 重新加载配置
pm2 reload ecosystem.config.js
```

### 日志查看

```bash
# 应用日志
tail -f logs/app.log
tail -f logs/error.log

# PM2 日志
pm2 logs

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 系统日志
journalctl -u nginx -f
journalctl -u mysql -f
```

## 🔐 安全配置

### 生产环境安全检查清单

- [ ] 更新默认的 JWT 密钥
- [ ] 配置 CORS 允许的域名
- [ ] 启用 HTTPS 和安全头
- [ ] 设置防火墙规则
- [ ] 定期更新依赖包
- [ ] 配置日志监控
- [ ] 设置数据库备份

### 生成安全密钥

```bash
# 生成 JWT 密钥
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 生成随机密码
openssl rand -base64 32
```

## 📊 性能优化

### 生产环境优化建议

1. **启用 Gzip 压缩**
2. **配置 CDN 加速静态资源**
3. **启用 Redis 缓存**
4. **数据库索引优化**
5. **图片压缩和懒加载**
6. **API 响应缓存**

### 监控和维护

```bash
# 系统资源监控
htop
df -h
free -h

# 应用性能监控
pm2 monit

# 数据库性能
mysql -e "SHOW PROCESSLIST;"
mysql -e "SHOW STATUS LIKE 'Slow_queries';"
```

## 📞 技术支持

### 项目结构

```
travelweb/
├── src/                 # 前端源码
├── admin-panel/         # 管理后台
├── api/                 # API 接口
├── database/            # 数据库相关
├── public/              # 静态资源
├── scripts/             # 部署脚本
├── nginx/               # Nginx 配置
└── docs/                # 文档
```

### 相关链接

- [项目仓库](https://github.com/Hedlen/Chengex)
- [部署文档](./DEPLOYMENT.md)
- [维护指南](./MAINTENANCE_GUIDE.md)
- [腾讯云部署](./TENCENT-CLOUD-DEPLOYMENT.md)

### 版本信息

- **当前版本**: 1.0.0
- **Node.js**: 18+
- **数据库**: SQLite 3.x / MySQL 8.0+
- **最后更新**: 2024年

---

**注意**: 在生产环境中，请务必更改所有默认密钥和敏感配置，并定期进行安全更新。
