// Railway数据库初始化脚本
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Railway数据库连接配置
// 请将这些值替换为Railway控制台中的实际值
const railwayConfig = {
  host: process.env.MYSQLHOST || 'containers-us-west-1.railway.app',
  port: parseInt(process.env.MYSQLPORT) || 6543,
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'your-railway-password',
  database: process.env.MYSQLDATABASE || 'railway',
  ssl: { rejectUnauthorized: false }
};

async function initializeDatabase() {
  let connection;
  
  try {
    console.log('🚀 连接到Railway MySQL数据库...');
    console.log('配置:', {
      host: railwayConfig.host,
      port: railwayConfig.port,
      user: railwayConfig.user,
      database: railwayConfig.database
    });
    
    // 创建连接
    connection = await mysql.createConnection(railwayConfig);
    console.log('✅ 数据库连接成功');
    
    // 读取初始化SQL脚本
    const sqlPath = path.join(__dirname, '..', 'database', 'init-cloud-db.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // 分割SQL语句（按分号分割，忽略空行和注释）
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    console.log(`📝 执行 ${statements.length} 条SQL语句...`);
    
    // 执行每条SQL语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          await connection.execute(statement);
          console.log(`✅ 语句 ${i + 1}/${statements.length} 执行成功`);
        } catch (error) {
          // 忽略表已存在的错误
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
              error.code === 'ER_DUP_ENTRY' ||
              error.message.includes('already exists')) {
            console.log(`⚠️  语句 ${i + 1}/${statements.length} 跳过 (已存在)`);
          } else {
            console.error(`❌ 语句 ${i + 1}/${statements.length} 执行失败:`, error.message);
            console.error('SQL:', statement.substring(0, 100) + '...');
          }
        }
      }
    }
    
    // 验证数据
    console.log('\n🔍 验证数据库初始化结果...');
    
    // 检查表
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 创建的表:', tables.map(row => Object.values(row)[0]));
    
    // 检查分类数据
    const [categories] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    console.log('📂 分类数量:', categories[0].count);
    
    // 检查博客数据
    const [blogs] = await connection.execute('SELECT COUNT(*) as count FROM blogs');
    console.log('📝 博客数量:', blogs[0].count);
    
    // 检查视频数据
    const [videos] = await connection.execute('SELECT COUNT(*) as count FROM videos');
    console.log('🎥 视频数量:', videos[0].count);
    
    console.log('\n🎉 数据库初始化完成！');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行初始化
initializeDatabase