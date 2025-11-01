# 旅游网站系统

一个现代化的旅游网站系统，包含用户前端和管理后台，支持景点展示、路线规划、用户管理等功能。

## 🚀 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后台管理**: React + TypeScript + Vite
- **后端**: Node.js + Express
- **数据库**: MySQL 8.0+
- **部署**: 宝塔面板 (推荐)

## ✨ 主要功能

### 前端功能
- 🏞️ 景点展示和详情
- 🗺️ 旅游路线规划
- 📱 响应式设计
- 🌐 多语言支持
- 💬 评论系统
- 📊 页面浏览统计

### 管理后台功能
- 🔧 系统管理面板
- 📊 数据库信息监控
- 📈 数据分析和统计
- 👥 用户管理
- 📝 内容管理
- 🎥 视频管理
- 📰 博客管理
- 📋 活动日志

## 📦 环境要求

- **Node.js** 18.x 或更高版本 (推荐 18.17.0+)
- **MySQL** 8.0+ 或 **SQLite** 3.x (开发环境可选)
- **npm** 9+ 或 **pnpm** 8+
- **Git** (用于克隆项目)

## 📁 项目结构

```
travelweb/
├── src/                    # 前端源码
│   ├── components/         # React组件
│   ├── pages/             # 页面组件
│   ├── hooks/             # 自定义Hooks
│   ├── utils/             # 工具函数
│   ├── styles/            # 样式文件
│   └── config/            # 配置文件
├── admin-panel/           # 管理后台
│   ├── src/               # 管理后台源码
│   ├── dist/              # 管理后台构建输出
│   ├── package.json       # 管理后台依赖配置
│   ├── .env.example       # 管理后台环境变量模板
│   └── README.md          # 管理后台说明文档
├── api/                   # 后端API
│   ├── routes/            # API路由
│   ├── models/            # 数据模型
│   ├── middleware/        # 中间件
│   └── utils/             # 后端工具函数
├── database/              # 数据库脚本
│   ├── migrations/        # 数据库迁移脚本
│   ├── seeds/             # 初始数据
│   └── migrate-database.cjs # 数据库迁移工具
├── public/                # 静态资源
├── dist/                  # 前端构建输出
├── scripts/               # 部署脚本
├── nginx/                 # Nginx配置模板
├── server.cjs             # 后端服务器启动文件
├── package.json           # 项目配置
├── .env.example           # 环境变量模板
└── README.md              # 项目说明文档
```

## 📋 发版日志

### v1.6.1 (2025-11-01)
**部署状态**: ✅ 生产环境运行中 (宝塔面板)

**新增功能：**
- ✅ 完善的宝塔面板部署支持
- ✅ 数据库信息监控面板
- ✅ 成都特色旅游数据集成
- ✅ 多平台部署脚本支持

**修复内容：**
- ✅ 修复管理后台数据库信息菜单404错误
- ✅ 优化Nginx SPA路由处理
- ✅ 完善数据库迁移工具
- ✅ 统一端口配置 (前端:3000, 后端:3002, 管理后台:5174)

**技术改进：**
- ✅ 支持MySQL 8.0数据库
- ✅ 完善的错误处理和日志记录
- ✅ 优化构建和部署流程
- ✅ 增强安全配置

**部署信息：**
- **服务器**: 宝塔面板部署
- **数据库**: MySQL 8.0 (已成功迁移)
- **API状态**: ✅ 所有接口正常运行
- **管理后台**: ✅ 功能完整可用
- **前端网站**: ✅ 响应式设计正常

## 🚀 宝塔面板部署 (推荐)

### ✅ 部署成功案例

**部署状态**: 已成功部署并运行  
**部署时间**: 2025-11-01  
**部署方式**: 本地打包上传  

**成功验证项目**:
- ✅ 前端网站正常访问和显示
- ✅ 后端管理系统正常打开
- ✅ 数据库连接和读取正常
- ✅ 所有API接口正常响应
- ✅ 数据库信息菜单显示正常 (已修复404错误)
- ✅ 数据库迁移完成，包含成都特色旅游数据

### 🚀 快速部署步骤

