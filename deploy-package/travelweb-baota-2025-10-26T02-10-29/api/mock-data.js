// 模拟数据 - 用于测试API功能
export const mockCategories = [
  {
    id: 1,
    name: '旅游攻略',
    name_en: 'Travel Guides',
    description: '详细的旅游目的地攻略和建议',
    description_en: 'Detailed travel destination guides and tips'
  },
  {
    id: 2,
    name: '美食推荐',
    name_en: 'Food Recommendations',
    description: '当地特色美食和餐厅推荐',
    description_en: 'Local cuisine and restaurant recommendations'
  },
  {
    id: 3,
    name: '住宿体验',
    name_en: 'Accommodation',
    description: '酒店、民宿等住宿体验分享',
    description_en: 'Hotel and accommodation experience sharing'
  }
];

export const mockBlogs = [
  {
    id: 1,
    title: '探索京都的古典美学',
    title_en: 'Exploring Kyoto\'s Classical Aesthetics',
    content: '京都，这座千年古都，承载着日本最深厚的文化底蕴。从清水寺的木质建筑到金阁寺的金碧辉煌，每一处景致都诉说着历史的故事。漫步在石板路上，感受着古老与现代的完美融合。',
    content_en: 'Kyoto, this thousand-year-old ancient capital, carries Japan\'s deepest cultural heritage. From the wooden architecture of Kiyomizu-dera to the golden splendor of Kinkaku-ji, every scene tells a story of history.',
    excerpt: '深入了解京都的传统文化和建筑美学，体验千年古都的独特魅力。',
    excerpt_en: 'Dive deep into Kyoto\'s traditional culture and architectural aesthetics, experiencing the unique charm of this ancient capital.',
    featured_image: '/images/kyoto-temple.jpg',
    category_id: 1,
    author: 'Admin',
    status: 'published',
    views: 1250,
    tags: ['京都', '日本', '文化', '寺庙'],
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    title: '巴黎美食之旅',
    title_en: 'A Culinary Journey Through Paris',
    content: '巴黎不仅是艺术之都，更是美食天堂。从街角的小咖啡馆到米其林星级餐厅，这里汇聚了世界上最精致的法式料理。每一道菜都是艺术品，每一口都是享受。',
    content_en: 'Paris is not only the capital of art but also a paradise for food lovers. From corner cafes to Michelin-starred restaurants, it brings together the world\'s most exquisite French cuisine.',
    excerpt: '探索巴黎的美食文化，从传统法式料理到现代创新菜品。',
    excerpt_en: 'Explore Paris\'s culinary culture, from traditional French cuisine to modern innovative dishes.',
    featured_image: '/images/paris-food.jpg',
    category_id: 2,
    author: 'Admin',
    status: 'published',
    views: 980,
    tags: ['巴黎', '美食', '法国', '料理'],
    created_at: '2024-01-20T14:15:00Z',
    updated_at: '2024-01-20T14:15:00Z'
  },
  {
    id: 3,
    title: '马尔代夫度假村体验',
    title_en: 'Maldives Resort Experience',
    content: '在马尔代夫的水上别墅中醒来，推开门就是碧蓝的印度洋。这里的每一个度假村都是一个私人天堂，提供世界级的服务和无与伦比的海景。',
    content_en: 'Waking up in a water villa in the Maldives, opening the door to the azure Indian Ocean. Every resort here is a private paradise offering world-class service and unparalleled ocean views.',
    excerpt: '体验马尔代夫顶级度假村的奢华服务和绝美海景。',
    excerpt_en: 'Experience the luxury services and stunning ocean views of top Maldives resorts.',
    featured_image: '/images/maldives-resort.jpg',
    category_id: 3,
    author: 'Admin',
    status: 'published',
    views: 1580,
    tags: ['马尔代夫', '度假村', '海岛', '奢华'],
    created_at: '2024-01-25T09:45:00Z',
    updated_at: '2024-01-25T09:45:00Z'
  }
];

export const mockVideos = [
  {
    id: 1,
    title: '冰岛极光之旅',
    title_en: 'Iceland Northern Lights Journey',
    description: '跟随我们的镜头，探索冰岛神秘的极光现象，感受大自然的壮丽奇观。在漫长的冬夜中，绿色的光带在天空中舞动，创造出令人难忘的视觉盛宴。',
    description_en: 'Follow our lens to explore Iceland\'s mysterious aurora phenomenon and feel the magnificent wonders of nature. In the long winter nights, green light bands dance in the sky, creating an unforgettable visual feast.',
    video_url: 'https://example.com/videos/iceland-aurora.mp4',
    thumbnail_url: '/images/iceland-aurora-thumb.jpg',
    duration: 480,
    category_id: 1,
    language: 'both',
    status: 'published',
    views: 2340,
    tags: ['冰岛', '极光', '自然', '摄影'],
    created_at: '2024-01-10T16:20:00Z',
    updated_at: '2024-01-10T16:20:00Z'
  },
  {
    id: 2,
    title: '东京街头美食探索',
    title_en: 'Tokyo Street Food Exploration',
    description: '深入东京的街头巷尾，发现最地道的日式小吃和隐藏美食。从拉面到寿司，从章鱼烧到和果子，每一样都承载着日本的饮食文化。',
    description_en: 'Dive into Tokyo\'s streets and alleys to discover the most authentic Japanese snacks and hidden delicacies. From ramen to sushi, from takoyaki to wagashi, each carries Japanese food culture.',
    video_url: 'https://example.com/videos/tokyo-street-food.mp4',
    thumbnail_url: '/images/tokyo-food-thumb.jpg',
    duration: 360,
    category_id: 2,
    language: 'zh',
    status: 'published',
    views: 1890,
    tags: ['东京', '街头美食', '日本', '小吃'],
    created_at: '2024-01-18T11:30:00Z',
    updated_at: '2024-01-18T11:30:00Z'
  },
  {
    id: 3,
    title: '新西兰南岛自驾游',
    title_en: 'New Zealand South Island Road Trip',
    description: '驾车穿越新西兰南岛，欣赏壮丽的山川湖泊和独特的自然风光。从皇后镇到米尔福德峡湾，每一处风景都如画般美丽。',
    description_en: 'Drive through New Zealand\'s South Island, enjoying magnificent mountains, lakes, and unique natural scenery. From Queenstown to Milford Sound, every landscape is as beautiful as a painting.',
    video_url: 'https://example.com/videos/nz-road-trip.mp4',
    thumbnail_url: '/images/nz-landscape-thumb.jpg',
    duration: 600,
    category_id: 1,
    language: 'both',
    status: 'published',
    views: 3120,
    tags: ['新西兰', '自驾游', '南岛', '风景'],
    created_at: '2024-01-22T13:45:00Z',
    updated_at: '2024-01-22T13:45:00Z'
  }
];