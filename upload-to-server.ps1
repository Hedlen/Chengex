# SCP Upload Script
# Target: ubuntu@101.42.21.165:/www/wwwroot/chengex.wisdomier.com/

param(
    [string]$Mode = "source",
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

# Server config
$SERVER_USER = "ubuntu"
$SERVER_HOST = "101.42.21.165"
$SERVER_PATH = "/www/wwwroot/chengex.wisdomier.com/"
$SERVER_TARGET = "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}"

Write-Host "Starting upload to: $SERVER_TARGET" -ForegroundColor Cyan
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host "Upload mode: $Mode" -ForegroundColor Cyan

# Files to upload based on mode
function Get-FilesToUpload {
    param([string]$UploadMode)
    
    switch ($UploadMode) {
        "source" {
            Write-Host "Source mode - uploading source files" -ForegroundColor Green
            return @("src", "api", "database", "scripts", "shared", "public", "supabase", "package.json", "server.cjs", ".env.example", ".gitignore", "nginx", "README.md")
        }
        "all" {
            Write-Host "All mode - uploading all files" -ForegroundColor Green
            return @(".")
        }
        default {
            Write-Host "Unknown upload mode: $UploadMode" -ForegroundColor Red
            exit 1
        }
    }
}

# Test SSH connection
function Test-SSHConnection {
    Write-Host "Testing SSH connection..." -ForegroundColor Yellow
    try {
        ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_HOST "echo 'SSH OK'" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SSH connection OK" -ForegroundColor Green
            return $true
        } else {
            Write-Host "SSH connection failed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "SSH test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Create remote directory
function Ensure-RemoteDirectory {
    Write-Host "Ensuring remote directory exists..." -ForegroundColor Yellow
    ssh $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_PATH"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Remote directory ready" -ForegroundColor Green
    } else {
        Write-Host "Cannot create remote directory" -ForegroundColor Red
        exit 1
    }
}

# Upload files
function Start-Upload {
    param([array]$FilesToUpload)
    
    Write-Host "Starting file upload..." -ForegroundColor Yellow
    
    foreach ($item in $FilesToUpload) {
        if (Test-Path $item) {
            Write-Host "Preparing to upload: $item" -ForegroundColor Cyan
            
            if ($DryRun) {
                Write-Host "DRY RUN - Would upload: $item" -ForegroundColor Yellow
                continue
            }
            
            # Use scp to upload
            if (Test-Path $item -PathType Container) {
                Write-Host "Uploading directory: $item" -ForegroundColor Blue
                
                # 首先尝试创建远程目录并设置权限
                Write-Host "Setting up remote permissions for $item..." -ForegroundColor Cyan
                ssh "${SERVER_USER}@${SERVER_HOST}" "sudo mkdir -p ${SERVER_PATH}/$item && sudo chown -R ${SERVER_USER}:${SERVER_USER} ${SERVER_PATH}/$item"
                
                # 然后上传文件
                scp -r $item $SERVER_TARGET
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "SUCCESS: $item uploaded" -ForegroundColor Green
                    # 上传后再次设置权限确保正确
                    ssh "${SERVER_USER}@${SERVER_HOST}" "sudo chown -R ${SERVER_USER}:${SERVER_USER} ${SERVER_PATH}/$item"
                } else {
                    Write-Host "FAILED: $item upload failed" -ForegroundColor Red
                    Write-Host "Trying with sudo permissions..." -ForegroundColor Yellow
                    
                    # 如果普通上传失败，尝试先在远程创建临时目录
                    $tempPath = "/tmp/upload_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
                    ssh "${SERVER_USER}@${SERVER_HOST}" "mkdir -p $tempPath"
                    scp -r $item "${SERVER_USER}@${SERVER_HOST}:$tempPath/"
                    
                    if ($LASTEXITCODE -eq 0) {
                        # 使用sudo移动文件到目标位置
                        ssh "${SERVER_USER}@${SERVER_HOST}" "sudo cp -r $tempPath/$item ${SERVER_PATH}/ && sudo chown -R ${SERVER_USER}:${SERVER_USER} ${SERVER_PATH}/$item && rm -rf $tempPath"
                        Write-Host "SUCCESS: $item uploaded via temporary directory" -ForegroundColor Green
                    } else {
                        Write-Host "FAILED: $item upload completely failed" -ForegroundColor Red
                    }
                }
            } else {
                Write-Host "Uploading file: $item" -ForegroundColor Blue
                scp $item $SERVER_TARGET
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "SUCCESS: $item uploaded" -ForegroundColor Green
                } else {
                    Write-Host "FAILED: $item upload failed" -ForegroundColor Red
                }
            }
        } else {
            Write-Host "File not found: $item" -ForegroundColor Yellow
        }
    }
}

# Main execution
try {
    # Check required tools
    if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
        Write-Host "SSH command not found, please install OpenSSH" -ForegroundColor Red
        exit 1
    }
    
    if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
        Write-Host "SCP command not found, please install OpenSSH" -ForegroundColor Red
        exit 1
    }
    
    # Test connection
    if (-not (Test-SSHConnection)) {
        Write-Host "SSH connection failed, please check configuration" -ForegroundColor Red
        exit 1
    }
    
    # Ensure remote directory
    Ensure-RemoteDirectory
    
    # Get files to upload
    $filesToUpload = Get-FilesToUpload -UploadMode $Mode
    
    if ($DryRun) {
        Write-Host "DRY RUN MODE - Files to upload:" -ForegroundColor Yellow
        $filesToUpload | ForEach-Object { Write-Host "  - $_" }
        Write-Host "Run without -DryRun to execute actual upload" -ForegroundColor Cyan
        exit 0
    }
    
    # Show upload info
    Write-Host "Files to upload:" -ForegroundColor Cyan
    $filesToUpload | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    
    # Confirm upload
    if (-not $Force) {
        $confirmation = Read-Host "Continue upload to $SERVER_TARGET ? (y/N)"
        if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
            Write-Host "Upload cancelled" -ForegroundColor Yellow
            exit 0
        }
    } else {
        Write-Host "Force mode - starting upload immediately" -ForegroundColor Green
    }
    
    # Record start time
    $startTime = Get-Date
    
    # Execute upload
    Start-Upload -FilesToUpload $filesToUpload
    
    # Calculate duration
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    Write-Host "Upload completed!" -ForegroundColor Green
    Write-Host "Total time: $($duration.Minutes) min $($duration.Seconds) sec" -ForegroundColor Cyan
    Write-Host "Server: $SERVER_TARGET" -ForegroundColor Cyan
    
} catch {
    Write-Host "Upload error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Usage:" -ForegroundColor Cyan
Write-Host "  .\upload-to-server.ps1                # Default source mode"
Write-Host "  .\upload-to-server.ps1 -Mode all      # Upload all files"
Write-Host "  .\upload-to-server.ps1 -DryRun        # Preview mode"