# 数据库迁移指南

## 概述

本目录包含了 TravelWeb 项目的数据库迁移工具和配置文件。主要功能是将本地数据库完整迁移到远程数据库。

## 核心文件说明

### 迁移工具
- **`migrate-database.cjs`** - 统一的数据库迁移脚本（推荐使用）
- **`temp/`** - 临时文件目录（自动创建和清理）

### 数据库服务
- **`DatabaseService.js`** - 数据库服务抽象层
- **`DatabaseFactory.js`** - 数据库工厂类
- **`QueryBuilder.js`** - SQL查询构建器
- **`connection.js`** - 数据库连接管理
- **`mysql-config.js`** - MySQL配置管理

### 数据库适配器
- **`adapters/`** - 数据库适配器目录
  - `DatabaseAdapter.js` - 基础适配器接口
  - `MySQLAdapter.js` - MySQL适配器
  - `SQLiteAdapter.js` - SQLite适配器
  - `MemoryAdapter.js` - 内存适配器
  - `SQLiteFileAdapter.js` - SQLite文件适配器

### 初始化文件
- **`init-database.js`** - 数据库初始化脚本
- **`init-mysql.js`** - MySQL初始化脚本
- **`init-mysql.sql`** - MySQL初始化SQL
- **`init-tables.sql`** - 表结构初始化SQL
- **`init.js`** - 通用初始化脚本
- **`setup-database.js`** - 数据库设置脚本

### 迁移工具
- **`migration/`** - 迁移工具目录
  - `MigrationTool.js` - 迁移工具类
  - `TypeMapper.js` - 数据类型映射器

### API接口
- **`api.js`** - 数据库API接口

### 文档
- **`MIGRATION_SUMMARY.md`** - 迁移总结文档
- **`BAOTA_MIGRATION_GUIDE.md`** - 宝塔面板迁移指南

## 快速开始

### 1. 基本迁移（本地到远程）

```bash
# 迁移到远程数据库（通过SSH）
node database/migrate-database.cjs \
  --source-password "your_local_password" \
  --target-host "101.42.21.165" \
  --target-user "travelweb_user" \
  --target-password "remote_password" \
  --ssh-host "101.42.21.165" \
  --ssh-user "ubuntu" \
  --backup --verify
```

### 2. 干运行模式（测试）

```bash
# 仅显示操作步骤，不实际执行
node database/migrate-database.cjs \
  --source-password "your_local_password" \
  --target-host "101.42.21.165" \
  --target-user "travelweb_user" \
  --target-password "remote_password" \
  --ssh-host "101.42.21.165" \
  --dry-run
```

### 3. 本地到本地迁移

```bash
# 本地数据库之间迁移
node database/migrate-database.cjs \
  --source-password "source_password" \
  --target-host "192.168.1.100" \
  --target-user "target_user" \
  --target-password "target_password" \
  --backup --verify
```

## 命令行选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--source-host` | 源数据库主机 | localhost |
| `--source-user` | 源数据库用户 | root |
| `--source-password` | 源数据库密码 | (必需) |
| `--source-database` | 源数据库名 | travelweb_db |
| `--target-host` | 目标数据库主机 | (必需) |
| `--target-user` | 目标数据库用户 | (必需) |
| `--target-password` | 目标数据库密码 | (必需) |
| `--target-database` | 目标数据库名 | travelweb_db |
| `--ssh-host` | SSH主机（远程操作） | - |
| `--ssh-user` | SSH用户 | ubuntu |
| `--backup` | 迁移前备份目标数据库 | false |
| `--verify` | 迁移后验证数据完整性 | true |
| `--dry-run` | 仅显示操作步骤 | false |
| `--help` | 显示帮助信息 | - |

## 迁移流程

1. **连接验证** - 验证源数据库和目标数据库连接
2. **备份（可选）** - 备份目标数据库
3. **数据导出** - 从源数据库导出所有表结构和数据
4. **数据导入** - 将数据导入到目标数据库
5. **数据验证** - 验证迁移后的数据完整性
6. **生成报告** - 生成详细的迁移报告

## 特性

- ✅ **完整迁移** - 包含表结构、数据、索引等
- ✅ **数据验证** - 自动验证迁移后的数据完整性
- ✅ **备份支持** - 可选的目标数据库备份
- ✅ **SSH支持** - 支持通过SSH连接远程数据库
- ✅ **错误处理** - 完善的错误处理和回滚机制
- ✅ **进度跟踪** - 详细的日志输出和进度显示
- ✅ **干运行模式** - 测试模式，不实际执行操作
- ✅ **JSON处理** - 正确处理JSON类型字段
- ✅ **批量操作** - 大数据量的批量处理

## 注意事项

1. **权限要求**
   - 源数据库需要读取权限
   - 目标数据库需要完整的读写权限
   - SSH用户需要数据库操作权限

2. **网络要求**
   - 确保网络连接稳定
   - SSH连接需要配置密钥或密码认证

3. **数据安全**
   - 建议在迁移前备份重要数据
   - 使用 `--dry-run` 模式先测试迁移流程

4. **性能考虑**
   - 大数据量迁移可能需要较长时间
   - 建议在低峰期进行迁移操作

## 故障排除

### 常见问题

1. **连接失败**
   ```
   错误: 源数据库连接失败
   解决: 检查数据库配置和网络连接
   ```

2. **SSH连接失败**
   ```
   错误: SSH连接失败
   解决: 检查SSH配置和密钥认证
   ```

3. **权限不足**
   ```
   错误: Access denied
   解决: 检查数据库用户权限
   ```

4. **数据验证失败**
   ```
   错误: 数据验证失败，迁移可能不完整
   解决: 检查迁移日志，重新执行迁移
   ```

### 日志分析

迁移脚本会输出详细的日志信息：
- 📝 信息日志
- ✅ 成功操作
- ⚠️ 警告信息
- ❌ 错误信息
- 🔄 进度更新

## 环境要求

- Node.js 14+
- MySQL 5.7+
- SSH客户端（远程迁移）
- 足够的磁盘空间（临时文件）

## 支持

如有问题，请查看：
1. 本文档的故障排除部分
2. 迁移日志输出
3. 相关的错误信息和建议

---

**重要提醒**: 在生产环境中使用前，请务必在测试环境中验证迁移流程。