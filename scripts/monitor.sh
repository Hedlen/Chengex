#!/bin/bash

# 系统监控脚本
# 用于持续监控TravelWeb应用的性能和状态

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MONITOR_LOG="/var/log/travelweb/monitor.log"
METRICS_LOG="/var/log/travelweb/metrics.log"
PID_FILE="/var/run/travelweb-monitor.pid"
MONITOR_INTERVAL="${MONITOR_INTERVAL:-60}"  # 监控间隔（秒）

# 阈值配置
CPU_THRESHOLD="${CPU_THRESHOLD:-80}"
MEMORY_THRESHOLD="${MEMORY_THRESHOLD:-85}"
DISK_THRESHOLD="${DISK_THRESHOLD:-85}"
RESPONSE_TIME_THRESHOLD="${RESPONSE_TIME_THRESHOLD:-5000}"  # 毫秒
ERROR_RATE_THRESHOLD="${ERROR_RATE_THRESHOLD:-5}"  # 百分比

# 通知配置
ALERT_EMAIL="${ALERT_EMAIL:-admin@wisdomier.com}"
DINGTALK_WEBHOOK="${DINGTALK_WEBHOOK:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "${timestamp} [${level}] ${message}" >> "$MONITOR_LOG"
    
    if [ "$level" != "DEBUG" ] || [ "$VERBOSE" = "true" ]; then
        echo -e "${timestamp} [${level}] ${message}"
    fi
}

info() {
    log "INFO" "$@"
}

warn() {
    log "WARN" "$@"
}

error() {
    log "ERROR" "$@"
}

debug() {
    log "DEBUG" "$@"
}

# 记录指标
record_metric() {
    local metric_name=$1
    local value=$2
    local unit=$3
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "${timestamp},${metric_name},${value},${unit}" >> "$METRICS_LOG"
}

# 获取系统指标
get_system_metrics() {
    # CPU使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    record_metric "cpu_usage" "$cpu_usage" "percent"
    
    # 内存使用率
    local mem_info=$(free | grep Mem)
    local total_mem=$(echo $mem_info | awk '{print $2}')
    local used_mem=$(echo $mem_info | awk '{print $3}')
    local mem_usage=$(echo "scale=2; $used_mem * 100 / $total_mem" | bc)
    record_metric "memory_usage" "$mem_usage" "percent"
    
    # 磁盘使用率
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    record_metric "disk_usage" "$disk_usage" "percent"
    
    # 系统负载
    local load_avg=$(cat /proc/loadavg | awk '{print $1}')
    record_metric "load_average" "$load_avg" "number"
    
    # 网络连接数
    local connections=$(netstat -an | grep ESTABLISHED | wc -l)
    record_metric "network_connections" "$connections" "count"
    
    debug "系统指标已记录: CPU=${cpu_usage}%, 内存=${mem_usage}%, 磁盘=${disk_usage}%"
}

# 获取应用指标
get_application_metrics() {
    local app_port="${PORT:-3000}"
    
    # 应用响应时间
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' "http://localhost:${app_port}/api/health" 2>/dev/null)
    if [ -n "$response_time" ]; then
        local response_time_ms=$(echo "$response_time * 1000" | bc)
        record_metric "response_time" "$response_time_ms" "milliseconds"
    fi
    
    # PM2进程信息
    if command -v pm2 >/dev/null 2>&1; then
        local pm2_info=$(pm2 jlist 2>/dev/null)
        
        # 主应用进程
        local main_cpu=$(echo "$pm2_info" | jq -r '.[] | select(.name=="travelweb-main") | .monit.cpu // 0')
        local main_memory=$(echo "$pm2_info" | jq -r '.[] | select(.name=="travelweb-main") | .monit.memory // 0')
        
        if [ "$main_cpu" != "null" ] && [ "$main_cpu" != "0" ]; then
            record_metric "app_main_cpu" "$main_cpu" "percent"
            record_metric "app_main_memory" "$((main_memory / 1024 / 1024))" "MB"
        fi
        
        # 后台任务进程
        local worker_cpu=$(echo "$pm2_info" | jq -r '.[] | select(.name=="travelweb-worker") | .monit.cpu // 0')
        local worker_memory=$(echo "$pm2_info" | jq -r '.[] | select(.name=="travelweb-worker") | .monit.memory // 0')
        
        if [ "$worker_cpu" != "null" ] && [ "$worker_cpu" != "0" ]; then
            record_metric "app_worker_cpu" "$worker_cpu" "percent"
            record_metric "app_worker_memory" "$((worker_memory / 1024 / 1024))" "MB"
        fi
    fi
    
    debug "应用指标已记录: 响应时间=${response_time_ms}ms"
}

