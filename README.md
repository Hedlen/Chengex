# 旅游网站系统

一个现代化的旅游网站系统，包含用户前端和管理后台，支持景点展示、路线规划、用户管理等功能。

**版本**: v1.6.1  
**最后更新**: 2025-11-01  
**部署状态**: ✅ 生产环境运行中 (宝塔面板)  
**服务器**: 宝塔面板部署  
**数据库**: MySQL 8.0 (已成功迁移到宝塔数据库)  
**API状态**: ✅ 所有接口正常运行  
**管理后台**: ✅ 数据库信息菜单已修复  
**Nginx配置**: ✅ 已优化SPA路由处理

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
- 👤 用户注册和登录
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

## 🚀 宝塔面板部署 (主推荐)

### ✅ 宝塔部署成功案例

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

**关键修复内容**:
1. **API接口修复**: 修复了后端管理系统数据库信息菜单的API 404错误
2. **数据库迁移**: 成功将本地数据库迁移到宝塔MySQL数据库
3. **环境配置**: 正确配置了生产环境的数据库连接和API路径

### 🚀 快速部署步骤

#### 1. 本地准备部署包

```bash
# Windows PowerShell / Mac Terminal / Linux Terminal
npm run package:baota
```

#### 2. 宝塔面板环境准备

在宝塔面板中安装：
- **Nginx** 1.20+ 
- **MySQL** 8.0+ 
- **Node.js** 18.x 
- **PM2管理器** 4.x

#### 3. 上传和解压

```bash
# 上传到服务器并解压
cd /www/wwwroot/your-domain.com   
unzip travelweb-baota-*.zip
```

#### 4. 安装依赖和配置

```bash
# 只需安装后端API服务依赖
npm install --production

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置数据库连接

# 配置管理后台
cd admin-panel
cp .env.example .env
# 编辑管理后台 .env 文件
```

#### 5. 启动服务

```bash
# 使用PM2启动后端API服务
pm2 start server.cjs --name "travelweb-api"
pm2 save
pm2 startup
```

#### 6. 配置Nginx

在宝塔面板添加网站，配置Nginx代理静态文件和API。

**详细配置请参考下方完整部署指南。**

## 📦 环境要求

- **Node.js** 18.x 或更高版本 (推荐 18.17.0+)
- **MySQL** 8.0+ 或 **SQLite** 3.x (开发环境可选)
- **npm** 9+ 或 **pnpm** 8+
- **Git** (用于克隆项目)

## 💻 本地开发环境部署

### 1. **克隆项目**

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

### 2. **安装依赖**

```bash
# Windows PowerShell / Mac Terminal / Linux Terminal
# 安装主项目依赖
npm install

# 安装管理后台依赖
cd admin-panel
npm install
cd ..
```

### 3. **数据库配置**

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

### 4. **环境变量配置**

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

### 5. **初始化数据库**

```bash
# Windows PowerShell / Mac Terminal / Linux Terminal
# MySQL数据库初始化
npm run init:mysql

# 或者SQLite数据库初始化
npm run init:sqlite
```

### 6. **启动开发服务器**

```bash
# 方式1: 分别启动各服务 (所有平台)
# 启动后端API服务 (端口 3002)
npm start

# 新开终端启动前端 (端口 3000)
npm run dev

# 新开终端启动管理后台 (端口 5174)
cd admin-panel
npm run dev
```

```bash
# 方式2: 使用并发启动 (推荐，所有平台)
npm run dev:all
```

**访问地址：**
- 🌐 **前端网站**: http://localhost:3000
- 🔧 **管理后台**: http://localhost:5174
- 🔌 **API服务**: http://localhost:3002
- 📊 **API文档**: http://localhost:3002/api-docs (如果启用)

### 本地 Nginx 配置 (可选)

如果您希望在本地使用 Nginx 进行反向代理和静态文件服务，可以按照以下步骤配置：

#### 1. **本地 Nginx 安装**

**Windows:**
```bash
# 下载 Nginx for Windows
# 访问 http://nginx.org/en/download.html
# 下载 nginx/Windows-x.x.x 版本
# 解压到本地目录，例如：C:\nginx
```

**Mac:**
```bash
# 使用 Homebrew 安装
brew install nginx

# 或者下载二进制包
# 访问 http://nginx.org/en/download.html
```

