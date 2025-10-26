/**
 * 数据库服务抽象层
 * 支持MySQL和文件存储（作为SQLite的替代方案）
 */

import mysql from 'mysql2/promise';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

/**
 * 文件存储数据库（SQLite替代方案）
 */
class FileDatabase {
  constructor(filePath) {
    this.filePath = filePath;
    this.dataDir = dirname(filePath);
    this.data = {};
    this.indexes = {};
    
    // 确保数据目录存在
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
    
    this.loadData();
  }
  
  loadData() {
    try {
      if (existsSync(this.filePath)) {
        const content = readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(content);
        this.data = parsed.data || {};
        this.indexes = parsed.indexes || {};
      }
    } catch (error) {
      console.warn('加载数据文件失败，使用空数据库:', error.message);
      this.data = {};
      this.indexes = {};
    }
  }
  
  saveData() {
    try {
      const content = JSON.stringify({
        data: this.data,
        indexes: this.indexes,
        lastModified: new Date().toISOString()
      }, null, 2);
      writeFileSync(this.filePath, content, 'utf8');
    } catch (error) {
      console.error('保存数据文件失败:', error.message);
      throw error;
    }
  }
  
  // 创建表
  createTable(tableName, schema) {
    if (!this.data[tableName]) {
      this.data[tableName] = [];
      this.indexes[tableName] = { nextId: 1 };
    }
    this.saveData();
  }
  
  // 插入数据
  insert(tableName, data) {
    if (!this.data[tableName]) {
      this.createTable(tableName);
    }
    
    const record = { ...data };
    if (!record.id) {
      record.id = this.indexes[tableName].nextId++;
    }
    record.created_at = record.created_at || new Date().toISOString();
    record.updated_at = new Date().toISOString();
    
    this.data[tableName].push(record);
    this.saveData();
    return record;
  }
  
  // 查询数据
  select(tableName, conditions = {}, options = {}) {
    if (!this.data[tableName]) {
      return [];
    }
    
    let results = [...this.data[tableName]];
    
    // 应用条件过滤
    if (Object.keys(conditions).length > 0) {
      results = results.filter(record => {
        return Object.entries(conditions).every(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            // 支持操作符
            if (value.$like) {
              return record[key] && record[key].toLowerCase().includes(value.$like.toLowerCase());
            }
            if (value.$gt) {
              return record[key] > value.$gt;
            }
            if (value.$lt) {
              return record[key] < value.$lt;
            }
            if (value.$in) {
              return value.$in.includes(record[key]);
            }
          }
          return record[key] === value;
        });
      });
    }
    
    // 排序
    if (options.orderBy) {
      const [field, direction = 'ASC'] = options.orderBy.split(' ');
      results.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return direction.toUpperCase() === 'DESC' ? -comparison : comparison;
      });
    }
    
    // 分页
    if (options.limit) {
      const offset = options.offset || 0;
      results = results.slice(offset, offset + options.limit);
    }
    
    return results;
  }
  
  // 更新数据
  update(tableName, conditions, updates) {
    if (!this.data[tableName]) {
      return 0;
    }
    
    let updatedCount = 0;
    this.data[tableName] = this.data[tableName].map(record => {
      const matches = Object.entries(conditions).every(([key, value]) => record[key] === value);
      if (matches) {
        updatedCount++;
        return { ...record, ...updates, updated_at: new Date().toISOString() };
      }
      return record;
    });
    
    if (updatedCount > 0) {
      this.saveData();
    }
    return updatedCount;
  }
  
  // 删除数据
  delete(tableName, conditions) {
    if (!this.data[tableName]) {
      return 0;
    }
    
    const originalLength = this.data[tableName].length;
    this.data[tableName] = this.data[tableName].filter(record => {
      return !Object.entries(conditions).every(([key, value]) => record[key] === value);
    });
    
    const deletedCount = originalLength - this.data[tableName].length;
    if (deletedCount > 0) {
      this.saveData();
    }
    return deletedCount;
  }
  
  // 计数
  count(tableName, conditions = {}) {
    return this.select(tableName, conditions).length;
  }
  
  // 执行原始查询（有限支持）
  exec(sql) {
    console.warn('文件数据库不支持原始SQL查询:', sql);
    return [];
  }
  
  close() {
    this.saveData();
  }
}