# 获取数据库指标
get_database_metrics() {
    if command -v mysql >/dev/null 2>&1; then
        # 数据库连接数
        local connections=$(mysql -u"${DB_USER:-travelweb}" -p"${DB_PASSWORD}" -h"${DB_HOST:-localhost}" -e "SHOW STATUS LIKE 'Threads_connected';" 2>/dev/null | awk 'NR==2 {print $2}')
        if [ -n "$connections" ]; then
            record_metric "db_connections" "$connections" "count"
        fi
        
        # 查询缓存命中率
        local qcache_hits=$(mysql -u"${DB_USER:-travelweb}" -p"${DB_PASSWORD}" -h"${DB_HOST:-localhost}" -e "SHOW STATUS LIKE 'Qcache_hits';" 2>/dev/null | awk 'NR==2 {print $2}')
        local qcache_inserts=$(mysql -u"${DB_USER:-travelweb}" -p"${DB_PASSWORD}" -h"${DB_HOST:-localhost}" -e "SHOW STATUS LIKE 'Qcache_inserts';" 2>/dev/null | awk 'NR==2 {print $2}')
        
        if [ -n "$qcache_hits" ] && [ -n "$qcache_inserts" ] && [ "$qcache_inserts" -gt 0 ]; then
            local hit_rate=$(echo "scale=2; $qcache_hits * 100 / ($qcache_hits + $qcache_inserts)" | bc)
            record_metric "db_cache_hit_rate" "$hit_rate" "percent"
        fi
        
        debug "数据库指标已记录: 连接数=${connections}"
    fi
}

# 检查阈值并发送警报
check_thresholds() {
    local current_time=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 检查CPU使用率
    local cpu_usage=$(tail -1 "$METRICS_LOG" | grep "cpu_usage" | cut -d',' -f3)
    if [ -n "$cpu_usage" ] && (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) )); then
        send_alert "CPU使用率过高" "CPU使用率达到 ${cpu_usage}%，超过阈值 ${CPU_THRESHOLD}%"
    fi
    
    # 检查内存使用率
    local mem_usage=$(tail -1 "$METRICS_LOG" | grep "memory_usage" | cut -d',' -f3)
    if [ -n "$mem_usage" ] && (( $(echo "$mem_usage > $MEMORY_THRESHOLD" | bc -l) )); then
        send_alert "内存使用率过高" "内存使用率达到 ${mem_usage}%，超过阈值 ${MEMORY_THRESHOLD}%"
    fi
    
    # 检查磁盘使用率
    local disk_usage=$(tail -1 "$METRICS_LOG" | grep "disk_usage" | cut -d',' -f3)
    if [ -n "$disk_usage" ] && [ "$disk_usage" -gt "$DISK_THRESHOLD" ]; then
        send_alert "磁盘空间不足" "磁盘使用率达到 ${disk_usage}%，超过阈值 ${DISK_THRESHOLD}%"
    fi
    
    # 检查响应时间
    local response_time=$(tail -1 "$METRICS_LOG" | grep "response_time" | cut -d',' -f3)
    if [ -n "$response_time" ] && (( $(echo "$response_time > $RESPONSE_TIME_THRESHOLD" | bc -l) )); then
        send_alert "应用响应时间过长" "应用响应时间达到 ${response_time}ms，超过阈值 ${RESPONSE_TIME_THRESHOLD}ms"
    fi
}