**Linux (Ubuntu/Debian):**
```bash
# 使用包管理器安装
sudo apt update
sudo apt install nginx
```

**Linux (CentOS/RHEL):**
```bash
# 使用 yum 或 dnf 安装
sudo yum install nginx
# 或者
sudo dnf install nginx
```

#### 2. **启动 Nginx**

```bash
# Windows PowerShell (以管理员身份运行)
cd C:\nginx  # 或您的 Nginx 安装路径
.\nginx.exe

# Mac
sudo nginx
# 或者使用 Homebrew 服务
brew services start nginx

# Linux
sudo systemctl start nginx
# 或者
sudo service nginx start

# 检查 Nginx 是否运行 (所有平台)
# Windows: .\nginx.exe -t
# Mac/Linux: nginx -t
```

#### 3. **本地 Nginx 配置文件**

**配置文件位置：**
- **Windows**: `C:\nginx\conf\nginx.conf` (或您的安装路径)
- **Mac**: `/usr/local/etc/nginx/nginx.conf` (Homebrew) 或 `/etc/nginx/nginx.conf`
- **Linux**: `/etc/nginx/nginx.conf`

编辑 `nginx.conf` 文件：

```nginx
# nginx.conf - 本地开发环境配置
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    # 开发环境服务器配置
    server {
        listen       80;
        server_name  localhost;

        # 前端应用 (开发服务器代理)
        location / {
            proxy_pass http://localhost:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket 支持 (Vite HMR)
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # 管理后台 (开发服务器代理)
        location /admin {
            proxy_pass http://localhost:5174;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket 支持 (Vite HMR)
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # API 服务代理
        location /api/ {
            proxy_pass http://localhost:3002/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # 超时设置
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
    }

    # 生产环境预览配置 (构建后的静态文件)
    server {
        listen       8080;
        server_name  localhost;
        root         D:/code/travelweb/dist;  # 修改为您的项目路径
        index        index.html;

        # 前端应用 (静态文件)
        location / {
            try_files $uri $uri/ /index.html;
        }

        # 管理后台 (静态文件)
        location /admin {
            alias D:/code/travelweb/admin-panel/dist;  # 修改为您的项目路径
            try_files $uri $uri/ /index.html;
        }

        # API 服务代理
        location /api/ {
            proxy_pass http://localhost:3002/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### 4. **Nginx 管理命令**

```bash
# Windows PowerShell (在 Nginx 安装目录下)
# 启动 Nginx
.\nginx.exe

# 重新加载配置
.\nginx.exe -s reload

# 停止 Nginx
.\nginx.exe -s stop

# 测试配置文件
.\nginx.exe -t

# 查看 Nginx 进程
tasklist /fi "imagename eq nginx.exe"

# 强制结束 Nginx 进程 (如果需要)
taskkill /f /im nginx.exe
```

```bash
# Mac Terminal
# 启动 Nginx
sudo nginx
# 或者使用 Homebrew 服务
brew services start nginx

# 重新加载配置
sudo nginx -s reload

# 停止 Nginx
sudo nginx -s stop
# 或者使用 Homebrew 服务
brew services stop nginx

# 测试配置文件
nginx -t

# 查看 Nginx 进程
ps aux | grep nginx
```

```bash
# Linux Terminal
# 启动 Nginx
sudo systemctl start nginx
# 或者
sudo service nginx start

# 重新加载配置
sudo systemctl reload nginx
# 或者
sudo service nginx reload

# 停止 Nginx
sudo systemctl stop nginx
# 或者
sudo service nginx stop

# 测试配置文件
nginx -t

# 查看 Nginx 状态
sudo systemctl status nginx
# 或者
sudo service nginx status
```

#### 5. **本地访问地址**

配置完成后，您可以通过以下地址访问：

**开发环境 (端口 80)：**
- 🌐 **前端网站**: http://localhost (代理到 :3000)
- 🔧 **管理后台**: http://localhost/admin (代理到 :5174)
- 🔌 **API服务**: http://localhost/api (代理到 :3002)

**生产预览 (端口 8080)：**
- 🌐 **前端网站**: http://localhost:8080 (静态文件)
- 🔧 **管理后台**: http://localhost:8080/admin (静态文件)
- 🔌 **API服务**: http://localhost:8080/api (代理到 :3002)

#### 6. **故障排除**

**常见问题：**

1. **端口被占用**
```bash
# Windows - 检查端口占用
netstat -ano | findstr :80
netstat -ano | findstr :8080
# 结束占用进程
taskkill /f /pid <PID>

