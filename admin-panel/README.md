# TravelWeb 管理后台

TravelWeb 旅游网站的后台管理系统，基于 React + TypeScript + Vite 构建的现代化管理平台。

## ✨ 功能特性

- 🎯 **博客管理**：创建、编辑、删除博客文章，支持 Markdown 编辑
- 📊 **数据统计**：网站访问量、用户行为分析、实时数据监控
- 🖼️ **媒体管理**：图片上传、管理和优化
- 👥 **用户管理**：用户信息查看和权限管理
- 🎨 **现代化UI**：基于 Tailwind CSS 的响应式设计
- 🔐 **安全认证**：JWT 身份验证和权限控制

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **状态管理**: Redux Toolkit
- **路由**: React Router
- **样式**: Tailwind CSS
- **图表**: Recharts
- **编辑器**: React MD Editor
- **HTTP客户端**: Fetch API

## 📋 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0

## 🚀 快速开始

### 1. 安装依赖

```bash
# Windows PowerShell / Mac Terminal / Linux Terminal
npm install
```

### 2. 环境配置

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Mac/Linux Terminal
cp .env.example .env
```

**编辑 `.env` 文件：**
```env
# 开发环境配置
VITE_NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3002
VITE_ALLOWED_ORIGINS=http://localhost:5174
VITE_ENABLE_DEV_TOOLS=true
VITE_ENABLE_DEBUG=true
```

### 3. 启动开发服务器

```bash
npm run dev
```

**🌐 访问地址：**
- **管理后台**: http://localhost:5174

### 4. 构建生产版本

```bash
npm run build
```

构建文件将生成在 `dist` 目录中。

## 🔧 开发指南

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

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码

## 🖥️ 部署说明

### 环境变量配置

**生产环境配置：**
```env
VITE_NODE_ENV=production
VITE_API_BASE_URL=https://your-domain.com/api
VITE_ALLOWED_ORIGINS=https://your-domain.com
VITE_ENABLE_DEV_TOOLS=false
VITE_ENABLE_DEBUG=false
```

### 构建部署

1. **构建项目**：
   ```bash
   npm run build
   ```

2. **部署静态文件**：
   将 `dist` 目录上传到服务器

3. **Nginx 配置示例**：
   ```nginx
   # 管理后台
   location /admin {
       alias /path/to/admin-panel/dist;
       try_files $uri $uri/ /admin/index.html;
   }
   ```

## 🔗 API 配置

确保管理后台的API配置与主项目后端服务器配置一致：

**后端服务器配置（主项目 .env）：**
```env
PORT=3002
CORS_ORIGINS=http://localhost:3000,http://localhost:5174
```

**管理后台配置（.env）：**
```env
VITE_API_BASE_URL=http://localhost:3002
VITE_ALLOWED_ORIGINS=http://localhost:5174
```

## 🛠️ 常见问题

### API 连接失败
- 检查 `VITE_API_BASE_URL` 配置
- 确认后端服务器正在运行
- 检查 CORS 配置

### 构建失败
- 清除 node_modules 并重新安装
- 检查 TypeScript 类型错误

### 环境变量不生效
- 确保变量名以 `VITE_` 开头
- 重启开发服务器

## 📄 License

MIT License

## 🙏 致谢

感谢所有为项目做出贡献的开发者和开源社区的支持。