// 云数据库连接模块 - 支持多种云数据库服务
import mysql from 'mysql2/promise';

// 云数据库配置
const getCloudConfig = () => {
  // 优先使用环境变量中的云数据库配置
  if (process.env.DATABASE_URL) {
    // 解析 DATABASE_URL
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // 移除开头的 /
      ssl: {
        rejectUnauthorized: false
      },
      charset: 'utf8mb4',
      timezone: '+00:00'
    };
  }

  // 使用分离的环境变量
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'travelweb',
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
    charset: 'utf8mb4',
    timezone: '+00:00'
  };
};

// 创建连接池
let pool;

const createPool = () => {
  if (!pool) {
    const config = getCloudConfig();
    console.log('Creating database pool with config:', {
      host: config.host,
      port: config.port,
      user: config.user,
      database: config.database,
      ssl: !!config.ssl
    });
    
    pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000
    });
  }
  return pool;
};

// 测试数据库连接
export async function testConnection() {
  try {
    const dbPool = createPool();
    const connection = await dbPool.getConnection();
    console.log('✅ 云数据库连接成功');
    
    // 测试查询
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ 云数据库查询测试成功:', rows[0]);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 云数据库连接失败:', error.message);
    return false;
  }
}

// 执行查询
export async function query(sql, params = []) {
  try {
    const dbPool = createPool();
    const [rows, fields] = await dbPool.execute(sql, params);
    
    // 对于 INSERT, UPDATE, DELETE 操作，返回结果对象而不是行数据
    if (sql.trim().toUpperCase().startsWith('INSERT')) {
      return { insertId: rows.insertId, affectedRows: rows.affectedRows };
    } else if (sql.trim().toUpperCase().startsWith('UPDATE') || 
               sql.trim().toUpperCase().startsWith('DELETE')) {
      return { affectedRows: rows.affectedRows };
    }
    
    return rows;
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  }
}

// 事务处理
export async function transaction(callback) {
  const dbPool = createPool();
  const connection = await dbPool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const result = await callback(connection);
    
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// 关闭连接池
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('数据库连接池已关闭');
  }
}

export { createPool as pool };
export default createPool;