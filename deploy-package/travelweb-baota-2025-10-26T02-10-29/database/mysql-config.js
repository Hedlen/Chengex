// MySQL数据库配置模块
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 获取MySQL连接配置
 */
export function getMySQLConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'travelweb',
    charset: 'utf8mb4',
    timezone: '+08:00',
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
    timeout: parseInt(process.env.DB_TIMEOUT) || 60000,
    reconnect: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false,
    // 连接配置
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: false,
    debug: process.env.NODE_ENV === 'development',
    multipleStatements: false,
    // 连接池配置
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    // 字符集配置
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci'
  };
}

/**
 * 创建MySQL连接池
 */
export function createMySQLPool() {
  const config = getMySQLConfig();
  
  console.log('创建MySQL连接池...');
  console.log(`主机: ${config.host}:${config.port}`);
  console.log(`数据库: ${config.database}`);
  console.log(`用户: ${config.user}`);
  console.log(`连接池大小: ${config.connectionLimit}`);
  
  const pool = mysql.createPool(config);
  
  // 监听连接池事件
  pool.on('connection', (connection) => {
    console.log(`新的MySQL连接建立: ${connection.threadId}`);
  });
  
  pool.on('error', (err) => {
    console.error('MySQL连接池错误:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('MySQL连接丢失，尝试重新连接...');
    }
  });
  
  return pool;
}

/**
 * 测试MySQL连接
 */
export async function testMySQLConnection(pool) {
  try {
    const connection = await pool.getConnection();
    
    // 执行简单查询测试连接
    const [rows] = await connection.execute('SELECT 1 as test');
    
    // 获取服务器信息
    const [serverInfo] = await connection.execute('SELECT VERSION() as version');
    
    connection.release();
    
    console.log('✅ MySQL连接测试成功');
    console.log(`MySQL版本: ${serverInfo[0].version}`);
    console.log(`测试查询结果: ${rows[0].test}`);
    
    return true;
  } catch (error) {
    console.error('❌ MySQL连接测试失败:', error.message);
    return false;
  }
}

/**
 * 创建数据库（如果不存在）
 */
export async function createDatabaseIfNotExists() {
  const config = getMySQLConfig();
  const dbName = config.database;
  
  // 创建不包含数据库名的连接配置
  const connectionConfig = { ...config };
  delete connectionConfig.database;
  
  try {
    const connection = await mysql.createConnection(connectionConfig);
    
    // 检查数据库是否存在
    const [databases] = await connection.execute(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [dbName]
    );
    
    if (databases.length === 0) {
      // 创建数据库
      await connection.execute(
        `CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      console.log(`✅ 数据库 ${dbName} 创建成功`);
    } else {
      console.log(`✅ 数据库 ${dbName} 已存在`);
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.error(`❌ 创建数据库失败: ${error.message}`);
    return false;
  }
}

/**
 * 执行SQL文件
 */
export async function executeSQLFile(pool, filePath) {
  const fs = await import('fs');
  const path = await import('path');
  
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`SQL文件不存在: ${filePath}`);
    }
    
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // 分割SQL语句（简单的分割，可能需要更复杂的解析）
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      for (const statement of statements) {
        if (statement.trim()) {
          await connection.execute(statement);
        }
      }
      
      await connection.commit();
      console.log(`✅ SQL文件执行成功: ${path.basename(filePath)}`);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
    return true;
  } catch (error) {
    console.error(`❌ 执行SQL文件失败: ${error.message}`);
    return false;
  }
}

/**
 * 获取数据库表信息
 */
export async function getDatabaseTables(pool) {
  try {
    const [tables] = await pool.execute(
      'SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME',
      [process.env.DB_NAME || 'travelweb']
    );
    
    return tables.map(table => ({
      name: table.TABLE_NAME,
      rows: table.TABLE_ROWS,
      dataSize: table.DATA_LENGTH,
      indexSize: table.INDEX_LENGTH
    }));
  } catch (error) {
    console.error('获取数据库表信息失败:', error.message);
    return [];
  }
}

/**
 * 检查表是否存在
 */
export async function tableExists(pool, tableName) {
  try {
    const [tables] = await pool.execute(
      'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
      [process.env.DB_NAME || 'travelweb', tableName]
    );
    
    return tables.length > 0;
  } catch (error) {
    console.error(`检查表 ${tableName} 是否存在失败:`, error.message);
    return false;
  }
}

/**
 * 获取表结构
 */
export async function getTableStructure(pool, tableName) {
  try {
    const [columns] = await pool.execute(
      'SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION',
      [process.env.DB_NAME || 'travelweb', tableName]
    );
    
    return columns;
  } catch (error) {
    console.error(`获取表 ${tableName} 结构失败:`, error.message);
    return [];
  }
}

/**
 * 备份数据库
 */
export async function backupDatabase(outputPath) {
  const config = getMySQLConfig();
  const { spawn } = await import('child_process');
  const fs = await import('fs');
  
  return new Promise((resolve, reject) => {
    const mysqldump = spawn('mysqldump', [
      `-h${config.host}`,
      `-P${config.port}`,
      `-u${config.user}`,
      `-p${config.password}`,
      '--single-transaction',
      '--routines',
      '--triggers',
      config.database
    ]);
    
    const writeStream = fs.createWriteStream(outputPath);
    
    mysqldump.stdout.pipe(writeStream);
    
    mysqldump.stderr.on('data', (data) => {
      console.error(`mysqldump错误: ${data}`);
    });
    
    mysqldump.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ 数据库备份成功: ${outputPath}`);
        resolve(true);
      } else {
        reject(new Error(`mysqldump进程退出，代码: ${code}`));
      }
    });
    
    mysqldump.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * 恢复数据库
 */
export async function restoreDatabase(backupPath) {
  const config = getMySQLConfig();
  const { spawn } = await import('child_process');
  const fs = await import('fs');
  
  if (!fs.existsSync(backupPath)) {
    throw new Error(`备份文件不存在: ${backupPath}`);
  }
  
  return new Promise((resolve, reject) => {
    const mysql_restore = spawn('mysql', [
      `-h${config.host}`,
      `-P${config.port}`,
      `-u${config.user}`,
      `-p${config.password}`,
      config.database
    ]);
    
    const readStream = fs.createReadStream(backupPath);
    readStream.pipe(mysql_restore.stdin);
    
    mysql_restore.stderr.on('data', (data) => {
      console.error(`mysql恢复错误: ${data}`);
    });
    
    mysql_restore.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ 数据库恢复成功: ${backupPath}`);
        resolve(true);
      } else {
        reject(new Error(`mysql进程退出，代码: ${code}`));
      }
    });
    
    mysql_restore.on('error', (error) => {
      reject(error);
    });
  });
}

export default {
  getMySQLConfig,
  createMySQLPool,
  testMySQLConnection,
  createDatabaseIfNotExists,
  executeSQLFile,
  getDatabaseTables,
  tableExists,
  getTableStructure,
  backupDatabase,
  restoreDatabase
};