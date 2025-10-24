# TravelWeb 维护指南

## 📖 概述

本文档提供TravelWeb应用在腾讯云服务器上的日常维护、监控、故障排除和优化指南。

## 🔧 日常维护任务

### 每日检查

#### 1. 系统状态检查
```bash
# 检查系统资源使用情况
htop
df -h
free -h

# 检查系统负载
uptime
cat /proc/loadavg

# 检查磁盘IO
iostat -x 1 5
```

#### 2. 服务状态检查
```bash
# 检查关键服务状态
systemctl status nginx mysql

# 检查PM2进程状态
pm2 status
pm2 monit

# 检查端口监听
netstat -tlnp | grep -E ":(80|443|3000|3001|3306)"
```

#### 3. 应用健康检查
```bash
# 执行自动健康检查脚本
/var/www/travelweb/current/scripts/health-check.sh

# 手动检查API健康状态
curl -s https://www.wisdomier.com/api/health | jq
curl -s https://admin.wisdomier.com/api/health | jq

# 检查应用响应时间
curl -w "@curl-format.txt" -o /dev/null -s https://www.wisdomier.com
```

#### 4. 日志检查
```bash
# 检查应用日志
pm2 logs --lines 50

# 检查Nginx访问日志
tail -f /var/log/nginx/travelweb_access.log

# 检查Nginx错误日志
tail -f /var/log/nginx/travelweb_error.log

# 检查MySQL错误日志
tail -f /var/log/mysql/error.log

# 检查系统日志
journalctl -u nginx -u mysql --since "1 hour ago"
```

### 每周维护

#### 1. 系统更新
```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 更新Node.js包（谨慎操作）
npm outdated
npm update

# 清理系统缓存
sudo apt autoremove -y
sudo apt autoclean
```

#### 2. 日志清理
```bash
# 执行日志清理脚本
/var/www/travelweb/current/scripts/backup.sh --cleanup-logs

# 手动清理旧日志
find /var/log/travelweb -name "*.log" -mtime +30 -delete
find /var/log/nginx -name "*.log.*.gz" -mtime +30 -delete

# 清理PM2日志
pm2 flush
```

#### 3. 数据库维护
```bash
# 数据库优化
mysql -u root -p -e "OPTIMIZE TABLE travelweb.users, travelweb.destinations, travelweb.bookings, travelweb.reviews;"

# 检查数据库大小
mysql -u root -p -e "
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'travelweb'
GROUP BY table_schema;"

# 分析慢查询
mysql -u root -p -e "SHOW STATUS LIKE 'Slow_queries';"
```

### 每月维护

#### 1. 安全更新
```bash
# 检查安全更新
sudo unattended-upgrades --dry-run

# 更新SSL证书（如果需要）
sudo /var/www/travelweb/current/scripts/setup-ssl.sh --force-renewal

# 检查防火墙规则
sudo ufw status verbose

# 检查登录日志
last -n 20
grep "Failed password" /var/log/auth.log | tail -20
```

#### 2. 性能优化
```bash
# 分析Nginx访问日志
sudo goaccess /var/log/nginx/travelweb_access.log -o /tmp/nginx-report.html

# 数据库性能分析
mysql -u root -p -e "SHOW PROCESSLIST;"
mysql -u root -p -e "SHOW ENGINE INNODB STATUS\G" | grep -A 20 "LATEST DETECTED DEADLOCK"

# 检查应用性能指标
pm2 show travelweb-main
```

#### 3. 备份验证
```bash
# 验证备份完整性
/var/www/travelweb/current/scripts/backup.sh --verify

# 测试数据库恢复（在测试环境）
mysql -u root -p test_travelweb < /var/backups/travelweb/latest/database.sql
```

## 📊 监控和告警

### 关键指标监控

#### 1. 系统指标
- **CPU使用率**: 应保持在70%以下
- **内存使用率**: 应保持在80%以下
- **磁盘使用率**: 应保持在80%以下
- **网络连接数**: 监控异常连接

#### 2. 应用指标
- **响应时间**: API响应时间应在1秒以内
- **错误率**: 5xx错误率应低于1%
- **并发用户数**: 监控峰值并发
- **数据库连接数**: 监控连接池使用情况

#### 3. 业务指标
- **用户注册数**: 每日新用户注册
- **预订转化率**: 浏览到预订的转化
- **页面加载时间**: 前端页面加载性能
- **搜索响应时间**: 目的地搜索性能

### 告警配置

#### 1. 系统告警
```bash
# CPU使用率告警（超过80%）
if [ $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d',' -f1) -gt 80 ]; then
    echo "CPU使用率过高" | mail -s "系统告警" admin@wisdomier.com
fi

# 内存使用率告警（超过85%）
if [ $(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}') -gt 85 ]; then
    echo "内存使用率过高" | mail -s "系统告警" admin@wisdomier.com
fi

# 磁盘使用率告警（超过85%）
if [ $(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1) -gt 85 ]; then
    echo "磁盘使用率过高" | mail -s "系统告警" admin@wisdomier.com
fi
```

