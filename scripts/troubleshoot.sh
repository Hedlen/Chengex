#!/bin/bash

# 故障排除脚本
# 用于诊断和修复TravelWeb应用的常见问题

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/var/log/travelweb/troubleshoot.log"
DIAGNOSTIC_REPORT="/tmp/diagnostic-report-$(date +%Y%m%d-%H%M%S).txt"

# 应用配置
APP_DOMAIN="${APP_DOMAIN:-www.wisdomier.com}"
APP_PORT="${APP_PORT:-3000}"
ADMIN_PORT="${ADMIN_PORT:-3001}"
PROJECT_PATH="${PROJECT_PATH:-/var/www/travelweb}"

# 故障排除配置
AUTO_FIX="${AUTO_FIX:-false}"
BACKUP_BEFORE_FIX="${BACKUP_BEFORE_FIX:-true}"
RESTART_SERVICES="${RESTART_SERVICES:-false}"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 问题统计
TOTAL_ISSUES=0
FIXED_ISSUES=0
UNFIXED_ISSUES=0

# 日志函数
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

info() {
    log "INFO" "${BLUE}$@${NC}"
}

warn() {
    log "WARN" "${YELLOW}$@${NC}"
}

error() {
    log "ERROR" "${RED}$@${NC}"
}

success() {
    log "SUCCESS" "${GREEN}$@${NC}"
}

debug() {
    if [ "$VERBOSE" = "true" ]; then
        log "DEBUG" "${PURPLE}$@${NC}"
    fi
}

# 问题记录
record_issue() {
    local issue_name=$1
    local status=$2
    local description=$3
    local solution=$4
    
    TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
    
    case "$status" in
        "FIXED")
            FIXED_ISSUES=$((FIXED_ISSUES + 1))
            success "✓ 已修复: $issue_name - $description"
            ;;
        "DETECTED")
            UNFIXED_ISSUES=$((UNFIXED_ISSUES + 1))
            error "✗ 发现问题: $issue_name - $description"
            ;;
        "SKIPPED")
            warn "⚠ 跳过: $issue_name - $description"
            ;;
    esac
    
    # 记录到诊断报告
    {
        echo "[$status] $issue_name"
        echo "  描述: $description"
        if [ -n "$solution" ]; then
            echo "  解决方案: $solution"
        fi
        echo ""
    } >> "$DIAGNOSTIC_REPORT"
}

# 创建备份
create_backup() {
    if [ "$BACKUP_BEFORE_FIX" != "true" ]; then
        return 0
    fi
    
    info "创建修复前备份..."
    
    local backup_dir="/var/backups/travelweb/troubleshoot-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # 备份配置文件
    if [ -f "$PROJECT_PATH/.env.tencent" ]; then
        cp "$PROJECT_PATH/.env.tencent" "$backup_dir/"
    fi
    
    if [ -f "$PROJECT_PATH/ecosystem.config.js" ]; then
        cp "$PROJECT_PATH/ecosystem.config.js" "$backup_dir/"
    fi
    
    # 备份Nginx配置
    if [ -f "/etc/nginx/sites-available/travelweb" ]; then
        cp "/etc/nginx/sites-available/travelweb" "$backup_dir/"
    fi
    
    success "备份已创建: $backup_dir"
    echo "$backup_dir" > "/tmp/troubleshoot-backup-path"
}

