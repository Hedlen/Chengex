// 数据类型映射器
// 处理MySQL和SQLite之间的数据类型转换

/**
 * 数据类型映射器
 * 负责在不同数据库之间转换数据类型
 */
export class TypeMapper {
  constructor() {
    // MySQL到SQLite的类型映射
    this.mysqlToSqlite = {
      // 整数类型
      'TINYINT': 'INTEGER',
      'SMALLINT': 'INTEGER',
      'MEDIUMINT': 'INTEGER',
      'INT': 'INTEGER',
      'INTEGER': 'INTEGER',
      'BIGINT': 'INTEGER',
      
      // 浮点数类型
      'FLOAT': 'REAL',
      'DOUBLE': 'REAL',
      'DECIMAL': 'REAL',
      'NUMERIC': 'REAL',
      
      // 字符串类型
      'CHAR': 'TEXT',
      'VARCHAR': 'TEXT',
      'TINYTEXT': 'TEXT',
      'TEXT': 'TEXT',
      'MEDIUMTEXT': 'TEXT',
      'LONGTEXT': 'TEXT',
      
      // 二进制类型
      'BINARY': 'BLOB',
      'VARBINARY': 'BLOB',
      'TINYBLOB': 'BLOB',
      'BLOB': 'BLOB',
      'MEDIUMBLOB': 'BLOB',
      'LONGBLOB': 'BLOB',
      
      // 日期时间类型
      'DATE': 'TEXT',
      'TIME': 'TEXT',
      'DATETIME': 'TEXT',
      'TIMESTAMP': 'TEXT',
      'YEAR': 'INTEGER',
      
      // JSON类型
      'JSON': 'TEXT',
      
      // 枚举类型
      'ENUM': 'TEXT',
      'SET': 'TEXT',
      
      // 布尔类型
      'BOOLEAN': 'INTEGER',
      'BOOL': 'INTEGER'
    };

    // SQLite到MySQL的类型映射
    this.sqliteToMysql = {
      'INTEGER': 'INT',
      'REAL': 'DOUBLE',
      'TEXT': 'TEXT',
      'BLOB': 'BLOB',
      'NUMERIC': 'DECIMAL'
    };
  }

  /**
   * 将MySQL类型转换为SQLite类型
   * @param {string} mysqlType - MySQL数据类型
   * @returns {string} SQLite数据类型
   */
  mysqlToSqliteType(mysqlType) {
    // 提取基本类型名（去除长度和其他修饰符）
    const baseType = this.extractBaseType(mysqlType);
    return this.mysqlToSqlite[baseType.toUpperCase()] || 'TEXT';
  }

  /**
   * 将SQLite类型转换为MySQL类型
   * @param {string} sqliteType - SQLite数据类型
   * @returns {string} MySQL数据类型
   */
  sqliteToMysqlType(sqliteType) {
    const baseType = this.extractBaseType(sqliteType);
    return this.sqliteToMysql[baseType.toUpperCase()] || 'TEXT';
  }

  /**
   * 提取基本数据类型
   * @param {string} fullType - 完整的数据类型定义
   * @returns {string} 基本类型名
   */
  extractBaseType(fullType) {
    if (!fullType) return 'TEXT';
    
    // 移除括号内的内容和其他修饰符
    return fullType
      .split('(')[0]
      .split(' ')[0]
      .trim()
      .toUpperCase();
  }

  /**
   * 转换MySQL列定义为SQLite列定义
   * @param {Object} mysqlColumn - MySQL列信息
   * @returns {Object} SQLite列信息
   */
  convertMysqlColumnToSqlite(mysqlColumn) {
    const {
      Field: name,
      Type: type,
      Null: nullable,
      Key: key,
      Default: defaultValue,
      Extra: extra
    } = mysqlColumn;

    // 转换数据类型
    const sqliteType = this.mysqlToSqliteType(type);
    
    // 构建SQLite列定义
    let definition = `${name} ${sqliteType}`;
    
    // 处理主键
    if (key === 'PRI') {
      definition += ' PRIMARY KEY';
      
      // 处理自增
      if (extra && extra.includes('auto_increment')) {
        definition += ' AUTOINCREMENT';
      }
    }
    
    // 处理非空约束
    if (nullable === 'NO' && key !== 'PRI') {
      definition += ' NOT NULL';
    }
    
    // 处理默认值
    if (defaultValue !== null && defaultValue !== undefined && defaultValue !== 'NULL') {
      if (defaultValue === 'CURRENT_TIMESTAMP') {
        definition += " DEFAULT CURRENT_TIMESTAMP";
      } else if (typeof defaultValue === 'string' && defaultValue !== 'NULL') {
        // 对于字符串默认值，添加引号
        definition += ` DEFAULT '${defaultValue.replace(/'/g, "''")}'`;
      } else if (typeof defaultValue === 'number') {
        definition += ` DEFAULT ${defaultValue}`;
      }
    }
    
    // 处理唯一约束
    if (key === 'UNI') {
      definition += ' UNIQUE';
    }

    return {
      name,
      type: sqliteType,
      definition,
      nullable: nullable === 'YES',
      isPrimaryKey: key === 'PRI',
      isAutoIncrement: extra && extra.includes('auto_increment'),
      defaultValue,
      isUnique: key === 'UNI'
    };
  }