#### 1. 本地准备部署包

```bash
# Windows PowerShell / Mac Terminal / Linux Terminal
npm run package:baota
```

执行完成后，会在 `deploy-package` 目录生成压缩包：
- `travelweb-baota-YYYY-MM-DDTHH-mm-ss.zip`

**部署包内容说明：**
- `dist/` - 前端网站编译后的静态文件
- `admin-panel/dist/` - 管理后台编译后的静态文件
- `src/`、`api/`、`database/` - 后端API服务源码
- `server.cjs` - 后端服务启动文件
- `package.json` - 后端服务依赖配置
- `nginx/` - Nginx配置模板
- `.env.example` - 环境变量配置模板

#### 2. 宝塔面板环境准备

在宝塔面板中安装以下软件：
- **Nginx** 1.20+ （用于静态文件服务和API代理）
- **MySQL** 8.0+ （数据库服务）
- **Node.js** 18.x （仅用于运行后端API服务）
- **PM2管理器** 4.x （用于管理后端API进程）

#### 3. 上传和解压

```bash
# 上传到服务器并解压
cd /www/wwwroot/your-domain.com   
unzip travelweb-baota-*.zip
```

#### 4. 安装后端依赖

**重要说明：** 前端和管理后台已编译为静态文件，只需安装后端API服务依赖：

```bash
# 只安装后端API服务的生产依赖
npm install --production
```

#### 5. 配置环境变量

**5.1 配置后端服务器环境变量**

```bash
cp .env.example .env
nano .env
```

重要配置项：
```env
# 数据库配置
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=travelweb_db
DB_USER=your_username
DB_PASSWORD=your_password

# 服务配置
PORT=3002
NODE_ENV=production

# JWT密钥 (必须修改为至少32位字符)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# CORS配置 (替换为实际域名)
CORS_ORIGINS=https://your-domain.com

# API配置
API_BASE_URL=https://your-domain.com
```

**5.2 配置管理后台环境变量**

```bash
cp admin-panel/.env.example admin-panel/.env
nano admin-panel/.env
```

关键配置项：
```env
# 环境配置
VITE_NODE_ENV=production

# API 配置 (必须修改为实际域名)
VITE_API_BASE_URL=https://your-domain.com/api

# 安全配置 (替换为实际域名)
VITE_ALLOWED_ORIGINS=https://your-domain.com

# 功能开关
VITE_ENABLE_DEV_TOOLS=false
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ERROR_REPORTING=true
```

#### 6. 数据库初始化

**6.1 在宝塔面板创建数据库**

1. 登录宝塔面板 → 数据库 → 添加数据库
2. 数据库名：`travelweb_db`
3. 用户名：`travelweb_user` 
4. 密码：设置强密码
5. 字符集：`utf8mb4`

**6.2 数据库初始化和迁移**

```bash
# 方式1: 使用统一迁移脚本 (推荐，支持本地数据迁移到远程)
node database/migrate-database.cjs \
  --source-host localhost \
  --source-user root \
  --source-password your_local_password \
  --source-database travelweb_db \
  --target-host localhost \
  --target-user travelweb_user \
  --target-password your_baota_password \
  --target-database travelweb_db \
  --backup \
  --verify

# 方式2: 传统初始化方式 (仅初始化空数据库)
npm run init:mysql
```

**迁移工具特性**:
- ✅ **完整迁移**: 迁移所有表结构和数据
- ✅ **数据验证**: 自动验证迁移后的数据完整性  
- ✅ **备份支持**: 迁移前自动备份目标数据库
- ✅ **错误处理**: 完善的错误处理和回滚机制
- ✅ **干运行模式**: 支持 `--dry-run` 预览迁移操作

#### 7. 启动服务

