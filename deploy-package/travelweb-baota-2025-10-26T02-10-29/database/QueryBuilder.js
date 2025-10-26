// 查询构建器
// 提供跨数据库的SQL查询构建功能

/**
 * 查询构建器类
 * 支持链式调用构建SQL查询
 */
export class QueryBuilder {
  constructor(adapter) {
    this.adapter = adapter;
    this.reset();
  }

  /**
   * 重置查询构建器
   */
  reset() {
    this.queryType = null;
    this.tableName = null;
    this.selectFields = ['*'];
    this.whereConditions = [];
    this.joinClauses = [];
    this.orderByFields = [];
    this.groupByFields = [];
    this.havingConditions = [];
    this.limitValue = null;
    this.offsetValue = null;
    this.insertData = null;
    this.updateData = null;
    this.params = [];
    return this;
  }

  /**
   * 设置表名
   * @param {string} table - 表名
   */
  table(table) {
    this.tableName = table;
    return this;
  }

  /**
   * SELECT查询
   * @param {string|Array} fields - 字段列表
   */
  select(fields = ['*']) {
    this.queryType = 'SELECT';
    this.selectFields = Array.isArray(fields) ? fields : [fields];
    return this;
  }

  /**
   * INSERT查询
   * @param {Object} data - 插入数据
   */
  insert(data) {
    this.queryType = 'INSERT';
    this.insertData = data;
    return this;
  }

  /**
   * UPDATE查询
   * @param {Object} data - 更新数据
   */
  update(data) {
    this.queryType = 'UPDATE';
    this.updateData = data;
    return this;
  }

  /**
   * DELETE查询
   */
  delete() {
    this.queryType = 'DELETE';
    return this;
  }

  /**
   * WHERE条件
   * @param {string} field - 字段名
   * @param {string} operator - 操作符
   * @param {any} value - 值
   */
  where(field, operator, value) {
    if (arguments.length === 2) {
      value = operator;
      operator = '=';
    }
    
    this.whereConditions.push({
      type: 'AND',
      field,
      operator,
      value
    });
    return this;
  }

  /**
   * OR WHERE条件
   * @param {string} field - 字段名
   * @param {string} operator - 操作符
   * @param {any} value - 值
   */
  orWhere(field, operator, value) {
    if (arguments.length === 2) {
      value = operator;
      operator = '=';
    }
    
    this.whereConditions.push({
      type: 'OR',
      field,
      operator,
      value
    });
    return this;
  }

  /**
   * WHERE IN条件
   * @param {string} field - 字段名
   * @param {Array} values - 值数组
   */
  whereIn(field, values) {
    this.whereConditions.push({
      type: 'AND',
      field,
      operator: 'IN',
      value: values
    });
    return this;
  }

  /**
   * WHERE LIKE条件
   * @param {string} field - 字段名
   * @param {string} pattern - 模式
   */
  whereLike(field, pattern) {
    this.whereConditions.push({
      type: 'AND',
      field,
      operator: 'LIKE',
      value: pattern
    });
    return this;
  }

  /**
   * WHERE NULL条件
   * @param {string} field - 字段名
   */
  whereNull(field) {
    this.whereConditions.push({
      type: 'AND',
      field,
      operator: 'IS NULL',
      value: null
    });
    return this;
  }

  /**
   * WHERE NOT NULL条件
   * @param {string} field - 字段名
   */
  whereNotNull(field) {
    this.whereConditions.push({
      type: 'AND',
      field,
      operator: 'IS NOT NULL',
      value: null
    });
    return this;
  }

  /**
   * JOIN连接
   * @param {string} table - 连接表名
   * @param {string} condition - 连接条件
   * @param {string} type - 连接类型
   */
  join(table, condition, type = 'INNER') {
    this.joinClauses.push({
      type,
      table,
      condition
    });
    return this;
  }

  /**
   * LEFT JOIN连接
   * @param {string} table - 连接表名
   * @param {string} condition - 连接条件
   */
  leftJoin(table, condition) {
    return this.join(table, condition, 'LEFT');
  }

  /**
   * RIGHT JOIN连接
   * @param {string} table - 连接表名
   * @param {string} condition - 连接条件
   */
  rightJoin(table, condition) {
    return this.join(table, condition, 'RIGHT');
  }

  /**
   * ORDER BY排序
   * @param {string} field - 字段名
   * @param {string} direction - 排序方向
   */
  orderBy(field, direction = 'ASC') {
    this.orderByFields.push({ field, direction });
    return this;
  }

  /**
   * GROUP BY分组
   * @param {string|Array} fields - 字段列表
   */
  groupBy(fields) {
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    this.groupByFields.push(...fieldArray);
    return this;
  }