# 检查并修复系统服务
fix_system_services() {
    info "检查系统服务状态..."
    
    # 检查MySQL服务
    if ! systemctl is-active --quiet mysql; then
        record_issue "MySQL服务" "DETECTED" "MySQL服务未运行" "启动MySQL服务"
        
        if [ "$AUTO_FIX" = "true" ]; then
            if systemctl start mysql; then
                record_issue "MySQL服务启动" "FIXED" "MySQL服务已启动" ""
            else
                record_issue "MySQL服务启动" "DETECTED" "MySQL服务启动失败" "检查MySQL配置和日志"
            fi
        fi
    else
        debug "MySQL服务运行正常"
    fi
    
    # 检查Nginx服务
    if ! systemctl is-active --quiet nginx; then
        record_issue "Nginx服务" "DETECTED" "Nginx服务未运行" "启动Nginx服务"
        
        if [ "$AUTO_FIX" = "true" ]; then
            if systemctl start nginx; then
                record_issue "Nginx服务启动" "FIXED" "Nginx服务已启动" ""
            else
                record_issue "Nginx服务启动" "DETECTED" "Nginx服务启动失败" "检查Nginx配置"
            fi
        fi
    else
        debug "Nginx服务运行正常"
    fi
    
    # 检查防火墙配置
    if command -v ufw >/dev/null 2>&1; then
        if ! ufw status | grep -q "80/tcp.*ALLOW"; then
            record_issue "防火墙HTTP" "DETECTED" "HTTP端口未开放" "开放80端口"
            
            if [ "$AUTO_FIX" = "true" ]; then
                ufw allow 80/tcp >/dev/null 2>&1
                record_issue "防火墙HTTP修复" "FIXED" "HTTP端口已开放" ""
            fi
        fi
        
        if ! ufw status | grep -q "443/tcp.*ALLOW"; then
            record_issue "防火墙HTTPS" "DETECTED" "HTTPS端口未开放" "开放443端口"
            
            if [ "$AUTO_FIX" = "true" ]; then
                ufw allow 443/tcp >/dev/null 2>&1
                record_issue "防火墙HTTPS修复" "FIXED" "HTTPS端口已开放" ""
            fi
        fi
    fi
}

# 检查并修复数据库问题
fix_database_issues() {
    info "检查数据库连接和配置..."
    
    local db_host="${DB_HOST:-localhost}"
    local db_user="${DB_USER:-travelweb}"
    local db_password="${DB_PASSWORD}"
    local db_name="${DB_NAME:-travelweb}"
    
    # 检查数据库连接
    if ! mysql -h"$db_host" -u"$db_user" -p"$db_password" -e "SELECT 1;" >/dev/null 2>&1; then
        record_issue "数据库连接" "DETECTED" "无法连接到数据库" "检查数据库配置和凭据"
        
        # 尝试修复数据库连接
        if [ "$AUTO_FIX" = "true" ]; then
            # 检查MySQL是否运行
            if ! systemctl is-active --quiet mysql; then
                systemctl start mysql
                sleep 5
            fi
            
            # 再次尝试连接
            if mysql -h"$db_host" -u"$db_user" -p"$db_password" -e "SELECT 1;" >/dev/null 2>&1; then
                record_issue "数据库连接修复" "FIXED" "数据库连接已恢复" ""
            fi
        fi
    else
        debug "数据库连接正常"
        
        # 检查数据库表
        local table_count=$(mysql -h"$db_host" -u"$db_user" -p"$db_password" "$db_name" -e "SHOW TABLES;" 2>/dev/null | wc -l)
        if [ "$table_count" -le 1 ]; then
            record_issue "数据库表" "DETECTED" "数据库表缺失或为空" "运行数据库迁移脚本"
            
            if [ "$AUTO_FIX" = "true" ] && [ -f "$PROJECT_ROOT/create-mysql-schema.sql" ]; then
                mysql -h"$db_host" -u"$db_user" -p"$db_password" "$db_name" < "$PROJECT_ROOT/create-mysql-schema.sql" 2>/dev/null
                record_issue "数据库表修复" "FIXED" "数据库表已创建" ""
            fi
        fi
    fi
    
    # 检查数据库性能
    local slow_queries=$(mysql -h"$db_host" -u"$db_user" -p"$db_password" -e "SHOW STATUS LIKE 'Slow_queries';" 2>/dev/null | awk 'NR==2 {print $2}')
    if [ -n "$slow_queries" ] && [ "$slow_queries" -gt 100 ]; then
        record_issue "数据库性能" "DETECTED" "发现 $slow_queries 个慢查询" "优化数据库查询和索引"
    fi
}