# 发送警报
send_alert() {
    local title=$1
    local message=$2
    local full_message="[TravelWeb监控警报] $title: $message (时间: $(date))"
    
    warn "$full_message"
    
    # 发送钉钉通知
    if [ -n "$DINGTALK_WEBHOOK" ]; then
        curl -H "Content-Type: application/json" \
             -d "{\"msgtype\":\"text\",\"text\":{\"content\":\"$full_message\"}}" \
             "$DINGTALK_WEBHOOK" >/dev/null 2>&1
    fi
    
    # 发送Slack通知
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H "Content-Type: application/json" \
             -d "{\"text\":\"$full_message\"}" \
             "$SLACK_WEBHOOK" >/dev/null 2>&1
    fi
    
    # 发送邮件通知
    if command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "$title" "$ALERT_EMAIL"
    fi
}

# 生成监控报告
generate_report() {
    local report_file="/tmp/monitor-report-$(date +%Y%m%d-%H%M%S).txt"
    local hours_back="${1:-24}"  # 默认24小时
    
    {
        echo "TravelWeb 监控报告"
        echo "=================="
        echo "报告时间: $(date)"
        echo "统计周期: 最近 ${hours_back} 小时"
        echo ""
        
        # 系统指标统计
        echo "系统指标统计:"
        echo "============"
        
        local cutoff_time=$(date -d "${hours_back} hours ago" '+%Y-%m-%d %H:%M:%S')
        
        # CPU使用率统计
        local cpu_stats=$(awk -F',' -v cutoff="$cutoff_time" '$1 >= cutoff && $2 == "cpu_usage" {sum+=$3; count++; if($3>max) max=$3; if(min=="" || $3<min) min=$3} END {if(count>0) printf "平均: %.2f%%, 最大: %.2f%%, 最小: %.2f%%", sum/count, max, min; else print "无数据"}' "$METRICS_LOG")
        echo "CPU使用率 - $cpu_stats"
        
        # 内存使用率统计
        local mem_stats=$(awk -F',' -v cutoff="$cutoff_time" '$1 >= cutoff && $2 == "memory_usage" {sum+=$3; count++; if($3>max) max=$3; if(min=="" || $3<min) min=$3} END {if(count>0) printf "平均: %.2f%%, 最大: %.2f%%, 最小: %.2f%%", sum/count, max, min; else print "无数据"}' "$METRICS_LOG")
        echo "内存使用率 - $mem_stats"
        
        # 响应时间统计
        local response_stats=$(awk -F',' -v cutoff="$cutoff_time" '$1 >= cutoff && $2 == "response_time" {sum+=$3; count++; if($3>max) max=$3; if(min=="" || $3<min) min=$3} END {if(count>0) printf "平均: %.2fms, 最大: %.2fms, 最小: %.2fms", sum/count, max, min; else print "无数据"}' "$METRICS_LOG")
        echo "响应时间 - $response_stats"
        
        echo ""
        echo "警报统计:"
        echo "========"
        local alert_count=$(grep -c "WARN\|ERROR" "$MONITOR_LOG" | tail -1)
        echo "警报总数: $alert_count"
        
        echo ""
        echo "最近警报:"
        echo "========"
        tail -10 "$MONITOR_LOG" | grep "WARN\|ERROR"
        
    } > "$report_file"
    
    echo "$report_file"
}

# 清理旧日志
cleanup_logs() {
    local retention_days="${1:-30}"
    
    info "清理 ${retention_days} 天前的日志文件..."
    
    # 清理监控日志
    if [ -f "$MONITOR_LOG" ]; then
        local temp_file=$(mktemp)
        local cutoff_date=$(date -d "${retention_days} days ago" '+%Y-%m-%d')
        
        awk -v cutoff="$cutoff_date" '$1 >= cutoff' "$MONITOR_LOG" > "$temp_file"
        mv "$temp_file" "$MONITOR_LOG"
    fi
    
    # 清理指标日志
    if [ -f "$METRICS_LOG" ]; then
        local temp_file=$(mktemp)
        local cutoff_date=$(date -d "${retention_days} days ago" '+%Y-%m-%d')
        
        awk -F',' -v cutoff="$cutoff_date" '$1 >= cutoff' "$METRICS_LOG" > "$temp_file"
        mv "$temp_file" "$METRICS_LOG"
    fi
    
    info "日志清理完成"
}

