// 数据迁移工具
// 实现MySQL到SQLite的自动化数据迁移

import TypeMapper from './TypeMapper.js';
import { DatabaseFactory } from '../DatabaseFactory.js';
import fs from 'fs';
import path from 'path';

/**
 * 数据迁移工具
 * 负责在MySQL和SQLite之间进行数据迁移
 */
export class MigrationTool {
  constructor() {
    this.typeMapper = new TypeMapper();
    this.sourceAdapter = null;
    this.targetAdapter = null;
    this.migrationLog = [];
  }

  /**
   * 初始化迁移工具
   * @param {Object} sourceConfig - 源数据库配置
   * @param {Object} targetConfig - 目标数据库配置
   */
  async initialize(sourceConfig, targetConfig) {
    try {
      console.log('🔧 初始化迁移工具...');
      
      // 创建源数据库适配器
      this.sourceAdapter = await DatabaseFactory.createAdapter(sourceConfig);
      await this.sourceAdapter.connect();
      
      // 创建目标数据库适配器
      this.targetAdapter = await DatabaseFactory.createAdapter(targetConfig);
      await this.targetAdapter.connect();
      
      console.log('✅ 迁移工具初始化完成');
      return true;
    } catch (error) {
      console.error('❌ 迁移工具初始化失败:', error.message);
      throw error;
    }
  }

  /**
   * 执行完整的数据库迁移
   * @param {Object} options - 迁移选项
   * @returns {Promise<Object>} 迁移结果
   */
  async migrate(options = {}) {
    const {
      tables = null, // 指定要迁移的表，null表示迁移所有表
      dropExisting = false, // 是否删除目标数据库中的现有表
      batchSize = 1000, // 批量插入大小
      validateData = true // 是否验证数据
    } = options;

    const startTime = Date.now();
    const result = {
      success: false,
      tablesProcessed: 0,
      recordsMigrated: 0,
      errors: [],
      warnings: [],
      duration: 0
    };

    try {
      this.log('🚀 开始数据库迁移...');

      // 获取源数据库的表结构
      const sourceTables = await this.getSourceTables(tables);
      this.log(`发现 ${sourceTables.length} 个表需要迁移`);

      // 迁移每个表
      for (const tableName of sourceTables) {
        try {
          this.log(`\n📋 开始迁移表: ${tableName}`);
          
          // 获取表结构
          const tableStructure = await this.getTableStructure(tableName);
          
          // 创建目标表
          await this.createTargetTable(tableName, tableStructure, dropExisting);
          
          // 迁移数据
          const recordCount = await this.migrateTableData(tableName, batchSize);
          
          result.recordsMigrated += recordCount;
          result.tablesProcessed++;
          
          this.log(`✅ 表 ${tableName} 迁移完成，共 ${recordCount} 条记录`);
          
          // 验证数据（如果启用）
          if (validateData) {
            await this.validateTableData(tableName);
          }
          
        } catch (error) {
          const errorMsg = `表 ${tableName} 迁移失败: ${error.message}`;
          this.log(`❌ ${errorMsg}`);
          result.errors.push(errorMsg);
        }
      }

      // 创建索引
      await this.createIndexes();

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;
      
      this.log(`\n🎉 数据库迁移完成！`);
      this.log(`处理表数: ${result.tablesProcessed}`);
      this.log(`迁移记录数: ${result.recordsMigrated}`);
      this.log(`耗时: ${result.duration}ms`);
      
      if (result.errors.length > 0) {
        this.log(`错误数: ${result.errors.length}`);
      }

    } catch (error) {
      result.success = false;
      result.errors.push(error.message);
      this.log(`❌ 迁移过程中发生错误: ${error.message}`);
    }

    return result;
  }