```bash
# 使用PM2启动后端API服务
pm2 start server.cjs --name "travelweb-api" --env production

# 查看服务状态
pm2 status

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

#### 8. 配置Nginx

在宝塔面板添加网站，配置Nginx：

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name your-domain.com;
    root /www/wwwroot/your-domain.com/dist;
    index index.html;

    # HTTP重定向到HTTPS
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    }

    # 前端应用
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 管理后台
    location /admin {
        alias /www/wwwroot/your-domain.com/admin-panel/dist;
        try_files $uri $uri/ /index.html;
        
        # 确保管理后台的静态资源能正确加载
        location ~* ^/admin/(.+\.(js|css|png|jpg|jpeg|gif|ico|svg))$ {
            alias /www/wwwroot/your-domain.com/admin-panel/dist/$1;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API代理 (端口3002)
    location /api/ {
        proxy_pass http://localhost:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SSL配置 (如果启用HTTPS)
    ssl_certificate /path/to/your/certificate.pem;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
}
```

#### 9. 访问测试

- **前端**: https://your-domain.com
- **管理后台**: https://your-domain.com/admin
- **API**: https://your-domain.com/api

### 🔧 宝塔部署优势

**相比传统部署的优势：**
- ⚡ **更快**：无需在服务器上编译前端代码
- 🛡️ **更稳定**：避免服务器环境差异导致的编译问题
- 💾 **更省资源**：服务器无需安装前端开发依赖
- 🎯 **更简单**：部署步骤更少，出错概率更低
- 🔒 **更安全**：生产环境只运行必要的服务

**本地编译打包的优势：**
- ✅ 前端和管理后台已编译为静态文件，无需在服务器上安装Node.js开发依赖
- ✅ 减少服务器资源消耗和部署时间
- ✅ 避免服务器环境差异导致的编译问题
- ✅ 提高部署成功率和稳定性

## 💻 本地开发环境部署

### 1. 克隆项目

```bash
# Windows PowerShell
git clone <repository-url>
cd travelweb

# Mac/Linux Terminal  
git clone <repository-url>
cd travelweb

# 或者如果已下载压缩包
# Windows: 解压到 d:\code\travelweb 目录
# Mac/Linux: 解压到 ~/code/travelweb 目录
```

### 2. 安装依赖

```bash
# Windows PowerShell / Mac Terminal / Linux Terminal
# 安装主项目依赖
npm install

# 安装管理后台依赖
cd admin-panel
npm install
cd ..
```

### 3. 数据库配置

**选项A: MySQL数据库 (推荐生产环境)**

```bash
# Windows - 启动MySQL服务
net start mysql80

# Mac - 启动MySQL服务
brew services start mysql
# 或者
sudo /usr/local/mysql/support-files/mysql.server start

# Linux - 启动MySQL服务
sudo systemctl start mysql
# 或者
sudo service mysql start

# 登录MySQL (所有平台)
mysql -u root -p

# 创建数据库和用户
CREATE DATABASE travelweb_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'travelweb_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON travelweb_db.* TO 'travelweb_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**选项B: SQLite数据库 (快速开发)**
```bash
# 无需额外配置，系统会自动创建SQLite文件
# 适合快速开发和测试
```

### 4. 环境变量配置

```bash
# Windows PowerShell
Copy-Item .env.example .env
Copy-Item admin-panel\.env.example admin-panel\.env

# Mac/Linux Terminal
cp .env.example .env
cp admin-panel/.env.example admin-panel/.env
```

**编辑根目录 `.env` 文件：**
```env
# 数据库配置 (MySQL)
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=travelweb_db
DB_USER=travelweb_user
DB_PASSWORD=your_strong_password

# 或者使用SQLite (开发环境)
# DB_TYPE=sqlite
# DB_PATH=./database/travelweb.db

# 服务配置
PORT=3002
NODE_ENV=development
JWT_SECRET=your-jwt-secret-key-at-least-32-characters

# API配置
API_BASE_URL=http://localhost:3002
CORS_ORIGINS=http://localhost:3000,http://localhost:5174
```

**编辑 `admin-panel/.env` 文件：**
```env
# 管理后台配置
VITE_NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3002
VITE_ALLOWED_ORIGINS=http://localhost:5174
VITE_ENABLE_DEV_TOOLS=true
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ERROR_REPORTING=false
```

### 5. 初始化数据库

```bash
# Windows PowerShell / Mac Terminal / Linux Terminal
# MySQL数据库初始化
npm run init:mysql

