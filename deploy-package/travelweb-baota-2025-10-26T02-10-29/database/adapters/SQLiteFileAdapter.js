// SQLite文件数据库适配器
import { DatabaseAdapter, QueryResult } from './DatabaseAdapter.js';
import fs from 'fs';
import path from 'path';

/**
 * SQLite文件数据库适配器
 * 使用better-sqlite3驱动实现真实的SQLite文件操作
 */
export class SQLiteFileAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.dbPath = config.path || './database.db';
    this.db = null;
  }

  /**
   * 连接SQLite数据库
   */
  async connect() {
    try {
      // 动态导入better-sqlite3
      const Database = await import('better-sqlite3');
      
      // 确保数据库目录存在
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // 创建数据库连接
      this.db = new Database.default(this.dbPath);
      
      // 设置SQLite优化选项
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000000');
      this.db.pragma('temp_store = memory');
      
      console.log(`✅ SQLite文件数据库连接成功: ${this.dbPath}`);
      this.connected = true;
    } catch (error) {
      console.error('❌ SQLite数据库连接失败:', error.message);
      throw error;
    }
  }

  /**
   * 断开数据库连接
   */
  async disconnect() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('✅ SQLite数据库连接已关闭');
    }
    this.connected = false;
  }

  /**
   * 测试数据库连接
   */
  async testConnection() {
    try {
      if (this.db) {
        this.db.prepare('SELECT 1').get();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * 执行查询
   * @param {string} sql - SQL语句
   * @param {Array} params - 参数数组
   * @returns {Promise<Array>} 查询结果
   */
  async query(sql, params = []) {
    if (!this.connected || !this.db) {
      throw new Error('数据库未连接');
    }

    try {
      const stmt = this.db.prepare(sql);
      
      if (sql.trim().toLowerCase().startsWith('select')) {
        // SELECT查询
        if (params.length > 0) {
          return stmt.all(...params);
        } else {
          return stmt.all();
        }
      } else {
        // INSERT, UPDATE, DELETE
        if (params.length > 0) {
          return stmt.run(...params);
        } else {
          return stmt.run();
        }
      }
    } catch (error) {
      console.error('SQL执行错误:', error.message);
      console.error('SQL语句:', sql);
      console.error('参数:', params);
      throw error;
    }
  }

  /**
   * 执行SQL语句（INSERT, UPDATE, DELETE）
   * @param {string} sql - SQL语句
   * @param {Array} params - 参数数组
   * @returns {Promise<Object>} 执行结果
   */
  async execute(sql, params = []) {
    if (!this.connected || !this.db) {
      throw new Error('数据库未连接');
    }

    try {
      const stmt = this.db.prepare(sql);
      
      if (params.length > 0) {
        return stmt.run(...params);
      } else {
        return stmt.run();
      }
    } catch (error) {
      console.error('SQL执行错误:', error.message);
      console.error('SQL语句:', sql);
      console.error('参数:', params);
      throw error;
    }
  }

  /**
   * 执行事务
   * @param {Function} callback - 事务回调函数
   * @returns {Promise<any>} 事务结果
   */
  async transaction(callback) {
    if (!this.connected || !this.db) {
      throw new Error('数据库未连接');
    }

    const transaction = this.db.transaction(() => {
      return callback(this);
    });

    try {
      return transaction();
    } catch (error) {
      console.error('事务执行失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取数据库类型
   * @returns {string} 数据库类型
   */
  getType() {
    return 'sqlite';
  }

  /**
   * 优化数据库
   */
  async optimize() {
    if (this.db) {
      this.db.pragma('optimize');
      console.log('✅ SQLite数据库优化完成');
    }
  }

  /**
   * 检查数据库完整性
   */
  async checkIntegrity() {
    if (this.db) {
      const result = this.db.pragma('integrity_check');
      return result[0].integrity_check === 'ok';
    }
    return false;
  }

  /**
   * 获取数据库大小
   */
  getDatabaseSize() {
    if (fs.existsSync(this.dbPath)) {
      const stats = fs.statSync(this.dbPath);
      return stats.size;
    }
    return 0;
  }

  /**
   * 备份数据库
   * @param {string} backupPath - 备份路径
   */
  async backup(backupPath) {
    if (fs.existsSync(this.dbPath)) {
      fs.copyFileSync(this.dbPath, backupPath);
      console.log(`✅ 数据库备份完成: ${backupPath}`);
    }
  }

  /**
   * 恢复数据库
   * @param {string} backupPath - 备份路径
   */
  async restore(backupPath) {
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, this.dbPath);
      console.log(`✅ 数据库恢复完成: ${this.dbPath}`);
    }
  }
}

export default SQLiteFileAdapter;