#### 2. 应用告警
```bash
# 应用进程告警
if ! pm2 list | grep -q "online"; then
    echo "应用进程异常" | mail -s "应用告警" admin@wisdomier.com
fi

# 数据库连接告警
if ! mysql -u travelweb -p$DB_PASSWORD -e "SELECT 1;" >/dev/null 2>&1; then
    echo "数据库连接失败" | mail -s "数据库告警" admin@wisdomier.com
fi

# API健康检查告警
if ! curl -s https://www.wisdomier.com/api/health | grep -q "ok"; then
    echo "API健康检查失败" | mail -s "API告警" admin@wisdomier.com
fi
```

## 🔍 故障排除

### 常见问题诊断

#### 1. 应用无响应
```bash
# 检查步骤
1. 检查PM2进程状态
   pm2 status
   pm2 logs

2. 检查端口占用
   netstat -tlnp | grep :3000

3. 检查系统资源
   htop
   free -h

4. 检查应用日志
   tail -f /var/log/travelweb/app.log

# 解决方案
- 重启应用: pm2 restart all
- 重启系统服务: sudo systemctl restart nginx mysql
- 检查配置文件: cat .env
```

#### 2. 数据库连接问题
```bash
# 检查步骤
1. 检查MySQL服务状态
   sudo systemctl status mysql

2. 检查数据库连接
   mysql -u travelweb -p$DB_PASSWORD travelweb -e "SELECT 1;"

3. 检查连接数
   mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"

4. 检查慢查询
   mysql -u root -p -e "SHOW PROCESSLIST;"

# 解决方案
- 重启MySQL: sudo systemctl restart mysql
- 优化查询: 分析慢查询日志
- 调整连接池: 修改应用配置
```

#### 3. 网站访问缓慢
```bash
# 检查步骤
1. 检查服务器负载
   uptime
   iostat -x 1 5

2. 检查网络连接
   netstat -an | grep ESTABLISHED | wc -l

3. 检查Nginx配置
   sudo nginx -t
   tail -f /var/log/nginx/travelweb_access.log

4. 检查数据库性能
   mysql -u root -p -e "SHOW ENGINE INNODB STATUS\G"

# 解决方案
- 重启Nginx: sudo systemctl restart nginx
- 清理缓存: 清理应用和数据库缓存
- 优化配置: 调整Nginx和MySQL配置
```

#### 4. SSL证书问题
```bash
# 检查步骤
1. 检查证书有效性
   openssl x509 -in /etc/ssl/certs/wisdomier.com.crt -text -noout

2. 检查证书过期时间
   openssl x509 -in /etc/ssl/certs/wisdomier.com.crt -noout -enddate

3. 检查Nginx SSL配置
   sudo nginx -t

# 解决方案
- 续期证书: sudo /var/www/travelweb/current/scripts/setup-ssl.sh --force-renewal
- 重新配置: 重新运行SSL配置脚本
```

### 紧急故障处理

#### 1. 服务器宕机
```bash
# 应急步骤
1. 检查服务器状态（通过腾讯云控制台）
2. 尝试重启服务器
3. 检查硬件状态
4. 联系腾讯云技术支持

# 恢复步骤
1. 服务器启动后检查所有服务
2. 验证数据完整性
3. 执行健康检查脚本
4. 通知用户服务恢复
```

#### 2. 数据库损坏
```bash
# 应急步骤
1. 停止应用访问数据库
   pm2 stop all

2. 备份当前数据库状态
   mysqldump -u root -p travelweb > /tmp/emergency_backup.sql

3. 检查数据库完整性
   mysql -u root -p -e "CHECK TABLE travelweb.users, travelweb.destinations;"

4. 从最新备份恢复
   mysql -u root -p travelweb < /var/backups/travelweb/latest/database.sql

5. 重启应用
   pm2 start ecosystem.config.js --env production
```

#### 3. 安全事件
```bash
# 应急步骤
1. 立即更改所有密码
2. 检查访问日志
   grep "POST /api/auth" /var/log/nginx/travelweb_access.log
3. 暂时禁用受影响的功能
4. 分析攻击模式
5. 加强安全措施

# 恢复步骤
1. 修复安全漏洞
2. 更新所有组件
3. 加强监控
4. 通知相关用户
```

## 🚀 性能优化

### 数据库优化

#### 1. 查询优化
```sql
-- 分析慢查询
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';

-- 查看慢查询
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;

-- 分析查询执行计划
EXPLAIN SELECT * FROM destinations WHERE city = 'Beijing';

-- 添加索引
CREATE INDEX idx_destinations_city ON destinations(city);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_reviews_destination_id ON reviews(destination_id);
```

#### 2. 配置优化
```bash
# 编辑MySQL配置
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# 推荐配置（根据服务器规格调整）
[mysqld]
# 基本配置
max_connections = 200
max_connect_errors = 10000
table_open_cache = 2000
max_allowed_packet = 16M

# InnoDB配置
innodb_buffer_pool_size = 1G  # 设置为内存的70-80%
innodb_log_file_size = 256M
innodb_log_buffer_size = 8M
innodb_flush_log_at_trx_commit = 1

# 查询缓存
query_cache_type = 1
query_cache_size = 128M
query_cache_limit = 2M

# 重启MySQL应用配置
sudo systemctl restart mysql
```

