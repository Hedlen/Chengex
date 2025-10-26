// 数据库连接模块 - 使用新的数据库抽象层
import db from './DatabaseService.js';
import { join } from 'path';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 初始化数据库服务
let isInitialized = false;

/**
 * 获取数据库配置
 */
function getDatabaseConfig() {
  return {
    type: process.env.DB_TYPE || 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'travelweb'
  };
}

/**
 * 初始化数据库连接
 */
async function initializeDatabase() {
  if (isInitialized) {
    return true;
  }

  try {
    const config = getDatabaseConfig();
    
    // 根据配置连接数据库
    try {
      if (config.type === 'mysql') {
        await db.connect(config);
      } else if (config.type === 'sqlite') {
        console.log('使用SQLite数据库');
        const sqliteConfig = {
          type: 'sqlite',
          filename: join(process.cwd(), 'database', 'travelweb.db')
        };
        await db.connect(sqliteConfig);
      } else {
        throw new Error('非MySQL配置，使用文件存储');
      }
    } catch (mysqlError) {
      console.warn('MySQL连接失败，切换到文件存储:', mysqlError.message);
      const fileConfig = {
        type: 'file',
        filePath: join(process.cwd(), 'data', 'travelweb.json')
      };
      await db.connect(fileConfig);
    }
    
    isInitialized = true;
    console.log('✅ 数据库连接初始化成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接初始化失败:', error.message);
    isInitialized = false;
    return false;
  }
}

// 确保数据库已初始化的辅助函数
async function ensureInitialized() {
  if (!isInitialized) {
    await initializeDatabase();
  }
}

// 测试数据库连接
export async function testConnection() {
  try {
    await ensureInitialized();
    const result = await db.testConnection();
    
    if (result) {
      console.log('✅ 数据库连接测试成功');
      console.log(`当前数据库类型: ${db.getType()}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    return false;
  }
}

// 执行查询 - 兼容原有接口
export async function query(sql, params = []) {
  try {
    await ensureInitialized();
    
    // 判断是否为更新操作
    const isUpdateOperation = /^\s*(INSERT|UPDATE|DELETE)/i.test(sql.trim());
    
    if (isUpdateOperation) {
      // 对于更新操作，返回执行结果
      const result = await db.execute(sql, params);
      
      // 为了兼容原有代码，返回类似MySQL的结果格式
      return {
        affectedRows: result.affectedRows,
        insertId: result.insertId,
        changedRows: result.changes
      };
    } else {
      // 对于查询操作，返回数据行
      return await db.query(sql, params);
    }
  } catch (error) {
    console.error('数据库查询错误:', error.message);
    console.error('SQL:', sql);
    console.error('参数:', params);
    throw error;
  }
}

// 执行事务 - 兼容原有接口
export async function transaction(callback) {
  try {
    await ensureInitialized();
    
    return await db.transaction(async (adapter) => {
      // 创建兼容的连接对象
      const connection = {
        execute: async (sql, params) => {
          const isUpdateOperation = /^\s*(INSERT|UPDATE|DELETE)/i.test(sql.trim());
          
          if (isUpdateOperation) {
            const result = await adapter.execute(sql, params);
            return [{
              affectedRows: result.affectedRows,
              insertId: result.insertId,
              changedRows: result.changes
            }];
          } else {
            return [await adapter.query(sql, params)];
          }
        }
      };
      
      return await callback(connection);
    });
  } catch (error) {
    console.error('事务执行失败:', error.message);
    throw error;
  }
}

// 关闭数据库连接
export async function closePool() {
  try {
    if (isInitialized) {
      await db.close();
      isInitialized = false;
      console.log('数据库连接已关闭');
    }
  } catch (error) {
    console.error('关闭数据库连接时出错:', error.message);
  }
}

// 获取数据库服务实例
export function getDatabaseService() {
  return db;
}

// 获取数据库状态
export function getDatabaseStatus() {
  return db.getStatus();
}

// 切换数据库
export async function switchDatabase(config) {
  try {
    await db.close();
    await db.connect(config);
    console.log(`✅ 数据库已切换到: ${config.type}`);
  } catch (error) {
    console.error('❌ 数据库切换失败:', error.message);
    throw error;
  }
}

// 为了向后兼容，导出一个模拟的pool对象
export const pool = {
  execute: async (sql, params) => {
    const result = await query(sql, params);
    return [result];
  },
  getConnection: async () => {
    await ensureInitialized();
    return {
      execute: async (sql, params) => {
        const result = await query(sql, params);
        return [result];
      },
      release: () => {},
      beginTransaction: () => {},
      commit: () => {},
      rollback: () => {}
    };
  },
  end: closePool
};

// 导出初始化函数
export { initializeDatabase };

// 自动初始化数据库（延迟初始化）
// 这样可以确保在第一次使用时才初始化数据库
export default {
  initializeDatabase,
  testConnection,
  query,
  transaction,
  closePool,
  getDatabaseService,
  getDatabaseStatus,
  switchDatabase,
  pool
};