// 🚀 数据库连接测试工具
import { getMySQLConfig, createMySQLPool, testMySQLConnection } from './database/mysql-config.js';

async function testConnection() {
  console.log('🔍 测试数据库连接...');
  console.log('=' .repeat(50));
  
  const config = getMySQLConfig();
  console.log('📋 连接配置:');
  console.log(`主机: ${config.host}`);
  console.log(`端口: ${config.port}`);
  console.log(`数据库: ${config.database}`);
  console.log(`用户: ${config.user}`);
  console.log(`密码: ${config.password ? '***已设置***' : '未设置'}`);
  
  try {
    console.log('\n🔗 创建连接池...');
    const pool = createMySQLPool();
    
    console.log('✅ 连接池创建成功');
    
    console.log('\n🧪 测试连接...');
    const isConnected = await testMySQLConnection(pool);
    
    if (isConnected) {
      console.log('✅ 数据库连接成功！');
      
      // 测试查询
      console.log('\n📊 测试查询...');
      const connection = await pool.getConnection();
      
      try {
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ 查询测试成功:', rows);
        
        // 检查数据库版本
        const [version] = await connection.execute('SELECT VERSION() as version');
        console.log(`📋 MySQL版本: ${version[0].version}`);
        
        // 检查当前数据库
        const [db] = await connection.execute('SELECT DATABASE() as current_db');
        console.log(`📋 当前数据库: ${db[0].current_db}`);
        
        // 检查表
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`📋 数据库表数量: ${tables.length}`);
        if (tables.length > 0) {
          console.log('📋 表列表:', tables.map(t => Object.values(t)[0]).join(', '));
        }
        
      } finally {
        connection.release();
      }
      
    } else {
      console.log('❌ 数据库连接失败');
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ 连接测试失败:', error.message);
    console.error('错误代码:', error.code);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 解决方案:');
      console.log('1. 检查用户名和密码是否正确');
      console.log('2. 确保用户有访问数据库的权限');
      console.log('3. 在宝塔面板中检查MySQL用户权限设置');
      console.log('4. 可能需要为用户授予权限:');
      console.log('   GRANT ALL PRIVILEGES ON travelweb_db.* TO \'travelweb_user\'@\'localhost\';');
      console.log('   FLUSH PRIVILEGES;');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 解决方案:');
      console.log('1. 数据库不存在，需要先创建数据库');
      console.log('2. 在宝塔面板中创建名为 "travelweb_db" 的数据库');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 解决方案:');
      console.log('1. MySQL服务未启动');
      console.log('2. 检查MySQL端口是否正确');
      console.log('3. 检查防火墙设置');
    }
  }
}

// 运行测试
testConnection().catch(console.error);