# Mac/Linux - 检查端口占用
lsof -i :80
lsof -i :8080
# 结束占用进程
sudo kill -9 <PID>
```

2. **配置文件路径错误**
```bash
# Windows: 确保路径使用正斜杠或双反斜杠
# 正确: D:/code/travelweb/dist 或 D:\\code\\travelweb\\dist

# Mac/Linux: 使用绝对路径
# 正确: /Users/username/code/travelweb/dist
# 或: /home/username/code/travelweb/dist
```

3. **权限问题**
```bash
# Windows: 以管理员身份运行 PowerShell
# 右键点击 PowerShell -> "以管理员身份运行"

# Mac/Linux: 使用 sudo 权限
sudo nginx
sudo systemctl start nginx
```

4. **防火墙阻止**
```bash
# Windows: 在 Windows 防火墙中允许 nginx.exe
# 控制面板 -> 系统和安全 -> Windows Defender 防火墙 -> 允许应用通过防火墙

# Mac: 允许应用通过防火墙
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/nginx

# Linux: 配置 ufw 防火墙
sudo ufw allow 80
sudo ufw allow 443
```

## 🚀 宝塔面板部署 (推荐)

### ✅ 宝塔部署成功案例

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

**关键修复内容**:
1. **API接口修复**: 修复了后端管理系统数据库信息菜单的API 404错误
   - 在 `api/server.js` 中添加了 `/api/database/info` 路由
   - 修复了数据库API模块导入路径问题
2. **数据库迁移**: 成功将本地数据库迁移到宝塔MySQL数据库
3. **环境配置**: 正确配置了生产环境的数据库连接和API路径

### 方案一：本地打包上传 (推荐)

这是最简单、最可靠的部署方式。

**🚀 简化部署流程总览：**
1. **本地编译打包** → 生成包含静态文件的部署包
2. **上传解压** → 将部署包上传到服务器并解压
3. **安装后端依赖** → 只需安装后端API服务的生产依赖
4. **配置环境** → 配置数据库和API连接
5. **启动服务** → 使用PM2启动后端API服务
6. **配置Nginx** → 配置静态文件服务和API代理

**相比传统部署的优势：**
- ⚡ **更快**：无需在服务器上编译前端代码
- 🛡️ **更稳定**：避免服务器环境差异导致的编译问题
- 💾 **更省资源**：服务器无需安装前端开发依赖
- 🎯 **更简单**：部署步骤更少，出错概率更低

#### 1. 本地准备部署包

```bash
# 构建并打包项目
npm run package:baota
```

执行完成后，会在 `deploy-package` 目录生成压缩包：
- `travelweb-baota-YYYY-MM-DDTHH-mm-ss.zip`

**最新部署包信息：**
- **时间戳格式**：`YYYY-MM-DDTHH-mm-ss` (ISO 8601格式，便于版本管理)
- **包含内容**：完整的前后端代码、配置文件、数据库脚本
- **预期大小**：约 15-25 MB (包含所有编译后的静态资源)
- **最新版本**：`travelweb-baota-2025-10-26T16-02-08.zip` (已修复init-mysql.js缺失问题)

**部署包内容说明：**
- `dist/` - 前端网站编译后的静态文件（HTML、CSS、JS）
- `admin-panel/` - 管理后台完整目录
  - `admin-panel/dist/` - 管理后台编译后的静态文件
  - `admin-panel/.env.example` - 管理后台环境变量配置模板
  - `admin-panel/package.json` - 管理后台依赖配置
  - `admin-panel/README.md` - 管理后台部署说明
- `src/`、`api/`、`database/` - 后端API服务源码
- `server.cjs` - 后端服务启动文件
- `package.json` - 后端服务依赖配置
- `nginx/` - Nginx配置模板
- `.env.example` - 环境变量配置模板

**重要文件说明：**
- `admin-panel/.env.example`: 管理后台环境变量配置模板，包含API地址、基础路径等关键配置
- `admin-panel/package.json`: 管理后台的依赖信息，用于了解技术栈和版本
- `admin-panel/README.md`: 管理后台的详细部署和配置说明
- `admin-panel/dist/`: 已编译的管理后台静态资源，可直接部署

**本地编译打包的优势：**
- ✅ 前端和管理后台已编译为静态文件，无需在服务器上安装Node.js开发依赖
- ✅ 减少服务器资源消耗和部署时间
- ✅ 避免服务器环境差异导致的编译问题
- ✅ 提高部署成功率和稳定性

#### 2. 宝塔面板环境准备

在宝塔面板中安装以下软件：
- **Nginx** 1.20+ （用于静态文件服务和API代理）
- **MySQL** 5.7+ 或 8.0+ （数据库服务）
- **Node.js** 18.x （仅用于运行后端API服务）
- **PM2管理器** 4.x （用于管理后端API进程）

**注意：** Node.js仅用于运行后端API服务，前端和管理后台已编译为静态文件，由Nginx直接提供服务。

#### 3. 上传和解压

1. 将压缩包上传到服务器 `/www/wwwroot/chengex.wisdomier.com` 目录
2. 解压文件：
```bash
cd /www/wwwroot/chengex.wisdomier.com   
unzip travelweb-baota-*.zip

```

#### 4. 安装后端API服务依赖

**重要说明：** 由于已经在本地编译打包，前端和管理后台已经是静态文件，**无需安装前端依赖**。

**只需要为后端API服务安装生产运行时依赖：**

```bash
# 只安装后端API服务的生产依赖
npm install --production
```

**不需要执行的命令：**
```bash
# ❌ 不需要执行 - 管理后台已编译为静态文件
# cd admin-panel && npm install --production && cd ..
```

**依赖安装说明：**
- ✅ **后端API服务**：需要安装生产依赖（Express、MySQL驱动等）
- ❌ **前端网站**：已编译为静态文件（dist/目录），无需安装依赖
- ❌ **管理后台**：已编译为静态文件（admin-panel/dist/目录），无需安装依赖

**本地编译打包的优势：**
- ✅ **仅需安装后端依赖**：由于前端网站和管理后台已经编译为静态文件，只需要安装后端API服务的生产依赖
- ✅ **无需前端依赖**：不需要安装React、Vite、TypeScript等前端开发依赖
- ✅ **无需管理后台依赖**：管理后台的`admin-panel/dist/`已经是编译后的静态资源
- ⚡ **快速部署**：大大减少了依赖安装时间和服务器存储空间

#### 5. 配置环境变量

**需要配置两个 .env 文件：**

**5.1 配置后端服务器环境变量**

编辑根目录的 `.env` 文件：
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
CORS_ORIGINS=https://chengex.wisdomier.com,https://www.chengex.wisdomier.com

# API配置
API_BASE_URL=https://chengex.wisdomier.com
```

**5.2 配置管理后台环境变量**

编辑 `admin-panel/.env` 文件：
```bash
cp admin-panel/.env.example admin-panel/.env
nano admin-panel/.env
```

关键配置项：
```env
# 环境配置
VITE_NODE_ENV=production

# API 配置 (必须修改为实际域名)
VITE_API_BASE_URL=https://chengex.wisdomier.com/api

# 应用配置
VITE_APP_TITLE=TravelWeb 管理后台
VITE_APP_VERSION=1.0.0

# 开发服务器配置
VITE_DEV_SERVER_PORT=5174

# 安全配置 (替换为实际域名)
VITE_ALLOWED_ORIGINS=https://chengex.wisdomier.com

# 功能开关
VITE_ENABLE_DEV_TOOLS=false
VITE_ENABLE_DEBUG=false
VITE_SHOW_DETAILED_ERRORS=false
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_PERFORMANCE_MONITOR=true

# 文件上传配置
VITE_MAX_FILE_SIZE=10
VITE_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm
```

#### 6. 数据库初始化和迁移

**6.1 在宝塔面板创建数据库**

1. 登录宝塔面板 → 数据库 → 添加数据库
2. 数据库名：`travelweb_db`
3. 用户名：`travelweb_user` 
4. 密码：设置强密码
5. 字符集：`utf8mb4`

**6.2 数据库迁移 (已验证成功)**

