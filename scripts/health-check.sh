#!/bin/bash

# 健康检查脚本
# 用于检查TravelWeb应用的各个组件状态

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/var/log/travelweb/health-check.log"
ALERT_EMAIL="${ALERT_EMAIL:-admin@wisdomier.com}"
DINGTALK_WEBHOOK="${DINGTALK_WEBHOOK:-}"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
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

# 检查结果存储
declare -A CHECK_RESULTS
OVERALL_STATUS="healthy"

# 记录检查结果
record_check() {
    local check_name=$1
    local status=$2
    local message=$3
    
    CHECK_RESULTS["$check_name"]="$status:$message"
    
    if [ "$status" != "ok" ]; then
        OVERALL_STATUS="unhealthy"
    fi
}

# 检查系统资源
check_system_resources() {
    info "检查系统资源..."
    
    # 检查CPU使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        record_check "cpu" "warning" "CPU使用率过高: ${cpu_usage}%"
        warn "CPU使用率过高: ${cpu_usage}%"
    else
        record_check "cpu" "ok" "CPU使用率正常: ${cpu_usage}%"
        success "CPU使用率正常: ${cpu_usage}%"
    fi
    
    # 检查内存使用率
    local mem_info=$(free | grep Mem)
    local total_mem=$(echo $mem_info | awk '{print $2}')
    local used_mem=$(echo $mem_info | awk '{print $3}')
    local mem_usage=$(echo "scale=2; $used_mem * 100 / $total_mem" | bc)
    
    if (( $(echo "$mem_usage > 85" | bc -l) )); then
        record_check "memory" "warning" "内存使用率过高: ${mem_usage}%"
        warn "内存使用率过高: ${mem_usage}%"
    else
        record_check "memory" "ok" "内存使用率正常: ${mem_usage}%"
        success "内存使用率正常: ${mem_usage}%"
    fi
    
    # 检查磁盘空间
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 85 ]; then
        record_check "disk" "warning" "磁盘使用率过高: ${disk_usage}%"
        warn "磁盘使用率过高: ${disk_usage}%"
    else
        record_check "disk" "ok" "磁盘使用率正常: ${disk_usage}%"
        success "磁盘使用率正常: ${disk_usage}%"
    fi
}

# 检查数据库连接
check_database() {
    info "检查数据库连接..."
    
    # 检查MySQL服务状态
    if systemctl is-active --quiet mysql; then
        success "MySQL服务运行正常"
        
        # 检查数据库连接
        if mysql -u"${DB_USER:-travelweb}" -p"${DB_PASSWORD}" -h"${DB_HOST:-localhost}" -e "SELECT 1;" >/dev/null 2>&1; then
            record_check "database" "ok" "数据库连接正常"
            success "数据库连接正常"
        else
            record_check "database" "error" "数据库连接失败"
            error "数据库连接失败"
        fi
    else
        record_check "database" "error" "MySQL服务未运行"
        error "MySQL服务未运行"
    fi
}

# 检查应用进程
check_application() {
    info "检查应用进程..."
    
    # 检查PM2进程
    if command -v pm2 >/dev/null 2>&1; then
        local pm2_status=$(pm2 jlist 2>/dev/null)
        
        if echo "$pm2_status" | jq -e '.[] | select(.name=="travelweb-main" and .pm2_env.status=="online")' >/dev/null 2>&1; then
            record_check "app_main" "ok" "主应用进程运行正常"
            success "主应用进程运行正常"
        else
            record_check "app_main" "error" "主应用进程未运行"
            error "主应用进程未运行"
        fi
        
        if echo "$pm2_status" | jq -e '.[] | select(.name=="travelweb-worker" and .pm2_env.status=="online")' >/dev/null 2>&1; then
            record_check "app_worker" "ok" "后台任务进程运行正常"
            success "后台任务进程运行正常"
        else
            record_check "app_worker" "warning" "后台任务进程未运行"
            warn "后台任务进程未运行"
        fi
    else
        record_check "pm2" "error" "PM2未安装或不可用"
        error "PM2未安装或不可用"
    fi
}

# 检查Web服务
check_web_service() {
    info "检查Web服务..."
    
    # 检查Nginx状态
    if systemctl is-active --quiet nginx; then
        record_check "nginx" "ok" "Nginx服务运行正常"
        success "Nginx服务运行正常"
    else
        record_check "nginx" "error" "Nginx服务未运行"
        error "Nginx服务未运行"
    fi
    
    # 检查应用HTTP响应
    local app_port="${PORT:-3000}"
    if curl -f -s "http://localhost:${app_port}/api/health" >/dev/null; then
        record_check "http_response" "ok" "应用HTTP响应正常"
        success "应用HTTP响应正常"
    else
        record_check "http_response" "error" "应用HTTP响应异常"
        error "应用HTTP响应异常"
    fi
    
    # 检查HTTPS响应（如果配置了SSL）
    if curl -f -s "https://www.wisdomier.com/api/health" >/dev/null 2>&1; then
        record_check "https_response" "ok" "HTTPS响应正常"
        success "HTTPS响应正常"
    else
        record_check "https_response" "warning" "HTTPS响应异常或未配置"
        warn "HTTPS响应异常或未配置"
    fi
}

