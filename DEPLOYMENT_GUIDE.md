# TravelWeb 项目部署指南

## 📋 部署前准备

### 系统要求
- Node.js 18+ 
- MySQL 8.0+
- Nginx 1.18+
- PM2 进程管理器

### 环境变量配置
复制 `.env.example` 到 `.env` 并配置：
```bash
# 数据库配置
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=travelweb

# JWT 密钥
JWT_SECRET=your-super-secret-jwt-key

# 跨域配置
CORS_ORIGIN=https://你的域名.com

# 服务端口
PORT=3001
```

## 🚀 宝塔面板部署（推荐）

### 方案选择

| 特性 | 本地打包上传 | 服务器直接构建 |
|------|-------------|---------------|
| 部署速度 | ⚡ 快速 | 🐌 较慢 |
| 网络要求 | 📶 需要稳定上传 | 🌐 需要Git访问 |
| 服务器资源 | 💾 占用少 | 🔥 需要构建资源 |
| 构建环境 | 🏠 本地控制 | ☁️ 服务器环境 |
| 推荐场景 | 生产环境 | 开发测试 |

### 方案A：本地打包上传（推荐）

#### 1. 本地构建
```bash
# 安装依赖
npm install

# 构建生产版本
npm run build:production

# 打包部署文件
npm run package:baota
# 或使用 PowerShell 脚本
.\scripts\build-and-package.ps1
```

#### 2. 上传到宝塔
1. 将生成的 `travelweb-deploy.zip` 上传到服务器
2. 在宝塔面板中解压到网站目录
3. 配置环境变量和数据库

#### 3. 服务器配置
```bash
# 安装生产依赖
npm install --production

# 初始化数据库
npm run init:mysql

# 启动服务
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 方案B：服务器直接构建

#### 1. 克隆项目
```bash
cd /www/wwwroot
git clone https://github.com/your-username/travelweb.git 你的域名
cd 你的域名
```

#### 2. 安装依赖和构建
```bash
npm install
npm run build:all
```

#### 3. 配置和启动
```bash
# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 初始化数据库
npm run init:mysql

# 启动服务
pm2 start ecosystem.config.js
```

## 🔧 Nginx 配置

### 宝塔面板配置
1. 添加网站站点
2. 设置网站目录为 `/www/wwwroot/你的域名/dist`
3. 配置反向代理：
   - 代理名称：`api`
   - 目标URL：`http://127.0.0.1:3001`
   - 发送域名：`$host`

### 手动配置
使用 `scripts/nginx-config-template.conf` 模板：
```bash
# 复制配置模板
cp scripts/nginx-config-template.conf /etc/nginx/sites-available/你的域名
# 修改域名和路径
# 启用站点
ln -s /etc/nginx/sites-available/你的域名 /etc/nginx/sites-enabled/
nginx -t && nginx -s reload
```

## 🗄️ 数据库配置

### 宝塔面板
1. 创建数据库：`travelweb`
2. 创建用户并授权
3. 导入初始数据：`npm run init:mysql`

### 手动配置
```sql
CREATE DATABASE travelweb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'travelweb'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON travelweb.* TO 'travelweb'@'localhost';
FLUSH PRIVILEGES;
```

## 🔒 SSL 证书

### 宝塔面板
1. 网站设置 → SSL → Let's Encrypt
2. 填写邮箱申请免费证书
3. 开启强制HTTPS

### 手动配置
```bash
# 使用 Certbot
certbot --nginx -d 你的域名.com -d www.你的域名.com
```

## 📊 监控和维护

### PM2 管理
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启应用
pm2 restart all

# 监控资源
pm2 monit
```

### 日志管理
- 应用日志：`pm2 logs`
- Nginx 日志：`/var/log/nginx/`
- 宝塔日志：`/www/wwwlogs/`

## 🚨 故障排除

### 常见问题

#### 1. 构建失败
```bash
# 清理缓存重新构建
npm run clean
npm install
npm run build:all
```

#### 2. PM2 启动失败
```bash
# 检查端口占用
netstat -tlnp | grep :3001
# 查看详细错误
pm2 logs --err
```

#### 3. 数据库连接失败
- 检查数据库服务状态
- 验证 `.env` 配置
- 确认用户权限

#### 4. Nginx 配置错误
```bash
# 检查配置语法
nginx -t
# 查看错误日志
tail -f /var/log/nginx/error.log
```

## 📝 部署检查清单

### 部署前
- [ ] 环境变量配置完成
- [ ] 数据库创建并授权
- [ ] 域名解析配置
- [ ] SSL 证书准备

### 部署后
- [ ] 前端页面正常访问
- [ ] API 接口响应正常
- [ ] 后台管理系统可登录
- [ ] 数据库连接正常
- [ ] PM2 进程运行稳定
- [ ] SSL 证书有效
- [ ] 日志记录正常

## 🔄 更新部署

### 本地打包方式
```bash
# 本地更新代码
git pull origin main
npm run build:production
npm run package:baota

# 上传并替换服务器文件
# 重启服务
pm2 restart all
```

### 服务器直接方式
```bash
# 服务器更新
cd /www/wwwroot/你的域名
git pull origin main
npm install
npm run build:all
pm2 restart all
```

## 📞 技术支持

如遇到部署问题，请检查：
1. 系统环境是否满足要求
2. 网络连接是否正常
3. 权限配置是否正确
4. 日志文件中的错误信息

更多详细信息请参考 `README.md` 中的部署章节。