  /**
   * HAVING条件
   * @param {string} field - 字段名
   * @param {string} operator - 操作符
   * @param {any} value - 值
   */
  having(field, operator, value) {
    if (arguments.length === 2) {
      value = operator;
      operator = '=';
    }
    
    this.havingConditions.push({
      field,
      operator,
      value
    });
    return this;
  }

  /**
   * LIMIT限制
   * @param {number} limit - 限制数量
   */
  limit(limit) {
    this.limitValue = limit;
    return this;
  }

  /**
   * OFFSET偏移
   * @param {number} offset - 偏移量
   */
  offset(offset) {
    this.offsetValue = offset;
    return this;
  }

  /**
   * 构建SQL语句
   * @returns {Object} SQL语句和参数
   */
  build() {
    this.params = [];
    let sql = '';

    switch (this.queryType) {
      case 'SELECT':
        sql = this.buildSelect();
        break;
      case 'INSERT':
        sql = this.buildInsert();
        break;
      case 'UPDATE':
        sql = this.buildUpdate();
        break;
      case 'DELETE':
        sql = this.buildDelete();
        break;
      default:
        throw new Error('未指定查询类型');
    }

    return { sql, params: this.params };
  }

  /**
   * 构建SELECT语句
   */
  buildSelect() {
    let sql = `SELECT ${this.selectFields.join(', ')} FROM ${this.tableName}`;

    // JOIN子句
    if (this.joinClauses.length > 0) {
      sql += ' ' + this.joinClauses.map(join => 
        `${join.type} JOIN ${join.table} ON ${join.condition}`
      ).join(' ');
    }

    // WHERE子句
    sql += this.buildWhere();

    // GROUP BY子句
    if (this.groupByFields.length > 0) {
      sql += ` GROUP BY ${this.groupByFields.join(', ')}`;
    }

    // HAVING子句
    if (this.havingConditions.length > 0) {
      sql += ' HAVING ' + this.havingConditions.map(condition => {
        this.params.push(condition.value);
        return `${condition.field} ${condition.operator} ?`;
      }).join(' AND ');
    }

    // ORDER BY子句
    if (this.orderByFields.length > 0) {
      sql += ' ORDER BY ' + this.orderByFields.map(order => 
        `${order.field} ${order.direction}`
      ).join(', ');
    }

    // LIMIT和OFFSET子句
    if (this.limitValue !== null) {
      sql += ` LIMIT ${this.limitValue}`;
    }
    if (this.offsetValue !== null) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return sql;
  }

  /**
   * 构建INSERT语句
   */
  buildInsert() {
    const fields = Object.keys(this.insertData);
    const values = Object.values(this.insertData);
    
    this.params.push(...values);
    
    const placeholders = values.map(() => '?').join(', ');
    return `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
  }

  /**
   * 构建UPDATE语句
   */
  buildUpdate() {
    const fields = Object.keys(this.updateData);
    const values = Object.values(this.updateData);
    
    this.params.push(...values);
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    let sql = `UPDATE ${this.tableName} SET ${setClause}`;
    
    sql += this.buildWhere();
    
    return sql;
  }

  /**
   * 构建DELETE语句
   */
  buildDelete() {
    let sql = `DELETE FROM ${this.tableName}`;
    sql += this.buildWhere();
    return sql;
  }

  /**
   * 构建WHERE子句
   */
  buildWhere() {
    if (this.whereConditions.length === 0) {
      return '';
    }

    const conditions = this.whereConditions.map((condition, index) => {
      let clause = '';
      
      if (index > 0) {
        clause += ` ${condition.type} `;
      }

      if (condition.operator === 'IN') {
        const placeholders = condition.value.map(() => '?').join(', ');
        clause += `${condition.field} IN (${placeholders})`;
        this.params.push(...condition.value);
      } else if (condition.operator === 'IS NULL' || condition.operator === 'IS NOT NULL') {
        clause += `${condition.field} ${condition.operator}`;
      } else {
        clause += `${condition.field} ${condition.operator} ?`;
        this.params.push(condition.value);
      }

      return clause;
    });

    return ' WHERE ' + conditions.join('');
  }

  /**
   * 执行查询
   * @returns {Promise<Array>} 查询结果
   */
  async get() {
    const { sql, params } = this.build();
    return await this.adapter.query(sql, params);
  }

  /**
   * 执行查询并返回第一条记录
   * @returns {Promise<Object|null>} 查询结果
   */
  async first() {
    this.limit(1);
    const results = await this.get();
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 执行更新/插入/删除操作
   * @returns {Promise<QueryResult>} 执行结果
   */
  async execute() {
    const { sql, params } = this.build();
    return await this.adapter.execute(sql, params);
  }

  /**
   * 获取记录数量
   * @returns {Promise<number>} 记录数量
   */
  async count() {
    const originalFields = this.selectFields;
    this.selectFields = ['COUNT(*) as count'];
    
    const result = await this.first();
    this.selectFields = originalFields;
    
    return result ? result.count : 0;
  }
}

export default QueryBuilder;