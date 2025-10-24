#!/bin/bash

# 数据备份脚本
# 用于备份TravelWeb应用的数据库、文件和配置

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/travelweb}"
LOG_FILE="/var/log/travelweb/backup.log"

# 备份配置
DB_BACKUP_RETENTION="${DB_BACKUP_RETENTION:-30}"  # 数据库备份保留天数
FILE_BACKUP_RETENTION="${FILE_BACKUP_RETENTION:-7}"  # 文件备份保留天数
COMPRESS_BACKUPS="${COMPRESS_BACKUPS:-true}"  # 是否压缩备份
ENCRYPT_BACKUPS="${ENCRYPT_BACKUPS:-false}"  # 是否加密备份
BACKUP_PASSWORD="${BACKUP_PASSWORD:-}"  # 备份加密密码

# 远程备份配置
REMOTE_BACKUP="${REMOTE_BACKUP:-false}"
REMOTE_HOST="${REMOTE_HOST:-}"
REMOTE_USER="${REMOTE_USER:-}"
REMOTE_PATH="${REMOTE_PATH:-}"
REMOTE_KEY="${REMOTE_KEY:-}"

# 云存储配置
CLOUD_BACKUP="${CLOUD_BACKUP:-false}"
CLOUD_PROVIDER="${CLOUD_PROVIDER:-}"  # aliyun, tencent, aws
CLOUD_BUCKET="${CLOUD_BUCKET:-}"
CLOUD_ACCESS_KEY="${CLOUD_ACCESS_KEY:-}"
CLOUD_SECRET_KEY="${CLOUD_SECRET_KEY:-}"

# 通知配置
NOTIFY_EMAIL="${NOTIFY_EMAIL:-admin@wisdomier.com}"
DINGTALK_WEBHOOK="${DINGTALK_WEBHOOK:-}"

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

# 创建备份目录
create_backup_dirs() {
    local backup_date=$(date +%Y%m%d)
    
    BACKUP_DIR="$BACKUP_ROOT/$backup_date"
    DB_BACKUP_DIR="$BACKUP_DIR/database"
    FILE_BACKUP_DIR="$BACKUP_DIR/files"
    CONFIG_BACKUP_DIR="$BACKUP_DIR/config"
    
    mkdir -p "$DB_BACKUP_DIR"
    mkdir -p "$FILE_BACKUP_DIR"
    mkdir -p "$CONFIG_BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    
    info "备份目录已创建: $BACKUP_DIR"
}

# 备份数据库
backup_database() {
    info "开始备份数据库..."
    
    local db_name="${DB_NAME:-travelweb}"
    local db_user="${DB_USER:-travelweb}"
    local db_password="${DB_PASSWORD}"
    local db_host="${DB_HOST:-localhost}"
    local db_port="${DB_PORT:-3306}"
    
    local backup_file="$DB_BACKUP_DIR/${db_name}-$(date +%Y%m%d-%H%M%S).sql"
    
    # 执行数据库备份
    if mysqldump -h"$db_host" -P"$db_port" -u"$db_user" -p"$db_password" \
                 --single-transaction \
                 --routines \
                 --triggers \
                 --events \
                 --hex-blob \
                 --opt \
                 "$db_name" > "$backup_file" 2>/dev/null; then
        
        success "数据库备份完成: $backup_file"
        
        # 压缩备份文件
        if [ "$COMPRESS_BACKUPS" = "true" ]; then
            gzip "$backup_file"
            backup_file="${backup_file}.gz"
            info "备份文件已压缩: $backup_file"
        fi
        
        # 加密备份文件
        if [ "$ENCRYPT_BACKUPS" = "true" ] && [ -n "$BACKUP_PASSWORD" ]; then
            openssl enc -aes-256-cbc -salt -in "$backup_file" -out "${backup_file}.enc" -pass pass:"$BACKUP_PASSWORD"
            rm "$backup_file"
            backup_file="${backup_file}.enc"
            info "备份文件已加密: $backup_file"
        fi
        
        # 记录备份信息
        echo "$(date '+%Y-%m-%d %H:%M:%S'),database,$(basename "$backup_file"),$(stat -c%s "$backup_file")" >> "$BACKUP_DIR/backup.log"
        
        return 0
    else
        error "数据库备份失败"
        return 1
    fi
}