# 检查并修复应用进程
fix_application_processes() {
    info "检查应用进程状态..."
    
    if ! command -v pm2 >/dev/null 2>&1; then
        record_issue "PM2" "DETECTED" "PM2未安装" "安装PM2: npm install -g pm2"
        return
    fi
    
    local pm2_status=$(pm2 jlist 2>/dev/null)
    
    # 检查主应用进程
    if ! echo "$pm2_status" | jq -e '.[] | select(.name=="travelweb-main" and .pm2_env.status=="online")' >/dev/null 2>&1; then
        record_issue "主应用进程" "DETECTED" "主应用进程未运行" "启动主应用进程"
        
        if [ "$AUTO_FIX" = "true" ]; then
            cd "$PROJECT_PATH" || return
            
            # 尝试启动应用
            if pm2 start ecosystem.config.js --only travelweb-main >/dev/null 2>&1; then
                record_issue "主应用进程修复" "FIXED" "主应用进程已启动" ""
            else
                record_issue "主应用进程修复" "DETECTED" "主应用进程启动失败" "检查应用配置和依赖"
            fi
        fi
    else
        debug "主应用进程运行正常"
        
        # 检查进程健康状态
        local restart_count=$(echo "$pm2_status" | jq -r '.[] | select(.name=="travelweb-main") | .pm2_env.restart_time')
        if [ "$restart_count" -gt 10 ]; then
            record_issue "主应用稳定性" "DETECTED" "应用重启次数过多: $restart_count" "检查应用日志和内存使用"
        fi
    fi
    
    # 检查后台任务进程
    if ! echo "$pm2_status" | jq -e '.[] | select(.name=="travelweb-worker" and .pm2_env.status=="online")' >/dev/null 2>&1; then
        record_issue "后台任务进程" "DETECTED" "后台任务进程未运行" "启动后台任务进程"
        
        if [ "$AUTO_FIX" = "true" ]; then
            cd "$PROJECT_PATH" || return
            
            if pm2 start ecosystem.config.js --only travelweb-worker >/dev/null 2>&1; then
                record_issue "后台任务进程修复" "FIXED" "后台任务进程已启动" ""
            fi
        fi
    fi
    
    # 检查内存使用
    local memory_usage=$(echo "$pm2_status" | jq -r '.[] | select(.name=="travelweb-main") | .monit.memory // 0')
    if [ "$memory_usage" -gt 1073741824 ]; then  # 1GB
        local memory_mb=$((memory_usage / 1024 / 1024))
        record_issue "内存使用" "DETECTED" "应用内存使用过高: ${memory_mb}MB" "重启应用或优化内存使用"
        
        if [ "$AUTO_FIX" = "true" ] && [ "$RESTART_SERVICES" = "true" ]; then
            pm2 restart travelweb-main >/dev/null 2>&1
            record_issue "内存使用修复" "FIXED" "应用已重启" ""
        fi
    fi
}

# 检查并修复网络连接
fix_network_issues() {
    info "检查网络连接..."
    
    # 检查端口占用
    if ! netstat -tlnp | grep ":$APP_PORT " >/dev/null; then
        record_issue "应用端口" "DETECTED" "应用端口 $APP_PORT 未监听" "启动应用或检查端口配置"
    fi
    
    if ! netstat -tlnp | grep ":80 " >/dev/null; then
        record_issue "HTTP端口" "DETECTED" "HTTP端口80未监听" "启动Nginx或检查配置"
    fi
    
    if ! netstat -tlnp | grep ":443 " >/dev/null; then
        record_issue "HTTPS端口" "DETECTED" "HTTPS端口443未监听" "配置SSL或启动HTTPS服务"
    fi
    
    # 检查DNS解析
    if ! nslookup "$APP_DOMAIN" >/dev/null 2>&1; then
        record_issue "DNS解析" "DETECTED" "域名 $APP_DOMAIN DNS解析失败" "检查DNS配置"
    fi
    
    # 检查外部连接
    if ! curl -s --max-time 10 "http://localhost:$APP_PORT/api/health" >/dev/null; then
        record_issue "本地HTTP连接" "DETECTED" "无法连接到本地应用" "检查应用状态和防火墙"
    fi
    
    if ! curl -s --max-time 10 "https://$APP_DOMAIN/api/health" >/dev/null 2>&1; then
        record_issue "外部HTTPS连接" "DETECTED" "无法通过HTTPS访问应用" "检查SSL配置和DNS"
    fi
}