# 检查SSL证书
check_ssl_certificate() {
    info "检查SSL证书..."
    
    local domain="www.wisdomier.com"
    local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ -n "$cert_info" ]; then
        local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ "$days_until_expiry" -lt 30 ]; then
            record_check "ssl_cert" "warning" "SSL证书将在${days_until_expiry}天后过期"
            warn "SSL证书将在${days_until_expiry}天后过期"
        else
            record_check "ssl_cert" "ok" "SSL证书有效，${days_until_expiry}天后过期"
            success "SSL证书有效，${days_until_expiry}天后过期"
        fi
    else
        record_check "ssl_cert" "warning" "无法获取SSL证书信息"
        warn "无法获取SSL证书信息"
    fi
}

# 检查日志文件
check_logs() {
    info "检查日志文件..."
    
    local log_dir="/var/www/travelweb/logs"
    local error_count=0
    
    if [ -d "$log_dir" ]; then
        # 检查最近1小时的错误日志
        error_count=$(find "$log_dir" -name "*.log" -mmin -60 -exec grep -i "error\|exception\|fatal" {} \; 2>/dev/null | wc -l)
        
        if [ "$error_count" -gt 10 ]; then
            record_check "logs" "warning" "最近1小时发现${error_count}个错误"
            warn "最近1小时发现${error_count}个错误"
        else
            record_check "logs" "ok" "日志状态正常"
            success "日志状态正常"
        fi
    else
        record_check "logs" "warning" "日志目录不存在"
        warn "日志目录不存在: $log_dir"
    fi
}

# 发送钉钉通知
send_dingtalk_notification() {
    local message=$1
    
    if [ -n "$DINGTALK_WEBHOOK" ]; then
        curl -H "Content-Type: application/json" \
             -d "{\"msgtype\":\"text\",\"text\":{\"content\":\"$message\"}}" \
             "$DINGTALK_WEBHOOK" >/dev/null 2>&1
    fi
}

# 发送邮件通知
send_email_notification() {
    local subject=$1
    local body=$2
    
    if command -v mail >/dev/null 2>&1; then
        echo "$body" | mail -s "$subject" "$ALERT_EMAIL"
    fi
}

# 生成健康检查报告
generate_report() {
    local report_file="/tmp/health-check-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "TravelWeb 健康检查报告"
        echo "========================"
        echo "检查时间: $(date)"
        echo "整体状态: $OVERALL_STATUS"
        echo ""
        echo "详细检查结果:"
        echo "============"
        
        for check_name in "${!CHECK_RESULTS[@]}"; do
            local result="${CHECK_RESULTS[$check_name]}"
            local status="${result%%:*}"
            local message="${result#*:}"
            
            case "$status" in
                "ok")
                    echo "✓ $check_name: $message"
                    ;;
                "warning")
                    echo "⚠ $check_name: $message"
                    ;;
                "error")
                    echo "✗ $check_name: $message"
                    ;;
            esac
        done
        
        echo ""
        echo "系统信息:"
        echo "========"
        echo "主机名: $(hostname)"
        echo "运行时间: $(uptime)"
        echo "负载平均: $(cat /proc/loadavg)"
        
    } > "$report_file"
    
    echo "$report_file"
}

# 主函数
main() {
    info "开始健康检查..."
    
    # 创建日志目录
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # 执行各项检查
    check_system_resources
    check_database
    check_application
    check_web_service
    check_ssl_certificate
    check_logs
    
    # 生成报告
    local report_file=$(generate_report)
    info "健康检查报告已生成: $report_file"
    
    # 如果状态异常，发送通知
    if [ "$OVERALL_STATUS" != "healthy" ]; then
        local alert_message="TravelWeb健康检查发现问题，请查看详细报告: $report_file"
        
        warn "$alert_message"
        send_dingtalk_notification "$alert_message"
        send_email_notification "TravelWeb健康检查警报" "$(cat "$report_file")"
    else
        success "所有检查通过，系统运行正常"
    fi
    
    # 输出报告内容
    cat "$report_file"
    
    # 根据整体状态设置退出码
    if [ "$OVERALL_STATUS" = "healthy" ]; then
        exit 0
    else
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    cat << EOF
TravelWeb 健康检查脚本

用法: $0 [选项]

选项:
  -h, --help     显示此帮助信息
  -q, --quiet    静默模式，只输出错误信息
  -v, --verbose  详细模式，输出所有信息

环境变量:
  ALERT_EMAIL       警报邮件地址 (默认: admin@wisdomier.com)
  DINGTALK_WEBHOOK  钉钉机器人Webhook URL
  DB_USER          数据库用户名
  DB_PASSWORD      数据库密码
  DB_HOST          数据库主机 (默认: localhost)
  PORT             应用端口 (默认: 3000)

示例:
  $0                    # 执行完整健康检查
  $0 --quiet           # 静默模式执行
  ALERT_EMAIL=admin@example.com $0  # 指定警报邮箱

EOF
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -q|--quiet)
            exec > /dev/null
            shift
            ;;
        -v|--verbose)
            set -x
            shift
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