本项目提供了完整的数据库迁移工具，支持从本地数据库迁移到宝塔数据库：

```bash
# 使用统一迁移脚本 (推荐)
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

# 或者使用传统初始化方式
npm run init:mysql
```

**迁移工具特性**:
- ✅ **完整迁移**: 迁移所有表结构和数据
- ✅ **数据验证**: 自动验证迁移后的数据完整性
- ✅ **备份支持**: 迁移前自动备份目标数据库
- ✅ **错误处理**: 完善的错误处理和回滚机制
- ✅ **干运行模式**: 支持 `--dry-run` 预览迁移操作
- ✅ **SSH支持**: 支持通过SSH连接远程数据库

**迁移成功验证**:
- ✅ 所有表结构正确创建
- ✅ 成都特色旅游数据完整迁移
- ✅ 数据库连接测试通过
- ✅ API接口数据查询正常
- ✅ 管理后台数据库信息显示正常

#### 7. 启动服务

**使用PM2启动后端服务：**
```bash
# 启动后端API服务
pm2 start server.cjs --name "travelweb-api" --env production

# 查看服务状态
pm2 status

# 查看日志
pm2 logs travelweb-api

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup

# 重启服务 (如果需要)
pm2 restart travelweb-api

# 停止服务 (如果需要)
pm2 stop travelweb-api
```

**PM2 配置文件 (可选)：**

创建 `ecosystem.config.js` 文件：
```javascript
module.exports = {
  apps: [{
    name: 'travelweb-api',
    script: 'server.cjs',
    cwd: '/www/wwwroot/chengex.wisdomier.com',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

使用配置文件启动：
```bash
pm2 start ecosystem.config.js
```

#### 8. Nginx配置

在宝塔面板添加网站，配置Nginx：

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name chengex.wisdomier.com;
    root /www/wwwroot/chengex.wisdomier.com/dist;
    index index.html;

    # HTTP重定向到HTTPS
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    }

    # 前端应用
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 管理后台 - 修复后的配置
    location /admin {
        alias /www/wwwroot/chengex.wisdomier.com/admin-panel/dist;
        try_files $uri $uri/ /index.html;
        
        # 确保管理后台的静态资源能正确加载
        location ~* ^/admin/(.+\.(js|css|png|jpg|jpeg|gif|ico|svg))$ {
            alias /www/wwwroot/chengex.wisdomier.com/admin-panel/dist/$1;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # SSL配置
    ssl_certificate /www/server/panel/vhost/cert/chengex.wisdomier.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/chengex.wisdomier.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;

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
        
        # 缓存控制
        proxy_cache_bypass $http_upgrade;
        proxy_no_cache $http_upgrade;
        
        # CORS支持
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 错误页面
    error_page 404 /index.html;
    error_page 500 502 503 504 /index.html;
}
```

#### 9. 访问测试

- 前端: https://chengex.wisdomier.com
- 管理后台: https://chengex.wisdomier.com/admin
- API: https://chengex.wisdomier.com/api

### 方案二：服务器直接构建

如果服务器性能较好，也可以直接在服务器上构建：

1. 克隆代码到服务器
2. 安装依赖：`npm install && cd admin-panel && npm install && cd ..`
3. 构建项目：`npm run build:production`
4. 按照方案一的步骤5-9进行配置

## 🚀 生产环境配置清单

### 📋 从本地开发到生产部署必须修改的配置

#### 1. 域名配置 (必须修改)

**需要替换 localhost 的地方：**

| 配置文件 | 本地开发 | 生产环境 | 说明 |
|---------|---------|---------|------|
| 前端API配置 | `http://localhost:3002` | `https://chengex.wisdomier.com/api` | 前端调用后端API的地址 |
| 管理后台API配置 | `http://localhost:3002` | `https://chengex.wisdomier.com/api` | 管理后台调用API的地址 |
| 管理后台访问地址 | `http://localhost:5174` | `https://chengex.wisdomier.com/admin` | 管理后台访问地址 |
| Nginx配置 | `server_name localhost` | `server_name chengex.wisdomier.com` | 服务器域名 |
| CORS配置 | `localhost:3000,localhost:5174` | `chengex.wisdomier.com` | 跨域白名单 |

**具体修改示例：**

