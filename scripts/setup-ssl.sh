#!/bin/bash

# SSL证书配置脚本
# 支持Let's Encrypt自动证书和手动证书安装

# 配置
DOMAIN="${DOMAIN:-www.wisdomier.com}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.wisdomier.com}"
EMAIL="${SSL_EMAIL:-admin@wisdomier.com}"
WEBROOT_PATH="${WEBROOT_PATH:-/var/www/certbot}"
CERT_PATH="/etc/ssl/certs"
KEY_PATH="/etc/ssl/private"
NGINX_CONF_PATH="/etc/nginx/sites-available/travelweb"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled/travelweb"

# SSL配置选项
SSL_METHOD="${SSL_METHOD:-letsencrypt}"  # letsencrypt, manual, self-signed
FORCE_RENEWAL="${FORCE_RENEWAL:-false}"
DRY_RUN="${DRY_RUN:-false}"
AUTO_RENEWAL="${AUTO_RENEWAL:-true}"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 日志函数
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "${timestamp} [${level}] ${message}"
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

# 检查依赖
check_dependencies() {
    info "检查依赖项..."
    
    local missing_deps=()
    
    # 检查基本工具
    if ! command -v nginx >/dev/null 2>&1; then
        missing_deps+=("nginx")
    fi
    
    if ! command -v openssl >/dev/null 2>&1; then
        missing_deps+=("openssl")
    fi
    
    # 检查Let's Encrypt相关工具
    if [ "$SSL_METHOD" = "letsencrypt" ]; then
        if ! command -v certbot >/dev/null 2>&1; then
            missing_deps+=("certbot")
        fi
        
        if ! command -v python3-certbot-nginx >/dev/null 2>&1 && ! dpkg -l | grep -q python3-certbot-nginx; then
            missing_deps+=("python3-certbot-nginx")
        fi
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        error "缺少依赖项: ${missing_deps[*]}"
        info "安装依赖项..."
        
        # 更新包列表
        apt-get update >/dev/null 2>&1
        
        # 安装缺失的依赖
        for dep in "${missing_deps[@]}"; do
            case "$dep" in
                "nginx")
                    apt-get install -y nginx
                    ;;
                "openssl")
                    apt-get install -y openssl
                    ;;
                "certbot")
                    apt-get install -y certbot
                    ;;
                "python3-certbot-nginx")
                    apt-get install -y python3-certbot-nginx
                    ;;
            esac
        done
        
        success "依赖项安装完成"
    else
        success "所有依赖项已满足"
    fi
}

# 创建必要目录
create_directories() {
    info "创建必要目录..."
    
    # 创建证书目录
    mkdir -p "$CERT_PATH"
    mkdir -p "$KEY_PATH"
    
    # 创建webroot目录（用于Let's Encrypt验证）
    mkdir -p "$WEBROOT_PATH"
    
    # 创建Nginx配置目录
    mkdir -p "$(dirname "$NGINX_CONF_PATH")"
    mkdir -p "$(dirname "$NGINX_ENABLED_PATH")"
    
    # 设置权限
    chmod 755 "$CERT_PATH"
    chmod 700 "$KEY_PATH"
    chmod 755 "$WEBROOT_PATH"
    
    success "目录创建完成"
}

# 备份现有配置
backup_existing_config() {
    info "备份现有配置..."
    
    local backup_dir="/var/backups/ssl-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # 备份现有证书
    if [ -f "$CERT_PATH/${DOMAIN}.crt" ]; then
        cp "$CERT_PATH/${DOMAIN}.crt" "$backup_dir/"
    fi
    
    if [ -f "$KEY_PATH/${DOMAIN}.key" ]; then
        cp "$KEY_PATH/${DOMAIN}.key" "$backup_dir/"
    fi
    
    # 备份Nginx配置
    if [ -f "$NGINX_CONF_PATH" ]; then
        cp "$NGINX_CONF_PATH" "$backup_dir/"
    fi
    
    success "配置已备份到: $backup_dir"
    echo "$backup_dir" > "/tmp/ssl-backup-path"
}