  /**
   * 转换SQLite列定义为MySQL列定义
   * @param {Object} sqliteColumn - SQLite列信息
   * @returns {Object} MySQL列信息
   */
  convertSqliteColumnToMysql(sqliteColumn) {
    const {
      name,
      type,
      notnull,
      dflt_value,
      pk
    } = sqliteColumn;

    // 转换数据类型
    const mysqlType = this.sqliteToMysqlType(type);
    
    // 构建MySQL列定义
    let definition = `${name} ${mysqlType}`;
    
    // 处理非空约束
    if (notnull && !pk) {
      definition += ' NOT NULL';
    }
    
    // 处理自增（SQLite的INTEGER PRIMARY KEY自动自增）
    if (pk && type.toUpperCase() === 'INTEGER') {
      definition += ' AUTO_INCREMENT';
    }
    
    // 处理默认值
    if (dflt_value !== null && dflt_value !== undefined) {
      if (typeof dflt_value === 'string') {
        definition += ` DEFAULT '${dflt_value.replace(/'/g, "''")}'`;
      } else {
        definition += ` DEFAULT ${dflt_value}`;
      }
    }

    return {
      name,
      type: mysqlType,
      definition,
      nullable: !notnull,
      isPrimaryKey: pk === 1,
      defaultValue: dflt_value
    };
  }

  /**
   * 转换数据值
   * @param {any} value - 原始值
   * @param {string} fromType - 源数据类型
   * @param {string} toType - 目标数据类型
   * @returns {any} 转换后的值
   */
  convertValue(value, fromType, toType) {
    if (value === null || value === undefined) {
      return null;
    }

    const sourceType = this.extractBaseType(fromType).toUpperCase();
    const targetType = this.extractBaseType(toType).toUpperCase();

    // 如果类型相同，直接返回
    if (sourceType === targetType) {
      return value;
    }

    // 特殊转换规则
    switch (targetType) {
      case 'INTEGER':
        if (typeof value === 'boolean') {
          return value ? 1 : 0;
        }
        if (typeof value === 'string') {
          const parsed = parseInt(value, 10);
          return isNaN(parsed) ? 0 : parsed;
        }
        return parseInt(value, 10) || 0;

      case 'REAL':
      case 'DOUBLE':
      case 'FLOAT':
        return parseFloat(value) || 0;

      case 'TEXT':
        if (value instanceof Date) {
          return value.toISOString();
        }
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        return String(value);

      case 'BLOB':
        if (typeof value === 'string') {
          return Buffer.from(value, 'utf8');
        }
        return value;

      default:
        return value;
    }
  }

  /**
   * 获取类型兼容性信息
   * @param {string} sourceType - 源类型
   * @param {string} targetType - 目标类型
   * @returns {Object} 兼容性信息
   */
  getCompatibilityInfo(sourceType, targetType) {
    const source = this.extractBaseType(sourceType).toUpperCase();
    const target = this.extractBaseType(targetType).toUpperCase();

    const compatibility = {
      compatible: true,
      lossless: true,
      warnings: []
    };

    // 检查数据丢失风险
    if (source === 'DOUBLE' && target === 'INTEGER') {
      compatibility.lossless = false;
      compatibility.warnings.push('浮点数转换为整数可能丢失精度');
    }

    if (source === 'TEXT' && ['INTEGER', 'REAL'].includes(target)) {
      compatibility.lossless = false;
      compatibility.warnings.push('文本转换为数值可能失败');
    }

    if (source === 'BLOB' && target !== 'BLOB') {
      compatibility.compatible = false;
      compatibility.warnings.push('二进制数据无法转换为其他类型');
    }

    return compatibility;
  }

  /**
   * 处理特殊的MySQL数据类型
   * @param {string} mysqlType - MySQL数据类型
   * @returns {Object} 处理结果
   */
  handleSpecialMysqlTypes(mysqlType) {
    const upperType = mysqlType.toUpperCase();
    
    // 处理ENUM类型
    if (upperType.startsWith('ENUM')) {
      const enumValues = this.extractEnumValues(mysqlType);
      return {
        sqliteType: 'TEXT',
        constraint: `CHECK (${enumValues.map(v => `${name} = '${v}'`).join(' OR ')})`,
        enumValues
      };
    }
    
    // 处理SET类型
    if (upperType.startsWith('SET')) {
      const setValues = this.extractEnumValues(mysqlType);
      return {
        sqliteType: 'TEXT',
        setValues
      };
    }
    
    // 处理带长度的VARCHAR
    if (upperType.startsWith('VARCHAR')) {
      const length = this.extractLength(mysqlType);
      return {
        sqliteType: 'TEXT',
        maxLength: length
      };
    }
    
    return {
      sqliteType: this.mysqlToSqliteType(mysqlType)
    };
  }

  /**
   * 提取ENUM或SET的值
   * @param {string} typeDefinition - 类型定义
   * @returns {Array} 值数组
   */
  extractEnumValues(typeDefinition) {
    const match = typeDefinition.match(/\(([^)]+)\)/);
    if (!match) return [];
    
    return match[1]
      .split(',')
      .map(v => v.trim().replace(/^'|'$/g, ''));
  }

  /**
   * 提取类型长度
   * @param {string} typeDefinition - 类型定义
   * @returns {number|null} 长度
   */
  extractLength(typeDefinition) {
    const match = typeDefinition.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : null;
  }
}

export default TypeMapper;