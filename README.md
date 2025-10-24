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

### 方案三：宝塔面板部署 (推荐用于服务器管理)

宝塔面板是一款简单好用的服务器运维面板，支持一键LAMP/LNMP/集群/监控/网站/FTP/数据库/JAVA等100多项服务器管理功能。

#### 🎯 宝塔面板部署优势

- **可视化管理**：图形化界面，操作简单直观
- **一键安装**：自动安装和配置运行环境
- **安全防护**：内置防火墙、SSL证书管理
- **性能监控**：实时监控服务器状态和资源使用
- **文件管理**：在线文件编辑和管理
- **数据库管理**：可视化数据库操作
- **进程管理**：PM2进程监控和管理

#### 📋 部署步骤

##### 1. 宝塔面板访问和登录

```bash
# 如果还未安装宝塔面板，请先安装
# Ubuntu/Debian 系统
wget -O install.sh http://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh

# CentOS 系统
yum install -y wget && wget -O install.sh http://download.bt.cn/install/install_6.0.sh && sh install.sh
```

安装完成后：
1. 访问面板地址：`http://你的服务器IP:8888`
2. 使用安装时生成的用户名和密码登录
3. 首次登录建议修改默认端口和密码

```
外网面板地址:  http://101.42.21.165:39195/1680b888
内网面板地址:  http://10.0.16.13:39195/1680b888
username: 90jngcxq
password: ********
```

##### 2. 环境安装

在宝塔面板中安装必要的运行环境：

**2.1 安装基础环境**
- 进入 `软件商店` → `运行环境`
- 安装 `Nginx` (推荐 1.20+)
- 安装 `MySQL` (推荐 5.7+ 或 8.0+)
- 安装 `Node.js` (推荐 18.x LTS)

**2.2 安装 PM2 管理器**
```bash
# 在宝塔终端中执行
npm install -g pm2
```

**2.3 验证安装**
```bash
node --version
npm --version
pm2 --version
nginx -v
mysql --version
```

##### 3. 项目部署

**方式一：Git 克隆部署（推荐）**

1. 在宝塔面板中进入 `文件` 管理
2. 进入网站根目录（通常是 `/www/wwwroot/`）
3. 打开终端，执行：

```bash
# 克隆项目
git clone https://github.com/你的用户名/Chengex.git
cd Chengex

# 安装依赖
npm install

# 复制环境配置文件
cp .env.example .env
```

**方式二：文件上传部署**

1. 将项目文件打包为 zip 格式
2. 在宝塔面板 `文件` 管理中上传并解压
3. 进入项目目录安装依赖：

```bash
cd /www/wwwroot/Chengex
npm install
```

##### 4. 数据库配置

**4.1 创建数据库**
1. 进入宝塔面板 `数据库` 管理
2. 点击 `添加数据库`
3. 填写数据库信息：
   - 数据库名：`travelweb_db`
   - 用户名：`travelweb_user`
   - 密码：设置安全密码
   - 访问权限：`本地服务器`

**4.2 配置环境变量**

编辑项目根目录的 `.env` 文件：

```env
# 数据库配置
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=travelweb_db
DB_USER=travelweb_user
DB_PASSWORD=你设置的数据库密码

# 应用配置
NODE_ENV=production
JWT_SECRET=生成的安全密钥
PORT=3001

# 安全配置
CORS_ORIGIN=https://你的域名.com
RATE_LIMIT_MAX=1000
TRUST_PROXY=true
```

**4.3 初始化数据库**
```bash
cd /www/wwwroot/Chengex
npm run init:mysql
```

##### 5. 网站配置

**5.1 添加网站**
1. 进入宝塔面板 `网站` 管理
2. 点击 `添加站点`
3. 填写网站信息：
   - 域名：你的域名（如：example.com）
   - 根目录：`/www/wwwroot/Chengex`
   - PHP版本：选择 `纯静态`

**5.2 配置 Nginx 反向代理**

点击网站的 `设置` → `反向代理` → `添加反向代理`：

```nginx
# 代理名称：TravelWeb
# 目标URL：http://127.0.0.1:3001
# 发送域名：$host
```

或者手动编辑 Nginx 配置文件：

```nginx
server {
    listen 80;
    server_name 你的域名.com;
    
    # 静态文件直接服务
    location /uploads/ {
        alias /www/wwwroot/Chengex/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    location /admin/ {
        alias /www/wwwroot/Chengex/admin-panel/dist/;
        try_files $uri $uri/ /admin/index.html;
    }
    
    # API 和主应用代理
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

##### 6. SSL 证书配置

**6.1 申请免费 SSL 证书**
1. 在网站设置中点击 `SSL`
2. 选择 `Let's Encrypt` 免费证书
3. 填写邮箱地址并申请
4. 开启 `强制HTTPS`

**6.2 手动上传证书**
如果有自己的证书，可以选择 `其他证书` 并上传证书文件。

##### 7. 启动和监控

**7.1 使用 PM2 启动应用**

在宝塔终端中执行：