### 应用优化

#### 1. Node.js优化
```bash
# 调整PM2配置
# 编辑 ecosystem.config.js
{
  "max_memory_restart": "1G",
  "node_args": "--max-old-space-size=1024",
  "instances": "max",  # 使用所有CPU核心
  "exec_mode": "cluster"
}

# 重启应用
pm2 reload ecosystem.config.js --env production
```

#### 2. 缓存优化
```javascript
// 在应用中添加Redis缓存
const redis = require('redis');
const client = redis.createClient();

// 缓存热门目的地
app.get('/api/destinations/popular', async (req, res) => {
  const cacheKey = 'popular_destinations';
  const cached = await client.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  const destinations = await getPopularDestinations();
  await client.setex(cacheKey, 3600, JSON.stringify(destinations)); // 缓存1小时
  res.json(destinations);
});
```

### Nginx优化

#### 1. 配置优化
```nginx
# 编辑 /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 1024;

# 启用gzip压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;

# 启用缓存
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 限制请求
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20 nodelay;
```

#### 2. 负载均衡
```nginx
# 如果有多个应用实例
upstream travelweb_backend {
    server 127.0.0.1:3000 weight=3;
    server 127.0.0.1:3001 weight=1 backup;
    keepalive 32;
}
```

## 📈 容量规划

### 资源监控

#### 1. 建立基线
```bash
# 记录正常运行时的资源使用情况
echo "$(date): CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}'), Memory: $(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}'), Disk: $(df / | tail -1 | awk '{print $5}')" >> /var/log/travelweb/baseline.log
```

#### 2. 容量预测
- **用户增长**: 监控每日活跃用户数
- **数据增长**: 监控数据库大小增长趋势
- **流量增长**: 监控API请求量增长
- **存储需求**: 监控文件上传量

#### 3. 扩容计划
```bash
# 垂直扩容（升级服务器配置）
- CPU: 当平均使用率超过70%时考虑升级
- 内存: 当使用率超过80%时考虑升级
- 存储: 当使用率超过80%时考虑扩容

# 水平扩容（增加服务器）
- 应用服务器: 配置负载均衡
- 数据库: 考虑读写分离
- 静态资源: 使用CDN
```

## 🔐 安全维护

### 定期安全检查

#### 1. 系统安全
```bash
# 检查系统更新
sudo apt list --upgradable

# 检查开放端口
nmap -sT -O localhost

# 检查用户账户
cat /etc/passwd | grep -v nologin

# 检查sudo权限
sudo cat /etc/sudoers
```

#### 2. 应用安全
```bash
# 检查依赖漏洞
npm audit

# 检查文件权限
find /var/www/travelweb -type f -perm 777

# 检查敏感文件
ls -la /var/www/travelweb/current/.env*
```

#### 3. 网络安全
```bash
# 检查防火墙状态
sudo ufw status verbose

# 检查异常连接
netstat -an | grep :22 | grep ESTABLISHED

# 检查登录失败记录
grep "Failed password" /var/log/auth.log | tail -20
```

### 安全加固

#### 1. 系统加固
```bash
# 禁用root SSH登录
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# 更改SSH端口（可选）
sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

# 配置fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

#### 2. 应用加固
```bash
# 设置严格的文件权限
chmod 600 /var/www/travelweb/current/.env*
chmod 755 /var/www/travelweb/current/uploads

# 配置应用安全头
# 在Nginx配置中添加安全头
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

## 📋 维护检查清单

### 每日检查清单
- [ ] 系统资源使用情况正常
- [ ] 所有服务运行正常
- [ ] 应用健康检查通过
- [ ] 无严重错误日志
- [ ] 备份任务执行成功

### 每周检查清单
- [ ] 系统安全更新
- [ ] 日志文件清理
- [ ] 数据库优化
- [ ] 性能指标分析
- [ ] 备份完整性验证

### 每月检查清单
- [ ] 全面安全检查
- [ ] 容量规划评估
- [ ] 性能优化实施
- [ ] 灾难恢复测试
- [ ] 文档更新

## 📞 紧急联系方式

### 技术团队
- **开发负责人**: dev-lead@wisdomier.com / +86-xxx-xxxx-xxxx
- **运维负责人**: ops-lead@wisdomier.com / +86-xxx-xxxx-xxxx
- **安全负责人**: security@wisdomier.com / +86-xxx-xxxx-xxxx

### 服务提供商
- **腾讯云技术支持**: 95716
- **域名服务商**: 根据实际提供商
- **SSL证书提供商**: Let's Encrypt (免费) 或商业证书提供商

### 监控和告警
- **监控平台**: 配置的监控系统
- **告警通知**: 邮件、短信、钉钉等
- **状态页面**: 可考虑设置服务状态页面

---

**注意事项：**
1. 所有维护操作都应在维护窗口期进行
2. 重要操作前必须备份
3. 遵循变更管理流程
4. 记录所有维护活动
5. 定期更新维护文档