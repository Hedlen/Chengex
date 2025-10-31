#!/usr/bin/env node

/**
 * 统一数据库迁移脚本
 * 功能：将本地数据库完整迁移到远程数据库
 * 
 * 使用方法：
 * node database/migrate-database.cjs [options]
 * 
 * 选项：
 * --source-host <host>     源数据库主机 (默认: localhost)
 * --source-user <user>     源数据库用户 (默认: root)
 * --source-password <pwd>  源数据库密码
 * --source-database <db>   源数据库名 (默认: travelweb_db)
 * --target-host <host>     目标数据库主机
 * --target-user <user>     目标数据库用户
 * --target-password <pwd>  目标数据库密码
 * --target-database <db>   目标数据库名 (默认: travelweb_db)
 * --ssh-host <host>        SSH主机 (用于远程操作)
 * --ssh-user <user>        SSH用户 (默认: ubuntu)
 * --backup                 迁移前备份目标数据库
 * --verify                 迁移后验证数据完整性
 * --dry-run                仅显示将要执行的操作，不实际执行
 */

const mysql = require('mysql2/promise');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

class DatabaseMigrator {
  constructor(options = {}) {
    this.options = {
      // 源数据库配置
      sourceHost: options.sourceHost || 'localhost',
      sourcePort: options.sourcePort || 3306,
      sourceUser: options.sourceUser || 'root',
      sourcePassword: options.sourcePassword || '',
      sourceDatabase: options.sourceDatabase || 'travelweb_db',
      
      // 目标数据库配置
      targetHost: options.targetHost,
      targetPort: options.targetPort || 3306,
      targetUser: options.targetUser,
      targetPassword: options.targetPassword,
      targetDatabase: options.targetDatabase || 'travelweb_db',
      
      // SSH配置（用于远程操作）
      sshHost: options.sshHost,
      sshUser: options.sshUser || 'ubuntu',
      sshPort: options.sshPort || 22,
      
      // 操作选项
      backup: options.backup || false,
      verify: options.verify || true,
      dryRun: options.dryRun || false,
      
      // 临时文件路径
      tempDir: path.join(process.cwd(), 'database', 'temp'),
      exportFile: 'migration_export.sql',
      backupFile: `backup_${Date.now()}.sql`
    };
    
    this.sourceConnection = null;
    this.targetConnection = null;
    this.migrationStats = {
      startTime: null,
      endTime: null,
      tablesExported: 0,
      recordsExported: 0,
      tablesImported: 0,
      recordsImported: 0,
      errors: []
    };
  }

