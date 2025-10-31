// 🚀 MySQL性能监控工具
// 专门用于监控宝塔环境下的数据库性能

import { getMySQLConfig } from './mysql-config.js';
import mysql from 'mysql2/promise';

class DatabasePerformanceMonitor {
  constructor() {
    this.config = getMySQLConfig();
    this.connection = null;
  }

  async connect() {
    if (!this.connection) {
      this.connection = await mysql.createConnection(this.config);
    }
    return this.connection;
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  /**
   * 🚀 检查数据库连接性能
   */
  async checkConnectionPerformance() {
    const conn = await this.connect();
    
    console.log('\n🔍 数据库连接性能检查');
    console.log('=' .repeat(50));
    
    // 检查连接状态
    const [connections] = await conn.execute(`
      SHOW STATUS WHERE Variable_name IN (
        'Connections', 'Max_used_connections', 'Threads_connected',
        'Threads_running', 'Aborted_connects', 'Aborted_clients'
      )
    `);
    
    connections.forEach(row => {
      console.log(`${row.Variable_name}: ${row.Value}`);
    });
  }

  /**
   * 🚀 检查查询缓存性能
   */
  async checkQueryCachePerformance() {
    const conn = await this.connect();
    
    console.log('\n🔍 查询缓存性能检查');
    console.log('=' .repeat(50));
    
    const [cache] = await conn.execute(`
      SHOW STATUS WHERE Variable_name LIKE 'Qcache%'
    `);
    
    cache.forEach(row => {
      console.log(`${row.Variable_name}: ${row.Value}`);
    });
    
    // 计算缓存命中率
    const cacheHits = cache.find(r => r.Variable_name === 'Qcache_hits')?.Value || 0;
    const cacheInserts = cache.find(r => r.Variable_name === 'Qcache_inserts')?.Value || 0;
    const totalQueries = parseInt(cacheHits) + parseInt(cacheInserts);
    
    if (totalQueries > 0) {
      const hitRate = (parseInt(cacheHits) / totalQueries * 100).toFixed(2);
      console.log(`\n📊 缓存命中率: ${hitRate}%`);
      
      if (hitRate < 50) {
        console.log('⚠️  缓存命中率较低，建议优化查询或增加缓存大小');
      } else {
        console.log('✅ 缓存命中率良好');
      }
    }
  }

  /**
   * 🚀 检查表性能
   */
  async checkTablePerformance() {
    const conn = await this.connect();
    
    console.log('\n🔍 表性能检查');
    console.log('=' .repeat(50));
    
    const [tables] = await conn.execute(`
      SELECT 
        TABLE_NAME as '表名',
        TABLE_ROWS as '行数',
        ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS '总大小(MB)',
        ROUND((DATA_LENGTH / 1024 / 1024), 2) AS '数据大小(MB)',
        ROUND((INDEX_LENGTH / 1024 / 1024), 2) AS '索引大小(MB)',
        ROUND((INDEX_LENGTH / DATA_LENGTH * 100), 2) AS '索引比例(%)'
      FROM 
        INFORMATION_SCHEMA.TABLES 
      WHERE 
        TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY 
        (DATA_LENGTH + INDEX_LENGTH) DESC
    `);
    
    console.table(tables);
  }

  /**
   * 🚀 检查慢查询
   */
  async checkSlowQueries() {
    const conn = await this.connect();
    
    console.log('\n🔍 慢查询检查');
    console.log('=' .repeat(50));
    
    const [slowQuery] = await conn.execute(`
      SHOW VARIABLES WHERE Variable_name IN (
        'slow_query_log', 'long_query_time', 'slow_query_log_file'
      )
    `);
    
    slowQuery.forEach(row => {
      console.log(`${row.Variable_name}: ${row.Value}`);
    });
    
    // 检查慢查询统计
    const [slowStats] = await conn.execute(`
      SHOW STATUS WHERE Variable_name = 'Slow_queries'
    `);
    
    console.log(`慢查询数量: ${slowStats[0]?.Value || 0}`);
  }

  /**
   * 🚀 检查索引使用情况
   */
  async checkIndexUsage() {
    const conn = await this.connect();
    
    console.log('\n🔍 索引使用情况检查');
    console.log('=' .repeat(50));
    
    const [indexes] = await conn.execute(`
      SELECT 
        TABLE_NAME as '表名',
        INDEX_NAME as '索引名',
        COLUMN_NAME as '列名',
        CARDINALITY as '基数',
        INDEX_TYPE as '索引类型'
      FROM 
        INFORMATION_SCHEMA.STATISTICS 
      WHERE 
        TABLE_SCHEMA = DATABASE()
        AND INDEX_NAME != 'PRIMARY'
      ORDER BY 
        TABLE_NAME, INDEX_NAME
    `);
    
    console.table(indexes);
  }

  /**
   * 🚀 生成性能报告
   */
  async generatePerformanceReport() {
    console.log('\n🚀 MySQL性能监控报告');
    console.log('=' .repeat(60));
    console.log(`检查时间: ${new Date().toLocaleString()}`);
    
    try {
      await this.checkConnectionPerformance();
      await this.checkQueryCachePerformance();
      await this.checkTablePerformance();
      await this.checkSlowQueries();
      await this.checkIndexUsage();
      
      console.log('\n✅ 性能检查完成');
      console.log('\n💡 优化建议:');
      console.log('1. 如果连接数过高，考虑增加连接池大小');
      console.log('2. 如果缓存命中率低，检查查询是否可以优化');
      console.log('3. 如果表过大，考虑分区或归档旧数据');
      console.log('4. 定期执行 ANALYZE TABLE 和 OPTIMIZE TABLE');
      console.log('5. 监控慢查询日志，优化慢查询');
      
    } catch (error) {
      console.error('❌ 性能检查失败:', error.message);
    } finally {
      await this.disconnect();
    }
  }

  /**
   * 🚀 执行性能优化
   */
  async performOptimization() {
    const conn = await this.connect();
    
    console.log('\n🚀 执行性能优化');
    console.log('=' .repeat(50));
    
    try {
      // 1. 分析表
      console.log('📊 分析表统计信息...');
      const tables = ['blogs', 'videos', 'page_views', 'users', 'categories'];
      
      for (const table of tables) {
        try {
          await conn.execute(`ANALYZE TABLE ${table}`);
          console.log(`✅ ${table} 表分析完成`);
        } catch (error) {
          console.log(`⚠️  ${table} 表分析失败: ${error.message}`);
        }
      }
      
      // 2. 清理查询缓存
      console.log('\n🧹 清理查询缓存...');
      await conn.execute('FLUSH QUERY CACHE');
      console.log('✅ 查询缓存清理完成');
      
      // 3. 清理过期数据
      console.log('\n🗑️  清理过期数据...');
      const [result] = await conn.execute(`
        DELETE FROM page_views 
        WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);
      console.log(`✅ 清理了 ${result.affectedRows} 条过期页面浏览记录`);
      
      console.log('\n✅ 性能优化完成');
      
    } catch (error) {
      console.error('❌ 性能优化失败:', error.message);
    } finally {
      await this.disconnect();
    }
  }
}

// 导出监控器
export { DatabasePerformanceMonitor };

// 如果直接运行此文件，执行性能检查
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new DatabasePerformanceMonitor();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'report':
      await monitor.generatePerformanceReport();
      break;
    case 'optimize':
      await monitor.performOptimization();
      break;
    default:
      console.log('🚀 MySQL性能监控工具');
      console.log('使用方法:');
      console.log('  node performance-monitor.js report    - 生成性能报告');
      console.log('  node performance-monitor.js optimize  - 执行性能优化');
  }
}