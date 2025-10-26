// 认证API端点 - 管理员登录
export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: '仅支持POST请求'
    });
  }

  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码不能为空'
      });
    }

    // 硬编码的管理员凭据（在实际应用中应该从数据库验证）
    const ADMIN_CREDENTIALS = {
      username: 'admin',
      password: 'admin123'
    };

    // 验证凭据
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      // 生成简单的会话token（在实际应用中应该使用JWT）
      const token = 'admin-session-token-' + Date.now();
      
      const userData = {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['*'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return res.json({
        success: true,
        data: {
          user: userData,
          token: token
        },
        message: '登录成功'
      });
    } else {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }

  } catch (error) {
    console.error('Login API Error:', error);
    return res.status(500).json({
      success: false,
      error: '服务器内部错误: ' + error.message
    });
  }
}