# 备份文件
backup_files() {
    info "开始备份文件..."
    
    local files_to_backup=(
        "/var/www/travelweb/uploads"
        "/var/www/travelweb/public/images"
        "/var/www/travelweb/storage"
        "/var/www/travelweb/logs"
    )
    
    for file_path in "${files_to_backup[@]}"; do
        if [ -d "$file_path" ]; then
            local dir_name=$(basename "$file_path")
            local backup_file="$FILE_BACKUP_DIR/${dir_name}-$(date +%Y%m%d-%H%M%S).tar"
            
            info "备份目录: $file_path"
            
            if tar -cf "$backup_file" -C "$(dirname "$file_path")" "$dir_name" 2>/dev/null; then
                success "文件备份完成: $backup_file"
                
                # 压缩备份文件
                if [ "$COMPRESS_BACKUPS" = "true" ]; then
                    gzip "$backup_file"
                    backup_file="${backup_file}.gz"
                    info "备份文件已压缩: $backup_file"
                fi
                
                # 记录备份信息
                echo "$(date '+%Y-%m-%d %H:%M:%S'),files,$(basename "$backup_file"),$(stat -c%s "$backup_file")" >> "$BACKUP_DIR/backup.log"
            else
                warn "文件备份失败: $file_path"
            fi
        else
            warn "目录不存在，跳过备份: $file_path"
        fi
    done
}

# 备份配置文件
backup_config() {
    info "开始备份配置文件..."
    
    local config_files=(
        "/var/www/travelweb/.env.tencent"
        "/var/www/travelweb/ecosystem.config.js"
        "/var/www/travelweb/pm2.config.js"
        "/etc/nginx/sites-available/travelweb"
        "/etc/nginx/nginx.conf"
        "/etc/mysql/mysql.conf.d/mysqld.cnf"
        "/etc/ssl/certs/wisdomier.com.crt"
        "/etc/ssl/private/wisdomier.com.key"
    )
    
    local config_backup_file="$CONFIG_BACKUP_DIR/config-$(date +%Y%m%d-%H%M%S).tar"
    
    # 创建临时目录
    local temp_dir=$(mktemp -d)
    
    for config_file in "${config_files[@]}"; do
        if [ -f "$config_file" ]; then
            local dest_dir="$temp_dir$(dirname "$config_file")"
            mkdir -p "$dest_dir"
            cp "$config_file" "$dest_dir/"
            info "已添加配置文件: $config_file"
        else
            warn "配置文件不存在，跳过: $config_file"
        fi
    done
    
    # 创建配置备份
    if tar -cf "$config_backup_file" -C "$temp_dir" . 2>/dev/null; then
        success "配置备份完成: $config_backup_file"
        
        # 压缩备份文件
        if [ "$COMPRESS_BACKUPS" = "true" ]; then
            gzip "$config_backup_file"
            config_backup_file="${config_backup_file}.gz"
            info "配置备份已压缩: $config_backup_file"
        fi
        
        # 记录备份信息
        echo "$(date '+%Y-%m-%d %H:%M:%S'),config,$(basename "$config_backup_file"),$(stat -c%s "$config_backup_file")" >> "$BACKUP_DIR/backup.log"
    else
        error "配置备份失败"
    fi
    
    # 清理临时目录
    rm -rf "$temp_dir"
}

# 上传到远程服务器
upload_to_remote() {
    if [ "$REMOTE_BACKUP" != "true" ] || [ -z "$REMOTE_HOST" ]; then
        return 0
    fi
    
    info "开始上传备份到远程服务器..."
    
    local ssh_opts="-o StrictHostKeyChecking=no"
    if [ -n "$REMOTE_KEY" ]; then
        ssh_opts="$ssh_opts -i $REMOTE_KEY"
    fi
    
    # 创建远程目录
    ssh $ssh_opts "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_PATH" 2>/dev/null
    
    # 上传备份文件
    if rsync -avz --progress -e "ssh $ssh_opts" "$BACKUP_DIR/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/$(basename "$BACKUP_DIR")/" 2>/dev/null; then
        success "备份已上传到远程服务器: $REMOTE_HOST"
    else
        error "远程备份上传失败"
        return 1
    fi
}