# 安装Nginx配置
install_nginx_config() {
    info "安装Nginx配置..."
    
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local project_root="$(dirname "$script_dir")"
    local nginx_config="$project_root/nginx/travelweb.conf"
    
    if [ ! -f "$nginx_config" ]; then
        error "Nginx配置文件不存在: $nginx_config"
        return 1
    fi
    
    # 复制配置文件
    cp "$nginx_config" "$NGINX_CONF_PATH"
    
    # 创建软链接启用站点
    if [ ! -L "$NGINX_ENABLED_PATH" ]; then
        ln -sf "$NGINX_CONF_PATH" "$NGINX_ENABLED_PATH"
    fi
    
    # 删除默认站点（如果存在）
    if [ -L "/etc/nginx/sites-enabled/default" ]; then
        rm -f "/etc/nginx/sites-enabled/default"
    fi
    
    success "Nginx配置已安装"
}

# 生成自签名证书
generate_self_signed_cert() {
    info "生成自签名SSL证书..."
    
    local cert_file="$CERT_PATH/${DOMAIN}.crt"
    local key_file="$KEY_PATH/${DOMAIN}.key"
    
    # 生成私钥
    openssl genrsa -out "$key_file" 2048
    
    # 生成证书签名请求配置
    local csr_config="/tmp/ssl_csr.conf"
    cat > "$csr_config" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=CN
ST=Beijing
L=Beijing
O=TravelWeb
OU=IT Department
CN=${DOMAIN}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${DOMAIN}
DNS.2 = ${ADMIN_DOMAIN}
DNS.3 = wisdomier.com
EOF
    
    # 生成自签名证书
    openssl req -new -x509 -key "$key_file" -out "$cert_file" -days 365 -config "$csr_config" -extensions v3_req
    
    # 设置权限
    chmod 644 "$cert_file"
    chmod 600 "$key_file"
    
    # 清理临时文件
    rm -f "$csr_config"
    
    success "自签名证书生成完成"
    warn "注意: 自签名证书不被浏览器信任，仅用于测试环境"
}

# 使用Let's Encrypt获取证书
obtain_letsencrypt_cert() {
    info "使用Let's Encrypt获取SSL证书..."
    
    # 检查域名DNS解析
    if ! nslookup "$DOMAIN" >/dev/null 2>&1; then
        error "域名 $DOMAIN DNS解析失败，请检查DNS配置"
        return 1
    fi
    
    # 停止Nginx（避免端口冲突）
    if systemctl is-active --quiet nginx; then
        systemctl stop nginx
        local nginx_was_running=true
    fi
    
    # 构建certbot命令
    local certbot_cmd="certbot certonly"
    
    if [ "$DRY_RUN" = "true" ]; then
        certbot_cmd="$certbot_cmd --dry-run"
    fi
    
    # 使用standalone模式（推荐用于初始获取）
    certbot_cmd="$certbot_cmd --standalone"
    certbot_cmd="$certbot_cmd --email $EMAIL"
    certbot_cmd="$certbot_cmd --agree-tos"
    certbot_cmd="$certbot_cmd --no-eff-email"
    certbot_cmd="$certbot_cmd -d $DOMAIN"
    
    # 添加管理域名
    if [ -n "$ADMIN_DOMAIN" ]; then
        certbot_cmd="$certbot_cmd -d $ADMIN_DOMAIN"
    fi
    
    # 添加根域名
    if [ "$DOMAIN" != "wisdomier.com" ]; then
        certbot_cmd="$certbot_cmd -d wisdomier.com"
    fi
    
    # 强制续期
    if [ "$FORCE_RENEWAL" = "true" ]; then
        certbot_cmd="$certbot_cmd --force-renewal"
    fi
    
    info "执行命令: $certbot_cmd"
    
    # 执行certbot
    if eval "$certbot_cmd"; then
        success "Let's Encrypt证书获取成功"
        
        # 复制证书到标准位置
        local le_cert_path="/etc/letsencrypt/live/$DOMAIN"
        if [ -d "$le_cert_path" ]; then
            cp "$le_cert_path/fullchain.pem" "$CERT_PATH/${DOMAIN}.crt"
            cp "$le_cert_path/privkey.pem" "$KEY_PATH/${DOMAIN}.key"
            
            # 设置权限
            chmod 644 "$CERT_PATH/${DOMAIN}.crt"
            chmod 600 "$KEY_PATH/${DOMAIN}.key"
            
            success "证书已复制到标准位置"
        fi
    else
        error "Let's Encrypt证书获取失败"
        
        # 如果失败，生成自签名证书作为备用
        warn "生成自签名证书作为备用..."
        generate_self_signed_cert
    fi
    
    # 重启Nginx
    if [ "$nginx_was_running" = "true" ]; then
        systemctl start nginx
    fi
}

