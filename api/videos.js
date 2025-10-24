// Videos API
import { query, testConnection, getDatabaseService } from '../database/connection.js';

// 模拟视频数据作为备用方案
const mockVideos = [
  {
    id: 1,
    title: '冰岛极光之旅',
    title_en: 'Iceland Northern Lights Journey',
    description: '跟随我们的镜头，探索冰岛神秘的极光现象，感受大自然的壮丽奇观。在漫长的冬夜中，绿色的光带在天空中舞动，创造出令人难忘的视觉盛宴。',
    description_en: 'Follow our lens to explore Iceland\'s mysterious aurora phenomenon and feel the magnificent wonders of nature. In the long winter nights, green light bands dance in the sky, creating an unforgettable visual feast.',
    video_url: 'https://example.com/videos/iceland-aurora.mp4',
    thumbnail_url: '/images/iceland-aurora-thumb.jpg',
    duration: 480,
    category: '旅游攻略',
    category_id: 1,
    language: 'both',
    status: 'active',
    views_count: 2340,
    tags: ['冰岛', '极光', '自然', '摄影'],
    created_at: '2024-01-10T16:20:00Z',
    updated_at: '2024-01-10T16:20:00Z'
  },
  {
    id: 2,
    title: '东京街头美食探索',
    title_en: 'Tokyo Street Food Exploration',
    description: '深入东京的街头巷尾，发现最地道的日式小吃和隐藏美食。从拉面到寿司，从章鱼烧到和果子，每一样都承载着日本的饮食文化。',
    description_en: 'Dive into Tokyo\'s streets and alleys to discover the most authentic Japanese snacks and hidden delicacies. From ramen to sushi, from takoyaki to wagashi, each carries Japanese food culture.',
    video_url: 'https://example.com/videos/tokyo-street-food.mp4',
    thumbnail_url: '/images/tokyo-food-thumb.jpg',
    duration: 360,
    category: '美食推荐',
    category_id: 2,
    language: 'zh',
    status: 'active',
    views_count: 1890,
    tags: ['东京', '街头美食', '日本', '小吃'],
    created_at: '2024-01-18T11:30:00Z',
    updated_at: '2024-01-18T11:30:00Z'
  },
  {
    id: 3,
    title: '新西兰南岛自驾游',
    title_en: 'New Zealand South Island Road Trip',
    description: '驾车穿越新西兰南岛，欣赏壮丽的山川湖泊和独特的自然风光。从皇后镇到米尔福德峡湾，每一处风景都如画般美丽。',
    description_en: 'Drive through New Zealand\'s South Island, enjoying magnificent mountains, lakes, and unique natural scenery. From Queenstown to Milford Sound, every landscape is as beautiful as a painting.',
    video_url: 'https://example.com/videos/nz-road-trip.mp4',
    thumbnail_url: '/images/nz-landscape-thumb.jpg',
    duration: 600,
    category: '旅游攻略',
    category_id: 1,
    language: 'both',
    status: 'active',
    views_count: 3120,
    tags: ['新西兰', '自驾游', '南岛', '风景'],
    created_at: '2024-01-22T13:45:00Z',
    updated_at: '2024-01-22T13:45:00Z'
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
          // 获取单个视频
          if (useMockData) {
            const video = mockVideos.find(v => v.id == id);
            if (!video) {
              return res.status(404).json({ 
                success: false, 
                error: '视频不存在' 
              });
            }
            
            return res.json({ 
              success: true, 
              data: video 
            });
          } else {
            // 使用数据库抽象层
            const db = getDatabaseService();
            console.log(`🔍 API查询视频 ID: ${id} (类型: ${typeof id})`);
            const videos = await db.query('SELECT * FROM videos WHERE id = ?', [id]);
            console.log(`🎥 查询结果数量: ${videos.length}`);
            
            if (!videos || videos.length === 0) {
              console.log('❌ 视频不存在，返回404');
              return res.status(404).json({ 
                success: false, 
                error: '视频不存在' 
              });
            }
            
            // 增加浏览量
            const video = videos[0];
            video.views = (video.views || 0) + 1;
            await db.execute('UPDATE videos SET views = ? WHERE id = ?', [video.views, id]);
            
            return res.json({ 
              success: true, 
              data: video 
            });
          }
        } else {
          // 获取视频列表
          const { page = 1, limit = 10, status = 'active', category, search, lang = 'zh' } = req.query;
          
          if (useMockData) {
            // 使用模拟数据
            let filteredVideos = mockVideos.filter(video => video.status === status);
            
            if (category) {
              filteredVideos = filteredVideos.filter(video => video.category === category);
            }
            
            if (search) {
              filteredVideos = filteredVideos.filter(video => 
                video.title.includes(search) || video.description.includes(search)
              );
            }
            
            // 根据语言处理标题和描述
            const processedVideos = filteredVideos.map(video => ({
              ...video,
              title: lang === 'en' && video.title_en ? video.title_en : video.title,
              description: lang === 'en' && video.description_en ? video.description_en : video.description
            }));
            
            const total = processedVideos.length;
            const offset = (page - 1) * limit;
            const paginatedVideos = processedVideos.slice(offset, offset + parseInt(limit));
            
            return res.json({
              success: true,
              data: paginatedVideos,
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
            
            // 获取所有视频
            let videos = await db.query('SELECT * FROM videos', []);
            
            // 应用过滤条件
            videos = videos.filter(video => {
              let matches = true;
              
              // 状态过滤
              if (status && video.status !== status) {
                matches = false;
              }
              
              // 分类过滤
              if (category && video.category_id != category) {
                matches = false;
              }
              
              // 搜索过滤
              if (search) {
                const searchLower = search.toLowerCase();
                if (!video.title.toLowerCase().includes(searchLower) && 
                    !video.description.toLowerCase().includes(searchLower)) {
                  matches = false;
                }
              }
              
              return matches;
            });
            
            // 排序
            videos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            const total = videos.length;
            const paginatedVideos = videos.slice(offset, offset + parseInt(limit));
            
            return res.json({
              success: true,
              data: paginatedVideos,
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
        // 创建新视频
        const { 
          title, description, video_url, thumbnail, category_id, 
          duration, status = 'published', author_id = 1
        } = req.body;
        
        if (!title || !video_url) {
          return res.status(400).json({ 
            success: false, 
            error: '标题和视频URL不能为空' 
          });
        }
        
        try {
          const db = getDatabaseService();
          const newVideo = {
            title,
            description: description || '',
            video_url,
            thumbnail: thumbnail || '',
            duration: duration || 0,
            category_id: category_id || 1,
            status,
            author_id,
            views: 0,
            likes: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // 构建INSERT语句
          const columns = Object.keys(newVideo);
          const placeholders = columns.map(() => '?').join(', ');
          const values = Object.values(newVideo);
          
          const insertSQL = `INSERT INTO videos (${columns.join(', ')}) VALUES (${placeholders})`;
          const result = await db.execute(insertSQL, values);
          
          return res.status(201).json({ 
            success: true, 
            data: { id: result.insertId },
            message: '视频创建成功' 
          });
        } catch (error) {
          console.error('创建视频失败:', error);
          return res.status(500).json({ 
            success: false, 
            error: '创建视频失败' 
          });
        }
        
      case 'PUT':
        // 更新视频
        if (!id) {
          return res.status(400).json({ 
            success: false, 
            error: '缺少视频ID' 
          });
        }
        
        const updateData = req.body;
        const updateFields = [];
        const updateParams = [];
        
        Object.keys(updateData).forEach(key => {
          if (key !== 'id') {
            updateFields.push(`${key} = ?`);
            if (key === 'tags' || key === 'tags_en') {
              updateParams.push(JSON.stringify(updateData[key]));
            } else {
              updateParams.push(updateData[key]);
            }
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
          UPDATE videos SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `, updateParams);
        
        return res.json({ 
          success: true, 
          message: '视频更新成功' 
        });
        
      case 'DELETE':
        // 删除视频
        if (!id) {
          return res.status(400).json({ 
            success: false, 
            error: '缺少视频ID' 
          });
        }
        
        await query('DELETE FROM videos WHERE id = ?', [id]);
        
        return res.json({ 
          success: true, 
          message: '视频删除成功' 
        });
        
      default:
        return res.status(405).json({ 
          success: false, 
          error: '不支持的请求方法' 
        });
    }
    
  } catch (error) {
    console.error('Videos API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: '服务器内部错误: ' + error.message 
    });
  }
}