/**
 * 数据库服务类
 */
class DatabaseService {
  constructor() {
    this.connection = null;
    this.dbType = null;
    this.isConnected = false;
  }
  
  /**
   * 连接数据库
   */
  async connect(config) {
    try {
      if (config.type === 'mysql') {
        this.connection = await mysql.createConnection({
          host: config.host,
          user: config.user,
          password: config.password,
          database: config.database,
          port: config.port || 3306
        });
        this.dbType = 'mysql';
      } else if (config.type === 'file') {
        this.connection = new FileDatabase(config.filePath || './data/travelweb.json');
        this.dbType = 'file';
      } else {
        throw new Error(`不支持的数据库类型: ${config.type}`);
      }
      
      this.isConnected = true;
      console.log(`✅ ${this.dbType.toUpperCase()} 数据库连接成功`);
      return true;
    } catch (error) {
      console.error('❌ 数据库连接失败:', error.message);
      this.isConnected = false;
      throw error;
    }
  }
  
  /**
   * 执行查询
   */
  async query(sql, params = []) {
    if (!this.isConnected) {
      throw new Error('数据库未连接');
    }
    
    try {
      if (this.dbType === 'mysql') {
        const [rows] = await this.connection.execute(sql, params);
        return rows;
      } else if (this.dbType === 'file') {
        // 简单的SQL解析（仅支持基本操作）
        return this.parseAndExecuteSQL(sql, params);
      }
    } catch (error) {
      console.error('查询执行失败:', error.message);
      throw error;
    }
  }
  
  /**
   * 执行SQL语句（INSERT, UPDATE, DELETE）
   */
  async execute(sql, params = []) {
    if (!this.isConnected) {
      throw new Error('数据库未连接');
    }
    
    try {
      if (this.dbType === 'mysql') {
        const [result] = await this.connection.execute(sql, params);
        return result;
      } else if (this.dbType === 'file') {
        // 简单的SQL解析（仅支持基本操作）
        return this.parseAndExecuteSQL(sql, params);
      }
    } catch (error) {
      console.error('SQL执行失败:', error.message);
      throw error;
    }
  }

  /**
   * 简单的SQL解析器（用于文件数据库）
   */
  parseAndExecuteSQL(sql, params = []) {
    const sqlUpper = sql.trim().toUpperCase();
    
    if (sqlUpper.startsWith('SELECT')) {
      return this.parseSelect(sql, params);
    } else if (sqlUpper.startsWith('INSERT')) {
      return this.parseInsert(sql, params);
    } else if (sqlUpper.startsWith('UPDATE')) {
      return this.parseUpdate(sql, params);
    } else if (sqlUpper.startsWith('DELETE')) {
      return this.parseDelete(sql, params);
    } else {
      console.warn('不支持的SQL语句:', sql);
      return [];
    }
  }
  
  parseSelect(sql, params) {
    // 简单的SELECT解析
    const match = sql.match(/FROM\s+(\w+)/i);
    if (!match) return [];
    
    const tableName = match[1];
    const conditions = {};
    
    // 解析WHERE条件
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1];
      // 简单的条件解析
      const conditionMatch = whereClause.match(/(\w+)\s*=\s*\?/);
      if (conditionMatch && params.length > 0) {
        const fieldName = conditionMatch[1];
        let value = params[0];
        
        // 对于ID字段，尝试转换为数字
        if (fieldName === 'id' || fieldName.endsWith('_id')) {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            value = numValue;
          }
        }
        