# 上传到云存储
upload_to_cloud() {
    if [ "$CLOUD_BACKUP" != "true" ] || [ -z "$CLOUD_PROVIDER" ]; then
        return 0
    fi
    
    info "开始上传备份到云存储..."
    
    case "$CLOUD_PROVIDER" in
        "aliyun")
            upload_to_aliyun
            ;;
        "tencent")
            upload_to_tencent
            ;;
        "aws")
            upload_to_aws
            ;;
        *)
            error "不支持的云存储提供商: $CLOUD_PROVIDER"
            return 1
            ;;
    esac
}

# 上传到阿里云OSS
upload_to_aliyun() {
    if ! command -v ossutil >/dev/null 2>&1; then
        error "ossutil未安装，无法上传到阿里云OSS"
        return 1
    fi
    
    # 配置ossutil
    ossutil config -e oss-cn-hangzhou.aliyuncs.com -i "$CLOUD_ACCESS_KEY" -k "$CLOUD_SECRET_KEY" >/dev/null 2>&1
    
    # 上传备份
    if ossutil cp -r "$BACKUP_DIR" "oss://$CLOUD_BUCKET/backups/$(basename "$BACKUP_DIR")" >/dev/null 2>&1; then
        success "备份已上传到阿里云OSS"
    else
        error "阿里云OSS上传失败"
        return 1
    fi
}

# 上传到腾讯云COS
upload_to_tencent() {
    if ! command -v coscli >/dev/null 2>&1; then
        error "coscli未安装，无法上传到腾讯云COS"
        return 1
    fi
    
    # 配置coscli
    coscli config set -s "$CLOUD_ACCESS_KEY" -k "$CLOUD_SECRET_KEY" >/dev/null 2>&1
    
    # 上传备份
    if coscli cp -r "$BACKUP_DIR" "cos://$CLOUD_BUCKET/backups/$(basename "$BACKUP_DIR")" >/dev/null 2>&1; then
        success "备份已上传到腾讯云COS"
    else
        error "腾讯云COS上传失败"
        return 1
    fi
}

# 上传到AWS S3
upload_to_aws() {
    if ! command -v aws >/dev/null 2>&1; then
        error "aws cli未安装，无法上传到AWS S3"
        return 1
    fi
    
    # 配置AWS CLI
    export AWS_ACCESS_KEY_ID="$CLOUD_ACCESS_KEY"
    export AWS_SECRET_ACCESS_KEY="$CLOUD_SECRET_KEY"
    
    # 上传备份
    if aws s3 cp "$BACKUP_DIR" "s3://$CLOUD_BUCKET/backups/$(basename "$BACKUP_DIR")" --recursive >/dev/null 2>&1; then
        success "备份已上传到AWS S3"
    else
        error "AWS S3上传失败"
        return 1
    fi
}

# 清理旧备份
cleanup_old_backups() {
    info "开始清理旧备份..."
    
    # 清理本地数据库备份
    find "$BACKUP_ROOT" -name "*.sql*" -type f -mtime +$DB_BACKUP_RETENTION -delete 2>/dev/null
    info "已清理 ${DB_BACKUP_RETENTION} 天前的数据库备份"
    
    # 清理本地文件备份
    find "$BACKUP_ROOT" -name "*.tar*" -type f -mtime +$FILE_BACKUP_RETENTION -delete 2>/dev/null
    info "已清理 ${FILE_BACKUP_RETENTION} 天前的文件备份"
    
    # 清理空目录
    find "$BACKUP_ROOT" -type d -empty -delete 2>/dev/null
    
    success "旧备份清理完成"
}

# 验证备份完整性
verify_backup() {
    info "开始验证备份完整性..."
    
    local backup_log="$BACKUP_DIR/backup.log"
    local verification_failed=false
    
    if [ -f "$backup_log" ]; then
        while IFS=',' read -r timestamp type filename size; do
            local file_path="$BACKUP_DIR/$type/$filename"
            
            if [ -f "$file_path" ]; then
                local actual_size=$(stat -c%s "$file_path")
                if [ "$actual_size" = "$size" ]; then
                    success "备份文件验证通过: $filename"
                else
                    error "备份文件大小不匹配: $filename (期望: $size, 实际: $actual_size)"
                    verification_failed=true
                fi
            else
                error "备份文件不存在: $file_path"
                verification_failed=true
            fi
        done < "$backup_log"
    fi
    
    if [ "$verification_failed" = "true" ]; then
        error "备份验证失败"
        return 1
    else
        success "所有备份文件验证通过"
        return 0
    fi
}

