// Blogs API
import { query, testConnection, getDatabaseService } from '../database/connection.js';

// 模拟数据作为备用方案
const mockBlogs = [
  {
    id: 1,
    title: '探索京都的古典美学',
    title_en: 'Exploring Kyoto\'s Classical Aesthetics',
    content: '京都，这座千年古都，承载着日本最深厚的文化底蕴。从清水寺的木质建筑到金阁寺的金碧辉煌，每一处景致都诉说着历史的故事。漫步在石板路上，感受着古老与现代的完美融合。',
    content_en: 'Kyoto, this thousand-year-old ancient capital, carries Japan\'s deepest cultural heritage. From the wooden architecture of Kiyomizu-dera to the golden splendor of Kinkaku-ji, every scene tells a story of history.',
    excerpt: '深入了解京都的传统文化和建筑美学，体验千年古都的独特魅力。',
    excerpt_en: 'Dive deep into Kyoto\'s traditional culture and architectural aesthetics, experiencing the unique charm of this ancient capital.',
    featured_image: '/images/kyoto-temple.jpg',
    category: '旅游攻略',
    category_id: 1,
    author: 'Admin',
    status: 'published',
    views_count: 1250,
    tags: ['京都', '日本', '文化', '寺庙'],
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    title: '巴黎美食之旅',
    title_en: 'A Culinary Journey Through Paris',
    content: '巴黎不仅是艺术之都，更是美食天堂。从街角的小咖啡馆到米其林星级餐厅，这里汇聚了世界上最精致的法式料理。每一道菜都是艺术品，每一口都是享受。',
    content_en: 'Paris is not only the capital of art but also a paradise for food lovers. From corner cafes to Michelin-starred restaurants, it brings together the world\'s most exquisite French cuisine.',
    excerpt: '探索巴黎的美食文化，从传统法式料理到现代创新菜品。',
    excerpt_en: 'Explore Paris\'s culinary culture, from traditional French cuisine to modern innovative dishes.',
    featured_image: '/images/paris-food.jpg',
    category: '美食推荐',
    category_id: 2,
    author: 'Admin',
    status: 'published',
    views_count: 980,
    tags: ['巴黎', '美食', '法国', '料理'],
    created_at: '2024-01-20T14:15:00Z',
    updated_at: '2024-01-20T14:15:00Z'
  },
  {
    id: 3,
    title: '马尔代夫度假村体验',
    title_en: 'Maldives Resort Experience',
    content: '在马尔代夫的水上别墅中醒来，推开门就是碧蓝的印度洋。这里的每一个度假村都是一个私人天堂，提供世界级的服务和无与伦比的海景。',
    content_en: 'Waking up in a water villa in the Maldives, opening the door to the azure Indian Ocean. Every resort here is a private paradise offering world-class service and unparalleled ocean views.',
    excerpt: '体验马尔代夫顶级度假村的奢华服务和绝美海景。',
    excerpt_en: 'Experience the luxury services and stunning ocean views of top Maldives resorts.',
    featured_image: '/images/maldives-resort.jpg',
    category: '住宿体验',
    category_id: 3,
    author: 'Admin',
    status: 'published',
    views_count: 1580,
    tags: ['马尔代夫', '度假村', '海岛', '奢华'],
    created_at: '2024-01-25T09:45:00Z',
    updated_at: '2024-01-25T09:45:00Z'
  }
];

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 测试数据库连接
    const connected = await testConnection();
    const useMockData = !connected;

    const { method } = req;
    const { id } = req.query;

    switch (method) {
      case 'GET':
        if (id) {
          // 获取单个博客
          if (useMockData) {
            const blog = mockBlogs.find(b => b.id == id);
            if (!blog) {
              return res.status(404).json({ 
                success: false, 
                error: '博客不存在' 
              });
            }
            
            return res.json({ 
              success: true, 
              data: mapBlogFields(blog, req.query.lang)
            });
          } else {
            // 使用数据库抽象层
            const db = getDatabaseService();
            console.log(`🔍 API查询博客 ID: ${id} (类型: ${typeof id})`);
            const blogs = await db.query('SELECT * FROM blogs WHERE id = ?', [id]);
            console.log(`📝 查询结果数量: ${blogs.length}`);
            
            if (!blogs || blogs.length === 0) {
              console.log('❌ 博客不存在，返回404');
              return res.status(404).json({ 
                success: false, 
                error: '博客不存在' 
              });
            }
            
            // 增加浏览量
            const blog = blogs[0];
            blog.views = (blog.views || 0) + 1;
            await db.execute('UPDATE blogs SET views = ? WHERE id = ?', [blog.views, id]);
            
            return res.json({ 
              success: true, 
              data: mapBlogFields(blog, req.query.lang)
            });
          }
        } else {
          // 获取博客列表
          const { page = 1, limit = 10, status = 'published', category, search, lang = 'zh' } = req.query;
          
          if (useMockData) {
            // 使用模拟数据
            let filteredBlogs = mockBlogs.filter(blog => blog.status === status);
            
            if (category) {
              filteredBlogs = filteredBlogs.filter(blog => blog.category === category);
            }
            
            if (search) {
              filteredBlogs = filteredBlogs.filter(blog => 
                blog.title.includes(search) || blog.content.includes(search)
              );
            }
            
            const total = filteredBlogs.length;
            const offset = (page - 1) * limit;
            const paginatedBlogs = filteredBlogs.slice(offset, offset + parseInt(limit));
            
            return res.json({
              success: true,
              data: paginatedBlogs.map(blog => mapBlogFields(blog, lang)),
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
              }
            });
          } else {
            // 使用数据库抽象层
            const db = getDatabaseService();
            const offset = (page - 1) * limit;
            
            // 构建查询条件
            let whereConditions = { status };
            
            if (category) {
              whereConditions.category_id = category;
            }
            
            // 获取所有博客
            let blogs = await db.query('SELECT * FROM blogs', []);
            
            // 应用过滤条件
            blogs = blogs.filter(blog => {
              let matches = true;
              
              // 状态过滤
              if (whereConditions.status && blog.status !== whereConditions.status) {
                matches = false;
              }
              
              // 分类过滤
              if (whereConditions.category_id && blog.category_id != whereConditions.category_id) {
                matches = false;
              }
              
              // 搜索过滤
              if (search) {
                const searchLower = search.toLowerCase();
                if (!blog.title.toLowerCase().includes(searchLower) && 
                    !blog.content.toLowerCase().includes(searchLower)) {
                  matches = false;
                }
              }
              
              return matches;
            });
            
            // 排序
            blogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            const total = blogs.length;
            const paginatedBlogs = blogs.slice(offset, offset + parseInt(limit));
            
            return res.json({
              success: true,
              data: paginatedBlogs.map(blog => mapBlogFields(blog, lang)),
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
              }
            });
          }
        }
        
      case 'POST':
        // 创建新博客
        const { title, content, excerpt, featuredImage, category_id, tags, status = 'published', author_id = 1 } = req.body;
        
        if (!title || !content) {
          return res.status(400).json({ 
            success: false, 
            error: '标题和内容不能为空' 
          });
        }
        
        const db = getDatabaseService();
        const newBlog = {
          title,
          content,
          excerpt,
          featured_image: featuredImage || '', // 映射字段名
          category_id: category_id || 1,
          tags: Array.isArray(tags) ? JSON.stringify(tags) : '[]',
          status,
          author_id,
          views: 0,
          likes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // 构建INSERT语句
        const columns = Object.keys(newBlog);
        const placeholders = columns.map(() => '?').join(', ');
        const values = Object.values(newBlog);
        
        const insertSQL = `INSERT INTO blogs (${columns.join(', ')}) VALUES (${placeholders})`;
        const result = await db.execute(insertSQL, values);
        
        // 获取新创建的博客并返回映射后的数据
        const createdBlog = await db.query('SELECT * FROM blogs WHERE id = ?', [result.insertId]);
        
        return res.status(201).json({ 
          success: true, 
          data: mapBlogFields(createdBlog[0]),
          message: '博客创建成功' 
        });
        
      case 'PUT':
        // 更新博客
        if (!id) {
          return res.status(400).json({ 
            success: false, 
            error: '缺少博客ID' 
          });
        }
        
        const updateData = req.body;
        const updateFields = [];
        const updateParams = [];
        
        Object.keys(updateData).forEach(key => {
          if (key !== 'id') {
            // 映射前端字段名到数据库字段名
            let dbFieldName = key;
            if (key === 'featuredImage') {
              dbFieldName = 'featured_image';
            }
            
            updateFields.push(`${dbFieldName} = ?`);
            updateParams.push(key === 'tags' ? JSON.stringify(updateData[key]) : updateData[key]);
          }
        });
        
        if (updateFields.length === 0) {
          return res.status(400).json({ 
            success: false, 
            error: '没有要更新的字段' 
          });
        }
        
        updateParams.push(id);
        await query(`
          UPDATE blogs SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `, updateParams);
        
        // 获取更新后的博客并返回映射后的数据
        const updatedBlog = await query('SELECT * FROM blogs WHERE id = ?', [id]);
        
        return res.json({ 
          success: true, 
          data: mapBlogFields(updatedBlog[0]),
          message: '博客更新成功' 
        });
        
      case 'DELETE':
        // 删除博客
        if (!id) {
          return res.status(400).json({ 
            success: false, 
            error: '缺少博客ID' 
          });
        }
        
        await query('DELETE FROM blogs WHERE id = ?', [id]);
        
        return res.json({ 
          success: true, 
          message: '博客删除成功' 
        });
        
      default:
        return res.status(405).json({ 
          success: false, 
          error: '不支持的请求方法' 
        });
    }
    
  } catch (error) {
    console.error('Blogs API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: '服务器内部错误: ' + error.message 
    });
  }
}