        conditions[fieldName] = value;
      }
    }
    
    // 解析ORDER BY
    const options = {};
    const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
    if (orderMatch) {
      options.orderBy = `${orderMatch[1]} ${orderMatch[2] || 'ASC'}`;
    }
    
    // 解析LIMIT
    const limitMatch = sql.match(/LIMIT\s+(\d+)(?:\s+OFFSET\s+(\d+))?/i);
    if (limitMatch) {
      options.limit = parseInt(limitMatch[1]);
      if (limitMatch[2]) {
        options.offset = parseInt(limitMatch[2]);
      }
    }
    
    return this.connection.select(tableName, conditions, options);
  }
  
  parseInsert(sql, params) {
    const match = sql.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (!match) return { insertId: 0, affectedRows: 0 };
    
    const tableName = match[1];
    const columns = match[2].split(',').map(col => col.trim());
    const values = match[3].split(',').map(val => val.trim());
    
    const data = {};
    columns.forEach((col, index) => {
      if (values[index] === '?') {
        data[col] = params[index] || null;
      } else if (values[index]) {
        data[col] = values[index].replace(/'/g, '');
      } else {
        data[col] = null;
      }
    });
    
    const result = this.connection.insert(tableName, data);
    return { insertId: result.id, affectedRows: 1 };
  }
  
  parseUpdate(sql, params) {
    const match = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i);
    if (!match) return { affectedRows: 0 };
    
    const tableName = match[1];
    const setClause = match[2];
    const whereClause = match[3];
    
    // 解析SET子句
    const updates = {};
    const setMatch = setClause.match(/(\w+)\s*=\s*\?/);
    if (setMatch && params.length > 0) {
      const fieldName = setMatch[1];
      let value = params[0];
      
      // 对于ID字段，尝试转换为数字
      if (fieldName === 'id' || fieldName.endsWith('_id')) {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          value = numValue;
        }
      }
      
      updates[fieldName] = value;
    }
    
    // 解析WHERE子句
    const conditions = {};
    const whereMatch = whereClause.match(/(\w+)\s*=\s*\?/);
    if (whereMatch && params.length > 1) {
      const fieldName = whereMatch[1];
      let value = params[1];
      
      // 对于ID字段，尝试转换为数字
      if (fieldName === 'id' || fieldName.endsWith('_id')) {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          value = numValue;
        }
      }
      
      conditions[fieldName] = value;
    }
    
    const affectedRows = this.connection.update(tableName, conditions, updates);
    return { affectedRows };
  }
  
  parseDelete(sql, params) {
    const match = sql.match(/DELETE\s+FROM\s+(\w+)\s+WHERE\s+(.+)/i);
    if (!match) return { affectedRows: 0 };
    
    const tableName = match[1];
    const whereClause = match[2];
    
    const conditions = {};
    const whereMatch = whereClause.match(/(\w+)\s*=\s*\?/);
    if (whereMatch && params.length > 0) {
      const fieldName = whereMatch[1];
      let value = params[0];
      
      // 对于ID字段，尝试转换为数字
      if (fieldName === 'id' || fieldName.endsWith('_id')) {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          value = numValue;
        }
      }
      
      conditions[fieldName] = value;
    }
    
    const affectedRows = this.connection.delete(tableName, conditions);
    return { affectedRows };
  }
  
  /**
   * 开始事务
   */
  async beginTransaction() {
    if (this.dbType === 'mysql') {
      await this.connection.beginTransaction();
    }
    // 文件数据库不支持事务
  }
  
  /**
   * 提交事务
   */
  async commit() {
    if (this.dbType === 'mysql') {
      await this.connection.commit();
    }
  }
  
  /**
   * 回滚事务
   */
  async rollback() {
    if (this.dbType === 'mysql') {
      await this.connection.rollback();
    }
  }
  
  /**
   * 关闭连接
   */
  async close() {
    if (this.connection) {
      if (this.dbType === 'mysql') {
        await this.connection.end();
      } else if (this.dbType === 'file') {
        this.connection.close();
      }
      this.connection = null;
      this.isConnected = false;
    }
  }
  
  /**
   * 获取数据库状态
   */
  getStatus() {
    return {
      connected: this.isConnected,
      type: this.dbType,
      timestamp: new Date().toISOString()
    };
  }
}

// 创建全局实例
const db = new DatabaseService();

export default db;
export { DatabaseService, FileDatabase };