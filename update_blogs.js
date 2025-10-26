// 更新博客分类和状态的脚本
import { dbManager } from './database/DatabaseFactory.js';

async function updateBlogs() {
  try {
    console.log('开始更新博客数据...');
    
    // 初始化数据库连接
    await dbManager.initialize();
    const db = dbManager.getAdapter();
    
    // 1. 查看当前所有博客的分类和状态
    console.log('\n=== 当前博客数据 ===');
    const allBlogs = await db.query('SELECT id, title, category, status FROM blogs ORDER BY id');
    allBlogs.forEach(blog => {
      console.log(`ID: ${blog.id}, 标题: ${blog.title.substring(0, 30)}..., 分类: ${blog.category}, 状态: ${blog.status}`);
    });
    
    // 2. 将分类为"文化体验"的博客改为"旅游攻略"
    console.log('\n=== 更新分类为"文化体验"的博客 ===');
    const cultureBlogs = await db.query('SELECT id, title FROM blogs WHERE category = ?', ['文化体验']);
    
    if (cultureBlogs.length > 0) {
      console.log(`找到 ${cultureBlogs.length} 篇"文化体验"分类的博客:`);
      cultureBlogs.forEach(blog => {
        console.log(`- ID: ${blog.id}, 标题: ${blog.title}`);
      });
      
      // 更新分类为"旅游攻略"
      await db.execute('UPDATE blogs SET category = ? WHERE category = ?', ['旅游攻略', '文化体验']);
      console.log('✅ 已将"文化体验"分类更新为"旅游攻略"');
    } else {
      console.log('没有找到"文化体验"分类的博客');
    }
    
    // 3. 将状态为"draft"的博客改为"published"
    console.log('\n=== 更新状态为"draft"的博客 ===');
    const draftBlogs = await db.query('SELECT id, title FROM blogs WHERE status = ?', ['draft']);
    
    if (draftBlogs.length > 0) {
      console.log(`找到 ${draftBlogs.length} 篇草稿状态的博客:`);
      draftBlogs.forEach(blog => {
        console.log(`- ID: ${blog.id}, 标题: ${blog.title}`);
      });
      
      // 更新状态为"published"
      await db.execute('UPDATE blogs SET status = ? WHERE status = ?', ['published', 'draft']);
      console.log('✅ 已将草稿状态更新为已发布');
    } else {
      console.log('没有找到草稿状态的博客');
    }
    
    // 4. 显示更新后的结果
    console.log('\n=== 更新后的博客数据 ===');
    const updatedBlogs = await db.query('SELECT id, title, category, status FROM blogs ORDER BY id');
    updatedBlogs.forEach(blog => {
      console.log(`ID: ${blog.id}, 标题: ${blog.title.substring(0, 30)}..., 分类: ${blog.category}, 状态: ${blog.status}`);
    });
    
    console.log('\n✅ 博客数据更新完成！');
    
  } catch (error) {
    console.error('❌ 更新博客数据失败:', error);
  } finally {
    // 关闭数据库连接
    await dbManager.close();
  }
}

// 运行更新脚本
updateBlogs();