1. **前端配置文件** (`src/config/api.js` 或类似文件)：
```javascript
// 本地开发
const API_BASE_URL = 'http://localhost:3002/api';

// 生产环境 - 修改为：
const API_BASE_URL = 'https://chengex.wisdomier.com/api';
```

2. **管理后台环境变量配置** (`admin-panel/.env` 文件)：
```env
# 本地开发
VITE_NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3002
VITE_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5174
VITE_ENABLE_DEV_TOOLS=true
VITE_ENABLE_DEBUG=true

# 生产环境 - 修改为：
VITE_NODE_ENV=production
VITE_API_BASE_URL=https://chengex.wisdomier.com/api
VITE_ALLOWED_ORIGINS=https://chengex.wisdomier.com
VITE_BASE_PATH=/admin
VITE_ENABLE_DEV_TOOLS=false
VITE_ENABLE_DEBUG=false
```

3. **后端CORS配置** (`.env` 文件)：
```env
# 本地开发
CORS_ORIGIN=http://localhost:3000,http://localhost:5174

# 生产环境 - 修改为：
CORS_ORIGIN=https://chengex.wisdomier.com
```

#### 2. 环境变量对比表

**后端服务器配置 (根目录 `.env`)：**

| 配置项 | 本地开发 | 生产环境 | 是否必须修改 |
|-------|---------|---------|-------------|
| `NODE_ENV` | `development` | `production` | ✅ 必须 |
| `DB_HOST` | `localhost` | `localhost` 或 `数据库服务器IP` | 🔄 视情况 |
| `DB_NAME` | `travelweb_db` | `travelweb_db` | ✅ 保持一致 |
| `DB_USER` | `travelweb_user` | `生产环境用户名` | ✅ 必须 |
| `DB_PASSWORD` | `开发密码` | `强密码` | ✅ 必须 |
| `JWT_SECRET` | `开发密钥` | `复杂随机密钥` | ✅ 必须 |
| `PORT` | `3002` | `3002` | ✅ 保持一致 |
| `CORS_ORIGIN` | `localhost地址` | `实际域名` | ✅ 必须 |

**管理后台配置 (`admin-panel/.env`)：**

| 配置项 | 本地开发 | 生产环境 | 是否必须修改 |
|-------|---------|---------|-------------|
| `VITE_NODE_ENV` | `development` | `production` | ✅ 必须 |
| `VITE_API_BASE_URL` | `http://localhost:3002` | `https://chengex.wisdomier.com` | ✅ 必须 |
| `VITE_ALLOWED_ORIGINS` | `localhost地址` | `实际域名` | ✅ 必须 |
| `VITE_ENABLE_DEV_TOOLS` | `true` | `false` | ✅ 必须 |
| `VITE_ENABLE_DEBUG` | `true` | `false` | ✅ 必须 |
| `VITE_SHOW_DETAILED_ERRORS` | `true` | `false` | ✅ 必须 |
| `VITE_ENABLE_ERROR_REPORTING` | `false` | `true` | ✅ 必须 |
| `VITE_ENABLE_PERFORMANCE_MONITOR` | `false` | `true` | ✅ 必须 |

#### 3. 数据库配置

**生产环境数据库设置：**
```sql
-- 创建生产数据库
CREATE DATABASE travelweb_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建专用用户（使用强密码）
CREATE USER 'travelweb_prod'@'localhost' IDENTIFIED BY 'your-strong-password-here';
GRANT ALL PRIVILEGES ON travelweb_db.* TO 'travelweb_prod'@'localhost';
FLUSH PRIVILEGES;
```

**生产环境 .env 配置：**
```env
# 数据库配置
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=travelweb_db
DB_USER=travelweb_prod
DB_PASSWORD=your-strong-password-here

# 服务配置
PORT=3002
NODE_ENV=production

# 安全配置 (必须修改)
JWT_SECRET=your-super-complex-jwt-secret-key-at-least-32-characters-long

# CORS配置 (替换为实际域名)
CORS_ORIGIN=https://chengex.wisdomier.com
```