# 或者SQLite数据库初始化
npm run init:sqlite
```

### 6. 启动开发服务器

**🚀 一键启动 (推荐)：**
```bash
npm run dev:all
```

**或者分别启动各服务：**
```bash
# 启动后端API服务
npm start

# 新开终端启动前端
npm run dev

# 新开终端启动管理后台
cd admin-panel && npm run dev
```

**🌐 访问地址：**
- **前端网站**: http://localhost:3000
- **管理后台**: http://localhost:5174  
- **API服务**: http://localhost:3002

### 7. 开始开发

🎉 **恭喜！本地开发环境搭建完成！**

**💡 开发提示：**
- **简单直接**：本地开发无需 Nginx，各服务直接通过端口访问
- **一键启动**：推荐使用 `npm run dev:all` 同时启动所有服务
- **热重载**：前端和管理后台支持热重载，修改代码即时生效
- **API调试**：可通过 http://localhost:3002/api-docs 查看API文档

**需要 Nginx？** 请参考 [服务器部署](#-服务器部署) 部分的配置说明

## 🖥️ 服务器部署 (非宝塔)

### Docker 部署

#### 1. 创建 Dockerfile

```dockerfile
# 多阶段构建
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build:production

# 生产环境
FROM node:18-alpine AS production

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/admin-panel/dist ./admin-panel/dist
COPY --from=builder /app/api ./api
COPY --from=builder /app/database ./database
COPY --from=builder /app/server.cjs ./
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3002

CMD ["node", "server.cjs"]
```

#### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=travelweb_db
      - DB_USER=travelweb_user
      - DB_PASSWORD=your_password
    depends_on:
      - mysql
    volumes:
      - ./logs:/app/logs

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=travelweb_db
      - MYSQL_USER=travelweb_user
      - MYSQL_PASSWORD=your_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./dist:/usr/share/nginx/html
      - ./admin-panel/dist:/usr/share/nginx/html/admin
    depends_on:
      - app

volumes:
  mysql_data:
```

#### 3. 部署命令

```bash
# 构建和启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 传统 Linux 服务器部署

#### 1. 环境准备

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm nginx mysql-server

# CentOS/RHEL
sudo yum install nodejs npm nginx mysql-server
# 或者
sudo dnf install nodejs npm nginx mysql-server
```

#### 2. 部署步骤

```bash
# 1. 克隆代码
git clone <repository-url>
cd travelweb

# 2. 安装依赖
npm install
cd admin-panel && npm install && cd ..

# 3. 构建项目
npm run build:production

# 4. 配置环境变量
cp .env.example .env
cp admin-panel/.env.example admin-panel/.env
# 编辑配置文件...

# 5. 初始化数据库
npm run init:mysql

# 6. 使用PM2启动服务
npm install -g pm2
pm2 start server.cjs --name "travelweb-api"
pm2 save
pm2 startup

# 7. 配置Nginx
sudo cp nginx/nginx.conf /etc/nginx/sites-available/travelweb
sudo ln -s /etc/nginx/sites-available/travelweb /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 云服务器部署 (阿里云/腾讯云/AWS)

#### 1. 服务器配置要求

- **CPU**: 2核心或以上
- **内存**: 4GB或以上
- **存储**: 40GB或以上
- **带宽**: 5Mbps或以上
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Amazon Linux 2

#### 2. 安全组配置

开放以下端口：
- **80** (HTTP)
- **443** (HTTPS)
- **22** (SSH)
- **3002** (API服务，可选)

#### 3. 域名和SSL配置

```bash
# 安装Certbot (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx

# 申请SSL证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

## 🛠️ 常见问题解决

### 数据库连接问题

**问题**: 数据库连接失败

**解决方案**:
```bash
# Windows - 检查MySQL服务
Get-Service -Name "MySQL80"
net start mysql80

# Mac - 启动MySQL
brew services start mysql

# Linux - 启动MySQL
sudo systemctl start mysql

# 测试连接 (所有平台)
mysql -u travelweb_user -p -h localhost travelweb_db
```

### 端口占用问题