  /**
   * 获取源数据库的表列表
   * @param {Array|null} specificTables - 指定的表名列表
   * @returns {Promise<Array>} 表名列表
   */
  async getSourceTables(specificTables = null) {
    if (this.sourceAdapter.getType() === 'mysql') {
      const tables = await this.sourceAdapter.query('SHOW TABLES');
      const tableNames = tables.map(row => Object.values(row)[0]);
      
      if (specificTables) {
        return tableNames.filter(name => specificTables.includes(name));
      }
      
      return tableNames;
    } else {
      // SQLite
      const tables = await this.sourceAdapter.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      const tableNames = tables.map(row => row.name);
      
      if (specificTables) {
        return tableNames.filter(name => specificTables.includes(name));
      }
      
      return tableNames;
    }
  }

  /**
   * 获取表结构
   * @param {string} tableName - 表名
   * @returns {Promise<Object>} 表结构信息
   */
  async getTableStructure(tableName) {
    if (this.sourceAdapter.getType() === 'mysql') {
      // 获取MySQL表结构
      const columns = await this.sourceAdapter.query(`DESCRIBE ${tableName}`);
      const indexes = await this.sourceAdapter.query(`SHOW INDEX FROM ${tableName}`);
      
      return {
        columns: columns.map(col => this.typeMapper.convertMysqlColumnToSqlite(col)),
        indexes: this.processIndexes(indexes),
        primaryKey: columns.find(col => col.Key === 'PRI')?.Field
      };
    } else {
      // 获取SQLite表结构
      const columns = await this.sourceAdapter.query(`PRAGMA table_info(${tableName})`);
      const indexes = await this.sourceAdapter.query(
        `SELECT * FROM sqlite_master WHERE type='index' AND tbl_name='${tableName}'`
      );
      
      return {
        columns: columns.map(col => this.typeMapper.convertSqliteColumnToMysql(col)),
        indexes: indexes,
        primaryKey: columns.find(col => col.pk === 1)?.name
      };
    }
  }

  /**
   * 创建目标表
   * @param {string} tableName - 表名
   * @param {Object} structure - 表结构
   * @param {boolean} dropExisting - 是否删除现有表
   */
  async createTargetTable(tableName, structure, dropExisting = false) {
    try {
      // 检查表是否存在
      const tableExists = await this.checkTableExists(tableName);
      
      if (tableExists && dropExisting) {
        await this.targetAdapter.execute(`DROP TABLE IF EXISTS ${tableName}`);
        this.log(`删除现有表: ${tableName}`);
      } else if (tableExists) {
        this.log(`表 ${tableName} 已存在，跳过创建`);
        return;
      }

      // 构建CREATE TABLE语句
      const columnDefinitions = structure.columns.map(col => col.definition);
      const createTableSQL = `CREATE TABLE ${tableName} (\n  ${columnDefinitions.join(',\n  ')}\n)`;
      
      await this.targetAdapter.execute(createTableSQL);
      this.log(`创建表: ${tableName}`);
      
    } catch (error) {
      throw new Error(`创建表 ${tableName} 失败: ${error.message}`);
    }
  }

  /**
   * 迁移表数据
   * @param {string} tableName - 表名
   * @param {number} batchSize - 批量大小
   * @returns {Promise<number>} 迁移的记录数
   */
  async migrateTableData(tableName, batchSize = 1000) {
    let totalRecords = 0;
    let offset = 0;

    try {
      // 获取总记录数
      const countResult = await this.sourceAdapter.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const totalCount = countResult[0].count;
      
      if (totalCount === 0) {
        this.log(`表 ${tableName} 无数据`);
        return 0;
      }

      this.log(`表 ${tableName} 共有 ${totalCount} 条记录`);

      // 分批迁移数据
      while (offset < totalCount) {
        const limit = Math.min(batchSize, totalCount - offset);
        
        // 获取源数据
        const sourceData = await this.sourceAdapter.query(
          `SELECT * FROM ${tableName} LIMIT ${limit} OFFSET ${offset}`
        );

        if (sourceData.length === 0) {
          break;
        }

        // 批量插入目标数据库
        await this.batchInsertData(tableName, sourceData);
        
        totalRecords += sourceData.length;
        offset += limit;
        
        // 显示进度
        const progress = Math.round((offset / totalCount) * 100);
        this.log(`进度: ${progress}% (${offset}/${totalCount})`);
      }

      return totalRecords;
    } catch (error) {
      throw new Error(`迁移表 ${tableName} 数据失败: ${error.message}`);
    }
  }

