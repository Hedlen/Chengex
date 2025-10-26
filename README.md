# 旅游网站系统

一个现代化的旅游网站系统，包含用户前端和管理后台，支持景点展示、路线规划、用户管理等功能。

## 🚀 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后台管理**: React + TypeScript + Vite
- **后端**: Node.js + Express
- **数据库**: MySQL 8.0+
- **部署**: 宝塔面板 (推荐)

## ✨ 主要功能

- 🏞️ 景点展示和详情
- 🗺️ 旅游路线规划
- 👤 用户注册和登录
- 📱 响应式设计
- 🔧 管理后台
- 🌐 多语言支持

## 📦 快速开始

### 环境要求

- **Node.js** 18+
- **MySQL** 8.0+
- **npm** 或 **pnpm**

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd travelweb
```

2. **安装依赖**
```bash
npm install
cd admin-panel && npm install && cd ..
```

3. **创建MySQL数据库**
```bash
# 登录MySQL
mysql -u root -p

# 创建数据库和用户
CREATE DATABASE travelweb_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'travelweb_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON travelweb_db.* TO 'travelweb_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

4. **配置环境变量**
```bash
cp .env.example .env
cp admin-panel/.env.example admin-panel/.env
```

编辑 `.env` 文件，配置MySQL连接：
```env
# 数据库配置
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=travelweb_db
DB_USER=travelweb_user
DB_PASSWORD=your_password

# 服务配置
PORT=3001
NODE_ENV=development
JWT_SECRET=your-jwt-secret-key
```

5. **初始化数据库**
```bash
npm run init:mysql
```

5. **启动开发服务器**
```bash
# 启动前端 (端口 3000)
npm run dev

# 启动后台管理 (端口 5174)
cd admin-panel && npm run dev

# 启动后端服务 (端口 3001)
npm start
```

访问地址：
- 前端: http://localhost:3000
- 管理后台: http://localhost:5174
- API: http://localhost:3001

## 🚀 宝塔面板部署 (推荐)

### 方案一：本地打包上传 (推荐)

这是最简单、最可靠的部署方式。

#### 1. 本地准备部署包

```bash
# 构建并打包项目
npm run package:baota
```

执行完成后，会在 `deploy-package` 目录生成压缩包：
- `travelweb-baota-YYYY-MM-DDTHH-mm-ss.zip`

#### 2. 宝塔面板环境准备

在宝塔面板中安装以下软件：
- **Nginx** 1.20+
- **MySQL** 5.7+ 或 8.0+
- **Node.js** 18.x
- **PM2管理器** 4.x

#### 3. 上传和解压

1. 将压缩包上传到服务器 `/www/wwwroot/` 目录
2. 解压文件：
```bash
cd /www/wwwroot/
unzip travelweb-baota-*.zip
mv travelweb-baota-* travelweb
cd travelweb
```

#### 4. 安装依赖

```bash
npm install --production
cd admin-panel && npm install --production && cd ..
```

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
PORT=3001
NODE_ENV=production

# JWT密钥 (必须修改)
JWT_SECRET=your-super-secret-jwt-key-here

# CORS配置 (替换为实际域名)
CORS_ORIGIN=https://chengex.wisdomier.com
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

#### 6. 数据库初始化

在宝塔面板创建数据库，然后初始化：
```bash
npm run init:mysql
```

#### 7. 启动服务

使用PM2启动后端服务：
```bash
pm2 start server.cjs --name "travelweb-api"
pm2 save
pm2 startup
```

#### 8. Nginx配置

在宝塔面板添加网站，配置Nginx：

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name chengex.wisdomier.com;
    root /www/wwwroot/travelweb/dist;
    index index.html;

    # SSL配置
    ssl_certificate /etc/letsencrypt/live/chengex.wisdomier.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chengex.wisdomier.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;

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
        alias /www/wwwroot/travelweb/admin-panel/dist;
        try_files $uri $uri/ /admin/index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
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
| 前端API配置 | `http://localhost:3001` | `https://chengex.wisdomier.com/api` | 前端调用后端API的地址 |
| 管理后台API配置 | `http://localhost:3001` | `https://chengex.wisdomier.com/api` | 管理后台调用API的地址 |
| 管理后台访问地址 | `http://localhost:5174` | `https://chengex.wisdomier.com/admin` | 管理后台访问地址 |
| Nginx配置 | `server_name localhost` | `server_name chengex.wisdomier.com` | 服务器域名 |
| CORS配置 | `localhost:3000,localhost:5174` | `chengex.wisdomier.com` | 跨域白名单 |