```bash
cd /www/wwwroot/Chengex

# 构建项目
npm run build:all

# 启动应用
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

**7.2 配置 PM2 管理器**

1. 在宝塔面板安装 `PM2管理器` 插件
2. 可以在面板中直接管理 Node.js 应用
3. 查看应用状态、日志、重启等操作

##### 8. 域名绑定和测试

**8.1 域名解析**
1. 在域名服务商处添加 A 记录
2. 将域名指向服务器 IP 地址
3. 等待 DNS 解析生效（通常 10-30 分钟）

**8.2 访问测试**
- 主网站：`https://你的域名.com`
- 管理后台：`https://你的域名.com/admin`
- API 接口：`https://你的域名.com/api/health`

#### 🔧 宝塔面板特有配置

##### 网站管理
- **域名管理**：支持多域名绑定和重定向
- **目录权限**：设置合适的文件权限（755 for directories, 644 for files）
- **访问日志**：查看网站访问日志和错误日志
- **流量统计**：监控网站流量和带宽使用

##### 数据库管理
- **可视化操作**：通过 phpMyAdmin 管理数据库
- **备份还原**：定时自动备份数据库
- **性能优化**：MySQL 性能调优和慢查询分析
- **远程访问**：配置数据库远程连接权限

##### 文件管理
- **在线编辑**：直接在面板中编辑配置文件
- **权限管理**：设置文件和目录权限
- **压缩解压**：支持多种格式的压缩和解压
- **文件监控**：监控重要文件的变化

##### 进程管理
- **PM2 集成**：通过面板管理 Node.js 进程
- **资源监控**：实时查看 CPU、内存使用情况
- **日志查看**：查看应用运行日志和错误日志
- **自动重启**：配置进程异常时自动重启

##### 安全设置
- **防火墙**：配置端口访问规则
- **SSH 安全**：修改 SSH 端口和密钥登录
- **面板安全**：设置面板访问白名单
- **SSL 管理**：自动续期 SSL 证书

#### 🚨 宝塔部署故障排除

##### 常见问题解决

**1. Node.js 应用无法启动**
```bash
# 检查 Node.js 版本
node --version

# 检查端口占用
netstat -tlnp | grep :3001

# 查看 PM2 日志
pm2 logs

# 重启应用
pm2 restart all
```

**2. 数据库连接失败**
- 检查数据库服务状态：`systemctl status mysql`
- 验证数据库用户权限：在宝塔数据库管理中检查
- 确认 `.env` 文件中的数据库配置正确

**3. Nginx 配置错误**
```bash
# 检查 Nginx 配置语法
nginx -t

# 重新加载 Nginx 配置
nginx -s reload

# 查看 Nginx 错误日志
tail -f /www/wwwlogs/你的域名.com.error.log
```

**4. SSL 证书问题**
- 确保域名已正确解析到服务器
- 检查防火墙是否开放 80 和 443 端口
- 在宝塔面板中重新申请证书

**5. 文件权限问题**
```bash
# 设置正确的文件权限
chown -R www:www /www/wwwroot/Chengex
chmod -R 755 /www/wwwroot/Chengex
chmod -R 644 /www/wwwroot/Chengex/uploads
```

**6. 内存不足**
- 在宝塔面板中查看系统资源使用情况
- 考虑升级服务器配置或优化应用性能
- 配置 swap 交换空间

##### 性能优化建议

**1. 启用 Gzip 压缩**
在网站设置中开启 Gzip 压缩，减少传输数据量。

**2. 配置缓存策略**
```nginx
# 在 Nginx 配置中添加缓存规则
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**3. 数据库优化**
- 定期清理数据库日志
- 优化数据库查询索引
- 配置合适的数据库缓存

**4. 监控和告警**
- 设置服务器资源监控告警
- 配置应用异常通知
- 定期检查系统日志

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

#### 5. 宝塔面板特有问题

**宝塔面板无法访问**
```bash
# 检查宝塔服务状态
systemctl status bt

# 重启宝塔服务
systemctl restart bt

# 查看宝塔端口
cat /www/server/panel/data/port.pl

# 检查防火墙设置
ufw status
```

**宝塔 Node.js 版本问题**
```bash
# 在宝塔终端中切换 Node.js 版本
nvm use 18

# 或者重新安装指定版本
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

**宝塔数据库权限问题**
- 在宝塔面板 `数据库` 管理中检查用户权限
- 确保数据库用户有足够的操作权限
- 重置数据库密码并更新 `.env` 文件

**宝塔 SSL 证书申请失败**
- 确保域名已正确解析到服务器
- 检查 80 端口是否被占用或被防火墙阻止
- 暂时关闭 CDN 服务（如使用）
- 在宝塔面板中清除 SSL 缓存后重新申请

**宝塔文件权限问题**
```bash
# 通过宝塔终端设置正确权限
chown -R www:www /www/wwwroot/Chengex
find /www/wwwroot/Chengex -type d -exec chmod 755 {} \;
find /www/wwwroot/Chengex -type f -exec chmod 644 {} \;
chmod +x /www/wwwroot/Chengex/scripts/*.sh
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
