const { DatabaseService } = require('./database/DatabaseService');

async function checkCategories() {
  try {
    console.log('Connecting to database...');
    const dbService = new DatabaseService();
    const db = await dbService.getAdapter();
    
    console.log('\n=== Categories ===');
    const categories = await db.query('SELECT * FROM categories');
    console.log('Categories found:', categories.length);
    categories.forEach(cat => {
      console.log(`ID: ${cat.id}, name: "${cat.name}", slug: "${cat.slug}"`);
    });
    
    console.log('\n=== Blogs with category_id ===');
    const blogs = await db.query('SELECT id, title, category_id, published FROM blogs LIMIT 10');
    console.log('Blogs found:', blogs.length);
    blogs.forEach(blog => {
      console.log(`Blog ID: ${blog.id}, title: "${blog.title}", category_id: ${blog.category_id}, published: ${blog.published}`);
    });
    
    await db.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCategories();