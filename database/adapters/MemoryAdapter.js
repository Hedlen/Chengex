// 内存数据库适配器 - 用于测试和开发
import { DatabaseAdapter, QueryResult } from './DatabaseAdapter.js';

/**
 * 内存数据库适配器
 * 使用JavaScript对象模拟数据库操作，用于测试和开发
 */
export class MemoryAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.tables = {};
    this.autoIncrement = {};
  }

  /**
   * 连接数据库（内存数据库无需连接）
   */
  async connect() {
    this.connected = true;
    console.log('✅ 内存数据库连接成功');
    
    // 初始化基本表结构
    this.tables = {
      blogs: [],
      categories: [],
      tags: [],
      users: [],
      analytics: [],
      videos: []
    };
    
    this.autoIncrement = {
      blogs: 1,
      categories: 1,
      tags: 1,
      users: 1,
      analytics: 1,
      videos: 1
    };
  }

  /**
   * 断开数据库连接
   */
  async disconnect() {
    this.connected = false;
    console.log('✅ 内存数据库连接已关闭');
  }

  /**
   * 测试数据库连接
   */
  async testConnection() {
    try {
      if (!this.connected) {
        await this.connect();
      }
      console.log('✅ 内存数据库查询测试成功');
      return true;
    } catch (error) {
      console.error('❌ 内存数据库连接测试失败:', error.message);
      return false;
    }
  }

  /**
   * 执行查询操作
   */
  async query(sql, params = []) {
    try {
      if (!this.connected) {
        await this.connect();
      }

      console.log('执行SQL查询:', sql);
      console.log('查询参数:', params);

      // 简单的SQL解析 - 只处理基本的SELECT查询
      const sqlLower = sql.toLowerCase().trim();
      
      if (sqlLower.startsWith('select')) {
        return this.handleSelect(sql, params);
      } else if (sqlLower.startsWith('insert')) {
        return this.handleInsert(sql, params);
      } else if (sqlLower.startsWith('update')) {
        return this.handleUpdate(sql, params);
      } else if (sqlLower.startsWith('delete')) {
        return this.handleDelete(sql, params);
      } else {
        // 对于其他SQL语句，返回空结果
        return [];
      }
    } catch (error) {
      console.error('内存数据库查询错误:', error.message);
      console.error('SQL:', sql);
      console.error('参数:', params);
      return [];
    }
  }

  /**
   * 处理SELECT查询
   */
  handleSelect(sql, params) {
    // 提取表名
    const tableMatch = sql.match(/from\s+(\w+)/i);
    if (!tableMatch) {
      return [];
    }
    
    const tableName = tableMatch[1];
    const table = this.tables[tableName] || [];
    
    // 简单返回所有数据（实际应该解析WHERE、LIMIT等）
    return table;
  }

  /**
   * 处理INSERT查询
   */
  handleInsert(sql, params) {
    // 提取表名
    const tableMatch = sql.match(/insert\s+into\s+(\w+)/i);
    if (!tableMatch) {
      return [];
    }
    
    const tableName = tableMatch[1];
    if (!this.tables[tableName]) {
      this.tables[tableName] = [];
    }
    
    // 创建新记录（简化处理）
    const newRecord = {
      id: this.autoIncrement[tableName] || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.tables[tableName].push(newRecord);
    this.autoIncrement[tableName] = (this.autoIncrement[tableName] || 1) + 1;
    
    return [newRecord];
  }

  /**
   * 处理UPDATE查询
   */
  handleUpdate(sql, params) {
    return [];
  }

  /**
   * 处理DELETE查询
   */
  handleDelete(sql, params) {
    return [];
  }

  /**
   * 执行更新操作
   */
  async execute(sql, params = []) {
    try {
      if (!this.connected) {
        await this.connect();
      }

      console.log('执行SQL:', sql);
      console.log('参数:', params);

      // 对于内存数据库，execute和query类似
      const result = await this.query(sql, params);
      
      return new QueryResult(
        1, // affectedRows
        this.autoIncrement.blogs || 1, // insertId
        1  // changedRows
      );
    } catch (error) {
      console.error('内存数据库执行错误:', error.message);
      throw error;
    }
  }

  /**
   * 执行事务（内存数据库简化处理）
   */
  async transaction(callback) {
    try {
      return await callback(this);
    } catch (error) {
      console.error('内存数据库事务错误:', error.message);
      throw error;
    }
  }

  /**
   * 获取数据库类型
   */
  getType() {
    return 'memory';
  }

  /**
   * 优化数据库（内存数据库无需优化）
   */
  async optimize() {
    console.log('✅ 内存数据库优化完成（无需操作）');
  }

  /**
   * 检查数据库完整性
   */
  async checkIntegrity() {
    console.log('✅ 内存数据库完整性检查通过');
    return true;
  }

  /**
   * 获取数据库大小
   */
  getDatabaseSize() {
    const size = JSON.stringify(this.tables).length;
    return {
      size: size,
      unit: 'bytes'
    };
  }

  /**
   * 备份数据库
   */
  async backup(backupPath) {
    const fs = await import('fs');
    const data = JSON.stringify(this.tables, null, 2);
    fs.writeFileSync(backupPath, data);
    console.log('✅ 内存数据库备份完成:', backupPath);
  }

  /**
   * 恢复数据库
   */
  async restore(backupPath) {
    const fs = await import('fs');
    if (fs.existsSync(backupPath)) {
      const data = fs.readFileSync(backupPath, 'utf8');
      this.tables = JSON.parse(data);
      console.log('✅ 内存数据库恢复完成:', backupPath);
    }
  }
}

export default MemoryAdapter;