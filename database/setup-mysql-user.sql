-- 🚀 MySQL用户和数据库设置脚本
-- 用于宝塔环境下的MySQL配置

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `travelweb_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 创建用户（如果不存在）
CREATE USER IF NOT EXISTS 'travelweb_user'@'localhost' IDENTIFIED BY '7481196mysql';

-- 授予权限
GRANT ALL PRIVILEGES ON `travelweb_db`.* TO 'travelweb_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 使用数据库
USE `travelweb_db`;

-- 显示当前用户权限
SHOW GRANTS FOR 'travelweb_user'@'localhost';

-- 显示数据库列表
SHOW DATABASES;

-- 显示当前数据库的表
SHOW TABLES;