# 发送通知
send_notification() {
    local status=$1
    local message=$2
    
    local subject="TravelWeb备份通知 - $status"
    local full_message="备份时间: $(date)\n状态: $status\n详情: $message"
    
    # 发送邮件通知
    if command -v mail >/dev/null 2>&1; then
        echo -e "$full_message" | mail -s "$subject" "$NOTIFY_EMAIL"
    fi
    
    # 发送钉钉通知
    if [ -n "$DINGTALK_WEBHOOK" ]; then
        curl -H "Content-Type: application/json" \
             -d "{\"msgtype\":\"text\",\"text\":{\"content\":\"$subject\\n$full_message\"}}" \
             "$DINGTALK_WEBHOOK" >/dev/null 2>&1
    fi
}

# 生成备份报告
generate_backup_report() {
    local report_file="$BACKUP_DIR/backup-report.txt"
    
    {
        echo "TravelWeb 备份报告"
        echo "=================="
        echo "备份时间: $(date)"
        echo "备份目录: $BACKUP_DIR"
        echo ""
        
        echo "备份文件列表:"
        echo "============"
        find "$BACKUP_DIR" -type f -name "*.sql*" -o -name "*.tar*" | while read -r file; do
            local size=$(stat -c%s "$file" | numfmt --to=iec)
            echo "$(basename "$file") - $size"
        done
        
        echo ""
        echo "备份统计:"
        echo "========"
        local total_files=$(find "$BACKUP_DIR" -type f | wc -l)
        local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
        echo "文件总数: $total_files"
        echo "总大小: $total_size"
        
        if [ -f "$BACKUP_DIR/backup.log" ]; then
            echo ""
            echo "备份详情:"
            echo "========"
            cat "$BACKUP_DIR/backup.log"
        fi
        
    } > "$report_file"
    
    echo "$report_file"
}

# 恢复数据库
restore_database() {
    local backup_file=$1
    
    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
        error "备份文件不存在: $backup_file"
        return 1
    fi
    
    info "开始恢复数据库: $backup_file"
    
    local db_name="${DB_NAME:-travelweb}"
    local db_user="${DB_USER:-travelweb}"
    local db_password="${DB_PASSWORD}"
    local db_host="${DB_HOST:-localhost}"
    local db_port="${DB_PORT:-3306}"
    
    # 处理压缩文件
    local temp_file=""
    if [[ "$backup_file" == *.gz ]]; then
        temp_file=$(mktemp)
        gunzip -c "$backup_file" > "$temp_file"
        backup_file="$temp_file"
    fi
    
    # 处理加密文件
    if [[ "$backup_file" == *.enc ]]; then
        if [ -z "$BACKUP_PASSWORD" ]; then
            error "需要备份密码来解密文件"
            return 1
        fi
        
        local decrypted_file=$(mktemp)
        openssl enc -aes-256-cbc -d -in "$backup_file" -out "$decrypted_file" -pass pass:"$BACKUP_PASSWORD"
        backup_file="$decrypted_file"
    fi
    
    # 恢复数据库
    if mysql -h"$db_host" -P"$db_port" -u"$db_user" -p"$db_password" "$db_name" < "$backup_file" 2>/dev/null; then
        success "数据库恢复完成"
        
        # 清理临时文件
        [ -n "$temp_file" ] && rm -f "$temp_file"
        [ -n "$decrypted_file" ] && rm -f "$decrypted_file"
        
        return 0
    else
        error "数据库恢复失败"
        return 1
    fi
}

# 列出可用备份
list_backups() {
    local backup_type="${1:-all}"
    
    echo "可用备份列表:"
    echo "============"
    
    case "$backup_type" in
        "database"|"db")
            find "$BACKUP_ROOT" -name "*.sql*" -type f | sort -r | head -20
            ;;
        "files")
            find "$BACKUP_ROOT" -name "*.tar*" -type f | sort -r | head -20
            ;;
        "all"|*)
            find "$BACKUP_ROOT" -type f \( -name "*.sql*" -o -name "*.tar*" \) | sort -r | head -20
            ;;
    esac
}