**问题**: 端口被占用

**解决方案**:
```bash
# Windows - 查看和结束进程
netstat -ano | findstr :3002
taskkill /f /pid <PID>

# Mac/Linux - 查看和结束进程
lsof -i :3002
sudo kill -9 <PID>
```

**常见端口：**
- **3000**: 前端开发服务器
- **3002**: 后端API服务
- **5174**: 管理后台开发服务器

### 构建失败问题

**问题**: npm run build 失败

**解决方案**:
```bash
# 清理并重新安装 (所有平台)
npm cache clean --force
rm -rf node_modules package-lock.json  # Mac/Linux
Remove-Item -Recurse -Force node_modules  # Windows
npm install

# 检查Node.js版本 (需要18.x+)
node --version
```

### PM2进程管理问题

**问题**: PM2服务异常

**解决方案**:
```bash
# 查看和管理PM2进程 (所有平台)
pm2 status
pm2 restart travelweb-api
pm2 logs travelweb-api
pm2 delete travelweb-api  # 删除进程
```

### Nginx配置问题

**问题**: Nginx配置错误

**解决方案**:
```bash
# 测试Nginx配置
nginx -t

# 重新加载配置
sudo nginx -s reload

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log
```

### 权限问题

**问题**: 文件权限不足

**解决方案**:
```bash
# Linux/Mac - 设置正确权限
sudo chown -R www-data:www-data /www/wwwroot/your-domain.com
sudo chmod -R 755 /www/wwwroot/your-domain.com

# Windows - 以管理员身份运行
# 右键点击 PowerShell -> "以管理员身份运行"
```

### 日志查看

```bash
# 开发环境日志
npm start  # 查看后端日志
npm run dev  # 查看前端日志

# 生产环境日志
pm2 logs travelweb-api  # PM2日志
tail -f /var/log/nginx/error.log  # Nginx日志 (Linux)
```

### 性能优化建议

**开发环境优化：**
- 关闭不必要的后台程序
- 使用SSD硬盘
- 增加Node.js内存限制：`export NODE_OPTIONS="--max-old-space-size=4096"`
- 使用现代终端 (Windows Terminal / iTerm2 / Gnome Terminal)

**生产环境优化：**
- 启用Gzip压缩
- 配置静态资源缓存
- 使用CDN加速
- 数据库查询优化
- 启用HTTP/2

## 🔧 可用脚本

```bash
# 开发
npm run dev                 # 启动前端开发服务器
npm start                   # 启动后端服务器
npm run dev:all            # 并发启动所有服务

# 构建
npm run build:frontend      # 构建前端
npm run build:admin         # 构建管理后台
npm run build:all          # 构建前端和后台
npm run build:production    # 生产环境构建

# 部署
npm run package:baota       # 打包宝塔部署包
npm run upload:baota        # 上传到宝塔服务器

# 数据库
npm run init:mysql          # 初始化MySQL数据库 (主要)
npm run init:sqlite         # 初始化SQLite数据库 (可选)

# 测试
npm run test               # 运行测试
npm run test:coverage      # 运行测试并生成覆盖率报告

# 代码质量
npm run lint               # 代码检查
npm run lint:fix           # 自动修复代码问题
npm run format             # 代码格式化
```

## 📄 License

本项目采用 [MIT License](https://opensource.org/licenses/MIT) 开源协议。

```
MIT License

Copyright (c) 2025 TravelWeb Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 致谢

感谢以下开源项目和技术栈的支持：

**核心技术栈：**
- [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/) - 前端技术栈
- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) + [MySQL](https://www.mysql.com/) - 后端技术栈
- [宝塔面板](https://www.bt.cn/) + [Nginx](https://nginx.org/) + [PM2](https://pm2.keymetrics.io/) - 部署运维

**特别感谢：**
- 成都旅游数据提供方 - 提供丰富的旅游景点数据
- 开源社区 - 提供技术支持和解决方案

---

**版本**: v1.6.1  
**更新时间**: 2025年11月  
**部署状态**: ✅ 宝塔面板生产环境运行中

感谢您选择 TravelWeb 旅游网站系统！🎉