  /**
   * 批量插入数据
   * @param {string} tableName - 表名
   * @param {Array} data - 数据数组
   */
  async batchInsertData(tableName, data) {
    if (data.length === 0) return;

    try {
      await this.targetAdapter.transaction((adapter) => {
        for (const row of data) {
          const fields = Object.keys(row);
          // 转换数据类型
          const values = Object.values(row).map(value => {
            // 处理Date对象
            if (value instanceof Date) {
              return value.toISOString();
            }
            // 处理布尔值
            if (typeof value === 'boolean') {
              return value ? 1 : 0;
            }
            // 处理null和undefined
            if (value === null || value === undefined) {
              return null;
            }
            // 处理对象（转为JSON字符串）
            if (typeof value === 'object' && value !== null) {
              return JSON.stringify(value);
            }
            return value;
          });
          const placeholders = values.map(() => '?').join(', ');
          
          const sql = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
          adapter.execute(sql, values);
        }
      });
    } catch (error) {
      throw new Error(`批量插入数据失败: ${error.message}`);
    }
  }

  /**
   * 验证表数据
   * @param {string} tableName - 表名
   */
  async validateTableData(tableName) {
    try {
      // 比较记录数
      const sourceCount = await this.sourceAdapter.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const targetCount = await this.targetAdapter.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      
      const sourceTotal = sourceCount[0].count;
      const targetTotal = targetCount[0].count;
      
      if (sourceTotal !== targetTotal) {
        throw new Error(`记录数不匹配: 源=${sourceTotal}, 目标=${targetTotal}`);
      }
      
      this.log(`✅ 表 ${tableName} 数据验证通过`);
    } catch (error) {
      throw new Error(`验证表 ${tableName} 失败: ${error.message}`);
    }
  }

  /**
   * 创建索引
   */
  async createIndexes() {
    this.log('创建索引...');
    // 这里可以根据需要创建特定的索引
    // 由于SQLite和MySQL的索引语法差异，需要根据目标数据库类型调整
  }

  /**
   * 检查表是否存在
   * @param {string} tableName - 表名
   * @returns {Promise<boolean>} 表是否存在
   */
  async checkTableExists(tableName) {
    try {
      if (this.targetAdapter.getType() === 'mysql') {
        const result = await this.targetAdapter.query(
          `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = ?`,
          [tableName]
        );
        return result[0].count > 0;
      } else {
        const result = await this.targetAdapter.query(
          `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?`,
          [tableName]
        );
        return result[0].count > 0;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * 处理索引信息
   * @param {Array} indexes - 索引信息
   * @returns {Array} 处理后的索引信息
   */
  processIndexes(indexes) {
    // 简化索引处理，实际项目中可能需要更复杂的逻辑
    return indexes.filter(index => index.Key_name !== 'PRIMARY');
  }

  /**
   * 记录日志
   * @param {string} message - 日志消息
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.migrationLog.push(logEntry);
    console.log(logEntry);
  }

  /**
   * 获取迁移日志
   * @returns {Array} 日志数组
   */
  getLog() {
    return this.migrationLog;
  }

  /**
   * 保存迁移日志到文件
   * @param {string} filePath - 文件路径
   */
  async saveLogToFile(filePath) {
    try {
      const logContent = this.migrationLog.join('\n');
      
      // 确保目录存在
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, logContent, 'utf8');
      this.log(`日志已保存到: ${filePath}`);
    } catch (error) {
      this.log(`保存日志失败: ${error.message}`);
    }
  }

  /**
   * 关闭连接
   */
  async close() {
    if (this.sourceAdapter) {
      await this.sourceAdapter.disconnect();
    }
    if (this.targetAdapter) {
      await this.targetAdapter.disconnect();
    }
    this.log('迁移工具已关闭');
  }
}

export default MigrationTool;