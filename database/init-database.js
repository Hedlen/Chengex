// 数据库初始化脚本
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbManager } from './DatabaseFactory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库初始化标志
let dbInitialized = false;

// 确保数据库管理器已初始化
async function ensureDbInitialized() {
  if (!dbInitialized) {
    await dbManager.initialize();
    dbInitialized = true;
  }
}

// 获取数据库适配器
async function getDb() {
  await ensureDbInitialized();
  return dbManager.getAdapter();
}

// 兼容性查询函数
async function query(sql, params = []) {
  const db = await getDb();
  return await db.query(sql, params);
}

// 兼容性测试连接函数
async function testConnection() {
  try {
    const db = await getDb();
    return await db.testConnection();
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    return false;
  }
}

/**
 * 执行SQL文件
 */
async function executeSQLFile(filePath) {
  try {
    console.log(`正在执行SQL文件: ${filePath}`);
    
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // 更智能的SQL语句分割
    // 移除注释行和空行
    const lines = sqlContent.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('--'));
    
    const cleanedSQL = lines.join('\n');
    
    // 按分号分割，但要考虑多行语句
    const statements = [];
    let currentStatement = '';
    
    for (const line of lines) {
      currentStatement += line + '\n';
      
      // 如果行以分号结尾，则认为是一个完整的语句
      if (line.endsWith(';')) {
        const stmt = currentStatement.trim();
        if (stmt.length > 0) {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }
    
    // 处理最后一个语句（如果没有分号结尾）
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }
    
    console.log(`找到 ${statements.length} 条SQL语句`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await query(statement);
          const preview = statement.replace(/\s+/g, ' ').substring(0, 80);
          console.log(`✅ 执行成功 (${i + 1}/${statements.length}): ${preview}...`);
        } catch (error) {
          console.error(`❌ 执行失败 (${i + 1}/${statements.length}):`, error.message);
          console.error(`SQL: ${statement}`);
          throw error;
        }
      }
    }
    
    console.log(`✅ SQL文件执行完成: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ 执行SQL文件失败: ${filePath}`, error);
    throw error;
  }
}

/**
 * 检查表是否存在
 */
async function checkTableExists(tableName) {
  try {
    const result = await query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = ?
    `, [tableName]);
    
    return result[0].count > 0;
  } catch (error) {
    console.error(`检查表 ${tableName} 是否存在时出错:`, error);
    return false;
  }
}

/**
 * 获取表的记录数
 */
async function getTableCount(tableName) {
  try {
    const result = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return result[0].count;
  } catch (error) {
    console.error(`获取表 ${tableName} 记录数时出错:`, error);
    return 0;
  }
}

/**
 * 验证数据库结构
 */
async function validateDatabaseStructure() {
  console.log('\n🔍 验证数据库结构...');
  
  const expectedTables = [
    'users',
    'categories', 
    'blogs',
    'videos',
    'comments',
    'user_interactions',
    'page_views',
    'blog_views',
    'video_plays',
    'external_video_clicks',
    'external_video_returns',
    'system_config',
    'activity_logs',
    'cache_management',
    'user_preferences'
  ];
  
  const results = [];
  
  for (const tableName of expectedTables) {
    const exists = await checkTableExists(tableName);
    const count = exists ? await getTableCount(tableName) : 0;
    
    results.push({
      table: tableName,
      exists,
      count
    });
    
    if (exists) {
      console.log(`✅ ${tableName}: 存在，记录数: ${count}`);
    } else {
      console.log(`❌ ${tableName}: 不存在`);
    }
  }
  
  const missingTables = results.filter(r => !r.exists);
  
  if (missingTables.length === 0) {
    console.log('\n✅ 所有数据表都已正确创建！');
    return true;
  } else {
    console.log(`\n❌ 缺少 ${missingTables.length} 个数据表:`, missingTables.map(t => t.table));
    return false;
  }
}

/**
 * 主初始化函数
 */
async function initializeDatabase() {
  console.log('🚀 开始初始化数据库...\n');
  
  try {
    // 1. 测试数据库连接
    console.log('1️⃣ 测试数据库连接...');
    const connectionOk = await testConnection();
    if (!connectionOk) {
      throw new Error('数据库连接失败，请检查配置');
    }
    
    // 2. 执行表结构创建脚本
    console.log('\n2️⃣ 创建数据库表结构...');
    const sqlFilePath = path.join(__dirname, 'init-tables.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL文件不存在: ${sqlFilePath}`);
    }
    
    await executeSQLFile(sqlFilePath);
    
    // 3. 验证数据库结构
    console.log('\n3️⃣ 验证数据库结构...');
    const structureValid = await validateDatabaseStructure();
    
    if (!structureValid) {
      throw new Error('数据库结构验证失败');
    }
    
    console.log('\n🎉 数据库初始化完成！');
    console.log('\n📊 数据库统计信息:');
    
    // 显示统计信息
    const stats = await query(`
      SELECT 
        table_name as 'Table',
        table_rows as 'Rows',
        ROUND(((data_length + index_length) / 1024 / 1024), 2) as 'Size_MB'
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      ORDER BY table_name
    `);
    
    console.table(stats);
    
    return true;
    
  } catch (error) {
    console.error('\n❌ 数据库初始化失败:', error.message);
    console.error('错误详情:', error);
    return false;
  }
}

/**
 * 重置数据库（危险操作）
 */
async function resetDatabase() {
  console.log('⚠️  警告：即将重置数据库，所有数据将被删除！');
  
  try {
    // 禁用外键检查
    await query('SET FOREIGN_KEY_CHECKS = 0');
    
    // 获取所有表
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);
    
    // 删除所有表
    for (const table of tables) {
      await query(`DROP TABLE IF EXISTS ${table.table_name}`);
      console.log(`🗑️  删除表: ${table.table_name}`);
    }
    
    // 重新启用外键检查
    await query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ 数据库重置完成');
    
    // 重新初始化
    return await initializeDatabase();
    
  } catch (error) {
    console.error('❌ 数据库重置失败:', error);
    return false;
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0];

if (command === 'reset') {
  resetDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
} else {
  initializeDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { initializeDatabase, resetDatabase, validateDatabaseStructure };