**具体修改示例：**

1. **前端配置文件** (`src/config/api.js` 或类似文件)：
```javascript
// 本地开发
const API_BASE_URL = 'http://localhost:3001/api';

// 生产环境 - 修改为：
const API_BASE_URL = 'https://chengex.wisdomier.com/api';
```

2. **管理后台环境变量配置** (`admin-panel/.env` 文件)：
```env
# 本地开发
VITE_NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3001
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
| `PORT` | `3001` | `3001` | ✅ 保持一致 |
| `CORS_ORIGIN` | `localhost地址` | `实际域名` | ✅ 必须 |

**管理后台配置 (`admin-panel/.env`)：**

| 配置项 | 本地开发 | 生产环境 | 是否必须修改 |
|-------|---------|---------|-------------|
| `VITE_NODE_ENV` | `development` | `production` | ✅ 必须 |
| `VITE_API_BASE_URL` | `http://localhost:3001` | `https://chengex.wisdomier.com` | ✅ 必须 |
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
PORT=3001
NODE_ENV=production

# 安全配置 (必须修改)
JWT_SECRET=your-super-complex-jwt-secret-key-at-least-32-characters-long

# CORS配置 (替换为实际域名)
CORS_ORIGIN=https://chengex.wisdomier.com
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

### 常见问题

**1. MySQL数据库连接失败**
```bash
# 检查MySQL服务状态
# Windows
net start mysql80

# 测试数据库连接
mysql -u travelweb_user -p -h localhost travelweb_db

# 检查环境变量配置
cat .env | grep DB_
```
- 确认MySQL服务已启动
- 验证数据库用户名和密码
- 检查数据库名称是否正确
- 确认用户权限是否足够

**2. 端口被占用**
```bash
# 查看端口占用
netstat -tlnp | grep :3000
# 杀死进程
kill -9 <PID>
```

**3. PM2进程问题**
```bash
# 查看进程状态
pm2 status
# 重启服务
pm2 restart travelweb-api
# 查看日志
pm2 logs travelweb-api
```

**4. 构建失败**
- 检查Node.js版本 (需要18.x)
- 清理缓存：`npm cache clean --force`
- 重新安装依赖：`rm -rf node_modules && npm install`

**5. 无法访问管理后台**
- 检查Nginx配置中的 `/admin` 路径
- 确认 `admin-panel/dist` 目录存在
- 检查文件权限

### 日志查看

```bash
# PM2日志
pm2 logs travelweb-api

# Nginx日志
tail -f /www/wwwroot/travelweb/logs/access.log
tail -f /www/wwwroot/travelweb/logs/error.log
```

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

## 🔒 安全配置

**生产环境安全检查清单：**

**基础安全：**
- [ ] 修改默认的JWT密钥为复杂随机字符串 (至少32位)
- [ ] 设置强密码的数据库用户 (包含大小写字母、数字、特殊字符)
- [ ] 将数据库用户名从 `travelweb_user` 改为 `travelweb_prod`
- [ ] 更新数据库名称为 `travelweb_db`
- [ ] 配置防火墙规则，只开放必要端口 (80, 443, 22)

**HTTPS配置：**
- [ ] 申请并配置SSL证书 (推荐Let's Encrypt免费证书)
- [ ] 配置HTTP自动重定向到HTTPS
- [ ] 启用HSTS (HTTP Strict Transport Security)
- [ ] 配置安全的SSL协议和加密套件

**应用安全：**
- [ ] 设置正确的CORS白名单，移除localhost地址
- [ ] 启用请求频率限制 (Rate Limiting)
- [ ] 配置安全头部 (Security Headers)
- [ ] 移除开发环境的调试信息和错误详情

**服务器安全：**
- [ ] 定期更新系统和软件包
- [ ] 配置自动安全更新
- [ ] 设置日志监控和告警
- [ ] 定期备份数据库和重要文件
- [ ] 限制SSH访问，使用密钥认证

## 📞 技术支持

如果在部署过程中遇到问题，请检查：
1. 服务器环境是否满足要求
2. 所有配置文件是否正确
3. 服务是否正常启动
4. 网络和防火墙设置

---

**版本**: v1.0.0  
**更新时间**: 2024年10月