// 字段映射函数：将数据库字段映射为前端期望的字段
function mapBlogFields(blog, lang = 'zh') {
  if (!blog) return null;
  
  // 安全的日期转换函数
  const safeDate = (dateValue) => {
    if (!dateValue) return new Date().toISOString();
    
    try {
      // 如果是数字（时间戳），直接使用
      if (typeof dateValue === 'number') {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
      }
      
      // 如果是字符串，尝试解析
      if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
      }
      
      // 其他情况返回当前时间
      return new Date().toISOString();
    } catch (error) {
      console.error('Date conversion error:', error, 'for value:', dateValue);
      return new Date().toISOString();
    }
  };
  
  return {
    ...blog,
    // 根据语言映射标题和内容
    title: lang === 'en' && blog.title_en ? blog.title_en : blog.title,
    content: lang === 'en' && blog.content_en ? blog.content_en : blog.content,
    excerpt: lang === 'en' && blog.excerpt_en ? blog.excerpt_en : blog.excerpt,
    // 映射图片字段
    featuredImage: blog.cover_image || blog.featured_image || blog.featuredImage || '',
    // 映射日期字段，确保格式正确
    createdAt: safeDate(blog.created_at || blog.createdAt),
    updatedAt: safeDate(blog.updated_at || blog.updatedAt),
    // 映射浏览量字段
    viewCount: blog.views_count || blog.views || blog.viewCount || 0,
    // 确保标签是数组格式
    tags: typeof blog.tags === 'string' ? JSON.parse(blog.tags || '[]') : (blog.tags || []),
    // 移除数据库原始字段，避免混淆
    cover_image: undefined,
    featured_image: undefined,
    created_at: undefined,
    updated_at: undefined,
    views_count: undefined,
    views: undefined,
    title_en: undefined,
    content_en: undefined,
    excerpt_en: undefined
  };
}