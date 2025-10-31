// MySQL数据库适配器
import mysql from 'mysql2/promise';
import { DatabaseAdapter, QueryResult } from './DatabaseAdapter.js';

/**
 * MySQL数据库适配器
 * 使用mysql2驱动实现MySQL数据库操作
 */
export class MySQLAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.pool = null;
    this.connection = null;
    // 🚀 性能优化：添加查询缓存
    this.queryCache = new Map();
    this.cacheMaxSize = 100; // 最大缓存100个查询
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存过期
  }

  /**
   * 连接MySQL数据库
   */
  async connect() {
    try {
      // 创建优化的连接池 - 针对宝塔环境优化
      this.pool = mysql.createPool({
        host: this.config.host || 'localhost',
        port: this.config.port || 3306,
        user: this.config.user || 'root',
        password: this.config.password || '',
        database: this.config.database,
        waitForConnections: true,
        // 🚀 性能优化：增加连接池大小，适合宝塔环境
        connectionLimit: this.config.connectionLimit || 20,
        queueLimit: 0,
        // 🚀 性能优化：大幅减少超时时间，提升响应速度
        acquireTimeout: 10000,  // 从60秒减少到10秒
        timeout: 30000,         // 从60秒减少到30秒
        reconnect: true,
        charset: 'utf8mb4',
        collation: 'utf8mb4_unicode_ci',
        timezone: '+08:00',
        supportBigNumbers: true,
        bigNumberStrings: true,
        dateStrings: false,
        multipleStatements: false,
        // 🚀 性能优化：在连接初始化时设置字符集，避免每次查询重复设置
        initSql: 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci',
        // 🚀 性能优化：启用连接压缩，减少网络传输时间
        compress: true,
        // 🚀 性能优化：设置空闲连接超时
        idleTimeout: 300000,    // 5分钟
        // 🚀 性能优化：启用连接保活
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });

      // 测试连接并设置字符集
      this.connection = await this.pool.getConnection();
      await this.connection.ping();
      
      // 设置连接字符集
      await this.connection.execute('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
      await this.connection.execute('SET CHARACTER SET utf8mb4');
      await this.connection.execute('SET character_set_connection=utf8mb4');
      
      this.connection.release();

      this.connected = true;
      console.log('✅ MySQL数据库连接成功');
    } catch (error) {
      console.error('❌ MySQL数据库连接失败:', error.message);
      throw error;
    }
  }

  /**
   * 断开数据库连接
   */
  async disconnect() {
    if (this.pool) {
      try {
        await this.pool.end();
        this.connected = false;
        console.log('✅ MySQL数据库连接已关闭');
      } catch (error) {
        console.error('❌ 关闭MySQL数据库连接时出错:', error.message);
        throw error;
      }
    }
  }

  /**
   * 测试数据库连接
   */
  async testConnection() {
    try {
      if (!this.pool) {
        await this.connect();
      }
      
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      
      console.log('✅ MySQL数据库连接测试成功');
      return true;
    } catch (error) {
      console.error('❌ MySQL数据库连接测试失败:', error.message);
      return false;
    }
  }

  /**
   * 🚀 性能优化：生成缓存键
   */
  _getCacheKey(sql, params) {
    return `${sql}:${JSON.stringify(params)}`;
  }

  /**
   * 🚀 性能优化：检查缓存是否有效
   */
  _isCacheValid(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < this.cacheTimeout;
  }

  /**
   * 🚀 性能优化：清理过期缓存
   */
  _cleanExpiredCache() {
    const now = Date.now();
    for (const [key, entry] of this.queryCache.entries()) {
      if (now - entry.timestamp >= this.cacheTimeout) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * 🚀 性能优化：判断是否应该缓存查询（只缓存SELECT查询）
   */
  _shouldCache(sql) {
    return sql.trim().toLowerCase().startsWith('select');
  }

  /**
   * 执行查询操作 - 性能优化版本（带缓存）
   */
  async query(sql, params = []) {
    const startTime = Date.now();
    
    // 🚀 性能优化：检查缓存
    if (this._shouldCache(sql)) {
      const cacheKey = this._getCacheKey(sql, params);
      const cached = this.queryCache.get(cacheKey);
      
      if (cached && this._isCacheValid(cached)) {
        console.log(`⚡ 缓存命中 (${Date.now() - startTime}ms):`, sql.substring(0, 50));
        return cached.data;
      }
    }
    
    try {
      if (!this.pool) {
        await this.connect();
      }

      // 🚀 性能优化：直接获取连接，不再每次设置字符集（已在连接池初始化时设置）
      const connection = await this.pool.getConnection();
      try {
        const [rows] = await connection.execute(sql, params);
        connection.release();
        
        // 🚀 性能优化：缓存SELECT查询结果
        if (this._shouldCache(sql)) {
          const cacheKey = this._getCacheKey(sql, params);
          
          // 清理过期缓存
          if (this.queryCache.size >= this.cacheMaxSize) {
            this._cleanExpiredCache();
          }
          
          // 如果缓存仍然满了，删除最旧的条目
          if (this.queryCache.size >= this.cacheMaxSize) {
            const firstKey = this.queryCache.keys().next().value;
            this.queryCache.delete(firstKey);
          }
          
          this.queryCache.set(cacheKey, {
            data: rows,
            timestamp: Date.now()
          });
        }
        
        // 🚀 性能监控：记录慢查询
        const executionTime = Date.now() - startTime;
        if (executionTime > 1000) { // 超过1秒的查询
          console.warn(`🐌 慢查询检测 (${executionTime}ms):`, sql.substring(0, 100));
        }
        
        return rows;
      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ MySQL查询错误 (${executionTime}ms):`, error.message);
      console.error('SQL:', sql);
      console.error('参数:', params);
      throw error;
    }
  }

  /**
   * 执行更新操作 - 性能优化版本
   */
  async execute(sql, params = []) {
    const startTime = Date.now();
    try {
      if (!this.pool) {
        await this.connect();
      }

      // 🚀 性能优化：直接获取连接，不再每次设置字符集
      const connection = await this.pool.getConnection();
      try {
        const [result] = await connection.execute(sql, params);
        connection.release();
        
        // 🚀 性能监控：记录执行时间
        const executionTime = Date.now() - startTime;
        if (executionTime > 1000) {
          console.warn(`🐌 慢执行检测 (${executionTime}ms):`, sql.substring(0, 100));
        }
        
        return new QueryResult(
          result.affectedRows || 0,
          result.insertId || result.lastInsertRowid || null
        );
      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ MySQL执行错误 (${executionTime}ms):`, error.message);
      console.error('SQL:', sql);
      console.error('参数:', params);
      throw error;
    }
  }

  /**
   * 执行事务
   */
  async transaction(callback) {
    if (!this.pool) {
      await this.connect();
    }

    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 创建临时适配器用于事务
      const transactionAdapter = new MySQLTransactionAdapter(connection);
      const result = await callback(transactionAdapter);
      
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      console.error('MySQL事务执行失败:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 获取数据库类型
   */
  getType() {
    return 'mysql';
  }

  /**
   * 优化MySQL数据库
   */
  async optimize() {
    try {
      if (!this.pool) {
        await this.connect();
      }

      // 获取所有表名
      const [tables] = await this.pool.execute('SHOW TABLES');
      
      // 优化每个表
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        await this.pool.execute(`OPTIMIZE TABLE \`${tableName}\``);
      }
      
      console.log('✅ MySQL数据库优化完成');
    } catch (error) {
      console.error('❌ MySQL数据库优化失败:', error.message);
      throw error;
    }
  }

  /**
   * 检查数据库完整性
   */
  async checkIntegrity() {
    try {
      if (!this.pool) {
        await this.connect();
      }

      // 获取所有表名
      const [tables] = await this.pool.execute('SHOW TABLES');
      
      let allOk = true;
      
      // 检查每个表的完整性
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        const [result] = await this.pool.execute(`CHECK TABLE \`${tableName}\``);
        
        if (result[0].Msg_text !== 'OK') {
          console.warn(`⚠️ 表 ${tableName} 完整性检查失败:`, result[0].Msg_text);
          allOk = false;
        }
      }
      
      if (allOk) {
        console.log('✅ MySQL数据库完整性检查通过');
      }
      
      return allOk;
    } catch (error) {
      console.error('❌ MySQL数据库完整性检查出错:', error.message);
      return false;
    }
  }

  /**
   * 获取数据库大小
   */
  async getDatabaseSize() {
    try {
      if (!this.pool) {
        await this.connect();
      }

      const [result] = await this.pool.execute(`
        SELECT 
          ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
        FROM information_schema.tables 
        WHERE table_schema = ?
      `, [this.config.database]);

      return result[0]?.size_mb || 0;
    } catch (error) {
      console.error('获取MySQL数据库大小失败:', error.message);
      return 0;
    }
  }

  /**
   * 备份数据库
   */
  async backup() {
    try {
      // MySQL备份需要使用mysqldump工具
      // 这里返回备份SQL语句
      const backupSql = [];
      
      // 获取所有表
      const [tables] = await this.pool.execute('SHOW TABLES');
      
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        
        // 获取表结构
        const [createTable] = await this.pool.execute(`SHOW CREATE TABLE \`${tableName}\``);
        backupSql.push(createTable[0]['Create Table'] + ';');
        
        // 获取表数据
        const [rows] = await this.pool.execute(`SELECT * FROM \`${tableName}\``);
        
        if (rows.length > 0) {
          const columns = Object.keys(rows[0]);
          const values = rows.map(row => 
            `(${columns.map(col => 
              row[col] === null ? 'NULL' : 
              typeof row[col] === 'string' ? `'${row[col].replace(/'/g, "''")}'` : 
              row[col]
            ).join(', ')})`
          ).join(', ');
          
          backupSql.push(`INSERT INTO \`${tableName}\` (${columns.map(col => `\`${col}\``).join(', ')}) VALUES ${values};`);
        }
      }
      
      console.log('✅ MySQL数据库备份完成');
      return backupSql.join('\n');
    } catch (error) {
      console.error('❌ MySQL数据库备份失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取博客统计
   */
  async getBlogStats() {
    try {
      if (!this.pool) {
        await this.connect();
      }

      const [totalResult] = await this.pool.execute('SELECT COUNT(*) as count FROM blogs');
      const [publishedResult] = await this.pool.execute('SELECT COUNT(*) as count FROM blogs WHERE status = ?', ['published']);
      const [draftResult] = await this.pool.execute('SELECT COUNT(*) as count FROM blogs WHERE status = ?', ['draft']);

      return {
        total: totalResult[0]?.count || 0,
        published: publishedResult[0]?.count || 0,
        draft: draftResult[0]?.count || 0
      };
    } catch (error) {
      console.error('获取博客统计失败:', error.message);
      return { total: 0, published: 0, draft: 0 };
    }
  }

  /**
   * 获取视频统计
   */
  async getVideoStats() {
    try {
      if (!this.pool) {
        await this.connect();
      }

      const [totalResult] = await this.pool.execute('SELECT COUNT(*) as count FROM videos');
      const [publishedResult] = await this.pool.execute('SELECT COUNT(*) as count FROM videos WHERE status = ?', ['published']);
      const [activeResult] = await this.pool.execute('SELECT COUNT(*) as count FROM videos WHERE status = ?', ['active']);

      return {
        total: totalResult[0]?.count || 0,
        published: publishedResult[0]?.count || 0,
        active: activeResult[0]?.count || 0
      };
    } catch (error) {
      console.error('获取视频统计失败:', error.message);
      return { total: 0, published: 0, active: 0 };
    }
  }

  /**
   * 获取页面浏览统计
   */
  async getPageViewStats(timeRange = '7d') {
    try {
      if (!this.pool) {
        await this.connect();
      }

      let dateCondition = '';
      const params = [];

      if (timeRange === '1d' || timeRange === '24h') {
        dateCondition = "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)";
      } else if (timeRange === '7d') {
        dateCondition = "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
      } else if (timeRange === '30d') {
        dateCondition = "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
      }

      const [totalResult] = await this.pool.execute(`SELECT COUNT(*) as count FROM page_views ${dateCondition}`, params);
      const [uniqueResult] = await this.pool.execute(`SELECT COUNT(DISTINCT session_id) as count FROM page_views ${dateCondition}`, params);

      // 获取热门页面
      const [topPagesResult] = await this.pool.execute(`
        SELECT page_url, page_title, COUNT(*) as views, COUNT(DISTINCT session_id) as unique_visitors
        FROM page_views ${dateCondition}
        GROUP BY page_url, page_title
        ORDER BY views DESC
        LIMIT 10
      `, params);

      return {
        total: totalResult[0]?.count || 0,
        unique: uniqueResult[0]?.count || 0,
        topPages: topPagesResult || []
      };
    } catch (error) {
      console.error('获取页面浏览统计失败:', error.message);
      return { total: 0, unique: 0, topPages: [] };
    }
  }
}

/**
 * MySQL事务适配器
 * 用于在事务中执行操作
 */
class MySQLTransactionAdapter {
  constructor(connection) {
    this.connection = connection;
  }

  async query(sql, params = []) {
    const [rows] = await this.connection.execute(sql, params);
    return rows;
  }

  async execute(sql, params = []) {
    const [result] = await this.connection.execute(sql, params);
    return new QueryResult(
      result.affectedRows || 0,
      result.insertId || null,
      result.changedRows || 0
    );
  }

  getType() {
    return 'mysql';
  }
}

export default MySQLAdapter;