# 检查并修复文件权限
fix_file_permissions() {
    info "检查文件权限..."
    
    # 检查项目目录权限
    if [ ! -r "$PROJECT_PATH" ]; then
        record_issue "项目目录读权限" "DETECTED" "项目目录不可读" "修复目录权限"
        
        if [ "$AUTO_FIX" = "true" ]; then
            chmod -R 755 "$PROJECT_PATH" 2>/dev/null
            record_issue "项目目录权限修复" "FIXED" "项目目录权限已修复" ""
        fi
    fi
    
    # 检查上传目录权限
    local upload_dir="$PROJECT_PATH/uploads"
    if [ -d "$upload_dir" ] && [ ! -w "$upload_dir" ]; then
        record_issue "上传目录权限" "DETECTED" "上传目录不可写" "修复上传目录权限"
        
        if [ "$AUTO_FIX" = "true" ]; then
            chmod 755 "$upload_dir" 2>/dev/null
            chown www-data:www-data "$upload_dir" 2>/dev/null
            record_issue "上传目录权限修复" "FIXED" "上传目录权限已修复" ""
        fi
    fi
    
    # 检查日志目录权限
    local log_dir="/var/log/travelweb"
    if [ ! -w "$log_dir" ] 2>/dev/null; then
        record_issue "日志目录权限" "DETECTED" "日志目录不可写" "创建并修复日志目录权限"
        
        if [ "$AUTO_FIX" = "true" ]; then
            mkdir -p "$log_dir" 2>/dev/null
            chmod 755 "$log_dir" 2>/dev/null
            chown www-data:www-data "$log_dir" 2>/dev/null
            record_issue "日志目录权限修复" "FIXED" "日志目录权限已修复" ""
        fi
    fi
    
    # 检查SSL证书权限
    if [ -f "/etc/ssl/private/wisdomier.com.key" ]; then
        local key_perms=$(stat -c "%a" "/etc/ssl/private/wisdomier.com.key" 2>/dev/null)
        if [ "$key_perms" != "600" ]; then
            record_issue "SSL私钥权限" "DETECTED" "SSL私钥权限不安全: $key_perms" "修复SSL私钥权限为600"
            
            if [ "$AUTO_FIX" = "true" ]; then
                chmod 600 "/etc/ssl/private/wisdomier.com.key" 2>/dev/null
                record_issue "SSL私钥权限修复" "FIXED" "SSL私钥权限已修复" ""
            fi
        fi
    fi
}