# 监控主循环
monitor_loop() {
    info "开始监控循环，间隔: ${MONITOR_INTERVAL}秒"
    
    while true; do
        # 收集指标
        get_system_metrics
        get_application_metrics
        get_database_metrics
        
        # 检查阈值
        check_thresholds
        
        # 等待下一次监控
        sleep "$MONITOR_INTERVAL"
    done
}

# 启动监控
start_monitor() {
    # 检查是否已经在运行
    if [ -f "$PID_FILE" ]; then
        local old_pid=$(cat "$PID_FILE")
        if kill -0 "$old_pid" 2>/dev/null; then
            error "监控进程已在运行 (PID: $old_pid)"
            exit 1
        else
            rm -f "$PID_FILE"
        fi
    fi
    
    # 创建日志目录
    mkdir -p "$(dirname "$MONITOR_LOG")"
    mkdir -p "$(dirname "$METRICS_LOG")"
    
    # 启动监控
    info "启动TravelWeb监控服务..."
    
    # 后台运行监控循环
    monitor_loop &
    local monitor_pid=$!
    
    # 保存PID
    echo "$monitor_pid" > "$PID_FILE"
    
    info "监控服务已启动 (PID: $monitor_pid)"
    
    # 等待监控进程
    wait "$monitor_pid"
}

# 停止监控
stop_monitor() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            info "停止监控进程 (PID: $pid)..."
            kill "$pid"
            rm -f "$PID_FILE"
            info "监控服务已停止"
        else
            warn "监控进程不存在"
            rm -f "$PID_FILE"
        fi
    else
        warn "PID文件不存在，监控可能未运行"
    fi
}

# 显示监控状态
show_status() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo "监控服务运行中 (PID: $pid)"
            echo "监控间隔: ${MONITOR_INTERVAL}秒"
            echo "日志文件: $MONITOR_LOG"
            echo "指标文件: $METRICS_LOG"
        else
            echo "监控服务未运行 (PID文件存在但进程不存在)"
        fi
    else
        echo "监控服务未运行"
    fi
}

# 显示帮助信息
show_help() {
    cat << EOF
TravelWeb 监控脚本

用法: $0 {start|stop|restart|status|report|cleanup} [选项]

命令:
  start     启动监控服务
  stop      停止监控服务
  restart   重启监控服务
  status    显示监控状态
  report    生成监控报告
  cleanup   清理旧日志

选项:
  -i, --interval SECONDS    监控间隔 (默认: 60秒)
  -v, --verbose             详细输出
  -h, --help               显示此帮助信息

环境变量:
  MONITOR_INTERVAL          监控间隔 (默认: 60)
  CPU_THRESHOLD            CPU使用率阈值 (默认: 80)
  MEMORY_THRESHOLD         内存使用率阈值 (默认: 85)
  DISK_THRESHOLD           磁盘使用率阈值 (默认: 85)
  RESPONSE_TIME_THRESHOLD  响应时间阈值 (默认: 5000ms)
  ALERT_EMAIL              警报邮件地址
  DINGTALK_WEBHOOK         钉钉机器人Webhook URL
  SLACK_WEBHOOK            Slack Webhook URL

示例:
  $0 start                 # 启动监控
  $0 stop                  # 停止监控
  $0 report 12             # 生成最近12小时的报告
  $0 cleanup 7             # 清理7天前的日志

EOF
}

# 主函数
main() {
    local command=$1
    shift
    
    case "$command" in
        start)
            start_monitor "$@"
            ;;
        stop)
            stop_monitor "$@"
            ;;
        restart)
            stop_monitor "$@"
            sleep 2
            start_monitor "$@"
            ;;
        status)
            show_status "$@"
            ;;
        report)
            local report_file=$(generate_report "$@")
            echo "监控报告已生成: $report_file"
            cat "$report_file"
            ;;
        cleanup)
            cleanup_logs "$@"
            ;;
        -h|--help|help)
            show_help
            ;;
        *)
            error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--interval)
            MONITOR_INTERVAL="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE="true"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            break
            ;;
    esac
done

# 执行主函数
main "$@"