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
  }

  /**
   * 连接MySQL数据库
   */
  async connect() {
    try {
      // 创建连接池
      this.pool = mysql.createPool({
        host: this.config.host || 'localhost',
        port: this.config.port || 3306,
        user: this.config.user || 'root',
        password: this.config.password || '',
        database: this.config.database,
        waitForConnections: true,
        connectionLimit: this.config.connectionLimit || 10,
        queueLimit: 0,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true,
        charset: 'utf8mb4',
        collation: 'utf8mb4_unicode_ci',
        timezone: '+08:00',
        supportBigNumbers: true,
        bigNumberStrings: true,
        dateStrings: false,
        multipleStatements: false,
        // 强制设置字符集
        initSql: 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci'
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
   * 执行查询操作
   */
  async query(sql, params = []) {
    try {
      if (!this.pool) {
        await this.connect();
      }

      // 获取连接并设置字符集
      const connection = await this.pool.getConnection();
      try {
        await connection.execute('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
        const [rows] = await connection.execute(sql, params);
        connection.release();
        return rows;
      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('MySQL查询错误:', error.message);
      console.error('SQL:', sql);
      console.error('参数:', params);
      throw error;
    }
  }

  /**
   * 执行更新操作
   */
  async execute(sql, params = []) {
    try {
      if (!this.pool) {
        await this.connect();
      }

      // 获取连接并设置字符集
      const connection = await this.pool.getConnection();
      try {
        await connection.execute('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
        const [result] = await connection.execute(sql, params);
        connection.release();
        
        return new QueryResult(
          result.affectedRows || 0,
          result.insertId || result.lastInsertRowid || null
        );
      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('MySQL执行错误:', error.message);
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