**JWT安全配置说明：**
- **令牌有效期**：访问令牌24小时有效，自动刷新机制确保用户体验
- **密钥要求**：JWT_SECRET必须至少32个字符，建议使用64位随机字符串
- **安全建议**：
  - 使用强随机密钥生成器：`openssl rand -hex 32`
  - 定期轮换JWT密钥（建议每6个月）
  - 生产环境绝不使用示例密钥
  - 密钥应包含大小写字母、数字和特殊字符
```

#### 4. SSL/HTTPS 配置

**生产环境必须启用HTTPS：**

1. **申请SSL证书** (推荐Let's Encrypt免费证书)
2. **Nginx HTTPS配置：**
```nginx
server {
    listen 443 ssl http2;
    server_name chengex.wisdomier.com;
    
    ssl_certificate /etc/letsencrypt/live/chengex.wisdomier.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chengex.wisdomier.com/privkey.pem;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 其他配置...
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name chengex.wisdomier.com;
    return 301 https://$server_name$request_uri;
}
```

#### 5. 部署前检查清单

**配置检查：**
- [ ] 已将所有 `localhost` 替换为实际域名
- [ ] 已修改数据库用户名和密码
- [ ] 已设置复杂的JWT密钥 (至少32位字符)
- [ ] 已配置生产环境数据库
- [ ] 已更新CORS白名单
- [ ] 已设置 `NODE_ENV=production`
- [ ] 已配置 `admin-panel/.env` 文件
- [ ] 已设置 `VITE_NODE_ENV=production`
- [ ] 已更新 `VITE_API_BASE_URL` 为实际域名
- [ ] 已配置 `VITE_ALLOWED_ORIGINS` 为实际域名

**安全检查：**
- [ ] 数据库密码足够复杂
- [ ] JWT密钥已更换为生产密钥
- [ ] 已配置SSL证书
- [ ] 已设置防火墙规则
- [ ] 已移除开发调试信息
- [ ] 已关闭管理后台开发工具 (`VITE_ENABLE_DEV_TOOLS=false`)
- [ ] 已关闭管理后台调试模式 (`VITE_ENABLE_DEBUG=false`)
- [ ] 已启用错误上报 (`VITE_ENABLE_ERROR_REPORTING=true`)

**功能检查：**
- [ ] 前端页面正常访问
- [ ] 管理后台正常访问
- [ ] API接口正常响应
- [ ] 数据库连接正常
- [ ] 文件上传功能正常

**性能检查：**
- [ ] 已启用Gzip压缩
- [ ] 已配置静态资源缓存
- [ ] 已优化数据库查询
- [ ] 已设置PM2进程管理

## 🔧 可用脚本

```bash
# 开发
npm run dev                 # 启动前端开发服务器
npm start                   # 启动后端服务器

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
```

## 🛠️ 故障排除

### 常见问题解决

**1. 数据库连接失败**

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

**2. 端口被占用**

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

**3. 构建失败**

```bash
# 清理并重新安装 (所有平台)
npm cache clean --force
rm -rf node_modules package-lock.json  # Mac/Linux
Remove-Item -Recurse -Force node_modules  # Windows
npm install

# 检查Node.js版本 (需要18.x+)
node --version
```

**4. PM2进程问题**

```bash
# 查看和管理PM2进程 (所有平台)
pm2 status
pm2 restart travelweb-api
pm2 logs travelweb-api
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

## 📁 项目结构

```
travelweb/
├── src/                    # 前端源码
├── admin-panel/            # 管理后台
├── api/                    # 后端API
├── database/               # 数据库脚本
├── public/                 # 静态资源
├── dist/                   # 前端构建输出
├── scripts/                # 部署脚本
├── server.cjs              # 后端服务器
├── package.json            # 项目配置
└── README.md              # 项目说明
```

## 🔒 生产环境安全清单

**必须配置项：**
- [ ] 修改JWT密钥为复杂随机字符串 (至少32位)
- [ ] 设置强密码的数据库用户
- [ ] 配置HTTPS和SSL证书
- [ ] 设置正确的CORS白名单
- [ ] 配置防火墙规则 (只开放80, 443端口)

## 📞 技术支持

如果遇到部署问题，请检查：
1. Node.js版本是否为18.x+
2. 数据库连接配置是否正确
3. 端口是否被占用
4. 防火墙设置是否正确

---

**版本**: v1.6.1  
**更新时间**: 2025年11月  
**部署状态**: ✅ 宝塔面板生产环境运行中
