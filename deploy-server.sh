#!/bin/bash

# TravelWeb 服务器自动化部署脚本
# 用于在远程服务器上部署项目
# 使用方法: bash deploy-server.sh

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="TravelWeb"
GITHUB_REPO="https://github.com/Hedlen/Chengex.git"
PROJECT_DIR="/home/ubuntu/Chengex"
DB_NAME="travelweb_db"
DB_USER="travelweb_user"
DB_PASSWORD="7481196mysql"
DOMAIN_MAIN="chengex.wisdomier.com"
DOMAIN_ADMIN="chengex.admin.wisdomier.com"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装"
        return 1
    else
        log_success "$1 已安装"
        return 0
    fi
}

# 生成随机JWT密钥
generate_jwt_secret() {
    openssl rand -hex 32
}

# 检查服务器环境
check_environment() {
    log_info "检查服务器环境..."
    
    # 检查必要的命令
    local missing_commands=()
    
    if ! check_command "node"; then
        missing_commands+=("node")
    fi
    
    if ! check_command "npm"; then
        missing_commands+=("npm")
    fi
    
    if ! check_command "mysql"; then
        missing_commands+=("mysql")
    fi
    
    if ! check_command "nginx"; then
        missing_commands+=("nginx")
    fi
    
    if ! check_command "pm2"; then
        missing_commands+=("pm2")
    fi
    
    if ! check_command "git"; then
        missing_commands+=("git")
    fi
    
    if [ ${#missing_commands[@]} -ne 0 ]; then
        log_error "以下命令未安装: ${missing_commands[*]}"
        log_info "请先安装缺失的软件包"
        exit 1
    fi
    
    log_success "服务器环境检查完成"
}

# 克隆或更新项目
clone_or_update_project() {
    log_info "克隆或更新项目..."
    
    if [ -d "$PROJECT_DIR" ]; then
        log_info "项目目录已存在，更新代码..."
        cd "$PROJECT_DIR"
        git pull origin main