# 腾讯云部署配置指南

## 概述

本指南将帮助您在腾讯云服务器上部署旅游网站项目，包括域名配置、安全设置和生产环境优化。

## 前置条件

1. 腾讯云服务器（CVM）
2. 已备案的域名
3. MySQL 数据库
4. SSL 证书（推荐使用 Let's Encrypt 或腾讯云 SSL）

## 部署步骤

### 1. 服务器环境准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js (推荐 18.x LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2 进程管理器
sudo npm install -g pm2

# 安装 Nginx
sudo apt install nginx -y

# 安装 MySQL
sudo apt install mysql-server -y
```

### 2. 项目部署

```bash
# 克隆项目到服务器
git clone <your-repo-url> /var/www/travelweb
cd /var/www/travelweb

# 安装依赖
npm install

# 复制腾讯云配置文件
cp .env.tencent .env
```

### 3. 配置文件设置

#### 3.1 编辑 .env 文件

```bash
nano .env
```

**重要配置项：**

```env
# 域名配置 - 替换为您的实际域名
DOMAIN_NAME=your-domain.com
API_BASE_URL=https://your-domain.com/api
FRONTEND_URL=https://your-domain.com

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=travelweb
DB_USER=travelweb_user
DB_PASSWORD=your_secure_password

# 安全配置
CORS_ORIGIN=https://your-domain.com
JWT_SECRET=your_super_secure_jwt_secret_key

# SSL证书路径
SSL_CERT_PATH=/etc/letsencrypt/live/your-domain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/your-domain.com/privkey.pem
```

#### 3.2 安全配置说明

| 配置项 | 开发环境 | 生产环境 | 说明 |
|--------|----------|----------|------|
| `CORS_ORIGIN` | `*` | `https://your-domain.com` | 生产环境必须指定具体域名 |
| `RATE_LIMIT_MAX` | `100` | `1000-5000` | 根据预期流量调整 |
| `RATE_LIMIT_WINDOW` | `900000` | `900000` | 15分钟窗口期 |
| `TRUST_PROXY` | `false` | `true` | 腾讯云负载均衡需要开启 |

### 4. 数据库设置

```bash
# 登录 MySQL
sudo mysql -u root -p

# 创建数据库和用户
CREATE DATABASE travelweb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'travelweb_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON travelweb.* TO 'travelweb_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. SSL 证书配置

#### 5.1 使用 Let's Encrypt（推荐）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo crontab -e
# 添加以下行：
0 12 * * * /usr/bin/certbot renew --quiet
```

#### 5.2 使用腾讯云 SSL 证书

1. 在腾讯云控制台下载证书
2. 上传证书文件到服务器：
   ```bash
   sudo mkdir -p /etc/ssl/certs /etc/ssl/private
   sudo cp your-domain.com.pem /etc/ssl/certs/
   sudo cp your-domain.com.key /etc/ssl/private/
   sudo chmod 600 /etc/ssl/private/your-domain.com.key
   ```

### 6. Nginx 配置

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/travelweb
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL 配置
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 静态文件
    location /static/ {
        alias /var/www/travelweb/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 前端应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/travelweb /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. 启动应用

```bash
# 初始化数据库
npm run init-db

# 使用 PM2 启动应用
pm2 start ecosystem.config.js --env production

# 设置开机自启
pm2 startup
pm2 save
```

### 8. 防火墙配置

```bash
# 配置 UFW 防火墙
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 9. 监控和日志

```bash
# 查看应用状态
pm2 status
pm2 logs

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 查看系统资源
htop
```

## 域名配置检查清单

- [ ] 域名已备案
- [ ] DNS 解析指向服务器 IP
- [ ] SSL 证书已配置
- [ ] `.env` 文件中的域名配置正确
- [ ] `CORS_ORIGIN` 设置为具体域名（不是 `*`）
- [ ] Nginx 配置中的域名正确

## 安全配置检查清单

- [ ] 数据库密码强度足够
- [ ] JWT_SECRET 已更换为安全密钥
- [ ] 防火墙已配置
- [ ] SSL 证书有效
- [ ] 安全头已配置
- [ ] 速率限制已启用
- [ ] 文件上传限制已配置

## 性能优化建议

1. **启用 Gzip 压缩**
2. **配置 CDN**（腾讯云 CDN）
3. **数据库连接池优化**
4. **静态资源缓存**
5. **监控和告警**

## 故障排除

### 常见问题

1. **502 Bad Gateway**
   - 检查应用是否正常运行：`pm2 status`
   - 检查端口是否被占用：`netstat -tlnp | grep :3001`

2. **SSL 证书错误**
   - 检查证书路径是否正确
   - 验证证书有效性：`openssl x509 -in cert.pem -text -noout`

3. **数据库连接失败**
   - 检查 MySQL 服务状态：`sudo systemctl status mysql`
   - 验证数据库连接：`mysql -u travelweb_user -p -h localhost`

4. **CORS 错误**
   - 确认 `CORS_ORIGIN` 配置正确
   - 检查域名是否包含协议（https://）

## 维护和更新

```bash
# 更新代码
cd /var/www/travelweb
git pull origin main
npm install
pm2 reload all

# 备份数据库
mysqldump -u travelweb_user -p travelweb > backup_$(date +%Y%m%d_%H%M%S).sql

# 更新 SSL 证书
sudo certbot renew
```

## 联系支持

如果遇到问题，请检查：
1. 服务器日志
2. 应用日志
3. Nginx 日志
4. 数据库日志

确保所有配置文件中的域名和密钥都已正确替换为您的实际值。