# 手动安装证书
install_manual_cert() {
    info "手动安装SSL证书..."
    
    local cert_file="$CERT_PATH/${DOMAIN}.crt"
    local key_file="$KEY_PATH/${DOMAIN}.key"
    
    # 检查证书文件是否存在
    if [ ! -f "$MANUAL_CERT_FILE" ]; then
        error "证书文件不存在: $MANUAL_CERT_FILE"
        return 1
    fi
    
    if [ ! -f "$MANUAL_KEY_FILE" ]; then
        error "私钥文件不存在: $MANUAL_KEY_FILE"
        return 1
    fi
    
    # 验证证书
    if ! openssl x509 -in "$MANUAL_CERT_FILE" -text -noout >/dev/null 2>&1; then
        error "证书文件格式无效"
        return 1
    fi
    
    if ! openssl rsa -in "$MANUAL_KEY_FILE" -check >/dev/null 2>&1; then
        error "私钥文件格式无效"
        return 1
    fi
    
    # 复制证书文件
    cp "$MANUAL_CERT_FILE" "$cert_file"
    cp "$MANUAL_KEY_FILE" "$key_file"
    
    # 设置权限
    chmod 644 "$cert_file"
    chmod 600 "$key_file"
    
    success "手动证书安装完成"
}

# 验证证书
verify_certificate() {
    info "验证SSL证书..."
    
    local cert_file="$CERT_PATH/${DOMAIN}.crt"
    local key_file="$KEY_PATH/${DOMAIN}.key"
    
    if [ ! -f "$cert_file" ] || [ ! -f "$key_file" ]; then
        error "证书文件不存在"
        return 1
    fi
    
    # 检查证书有效性
    local cert_info=$(openssl x509 -in "$cert_file" -text -noout 2>/dev/null)
    if [ $? -ne 0 ]; then
        error "证书文件无效"
        return 1
    fi
    
    # 检查私钥有效性
    if ! openssl rsa -in "$key_file" -check >/dev/null 2>&1; then
        error "私钥文件无效"
        return 1
    fi
    
    # 检查证书和私钥匹配
    local cert_modulus=$(openssl x509 -noout -modulus -in "$cert_file" 2>/dev/null | openssl md5)
    local key_modulus=$(openssl rsa -noout -modulus -in "$key_file" 2>/dev/null | openssl md5)
    
    if [ "$cert_modulus" != "$key_modulus" ]; then
        error "证书和私钥不匹配"
        return 1
    fi
    
    # 获取证书信息
    local subject=$(echo "$cert_info" | grep "Subject:" | sed 's/.*Subject: //')
    local issuer=$(echo "$cert_info" | grep "Issuer:" | sed 's/.*Issuer: //')
    local not_before=$(echo "$cert_info" | grep "Not Before:" | sed 's/.*Not Before: //')
    local not_after=$(echo "$cert_info" | grep "Not After:" | sed 's/.*Not After: //')
    local san=$(echo "$cert_info" | grep -A1 "Subject Alternative Name:" | tail -1 | sed 's/.*DNS://')
    
    success "证书验证通过"
    info "证书信息:"
    info "  主题: $subject"
    info "  颁发者: $issuer"
    info "  有效期: $not_before 至 $not_after"
    if [ -n "$san" ]; then
        info "  备用名称: $san"
    fi
    
    # 检查证书过期时间
    local expire_date=$(date -d "$not_after" +%s 2>/dev/null)
    local current_date=$(date +%s)
    local days_left=$(( (expire_date - current_date) / 86400 ))
    
    if [ "$days_left" -lt 30 ]; then
        warn "证书将在 $days_left 天后过期，建议尽快续期"
    else
        info "证书还有 $days_left 天过期"
    fi
}

# 测试Nginx配置
test_nginx_config() {
    info "测试Nginx配置..."
    
    if nginx -t >/dev/null 2>&1; then
        success "Nginx配置语法正确"
        return 0
    else
        error "Nginx配置语法错误:"
        nginx -t
        return 1
    fi
}

