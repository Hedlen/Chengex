-- 旅游网站数据库初始化脚本
-- 适用于云MySQL数据库

-- 创建分类表
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  name_en VARCHAR(100),
  description TEXT,
  description_en TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建博客表
CREATE TABLE IF NOT EXISTS blogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  title_en VARCHAR(255),
  content TEXT NOT NULL,
  content_en TEXT,
  excerpt VARCHAR(500),
  excerpt_en VARCHAR(500),
  featured_image VARCHAR(500),
  category_id INT,
  author VARCHAR(100) DEFAULT 'Admin',
  status ENUM('draft', 'published', 'archived') DEFAULT 'published',
  views INT DEFAULT 0,
  tags JSON,
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_category (category_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建视频表
CREATE TABLE IF NOT EXISTS videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  title_en VARCHAR(255),
  description TEXT,
  description_en TEXT,
  video_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration INT,
  category_id INT,
  language ENUM('zh', 'en', 'both') DEFAULT 'zh',
  status ENUM('draft', 'published', 'archived') DEFAULT 'published',
  views INT DEFAULT 0,
  tags JSON,
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_category (category_id),
  INDEX idx_language (language),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认分类数据
INSERT IGNORE INTO categories (name, name_en, description, description_en) VALUES
('旅游攻略', 'Travel Guides', '详细的旅游目的地攻略和建议', 'Detailed travel destination guides and tips'),
('美食推荐', 'Food Recommendations', '当地特色美食和餐厅推荐', 'Local cuisine and restaurant recommendations'),
('住宿体验', 'Accommodation', '酒店、民宿等住宿体验分享', 'Hotel and accommodation experience sharing'),
('交通出行', 'Transportation', '交通方式和出行建议', 'Transportation options and travel advice'),
('文化体验', 'Cultural Experience', '当地文化和传统体验', 'Local culture and traditional experiences'),
('自然风光', 'Natural Scenery', '自然景观和户外活动', 'Natural landscapes and outdoor activities');

-- 插入示例博客数据
INSERT IGNORE INTO blogs (title, title_en, content, content_en, excerpt, excerpt_en, featured_image, category_id, tags) VALUES
('探索京都的古典美学', 'Exploring Kyoto\'s Classical Aesthetics', 
'京都，这座千年古都，承载着日本最深厚的文化底蕴。从清水寺的木质建筑到金阁寺的金碧辉煌，每一处景致都诉说着历史的故事...', 
'Kyoto, this thousand-year-old ancient capital, carries Japan\'s deepest cultural heritage. From the wooden architecture of Kiyomizu-dera to the golden splendor of Kinkaku-ji, every scene tells a story of history...',
'深入了解京都的传统文化和建筑美学，体验千年古都的独特魅力。',
'Dive deep into Kyoto\'s traditional culture and architectural aesthetics, experiencing the unique charm of this ancient capital.',
'/images/kyoto-temple.jpg', 1, '["京都", "日本", "文化", "寺庙"]'),

('巴黎美食之旅', 'A Culinary Journey Through Paris',
'巴黎不仅是艺术之都，更是美食天堂。从街角的小咖啡馆到米其林星级餐厅，这里汇聚了世界上最精致的法式料理...', 
'Paris is not only the capital of art but also a paradise for food lovers. From corner cafes to Michelin-starred restaurants, it brings together the world\'s most exquisite French cuisine...',
'探索巴黎的美食文化，从传统法式料理到现代创新菜品。',
'Explore Paris\'s culinary culture, from traditional French cuisine to modern innovative dishes.',
'/images/paris-food.jpg', 2, '["巴黎", "美食", "法国", "料理"]'),

('马尔代夫度假村体验', 'Maldives Resort Experience',
'在马尔代夫的水上别墅中醒来，推开门就是碧蓝的印度洋。这里的每一个度假村都是一个私人天堂...', 
'Waking up in a water villa in the Maldives, opening the door to the azure Indian Ocean. Every resort here is a private paradise...',
'体验马尔代夫顶级度假村的奢华服务和绝美海景。',
'Experience the luxury services and stunning ocean views of top Maldives resorts.',
'/images/maldives-resort.jpg', 3, '["马尔代夫", "度假村", "海岛", "奢华"]');

-- 插入示例视频数据
INSERT IGNORE INTO videos (title, title_en, description, description_en, video_url, thumbnail_url, category_id, language, tags) VALUES
('冰岛极光之旅', 'Iceland Northern Lights Journey',
'跟随我们的镜头，探索冰岛神秘的极光现象，感受大自然的壮丽奇观。', 
'Follow our lens to explore Iceland\'s mysterious aurora phenomenon and feel the magnificent wonders of nature.',
'https://example.com/videos/iceland-aurora.mp4', '/images/iceland-aurora-thumb.jpg', 6, 'both', '["冰岛", "极光", "自然", "摄影"]'),

('东京街头美食探索', 'Tokyo Street Food Exploration',
'深入东京的街头巷尾，发现最地道的日式小吃和隐藏美食。', 
'Dive into Tokyo\'s streets and alleys to discover the most authentic Japanese snacks and hidden delicacies.',
'https://example.com/videos/tokyo-street-food.mp4', '/images/tokyo-food-thumb.jpg', 2, 'zh', '["东京", "街头美食", "日本", "小吃"]'),

('新西兰南岛自驾游', 'New Zealand South Island Road Trip',
'驾车穿越新西兰南岛，欣赏壮丽的山川湖泊和独特的自然风光。', 
'Drive through New Zealand\'s South Island, enjoying magnificent mountains, lakes, and unique natural scenery.',
'https://example.com/videos/nz-road-trip.mp4', '/images/nz-landscape-thumb.jpg', 4, 'both', '["新西兰", "自驾游", "南岛", "风景"]');