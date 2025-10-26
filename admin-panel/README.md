# TravelWeb 管理后台

TravelWeb 旅游网站的后台管理系统，基于 React + TypeScript + Vite 构建。

## 功能特性

- 🎯 博客管理：创建、编辑、删除博客文章
- 📊 数据统计：网站访问量、用户统计等
- 🖼️ 媒体管理：图片上传、管理
- 👥 用户管理：用户信息查看和管理
- 🎨 现代化UI：基于 Tailwind CSS 的响应式设计
- 🔐 安全认证：JWT 身份验证

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **状态管理**: Redux Toolkit
- **路由**: React Router
- **样式**: Tailwind CSS
- **图表**: Recharts
- **编辑器**: React MD Editor
- **HTTP客户端**: Fetch API

## 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制环境变量示例文件并配置：

```bash
cp .env.example .env
```

根据你的环境修改 `.env` 文件中的配置：

#### 开发环境配置
```env
VITE_NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3001
VITE_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5174
VITE_ENABLE_DEV_TOOLS=true
VITE_ENABLE_DEBUG=true
```

#### 生产环境配置
```env
VITE_NODE_ENV=production
VITE_API_BASE_URL=https://chengex.wisdomier.com
VITE_ALLOWED_ORIGINS=https://chengex.wisdomier.com
VITE_ENABLE_DEV_TOOLS=false
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ERROR_REPORTING=true
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5174 查看管理后台。

### 4. 构建生产版本

```bash
npm run build
```

构建文件将生成在 `dist` 目录中。

## 部署指南

### 环境配置说明

#### 域名配置

| 环境 | 主网站 | 管理后台 | API服务器 |
|------|--------|----------|-----------|
| 开发环境 | http://localhost:3000 | http://localhost:5174 | http://localhost:3001 |
| 生产环境 | https://chengex.wisdomier.com | https://chengex.wisdomier.com/admin | https://chengex.wisdomier.com |
| 测试环境 | https://test.chengex.wisdomier.com | https://test.chengex.wisdomier.com/admin | https://test.chengex.wisdomier.com |

#### 重要配置项

1. **API_BASE_URL**: 后端API服务器地址
2. **ALLOWED_ORIGINS**: CORS允许的域名列表
3. **NODE_ENV**: 运行环境（development/production/test）

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 设置环境变量：
   ```
   VITE_NODE_ENV=production
   VITE_API_BASE_URL=https://chengex.wisdomier.com
   VITE_ALLOWED_ORIGINS=https://chengex.wisdomier.com
   ```
3. 部署命令：
   ```bash
   npm run build
   ```

### Netlify 部署

1. 连接 GitHub 仓库到 Netlify
2. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`
3. 环境变量配置同上

### 自定义服务器部署

1. 构建项目：
   ```bash
   npm run build
   ```

2. 将 `dist` 目录上传到服务器

3. 配置 Nginx（示例）：
   ```nginx
   server {
       listen 80;
       listen 443 ssl http2;
       server_name chengex.wisdomier.com;
       
       # 管理后台
       location /admin {
           alias /path/to/admin-panel/dist;
           try_files $uri $uri/ /admin/index.html;
       }
   }
   ```

## API 配置对应关系

确保管理后台的API配置与主网站后端服务器配置一致：

### 后端服务器配置（主网站 .env）
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:5174
CORS_ORIGINS=http://localhost:3000,http://localhost:5174
```

### 前端配置（管理后台 .env）
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5174
```

## 开发指南

### 项目结构

```
src/
├── components/          # 通用组件
├── pages/              # 页面组件
├── contexts/           # React Context
├── hooks/              # 自定义 Hooks
├── utils/              # 工具函数
├── config/             # 配置文件
└── styles/             # 样式文件
```

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码

### 常用命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

## 故障排除

### 常见问题

1. **API 连接失败**
   - 检查 `VITE_API_BASE_URL` 配置
   - 确认后端服务器正在运行
   - 检查 CORS 配置

2. **构建失败**
   - 清除 node_modules 并重新安装
   - 检查 TypeScript 类型错误

3. **环境变量不生效**
   - 确保变量名以 `VITE_` 开头
   - 重启开发服务器

### 调试模式

开发环境下启用调试模式：
```env
VITE_ENABLE_DEBUG=true
VITE_SHOW_DETAILED_ERRORS=true
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题，请联系开发团队或创建 Issue。