# 重载Nginx
reload_nginx() {
    info "重载Nginx配置..."
    
    if systemctl is-active --quiet nginx; then
        if systemctl reload nginx; then
            success "Nginx配置已重载"
        else
            error "Nginx重载失败"
            return 1
        fi
    else
        if systemctl start nginx; then
            success "Nginx已启动"
        else
            error "Nginx启动失败"
            return 1
        fi
    fi
}

# 设置自动续期
setup_auto_renewal() {
    if [ "$AUTO_RENEWAL" != "true" ] || [ "$SSL_METHOD" != "letsencrypt" ]; then
        return 0
    fi
    
    info "设置SSL证书自动续期..."
    
    # 创建续期脚本
    local renewal_script="/usr/local/bin/ssl-renewal.sh"
    cat > "$renewal_script" << 'EOF'
#!/bin/bash

# SSL证书自动续期脚本
DOMAIN="www.wisdomier.com"
CERT_PATH="/etc/ssl/certs"
KEY_PATH="/etc/ssl/private"

# 续期证书
certbot renew --quiet --no-self-upgrade

# 检查是否有新证书
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    # 复制新证书
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERT_PATH/${DOMAIN}.crt"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$KEY_PATH/${DOMAIN}.key"
    
    # 设置权限
    chmod 644 "$CERT_PATH/${DOMAIN}.crt"
    chmod 600 "$KEY_PATH/${DOMAIN}.key"
    
    # 重载Nginx
    systemctl reload nginx
    
    # 记录日志
    echo "$(date): SSL证书已续期" >> /var/log/ssl-renewal.log
fi
EOF
    
    chmod +x "$renewal_script"
    
    # 添加到crontab
    local cron_job="0 2 * * * $renewal_script"
    
    # 检查是否已存在
    if ! crontab -l 2>/dev/null | grep -q "$renewal_script"; then
        (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
        success "自动续期任务已添加到crontab"
    else
        info "自动续期任务已存在"
    fi
    
    # 创建systemd timer（推荐方式）
    cat > "/etc/systemd/system/ssl-renewal.service" << EOF
[Unit]
Description=SSL Certificate Renewal
After=network.target

[Service]
Type=oneshot
ExecStart=$renewal_script
User=root
EOF
    
    cat > "/etc/systemd/system/ssl-renewal.timer" << EOF
[Unit]
Description=SSL Certificate Renewal Timer
Requires=ssl-renewal.service

[Timer]
OnCalendar=daily
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
EOF
    
    # 启用timer
    systemctl daemon-reload
    systemctl enable ssl-renewal.timer
    systemctl start ssl-renewal.timer
    
    success "SSL证书自动续期已配置"
}

# 测试SSL连接
test_ssl_connection() {
    info "测试SSL连接..."
    
    # 等待Nginx启动
    sleep 5
    
    # 测试本地连接
    if curl -k -s --max-time 10 "https://localhost/health" >/dev/null; then
        success "本地HTTPS连接测试通过"
    else
        warn "本地HTTPS连接测试失败"
    fi
    
    # 测试域名连接（如果DNS已配置）
    if nslookup "$DOMAIN" >/dev/null 2>&1; then
        if curl -s --max-time 10 "https://$DOMAIN/health" >/dev/null; then
            success "域名HTTPS连接测试通过"
        else
            warn "域名HTTPS连接测试失败，可能需要等待DNS传播"
        fi
    else
        warn "域名DNS未配置，跳过域名连接测试"
    fi
    
    # 使用openssl测试SSL握手
    if echo | openssl s_client -connect "localhost:443" -servername "$DOMAIN" >/dev/null 2>&1; then
        success "SSL握手测试通过"
    else
        warn "SSL握手测试失败"
    fi
}

# 显示SSL信息
show_ssl_info() {
    echo ""
    echo "${CYAN}SSL配置信息:${NC}"
    echo "============"
    echo "域名: $DOMAIN"
    echo "管理域名: $ADMIN_DOMAIN"
    echo "SSL方法: $SSL_METHOD"
    echo "证书路径: $CERT_PATH/${DOMAIN}.crt"
    echo "私钥路径: $KEY_PATH/${DOMAIN}.key"
    echo "Nginx配置: $NGINX_CONF_PATH"
    
    if [ -f "$CERT_PATH/${DOMAIN}.crt" ]; then
        local expire_date=$(openssl x509 -in "$CERT_PATH/${DOMAIN}.crt" -noout -enddate 2>/dev/null | cut -d= -f2)
        echo "证书过期时间: $expire_date"
    fi
    
    echo ""
    echo "${CYAN}下一步操作:${NC}"
    echo "=========="
    echo "1. 确保DNS记录指向此服务器"
    echo "2. 检查防火墙开放443端口: ufw allow 443"
    echo "3. 测试HTTPS访问: https://$DOMAIN"
    echo "4. 检查SSL评级: https://www.ssllabs.com/ssltest/"
    
    if [ "$SSL_METHOD" = "letsencrypt" ]; then
        echo "5. 证书将自动续期，无需手动操作"
    fi
}

# 显示帮助信息
show_help() {
    cat << EOF
SSL证书配置脚本

用法: $0 [选项]

选项:
  --method METHOD         SSL证书方法 (letsencrypt|manual|self-signed)
  --domain DOMAIN         主域名 (默认: www.wisdomier.com)
  --admin-domain DOMAIN   管理域名 (默认: admin.wisdomier.com)
  --email EMAIL           Let's Encrypt邮箱
  --cert-file FILE        手动证书文件路径
  --key-file FILE         手动私钥文件路径
  --force-renewal         强制续期Let's Encrypt证书
  --no-auto-renewal       禁用自动续期
  --dry-run               测试模式（不实际获取证书）
  -v, --verbose           详细输出
  -h, --help              显示此帮助信息

SSL方法:
  letsencrypt            使用Let's Encrypt免费证书（推荐）
  manual                 手动安装证书文件
  self-signed            生成自签名证书（仅用于测试）

环境变量:
  DOMAIN                 主域名
  ADMIN_DOMAIN           管理域名
  SSL_EMAIL              Let's Encrypt邮箱
  SSL_METHOD             SSL证书方法
  MANUAL_CERT_FILE       手动证书文件路径
  MANUAL_KEY_FILE        手动私钥文件路径
  FORCE_RENEWAL          强制续期
  AUTO_RENEWAL           自动续期

示例:
  $0                                    # 使用Let's Encrypt获取证书
  $0 --method self-signed               # 生成自签名证书
  $0 --method manual --cert-file cert.pem --key-file key.pem  # 手动安装证书
  $0 --force-renewal                    # 强制续期证书
  $0 --dry-run                          # 测试模式

EOF
}

# 主函数
main() {
    info "开始SSL证书配置..."
    
    # 检查权限
    if [ "$EUID" -ne 0 ]; then
        error "请使用root权限运行此脚本"
        exit 1
    fi
    
    # 检查依赖
    check_dependencies
    
    # 创建目录
    create_directories
    
    # 备份配置
    backup_existing_config
    
    # 安装Nginx配置
    install_nginx_config
    
    # 根据方法获取/安装证书
    case "$SSL_METHOD" in
        "letsencrypt")
            obtain_letsencrypt_cert
            ;;
        "manual")
            install_manual_cert
            ;;
        "self-signed")
            generate_self_signed_cert
            ;;
        *)
            error "未知的SSL方法: $SSL_METHOD"
            exit 1
            ;;
    esac
    
    # 验证证书
    if ! verify_certificate; then
        error "证书验证失败"
        exit 1
    fi
    
    # 测试Nginx配置
    if ! test_nginx_config; then
        error "Nginx配置测试失败"
        exit 1
    fi
    
    # 重载Nginx
    if ! reload_nginx; then
        error "Nginx重载失败"
        exit 1
    fi
    
    # 设置自动续期
    setup_auto_renewal
    
    # 测试SSL连接
    test_ssl_connection
    
    # 显示信息
    show_ssl_info
    
    success "SSL证书配置完成！"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --method)
            SSL_METHOD="$2"
            shift 2
            ;;
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --admin-domain)
            ADMIN_DOMAIN="$2"
            shift 2
            ;;
        --email)
            EMAIL="$2"
            shift 2
            ;;
        --cert-file)
            MANUAL_CERT_FILE="$2"
            shift 2
            ;;
        --key-file)
            MANUAL_KEY_FILE="$2"
            shift 2
            ;;
        --force-renewal)
            FORCE_RENEWAL=true
            shift
            ;;
        --no-auto-renewal)
            AUTO_RENEWAL=false
            shift
            ;;
        --dry-run)
            DRY_RUN=true
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