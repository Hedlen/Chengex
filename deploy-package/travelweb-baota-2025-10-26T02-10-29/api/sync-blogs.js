// 简单的博客数据同步API模拟器
// 这个文件模拟了将管理后台的博客数据同步到共享JSON文件的过程

const fs = require('fs');
const path = require('path');

// 博客数据同步处理函数
function syncBlogs(req, res) {
  try {
    // 获取请求体中的博客数据
    const blogs = req.body;
    
    if (!Array.isArray(blogs)) {
      return res.status(400).json({ 
        success: false, 
        error: '无效的博客数据格式' 
      });
    }

    // 共享数据文件路径
    const sharedDataPath = path.join(__dirname, '..', 'shared', 'data', 'blogs.json');
    
    // 确保目录存在
    const dir = path.dirname(sharedDataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 写入博客数据到共享JSON文件
    fs.writeFileSync(sharedDataPath, JSON.stringify(blogs, null, 2), 'utf8');
    
    console.log(`Successfully synced ${blogs.length} blogs to shared data file`);
    
    res.json({ 
      success: true, 
      message: `成功同步 ${blogs.length} 篇博客到共享数据文件`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error syncing blogs:', error);
    res.status(500).json({ 
      success: false, 
      error: '同步博客数据失败: ' + error.message 
    });
  }
}

module.exports = { syncBlogs };