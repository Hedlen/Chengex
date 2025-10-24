// 环境变量设置助手脚本
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 提示用户输入Railway数据库信息
console.log('🚀 Railway MySQL数据库环境变量设置助手');
console.log('');
console.log('请从Railway控制台的Connect标签页复制以下信息：');
console.log('');

// 读取当前的.env.production文件
const envPath = path.join(__dirname, '..', '.env.production');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.log('创建新的.env.production文件...');
}

// 生成新的环境变量模板
const newEnvContent = `# 生产环境配置
# 生产环境配置

# Railway MySQL数据库连接
# 请将以下变量替换为Railway提供的实际值
DATABASE_URL=mysql://root:RAILWAY_PASSWORD@RAILWAY_HOST:RAILWAY_PORT/railway?ssl-mode=REQUIRED

# Railway环境变量 (从Railway控制台获取)
DB_HOST=RAILWAY_HOST
DB_PORT=RAILWAY_PORT
DB_NAME=railway
DB_USER=root
DB_PASSWORD=RAILWAY_PASSWORD

# 或者使用Railway提供的MYSQL_URL
MYSQL_URL=mysql://root:RAILWAY_PASSWORD@RAILWAY_HOST:RAILWAY_PORT/railway

# 应用配置
NODE_ENV=production
PORT=3000

# CORS配置
ALLOWED_ORIGINS=http://localhost:3000

# 替换说明：
# RAILWAY_HOST - 替换为Railway提供的MYSQLHOST值
# RAILWAY_PORT - 替换为Railway提供的MYSQLPORT值  
# RAILWAY_PASSWORD - 替换为Railway提供的MYSQLPASSWORD值
`;

// 写入文件
fs.writeFileSync(envPath, newEnvContent);

console.log('✅ 已更新 .env.production 文件');
console.log('');
console.log('📋 接下来的步骤：');
console.log('1. 从Railway控制台复制数据库连接信息');
console.log('2. 替换.env.production文件中的占位符：');
console.log('   - RAILWAY_HOST');
console.log('   - RAILWAY_PORT'); 
console.log('   - RAILWAY_PASSWORD');
console.log('3. 运行数据库初始化脚本');
console.log('');
console.log('🔗 有用的链接：');
console.log('- Railway控制台: https://railway.app/dashboard');
console.log('');