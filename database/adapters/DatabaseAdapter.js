// 数据库适配器接口
// 定义统一的数据库操作接口，支持多种数据库类型

/**
 * 数据库适配器基类
 * 提供统一的数据库操作接口
 */
export class DatabaseAdapter {
  constructor(config) {
    this.config = config;
    this.connected = false;
  }

  /**
   * 初始化数据库适配器
   * @returns {Promise<void>}
   */
  async init() {
    // 默认实现：调用连接方法
    await this.connect();
  }

  /**
   * 连接数据库
   * @returns {Promise<void>}
   */
  async connect() {
    throw new Error('connect() method must be implemented');
  }

  /**
   * 断开数据库连接
   * @returns {Promise<void>}
   */
  async disconnect() {
    throw new Error('disconnect() method must be implemented');
  }

  /**
   * 测试数据库连接
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    throw new Error('testConnection() method must be implemented');
  }

  /**
   * 执行查询
   * @param {string} sql - SQL查询语句
   * @param {Array} params - 查询参数
   * @returns {Promise<Array>} 查询结果
   */
  async query(sql, params = []) {
    throw new Error('query() method must be implemented');
  }

  /**
   * 执行更新操作（INSERT, UPDATE, DELETE）
   * @param {string} sql - SQL语句
   * @param {Array} params - 参数
   * @returns {Promise<QueryResult>} 执行结果
   */
  async execute(sql, params = []) {
    throw new Error('execute() method must be implemented');
  }

  /**
   * 执行事务
   * @param {Function} callback - 事务回调函数
   * @returns {Promise<any>} 事务结果
   */
  async transaction(callback) {
    throw new Error('transaction() method must be implemented');
  }

  /**
   * 获取数据库类型
   * @returns {string} 数据库类型
   */
  getType() {
    throw new Error('getType() method must be implemented');
  }

  /**
   * 获取连接状态
   * @returns {boolean} 连接状态
   */
  isConnected() {
    return this.connected;
  }

  /**
   * 优化数据库
   * @returns {Promise<void>}
   */
  async optimize() {
    // 默认实现为空，子类可以重写
  }

  /**
   * 检查数据库完整性
   * @returns {Promise<boolean>}
   */
  async checkIntegrity() {
    // 默认返回true，子类可以重写
    return true;
  }
}

/**
 * 查询结果接口
 */
export class QueryResult {
  constructor(affectedRows = 0, insertId = null, changes = 0) {
    this.affectedRows = affectedRows;
    this.insertId = insertId;
    this.changes = changes;
  }
}

export default DatabaseAdapter;