# 检查并修复配置文件
fix_configuration_files() {
    info "检查配置文件..."
    
    # 检查环境配置文件
    if [ ! -f "$PROJECT_PATH/.env.tencent" ]; then
        record_issue "环境配置文件" "DETECTED" "环境配置文件缺失" "创建.env.tencent文件"
    else
        # 检查关键配置项
        local missing_configs=()
        
        if ! grep -q "^DB_HOST=" "$PROJECT_PATH/.env.tencent"; then
            missing_configs+=("DB_HOST")
        fi
        
        if ! grep -q "^DB_USER=" "$PROJECT_PATH/.env.tencent"; then
            missing_configs+=("DB_USER")
        fi
        
        if ! grep -q "^DB_PASSWORD=" "$PROJECT_PATH/.env.tencent"; then
            missing_configs+=("DB_PASSWORD")
        fi
        
        if [ ${#missing_configs[@]} -gt 0 ]; then
            record_issue "环境配置缺失" "DETECTED" "缺少配置项: ${missing_configs[*]}" "补充缺失的环境变量"
        fi
    fi
    
    # 检查PM2配置文件
    if [ ! -f "$PROJECT_PATH/ecosystem.config.js" ]; then
        record_issue "PM2配置文件" "DETECTED" "PM2配置文件缺失" "创建ecosystem.config.js文件"
    fi
    
    # 检查Nginx配置文件
    if [ ! -f "/etc/nginx/sites-available/travelweb" ]; then
        record_issue "Nginx配置文件" "DETECTED" "Nginx配置文件缺失" "创建Nginx站点配置"
    else
        # 检查Nginx配置语法
        if ! nginx -t >/dev/null 2>&1; then
            record_issue "Nginx配置语法" "DETECTED" "Nginx配置语法错误" "修复Nginx配置语法"
        fi
    fi
    
    # 检查SSL证书文件
    if [ ! -f "/etc/ssl/certs/wisdomier.com.crt" ]; then
        record_issue "SSL证书文件" "DETECTED" "SSL证书文件缺失" "安装SSL证书"
    fi
    
    if [ ! -f "/etc/ssl/private/wisdomier.com.key" ]; then
        record_issue "SSL私钥文件" "DETECTED" "SSL私钥文件缺失" "安装SSL私钥"
    fi
}

# 检查并修复依赖项
fix_dependencies() {
    info "检查依赖项..."
    
    cd "$PROJECT_PATH" || return
    
    # 检查Node.js版本
    local node_version=$(node --version 2>/dev/null | sed 's/v//')
    if [ -z "$node_version" ]; then
        record_issue "Node.js" "DETECTED" "Node.js未安装" "安装Node.js"
    else
        local major_version=$(echo "$node_version" | cut -d. -f1)
        if [ "$major_version" -lt 18 ]; then
            record_issue "Node.js版本" "DETECTED" "Node.js版本过低: $node_version" "升级Node.js到18+版本"
        fi
    fi
    
    # 检查npm依赖
    if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
        record_issue "npm依赖" "DETECTED" "npm依赖未安装" "运行npm install"
        
        if [ "$AUTO_FIX" = "true" ]; then
            if npm install >/dev/null 2>&1; then
                record_issue "npm依赖修复" "FIXED" "npm依赖已安装" ""
            else
                record_issue "npm依赖修复" "DETECTED" "npm依赖安装失败" "检查package.json和网络连接"
            fi
        fi
    fi
    
    # 检查构建文件
    if [ -f "package.json" ] && [ ! -d "dist" ] && [ ! -d "build" ]; then
        record_issue "构建文件" "DETECTED" "应用未构建" "运行npm run build"
        
        if [ "$AUTO_FIX" = "true" ]; then
            if npm run build >/dev/null 2>&1; then
                record_issue "构建文件修复" "FIXED" "应用已构建" ""
            else
                record_issue "构建文件修复" "DETECTED" "应用构建失败" "检查构建脚本和依赖"
            fi
        fi
    fi
}

# 检查并修复日志问题
fix_logging_issues() {
    info "检查日志配置..."
    
    # 检查应用日志目录
    local app_log_dir="$PROJECT_PATH/logs"
    if [ ! -d "$app_log_dir" ]; then
        record_issue "应用日志目录" "DETECTED" "应用日志目录不存在" "创建应用日志目录"
        
        if [ "$AUTO_FIX" = "true" ]; then
            mkdir -p "$app_log_dir"
            chmod 755 "$app_log_dir"
            record_issue "应用日志目录修复" "FIXED" "应用日志目录已创建" ""
        fi
    fi
    
    # 检查系统日志目录
    local sys_log_dir="/var/log/travelweb"
    if [ ! -d "$sys_log_dir" ]; then
        record_issue "系统日志目录" "DETECTED" "系统日志目录不存在" "创建系统日志目录"
        
        if [ "$AUTO_FIX" = "true" ]; then
            mkdir -p "$sys_log_dir"
            chmod 755 "$sys_log_dir"
            chown www-data:www-data "$sys_log_dir" 2>/dev/null
            record_issue "系统日志目录修复" "FIXED" "系统日志目录已创建" ""
        fi
    fi
    
    # 检查日志轮转配置
    if [ ! -f "/etc/logrotate.d/travelweb" ]; then
        record_issue "日志轮转配置" "DETECTED" "日志轮转配置缺失" "创建logrotate配置"
    fi
    
    # 检查磁盘空间（日志可能占用大量空间）
    local log_size=$(du -sh "$sys_log_dir" 2>/dev/null | cut -f1)
    if [ -n "$log_size" ]; then
        local log_size_mb=$(du -sm "$sys_log_dir" 2>/dev/null | cut -f1)
        if [ "$log_size_mb" -gt 1024 ]; then  # 大于1GB
            record_issue "日志文件大小" "DETECTED" "日志文件过大: $log_size" "清理或轮转日志文件"
            
            if [ "$AUTO_FIX" = "true" ]; then
                find "$sys_log_dir" -name "*.log" -mtime +7 -delete 2>/dev/null
                record_issue "日志文件清理" "FIXED" "旧日志文件已清理" ""
            fi
        fi
    fi
}

# 执行系统清理
perform_system_cleanup() {
    info "执行系统清理..."
    
    # 清理临时文件
    if [ "$AUTO_FIX" = "true" ]; then
        find /tmp -name "travelweb-*" -mtime +1 -delete 2>/dev/null
        find /tmp -name "deploy-*" -mtime +1 -delete 2>/dev/null
        
        # 清理PM2日志
        if command -v pm2 >/dev/null 2>&1; then
            pm2 flush >/dev/null 2>&1
        fi
        
        # 清理系统缓存
        if command -v apt-get >/dev/null 2>&1; then
            apt-get clean >/dev/null 2>&1
        fi
        
        record_issue "系统清理" "FIXED" "系统临时文件已清理" ""
    fi
}

# 重启相关服务
restart_services() {
    if [ "$RESTART_SERVICES" != "true" ]; then
        return
    fi
    
    info "重启相关服务..."
    
    # 重启应用
    if command -v pm2 >/dev/null 2>&1; then
        pm2 restart all >/dev/null 2>&1
        record_issue "应用重启" "FIXED" "PM2应用已重启" ""
    fi
    
    # 重启Nginx
    if systemctl is-active --quiet nginx; then
        systemctl restart nginx >/dev/null 2>&1
        record_issue "Nginx重启" "FIXED" "Nginx已重启" ""
    fi
    
    # 重启MySQL（谨慎操作）
    if [ "$RESTART_MYSQL" = "true" ]; then
        systemctl restart mysql >/dev/null 2>&1
        record_issue "MySQL重启" "FIXED" "MySQL已重启" ""
    fi
}

# 生成诊断报告
generate_diagnostic_report() {
    local report_header="TravelWeb 故障诊断报告
==========================
诊断时间: $(date)
服务器: $(hostname)
域名: $APP_DOMAIN

诊断统计:
========
总问题数: $TOTAL_ISSUES
已修复: $FIXED_ISSUES
未修复: $UNFIXED_ISSUES

修复率: $(echo "scale=1; $FIXED_ISSUES * 100 / $TOTAL_ISSUES" | bc 2>/dev/null || echo "0")%

详细问题:
========
"
    
    # 在报告开头插入统计信息
    local temp_file=$(mktemp)
    echo "$report_header" > "$temp_file"
    cat "$DIAGNOSTIC_REPORT" >> "$temp_file"
    mv "$temp_file" "$DIAGNOSTIC_REPORT"
    
    # 添加系统信息
    {
        echo ""
        echo "系统状态:"
        echo "========"
        echo "运行时间: $(uptime -p 2>/dev/null || uptime)"
        echo "负载平均: $(cat /proc/loadavg)"
        echo "内存使用: $(free -h | grep Mem | awk '{print $3"/"$2}')"
        echo "磁盘使用: $(df -h / | awk 'NR==2 {print $3"/"$2" ("$5")"}')"
        echo ""
        echo "服务状态:"
        echo "========"
        echo "MySQL: $(systemctl is-active mysql 2>/dev/null || echo "unknown")"
        echo "Nginx: $(systemctl is-active nginx 2>/dev/null || echo "unknown")"
        echo "PM2进程: $(pm2 list 2>/dev/null | grep -c "online" || echo "0") 个在线"
        echo ""
        echo "网络状态:"
        echo "========"
        echo "监听端口: $(netstat -tlnp 2>/dev/null | grep -E ":(80|443|$APP_PORT|$ADMIN_PORT) " | wc -l) 个"
        echo "活动连接: $(netstat -an 2>/dev/null | grep ESTABLISHED | wc -l) 个"
        
    } >> "$DIAGNOSTIC_REPORT"
    
    echo "$DIAGNOSTIC_REPORT"
}

# 显示修复建议
show_recommendations() {
    echo ""
    echo "${CYAN}修复建议:${NC}"
    echo "========"
    
    if [ "$UNFIXED_ISSUES" -gt 0 ]; then
        echo "1. 使用 --auto-fix 参数自动修复可修复的问题"
        echo "2. 使用 --restart-services 参数重启相关服务"
        echo "3. 检查详细的诊断报告了解具体问题"
        echo "4. 对于无法自动修复的问题，请手动处理"
    fi
    
    echo ""
    echo "${CYAN}常用修复命令:${NC}"
    echo "============"
    echo "# 自动修复所有可修复问题"
    echo "$0 --auto-fix --restart-services"
    echo ""
    echo "# 重启所有服务"
    echo "systemctl restart nginx mysql"
    echo "pm2 restart all"
    echo ""
    echo "# 检查服务状态"
    echo "systemctl status nginx mysql"
    echo "pm2 status"
    echo ""
    echo "# 查看日志"
    echo "journalctl -u nginx -f"
    echo "pm2 logs"
    echo "tail -f /var/log/travelweb/*.log"
}

# 显示帮助信息
show_help() {
    cat << EOF
TravelWeb 故障排除脚本

用法: $0 [选项]

选项:
  --auto-fix              自动修复可修复的问题
  --restart-services      重启相关服务
  --restart-mysql         重启MySQL服务（谨慎使用）
  --no-backup             不创建修复前备份
  --cleanup               执行系统清理
  -v, --verbose           详细输出
  -h, --help              显示此帮助信息

环境变量:
  APP_DOMAIN              应用域名 (默认: www.wisdomier.com)
  APP_PORT                应用端口 (默认: 3000)
  ADMIN_PORT              管理端口 (默认: 3001)
  PROJECT_PATH            项目路径 (默认: /var/www/travelweb)
  AUTO_FIX                自动修复 (默认: false)
  RESTART_SERVICES        重启服务 (默认: false)
  BACKUP_BEFORE_FIX       修复前备份 (默认: true)

诊断项目:
  - 系统服务状态 (MySQL, Nginx, 防火墙)
  - 数据库连接和配置
  - 应用进程状态 (PM2)
  - 网络连接和端口
  - 文件权限
  - 配置文件完整性
  - 依赖项安装
  - 日志配置

示例:
  $0                      # 仅诊断问题
  $0 --auto-fix           # 诊断并自动修复
  $0 --auto-fix --restart-services  # 修复并重启服务
  $0 --cleanup            # 执行系统清理

EOF
}

# 主函数
main() {
    info "开始TravelWeb故障诊断..."
    
    # 创建日志目录
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # 初始化诊断报告
    echo "开始诊断..." > "$DIAGNOSTIC_REPORT"
    
    # 创建备份
    create_backup
    
    # 执行各项检查和修复
    fix_system_services
    fix_database_issues
    fix_application_processes
    fix_network_issues
    fix_file_permissions
    fix_configuration_files
    fix_dependencies
    fix_logging_issues
    
    # 执行清理和重启
    if [ "$CLEANUP" = "true" ]; then
        perform_system_cleanup
    fi
    
    restart_services
    
    # 生成最终报告
    local report_file=$(generate_diagnostic_report)
    
    # 显示结果摘要
    echo ""
    echo "================================"
    echo "故障诊断完成！"
    echo "================================"
    echo "总问题数: $TOTAL_ISSUES"
    echo "已修复: ${GREEN}$FIXED_ISSUES${NC}"
    echo "未修复: ${RED}$UNFIXED_ISSUES${NC}"
    echo "修复率: $(echo "scale=1; $FIXED_ISSUES * 100 / $TOTAL_ISSUES" | bc 2>/dev/null || echo "0")%"
    echo ""
    echo "诊断报告: $report_file"
    
    # 显示修复建议
    if [ "$UNFIXED_ISSUES" -gt 0 ]; then
        show_recommendations
    fi
    
    # 显示报告内容
    echo ""
    echo "详细诊断报告:"
    echo "============"
    cat "$report_file"
    
    # 设置退出码
    if [ "$UNFIXED_ISSUES" -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --auto-fix)
            AUTO_FIX=true
            shift
            ;;
        --restart-services)
            RESTART_SERVICES=true
            shift
            ;;
        --restart-mysql)
            RESTART_MYSQL=true
            shift
            ;;
        --no-backup)
            BACKUP_BEFORE_FIX=false
            shift
            ;;
        --cleanup)
            CLEANUP=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            set -x
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 执行主函数
main "$@"