# 显示帮助信息
show_help() {
    cat << EOF
TravelWeb 备份脚本

用法: $0 {backup|restore|list|cleanup|verify} [选项]

命令:
  backup              执行完整备份
  restore FILE        恢复数据库备份
  list [TYPE]         列出可用备份 (TYPE: database|files|all)
  cleanup             清理旧备份
  verify [DIR]        验证备份完整性

选项:
  --db-only           仅备份数据库
  --files-only        仅备份文件
  --config-only       仅备份配置
  --no-compress       不压缩备份
  --no-remote         不上传到远程
  --no-cloud          不上传到云存储
  -v, --verbose       详细输出
  -h, --help          显示此帮助信息

环境变量:
  BACKUP_ROOT                备份根目录 (默认: /var/backups/travelweb)
  DB_BACKUP_RETENTION        数据库备份保留天数 (默认: 30)
  FILE_BACKUP_RETENTION      文件备份保留天数 (默认: 7)
  COMPRESS_BACKUPS           是否压缩备份 (默认: true)
  ENCRYPT_BACKUPS            是否加密备份 (默认: false)
  BACKUP_PASSWORD            备份加密密码
  REMOTE_BACKUP              是否远程备份 (默认: false)
  CLOUD_BACKUP               是否云备份 (默认: false)
  NOTIFY_EMAIL               通知邮箱
  DINGTALK_WEBHOOK           钉钉通知Webhook

示例:
  $0 backup                  # 执行完整备份
  $0 backup --db-only        # 仅备份数据库
  $0 restore /path/to/backup.sql  # 恢复数据库
  $0 list database           # 列出数据库备份
  $0 cleanup                 # 清理旧备份

EOF
}

# 主函数
main() {
    local command=$1
    shift
    
    # 解析选项
    local db_only=false
    local files_only=false
    local config_only=false
    local no_compress=false
    local no_remote=false
    local no_cloud=false
    local verbose=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --db-only)
                db_only=true
                shift
                ;;
            --files-only)
                files_only=true
                shift
                ;;
            --config-only)
                config_only=true
                shift
                ;;
            --no-compress)
                no_compress=true
                COMPRESS_BACKUPS=false
                shift
                ;;
            --no-remote)
                no_remote=true
                REMOTE_BACKUP=false
                shift
                ;;
            --no-cloud)
                no_cloud=true
                CLOUD_BACKUP=false
                shift
                ;;
            -v|--verbose)
                verbose=true
                set -x
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
    
    case "$command" in
        backup)
            info "开始TravelWeb备份任务..."
            
            create_backup_dirs
            
            local backup_success=true
            
            # 执行备份
            if [ "$files_only" != "true" ] && [ "$config_only" != "true" ]; then
                backup_database || backup_success=false
            fi
            
            if [ "$db_only" != "true" ] && [ "$config_only" != "true" ]; then
                backup_files || backup_success=false
            fi
            
            if [ "$db_only" != "true" ] && [ "$files_only" != "true" ]; then
                backup_config || backup_success=false
            fi
            
            # 验证备份
            verify_backup || backup_success=false
            
            # 上传备份
            upload_to_remote || backup_success=false
            upload_to_cloud || backup_success=false
            
            # 生成报告
            local report_file=$(generate_backup_report)
            info "备份报告已生成: $report_file"
            
            # 发送通知
            if [ "$backup_success" = "true" ]; then
                success "备份任务完成"
                send_notification "成功" "备份任务成功完成"
            else
                error "备份任务失败"
                send_notification "失败" "备份任务执行过程中出现错误"
                exit 1
            fi
            ;;
        restore)
            local backup_file=$1
            if [ -z "$backup_file" ]; then
                error "请指定要恢复的备份文件"
                show_help
                exit 1
            fi
            restore_database "$backup_file"
            ;;
        list)
            list_backups "$1"
            ;;
        cleanup)
            cleanup_old_backups
            ;;
        verify)
            local backup_dir="${1:-$BACKUP_DIR}"
            if [ -z "$backup_dir" ]; then
                error "请指定要验证的备份目录"
                exit 1
            fi
            BACKUP_DIR="$backup_dir"
            verify_backup
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

# 执行主函数
main "$@"