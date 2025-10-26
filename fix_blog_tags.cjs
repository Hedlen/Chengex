async function fixBlogTags() {
  try {
    console.log('开始修复博客标签问题...');
    
    // 使用API方式更新数据
    const fetch = (await import('node-fetch')).default;
    
    // 1. 获取所有博客
    console.log('\n1. 获取所有博客数据...');
    const response = await fetch('http://localhost:3001/api/blogs');
    const blogs = await response.json();
    
    console.log(`找到 ${blogs.length} 篇博客`);
    
    // 2. 检查需要修复的博客
    let needsUpdate = [];
    
    blogs.forEach(blog => {
      let needUpdate = false;
      let updates = {};
      
      // 检查category_id为6的博客（对应culture分类）
      if (blog.category_id === '6' || blog.category_id === 6) {
        console.log(`博客 ${blog.id} "${blog.title}" 的分类需要修改 (category_id: ${blog.category_id})`);
        updates.category_id = '1'; // 改为旅游攻略分类
        needUpdate = true;
      }
      
      // 检查published字段为空的博客
      if (!blog.published || blog.published === '' || blog.published === null) {
        console.log(`博客 ${blog.id} "${blog.title}" 的发布状态需要修改 (published: ${blog.published})`);
        updates.published = 1; // 设置为已发布
        needUpdate = true;
      }
      
      if (needUpdate) {
        needsUpdate.push({
          id: blog.id,
          title: blog.title,
          updates: updates
        });
      }
    });
    
    console.log(`\n需要更新 ${needsUpdate.length} 篇博客`);
    
    // 3. 执行更新
    if (needsUpdate.length > 0) {
      for (const blog of needsUpdate) {
        try {
          console.log(`正在更新博客 ${blog.id}: "${blog.title}"`);
          
          // 构建更新URL
          const updateUrl = `http://localhost:3001/api/blogs/${blog.id}`;
          const updateResponse = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(blog.updates)
          });
          
          if (updateResponse.ok) {
            console.log(`✓ 博客 ${blog.id} 更新成功`);
          } else {
            console.log(`✗ 博客 ${blog.id} 更新失败: ${updateResponse.status}`);
          }
        } catch (error) {
          console.error(`更新博客 ${blog.id} 时出错:`, error.message);
        }
      }
    } else {
      console.log('没有需要更新的博客');
    }
    
    // 4. 验证修复结果
    console.log('\n4. 验证修复结果...');
    const verifyResponse = await fetch('http://localhost:3001/api/blogs');
    const updatedBlogs = await verifyResponse.json();
    
    let cultureCount = 0;
    let draftCount = 0;
    
    updatedBlogs.forEach(blog => {
      if (blog.category_id === '6' || blog.category_id === 6) {
        cultureCount++;
      }
      if (!blog.published || blog.published === '' || blog.published === null) {
        draftCount++;
      }
    });
    
    console.log(`\n修复结果:`);
    console.log(`- 仍有 ${cultureCount} 篇博客的分类为culture (category_id=6)`);
    console.log(`- 仍有 ${draftCount} 篇博客的发布状态为空`);
    
    if (cultureCount === 0 && draftCount === 0) {
      console.log('✓ 所有问题已修复！');
    } else {
      console.log('⚠ 仍有问题需要解决');
    }
    
  } catch (error) {
    console.error('修复过程中出错:', error);
  }
}

fixBlogTags();