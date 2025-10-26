# TravelWeb 宝塔部署说明

## 📋 部署步骤

### 1. 环境准备
- Node.js 18.x LTS
- MySQL 5.7+ 或 8.0+
- Nginx 1.20+
- PM2 进程管理器

### 2. 文件上传
1. 将此压缩包上传到宝塔面板
2. 解压到网站根目录: /www/wwwroot/你的域名/

### 3. 安装依赖
```bash
cd /www/wwwroot/你的域名/
npm install --production
```

### 4. 环境配置
1. 复制环境变量文件:
```bash
cp .env.example .env
```

2. 编辑 .env 文件，配置数据库和其他参数

### 5. 数据库初始化
```bash
npm run init:mysql
```

### 6. 启动服务
```bash
pm2 start server.cjs --name "travelweb"
pm2 startup
pm2 save
```

### 7. Nginx 配置
参考 nginx/ 目录下的配置文件

## 🔧 故障排除
- 检查 Node.js 版本: node --version
- 检查 PM2 状态: pm2 status
- 查看日志: pm2 logs travelweb
- 重启服务: pm2 restart travelweb

## 📞 技术支持
如遇问题，请查看主项目的 README.md 文件或联系技术支持。