  /**
   * 记录日志
   */
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📝',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      progress: '🔄'
    }[type] || '📝';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  /**
   * 创建临时目录
   */
  async createTempDir() {
    try {
      await fs.mkdir(this.options.tempDir, { recursive: true });
      this.log(`创建临时目录: ${this.options.tempDir}`);
    } catch (error) {
      throw new Error(`创建临时目录失败: ${error.message}`);
    }
  }

  /**
   * 清理临时文件
   */
  async cleanup() {
    try {
      const tempFiles = [
        path.join(this.options.tempDir, this.options.exportFile),
        path.join(this.options.tempDir, this.options.backupFile)
      ];
      
      for (const file of tempFiles) {
        try {
          await fs.unlink(file);
          this.log(`删除临时文件: ${file}`);
        } catch (error) {
          // 忽略文件不存在的错误
          if (error.code !== 'ENOENT') {
            this.log(`删除临时文件失败: ${file} - ${error.message}`, 'warning');
          }
        }
      }
    } catch (error) {
      this.log(`清理临时文件时出错: ${error.message}`, 'warning');
    }
  }

  /**
   * 连接源数据库
   */
  async connectSource() {
    try {
      this.log('连接源数据库...');
      this.sourceConnection = await mysql.createConnection({
        host: this.options.sourceHost,
        port: this.options.sourcePort,
        user: this.options.sourceUser,
        password: this.options.sourcePassword,
        database: this.options.sourceDatabase,
        charset: 'utf8mb4',
        timezone: '+08:00'
      });
      
      await this.sourceConnection.ping();
      this.log(`源数据库连接成功: ${this.options.sourceUser}@${this.options.sourceHost}:${this.options.sourcePort}/${this.options.sourceDatabase}`, 'success');
    } catch (error) {
      throw new Error(`源数据库连接失败: ${error.message}`);
    }
  }

  /**
   * 连接目标数据库
   */
  async connectTarget() {
    try {
      this.log('连接目标数据库...');
      
      if (this.options.sshHost) {
        // 通过SSH连接远程数据库
        this.log(`通过SSH连接远程数据库: ${this.options.sshUser}@${this.options.sshHost}`);
        await this.testSSHConnection();
      } else {
        // 直接连接目标数据库
        this.targetConnection = await mysql.createConnection({
          host: this.options.targetHost,
          port: this.options.targetPort,
          user: this.options.targetUser,
          password: this.options.targetPassword,
          database: this.options.targetDatabase,
          charset: 'utf8mb4',
          timezone: '+08:00'
        });
        
        await this.targetConnection.ping();
      }
      
      this.log(`目标数据库连接成功: ${this.options.targetUser}@${this.options.targetHost}:${this.options.targetPort}/${this.options.targetDatabase}`, 'success');
    } catch (error) {
      throw new Error(`目标数据库连接失败: ${error.message}`);
    }
  }

  /**
   * 测试SSH连接
   */
  async testSSHConnection() {
    try {
      const { stdout } = await execAsync(`ssh ${this.options.sshUser}@${this.options.sshHost} "echo 'SSH连接测试成功'"`, {
        timeout: 10000
      });
      this.log(`SSH连接测试成功: ${stdout.trim()}`, 'success');
    } catch (error) {
      throw new Error(`SSH连接失败: ${error.message}`);
    }
  }

  /**
   * 获取表列表
   */
  async getTables() {
    try {
      const [rows] = await this.sourceConnection.execute('SHOW TABLES');
      const tables = rows.map(row => Object.values(row)[0]);
      this.log(`发现 ${tables.length} 个表: ${tables.join(', ')}`);
      return tables;
    } catch (error) {
      throw new Error(`获取表列表失败: ${error.message}`);
    }
  }

  /**
   * 获取表的列信息
   */
  async getTableColumns(tableName) {
    try {
      const [rows] = await this.sourceConnection.execute(`DESCRIBE ${tableName}`);
      return rows;
    } catch (error) {
      throw new Error(`获取表 ${tableName} 列信息失败: ${error.message}`);
    }
  }

  /**
   * 导出数据库结构和数据
   */
  async exportDatabase() {
    try {
      this.log('开始导出数据库...', 'progress');
      
      const exportPath = path.join(this.options.tempDir, this.options.exportFile);
      const tables = await this.getTables();
      
      let sqlContent = '';
      
      // 添加文件头注释
      sqlContent += `-- 数据库迁移导出文件\n`;
      sqlContent += `-- 导出时间: ${new Date().toISOString()}\n`;
      sqlContent += `-- 源数据库: ${this.options.sourceDatabase}\n`;
      sqlContent += `-- 目标数据库: ${this.options.targetDatabase}\n\n`;
      
      // 设置字符集和外键检查
      sqlContent += `SET NAMES utf8mb4;\n`;
      sqlContent += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;
      
      // 导出每个表的结构和数据
      for (const tableName of tables) {
        this.log(`导出表: ${tableName}`, 'progress');
        
        // 获取表结构
        const [createTableRows] = await this.sourceConnection.execute(`SHOW CREATE TABLE ${tableName}`);
        const createTableSQL = createTableRows[0]['Create Table'];
        
        sqlContent += `-- 表结构: ${tableName}\n`;
        sqlContent += `DROP TABLE IF EXISTS ${tableName};\n`;
        sqlContent += `${createTableSQL};\n\n`;
        
        // 获取表数据
        const [dataRows] = await this.sourceConnection.execute(`SELECT * FROM ${tableName}`);
        
        if (dataRows.length > 0) {
          sqlContent += `-- 表数据: ${tableName}\n`;
          
          // 获取列信息以正确处理数据类型
          const columns = await this.getTableColumns(tableName);
          const columnInfo = {};
          columns.forEach(col => {
            columnInfo[col.Field] = col.Type.toLowerCase();
          });
          
          // 分批插入数据
          const batchSize = 100;
          for (let i = 0; i < dataRows.length; i += batchSize) {
            const batch = dataRows.slice(i, i + batchSize);
            const columnNames = Object.keys(batch[0]);
            
            sqlContent += `INSERT INTO ${tableName} (${columnNames.map(col => `\`${col}\``).join(', ')}) VALUES\n`;
            
            const values = batch.map(row => {
              const rowValues = columnNames.map(col => {
                const value = row[col];
                const columnType = columnInfo[col] || '';
                
                if (value === null) {
                  return 'NULL';
                } else if (typeof value === 'object') {
                  // 处理JSON类型
                  if (columnType.includes('json')) {
                    return `'${JSON.stringify(value).replace(/'/g, "\\'")}'`;
                  } else {
                    return `'${JSON.stringify(value).replace(/'/g, "\\'")}'`;
                  }
                } else if (typeof value === 'string') {
                  // 处理字符串类型，转义特殊字符
                  if (columnType.includes('json')) {
                    try {
                      // 验证是否为有效JSON
                      JSON.parse(value);
                      return `'${value.replace(/'/g, "\\'")}'`;
                    } catch {
                      // 如果不是有效JSON，转换为JSON字符串
                      return `'${JSON.stringify(value).replace(/'/g, "\\'")}'`;
                    }
                  } else {
                    return `'${value.replace(/'/g, "\\'")}'`;
                  }
                } else {
                  return value;
                }
              });
              return `(${rowValues.join(', ')})`;
            });
            
            sqlContent += values.join(',\n') + ';\n\n';
          }
          
          this.migrationStats.recordsExported += dataRows.length;
        }
        
        this.migrationStats.tablesExported++;
      }
      
      // 恢复外键检查
      sqlContent += `SET FOREIGN_KEY_CHECKS = 1;\n`;
      
      // 写入文件
      await fs.writeFile(exportPath, sqlContent, 'utf8');
      
      this.log(`数据库导出完成: ${exportPath}`, 'success');
      this.log(`导出统计: ${this.migrationStats.tablesExported} 个表, ${this.migrationStats.recordsExported} 条记录`);
      
      return exportPath;
    } catch (error) {
      throw new Error(`数据库导出失败: ${error.message}`);
    }
  }

  /**
   * 备份目标数据库
   */
  async backupTargetDatabase() {
    if (!this.options.backup) {
      return null;
    }
    
    try {
      this.log('备份目标数据库...', 'progress');
      
      const backupPath = path.join(this.options.tempDir, this.options.backupFile);
      
      if (this.options.sshHost) {
        // 远程备份
        const backupCommand = `ssh ${this.options.sshUser}@${this.options.sshHost} "mysqldump -u ${this.options.targetUser} -p${this.options.targetPassword} ${this.options.targetDatabase} > /tmp/${this.options.backupFile}"`;
        await execAsync(backupCommand, { timeout: 300000 }); // 5分钟超时
        
        // 下载备份文件
        const downloadCommand = `scp ${this.options.sshUser}@${this.options.sshHost}:/tmp/${this.options.backupFile} ${backupPath}`;
        await execAsync(downloadCommand, { timeout: 300000 });
        
        // 删除远程临时文件
        const cleanupCommand = `ssh ${this.options.sshUser}@${this.options.sshHost} "rm -f /tmp/${this.options.backupFile}"`;
        await execAsync(cleanupCommand, { timeout: 10000 });
      } else {
        // 本地备份
        const backupCommand = `mysqldump -h ${this.options.targetHost} -P ${this.options.targetPort} -u ${this.options.targetUser} -p${this.options.targetPassword} ${this.options.targetDatabase} > ${backupPath}`;
        await execAsync(backupCommand, { timeout: 300000 });
      }
      
      this.log(`目标数据库备份完成: ${backupPath}`, 'success');
      return backupPath;
    } catch (error) {
      throw new Error(`备份目标数据库失败: ${error.message}`);
    }
  }

  /**
   * 导入数据到目标数据库
   */
  async importDatabase(exportPath) {
    try {
      this.log('开始导入数据到目标数据库...', 'progress');
      
      if (this.options.sshHost) {
        // 远程导入
        await this.importToRemoteDatabase(exportPath);
      } else {
        // 本地导入
        await this.importToLocalDatabase(exportPath);
      }
      
      this.log('数据库导入完成', 'success');
    } catch (error) {
      throw new Error(`数据库导入失败: ${error.message}`);
    }
  }

  /**
   * 导入到远程数据库
   */
  async importToRemoteDatabase(exportPath) {
    try {
      // 上传SQL文件到远程服务器
      const remoteFile = `/tmp/migration_${Date.now()}.sql`;
      this.log(`上传SQL文件到远程服务器: ${remoteFile}`);
      
      const uploadCommand = `scp ${exportPath} ${this.options.sshUser}@${this.options.sshHost}:${remoteFile}`;
      await execAsync(uploadCommand, { timeout: 300000 });
      
      // 清理目标数据库
      this.log('清理目标数据库现有数据...');
      const cleanupCommand = `ssh ${this.options.sshUser}@${this.options.sshHost} "mysql -u ${this.options.targetUser} -p${this.options.targetPassword} ${this.options.targetDatabase} -e 'SET FOREIGN_KEY_CHECKS = 0; SHOW TABLES;' | grep -v Tables_in | xargs -I {} mysql -u ${this.options.targetUser} -p${this.options.targetPassword} ${this.options.targetDatabase} -e 'DROP TABLE IF EXISTS {}'; mysql -u ${this.options.targetUser} -p${this.options.targetPassword} ${this.options.targetDatabase} -e 'SET FOREIGN_KEY_CHECKS = 1;'"`;
      await execAsync(cleanupCommand, { timeout: 60000 });
      
      // 导入数据
      this.log('导入数据到远程数据库...');
      const importCommand = `ssh ${this.options.sshUser}@${this.options.sshHost} "mysql -u ${this.options.targetUser} -p${this.options.targetPassword} ${this.options.targetDatabase} < ${remoteFile}"`;
      await execAsync(importCommand, { timeout: 600000 }); // 10分钟超时
      
      // 清理远程临时文件
      const cleanupRemoteCommand = `ssh ${this.options.sshUser}@${this.options.sshHost} "rm -f ${remoteFile}"`;
      await execAsync(cleanupRemoteCommand, { timeout: 10000 });
      
      this.log('远程数据库导入完成', 'success');
    } catch (error) {
      throw new Error(`远程数据库导入失败: ${error.message}`);
    }
  }

  /**
   * 导入到本地数据库
   */
  async importToLocalDatabase(exportPath) {
    try {
      const importCommand = `mysql -h ${this.options.targetHost} -P ${this.options.targetPort} -u ${this.options.targetUser} -p${this.options.targetPassword} ${this.options.targetDatabase} < ${exportPath}`;
      await execAsync(importCommand, { timeout: 600000 });
      this.log('本地数据库导入完成', 'success');
    } catch (error) {
      throw new Error(`本地数据库导入失败: ${error.message}`);
    }
  }

  /**
   * 验证迁移结果
   */
  async verifyMigration() {
    if (!this.options.verify) {
      return true;
    }
    
    try {
      this.log('验证迁移结果...', 'progress');
      
      // 获取源数据库表统计
      const sourceTables = await this.getTables();
      const sourceStats = {};
      
      for (const tableName of sourceTables) {
        const [countRows] = await this.sourceConnection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        sourceStats[tableName] = countRows[0].count;
      }
      
      // 验证目标数据库
      let targetStats = {};
      
      if (this.options.sshHost) {
        // 远程验证
        for (const tableName of sourceTables) {
          const countCommand = `ssh ${this.options.sshUser}@${this.options.sshHost} "mysql -u ${this.options.targetUser} -p${this.options.targetPassword} ${this.options.targetDatabase} -e 'SELECT COUNT(*) as count FROM ${tableName}'" | tail -n 1`;
          const { stdout } = await execAsync(countCommand, { timeout: 30000 });
          targetStats[tableName] = parseInt(stdout.trim());
        }
      } else {
        // 本地验证
        for (const tableName of sourceTables) {
          const [countRows] = await this.targetConnection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
          targetStats[tableName] = countRows[0].count;
        }
      }
      
      // 比较结果
      let verificationPassed = true;
      this.log('验证结果:');
      
      for (const tableName of sourceTables) {
        const sourceCount = sourceStats[tableName];
        const targetCount = targetStats[tableName];
        const status = sourceCount === targetCount ? '✅' : '❌';
        
        this.log(`  ${status} ${tableName}: 源=${sourceCount}, 目标=${targetCount}`);
        
        if (sourceCount !== targetCount) {
          verificationPassed = false;
          this.migrationStats.errors.push(`表 ${tableName} 记录数不匹配: 源=${sourceCount}, 目标=${targetCount}`);
        }
      }
      
      if (verificationPassed) {
        this.log('数据验证通过', 'success');
      } else {
        this.log('数据验证失败', 'error');
      }
      
      return verificationPassed;
    } catch (error) {
      this.log(`数据验证失败: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * 生成迁移报告
   */
  generateReport() {
    const duration = this.migrationStats.endTime - this.migrationStats.startTime;
    const report = {
      startTime: this.migrationStats.startTime,
      endTime: this.migrationStats.endTime,
      duration: `${Math.round(duration / 1000)}秒`,
      source: {
        host: this.options.sourceHost,
        database: this.options.sourceDatabase,
        tablesExported: this.migrationStats.tablesExported,
        recordsExported: this.migrationStats.recordsExported
      },
      target: {
        host: this.options.targetHost,
        database: this.options.targetDatabase,
        tablesImported: this.migrationStats.tablesImported,
        recordsImported: this.migrationStats.recordsImported
      },
      errors: this.migrationStats.errors,
      success: this.migrationStats.errors.length === 0
    };
    
    this.log('\n=== 迁移报告 ===');
    this.log(`开始时间: ${report.startTime}`);
    this.log(`结束时间: ${report.endTime}`);
    this.log(`总耗时: ${report.duration}`);
    this.log(`源数据库: ${report.source.host}/${report.source.database}`);
    this.log(`目标数据库: ${report.target.host}/${report.target.database}`);
    this.log(`导出表数: ${report.source.tablesExported}`);
    this.log(`导出记录数: ${report.source.recordsExported}`);
    
    if (report.errors.length > 0) {
      this.log('\n错误列表:', 'error');
      report.errors.forEach(error => this.log(`  - ${error}`, 'error'));
    }
    
    this.log(`\n迁移状态: ${report.success ? '成功' : '失败'}`, report.success ? 'success' : 'error');
    
    return report;
  }

  /**
   * 执行完整迁移流程
   */
  async migrate() {
    this.migrationStats.startTime = new Date();
    
    try {
      if (this.options.dryRun) {
        this.log('=== 干运行模式 - 仅显示操作步骤 ===', 'warning');
        this.log(`1. 连接源数据库: ${this.options.sourceUser}@${this.options.sourceHost}/${this.options.sourceDatabase}`);
        this.log(`2. 连接目标数据库: ${this.options.targetUser}@${this.options.targetHost}/${this.options.targetDatabase}`);
        if (this.options.backup) {
          this.log('3. 备份目标数据库');
        }
        this.log('4. 导出源数据库');
        this.log('5. 导入到目标数据库');
        if (this.options.verify) {
          this.log('6. 验证迁移结果');
        }
        this.log('=== 干运行完成 ===', 'success');
        return;
      }
      
      this.log('=== 开始数据库迁移 ===');
      
      // 1. 创建临时目录
      await this.createTempDir();
      
      // 2. 连接数据库
      await this.connectSource();
      await this.connectTarget();
      
      // 3. 备份目标数据库（可选）
      const backupPath = await this.backupTargetDatabase();
      
      // 4. 导出源数据库
      const exportPath = await this.exportDatabase();
      
      // 5. 导入到目标数据库
      await this.importDatabase(exportPath);
      
      // 6. 验证迁移结果
      const verificationPassed = await this.verifyMigration();
      
      this.migrationStats.endTime = new Date();
      
      // 7. 生成报告
      const report = this.generateReport();
      
      if (!verificationPassed) {
        throw new Error('数据验证失败，迁移可能不完整');
      }
      
      this.log('=== 数据库迁移完成 ===', 'success');
      
      return report;
    } catch (error) {
      this.migrationStats.endTime = new Date();
      this.migrationStats.errors.push(error.message);
      
      this.log(`迁移失败: ${error.message}`, 'error');
      throw error;
    } finally {
      // 清理资源
      if (this.sourceConnection) {
        await this.sourceConnection.end();
      }
      if (this.targetConnection) {
        await this.targetConnection.end();
      }
      
      // 清理临时文件
      await this.cleanup();
    }
  }
}

// 命令行参数解析
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--source-host':
        options.sourceHost = nextArg;
        i++;
        break;
      case '--source-user':
        options.sourceUser = nextArg;
        i++;
        break;
      case '--source-password':
        options.sourcePassword = nextArg;
        i++;
        break;
      case '--source-database':
        options.sourceDatabase = nextArg;
        i++;
        break;
      case '--target-host':
        options.targetHost = nextArg;
        i++;
        break;
      case '--target-user':
        options.targetUser = nextArg;
        i++;
        break;
      case '--target-password':
        options.targetPassword = nextArg;
        i++;
        break;
      case '--target-database':
        options.targetDatabase = nextArg;
        i++;
        break;
      case '--ssh-host':
        options.sshHost = nextArg;
        i++;
        break;
      case '--ssh-user':
        options.sshUser = nextArg;
        i++;
        break;
      case '--backup':
        options.backup = true;
        break;
      case '--verify':
        options.verify = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        console.log(`
数据库迁移脚本使用说明：

基本用法：
  node database/migrate-database.cjs [选项]

选项：
  --source-host <host>     源数据库主机 (默认: localhost)
  --source-user <user>     源数据库用户 (默认: root)
  --source-password <pwd>  源数据库密码
  --source-database <db>   源数据库名 (默认: travelweb_db)
  --target-host <host>     目标数据库主机
  --target-user <user>     目标数据库用户
  --target-password <pwd>  目标数据库密码
  --target-database <db>   目标数据库名 (默认: travelweb_db)
  --ssh-host <host>        SSH主机 (用于远程操作)
  --ssh-user <user>        SSH用户 (默认: ubuntu)
  --backup                 迁移前备份目标数据库
  --verify                 迁移后验证数据完整性 (默认启用)
  --dry-run                仅显示将要执行的操作，不实际执行
  --help, -h               显示此帮助信息

示例：
  # 本地到本地迁移
  node database/migrate-database.cjs \\
    --source-password "local_password" \\
    --target-host "192.168.1.100" \\
    --target-user "remote_user" \\
    --target-password "remote_password" \\
    --backup --verify

  # 本地到远程SSH迁移
  node database/migrate-database.cjs \\
    --source-password "local_password" \\
    --target-host "101.42.21.165" \\
    --target-user "travelweb_user" \\
    --target-password "remote_password" \\
    --ssh-host "101.42.21.165" \\
    --ssh-user "ubuntu" \\
    --backup --verify

  # 干运行模式（测试）
  node database/migrate-database.cjs \\
    --source-password "local_password" \\
    --target-host "101.42.21.165" \\
    --target-user "travelweb_user" \\
    --target-password "remote_password" \\
    --ssh-host "101.42.21.165" \\
    --dry-run
        `);
        process.exit(0);
        break;
    }
  }
  
  return options;
}

// 主函数
async function main() {
  try {
    const options = parseArguments();
    
    // 验证必需参数
    if (!options.targetHost) {
      console.error('错误: 必须指定目标数据库主机 (--target-host)');
      process.exit(1);
    }
    
    if (!options.targetUser) {
      console.error('错误: 必须指定目标数据库用户 (--target-user)');
      process.exit(1);
    }
    
    if (!options.targetPassword) {
      console.error('错误: 必须指定目标数据库密码 (--target-password)');
      process.exit(1);
    }
    
    // 创建迁移器并执行迁移
    const migrator = new DatabaseMigrator(options);
    await migrator.migrate();
    
    process.exit(0);
  } catch (error) {
    console.error(`迁移失败: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = DatabaseMigrator;