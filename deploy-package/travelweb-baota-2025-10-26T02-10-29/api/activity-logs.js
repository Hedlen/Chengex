// 活动日志API端点
export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method } = req;

    switch (method) {
      case 'GET':
        // 获取活动日志列表
        const { page = 1, limit = 20, type, userId } = req.query;
        
        // 模拟活动日志数据
        const mockLogs = [
          {
            id: '1',
            type: 'login',
            description: '管理员登录成功',
            userId: '1',
            details: { username: 'admin' },
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            type: 'blog_create',
            description: '创建新博客文章',
            userId: '1',
            details: { blogId: '123', title: '测试文章' },
            timestamp: new Date(Date.now() - 3600000).toISOString()
          }
        ];

        let filteredLogs = mockLogs;
        
        if (type) {
          filteredLogs = filteredLogs.filter(log => log.type === type);
        }
        
        if (userId) {
          filteredLogs = filteredLogs.filter(log => log.userId === userId);
        }

        const total = filteredLogs.length;
        const offset = (page - 1) * limit;
        const paginatedLogs = filteredLogs.slice(offset, offset + parseInt(limit));

        return res.json({
          success: true,
          data: paginatedLogs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        });

      case 'POST':
        // 创建活动日志
        const { type: logType, description, userId: logUserId, details } = req.body;
        
        if (!logType || !description) {
          return res.status(400).json({
            success: false,
            error: '日志类型和描述不能为空'
          });
        }

        const newLog = {
          id: Date.now().toString(),
          type: logType,
          description,
          userId: logUserId || 'system',
          details: details || {},
          timestamp: new Date().toISOString()
        };

        // 在实际应用中，这里应该保存到数据库
        console.log('Activity Log Created:', newLog);

        return res.status(201).json({
          success: true,
          data: newLog,
          message: '活动日志创建成功'
        });

      default:
        return res.status(405).json({
          success: false,
          error: '不支持的请求方法'
        });
    }

  } catch (error) {
    console.error('Activity Logs API Error:', error);
    return res.status(500).json({
      success: false,
      error: '服务器内部错误: ' + error.message
    });
  }