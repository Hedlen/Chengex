# TravelWeb 本地打包脚本
# 用于宝塔面板部署的本地打包方案

param(
    [switch]$SkipBuild,
    [switch]$UploadOnly,
    [string]$OutputDir = "deploy-package"
)

Write-Host "🚀 TravelWeb 宝塔部署打包工具" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$PackageName = "travelweb-baota-$Timestamp"
$PackageDir = Join-Path $ProjectRoot $OutputDir $PackageName

# 检查并构建项目
if (-not $SkipBuild) {
    Write-Host "`n📦 构建项目..." -ForegroundColor Yellow
    
    # 构建前端
    Write-Host "构建前端应用..." -ForegroundColor Cyan
    Set-Location $ProjectRoot
    npm run build:frontend
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 前端构建失败" -ForegroundColor Red
        exit 1
    }
    
    # 构建后台管理系统
    Write-Host "构建后台管理系统..." -ForegroundColor Cyan
    Set-Location (Join-Path $ProjectRoot "admin-panel")
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 后台管理系统构建失败" -ForegroundColor Red
        exit 1
    }
    
    Set-Location $ProjectRoot
    Write-Host "✅ 项目构建完成" -ForegroundColor Green
}

# 创建部署包
if (-not $UploadOnly) {
    Write-Host "`n📁 创建部署包..." -ForegroundColor Yellow
    
    # 清理并创建目录
    if (Test-Path (Join-Path $ProjectRoot $OutputDir)) {
        Remove-Item (Join-Path $ProjectRoot $OutputDir) -Recurse -Force
    }
    New-Item -ItemType Directory -Path $PackageDir -Force | Out-Null
    
    # 需要包含的文件和目录
    $IncludeItems = @(
        "dist",
        "admin-panel\dist",
        "src",
        "api", 
        "database",
        "shared",
        "public",
        "server.cjs",
        "package.json",
        "package-lock.json",
        ".env.example",
        "README.md",
        "nginx"
    )
    
    # 复制文件
    Write-Host "复制项目文件..." -ForegroundColor Cyan
    foreach ($Item in $IncludeItems) {
        $SourcePath = Join-Path $ProjectRoot $Item
        $DestPath = Join-Path $PackageDir $Item
        
        if (Test-Path $SourcePath) {
            if (Test-Path $SourcePath -PathType Container) {
                Copy-Item $SourcePath $DestPath -Recurse -Force
                Write-Host "  ✅ $Item/" -ForegroundColor Green
            } else {
                $DestDir = Split-Path $DestPath -Parent
                if (-not (Test-Path $DestDir)) {
                    New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
                }
                Copy-Item $SourcePath $DestPath -Force
                Write-Host "  ✅ $Item" -ForegroundColor Green
            }
        } else {
            Write-Host "  ⚠️  $Item 不存在，跳过" -ForegroundColor Yellow
        }
    }
    
    # 创建部署说明
    $DeploymentInstructions = @"
# TravelWeb 宝塔部署包

## 📋 快速部署步骤

### 1. 上传文件
1. 将整个文件夹上传到宝塔面板的网站根目录
2. 或者压缩后上传并解压

### 2. 安装依赖
``````bash
cd /www/wwwroot/你的域名/
npm install --production
``````

### 3. 配置环境
``````bash
cp .env.example .env
# 编辑 .env 文件配置数据库等信息
``````

### 4. 初始化数据库
``````bash
npm run init:mysql
``````

### 5. 启动服务
``````bash
pm2 start server.cjs --name "travelweb"
pm2 startup
pm2 save
``````

### 6. 配置 Nginx
参考 nginx/ 目录下的配置文件

## 🔧 构建信息
- 构建时间: $Timestamp
- 前端构建: dist/
- 后台管理: admin-panel/dist/
- 服务端: server.cjs

## 📞 技术支持
详细说明请查看主项目 README.md 文件
"@
    
    $DeploymentInstructions | Out-File -FilePath (Join-Path $PackageDir "DEPLOYMENT.md") -Encoding UTF8
    Write-Host "  ✅ DEPLOYMENT.md" -ForegroundColor Green
    
    # 创建压缩包
    Write-Host "`n🗜️  创建压缩包..." -ForegroundColor Yellow
    $ZipFile = "$PackageDir.zip"
    
    try {
        Compress-Archive -Path "$PackageDir\*" -DestinationPath $ZipFile -Force
        Write-Host "✅ 压缩包创建成功: $ZipFile" -ForegroundColor Green
    } catch {
        Write-Host "❌ 压缩失败: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n🎉 打包完成！" -ForegroundColor Green
    Write-Host "📦 部署包位置: $PackageDir" -ForegroundColor Cyan
    Write-Host "🗜️  压缩包位置: $ZipFile" -ForegroundColor Cyan
    
    # 显示文件大小
    $PackageSize = (Get-ChildItem $PackageDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "📊 包大小: $([math]::Round($PackageSize, 2)) MB" -ForegroundColor Cyan
}

Write-Host "`n📋 下一步操作:" -ForegroundColor Yellow
Write-Host "1. 上传压缩包到宝塔面板" -ForegroundColor White
Write-Host "2. 在网站根目录解压" -ForegroundColor White
Write-Host "3. 按照 DEPLOYMENT.md 说明配置" -ForegroundColor White
Write-Host "4. 配置 Nginx 反向代理" -ForegroundColor White

Write-Host "`n🌐 部署后访问地址:" -ForegroundColor Yellow
Write-Host "前端: https://你的域名.com" -ForegroundColor White
Write-Host "后台: https://admin.你的域名.com" -ForegroundColor White
Write-Host "API:  https://你的域名.com/api" -ForegroundColor White