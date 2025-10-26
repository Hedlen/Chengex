// 测试用的Markdown内容
export const testMarkdownContent = `# 成都旅游完整指南

欢迎来到**成都**，这座充满魅力的城市！本指南将为您提供最全面的旅游信息。

## 🏛️ 必游景点

### 1. 宽窄巷子
宽窄巷子是成都最具代表性的历史文化街区，由三条平行的古街道组成：
- **宽巷子**：老成都的"闲生活"
- **窄巷子**：老成都的"慢生活"  
- **井巷子**：成都人的"新生活"

> 💡 **小贴士**：建议傍晚时分前往，可以体验到最地道的成都夜生活。

### 2. 大熊猫繁育研究基地
这里是观赏可爱大熊猫的最佳地点！

\`\`\`
开放时间：07:30-18:00
门票价格：成人票 55元
最佳观赏时间：上午9:00-11:00（熊猫最活跃的时候）
\`\`\`

## 🍜 美食推荐

成都被誉为"美食之都"，这里有数不尽的美味：

| 美食 | 推荐指数 | 价格区间 | 特色 |
|------|----------|----------|------|
| 火锅 | ⭐⭐⭐⭐⭐ | 80-200元 | 麻辣鲜香 |
| 串串香 | ⭐⭐⭐⭐⭐ | 30-80元 | 平民美食 |
| 担担面 | ⭐⭐⭐⭐ | 15-25元 | 传统小吃 |
| 龙抄手 | ⭐⭐⭐⭐ | 20-35元 | 经典面食 |

### 推荐餐厅

1. **海底捞火锅**
   - 地址：春熙路步行街
   - 特色：服务一流，味道正宗

2. **小龙坎老火锅**
   - 地址：多个分店
   - 特色：传统老火锅，底料香浓

## 🚇 交通指南

### 地铁线路图
成都地铁网络发达，主要线路包括：

\`\`\`javascript
const metroLines = {
  line1: "韦家碾 - 科学城",
  line2: "犀浦 - 龙泉驿", 
  line3: "军区总医院 - 双流西站",
  line4: "万盛 - 西河"
};
\`\`\`

### 出行建议
- 🎫 推荐购买天府通卡，可乘坐地铁和公交
- 📱 下载"天府通"APP，支持手机支付
- 🚌 公交车覆盖面广，是经济实惠的选择

## 📅 行程规划

### 3日游推荐路线

**第一天：市区文化游**
- 上午：武侯祠 → 锦里古街
- 下午：宽窄巷子 → 人民公园
- 晚上：春熙路购物 + 美食

**第二天：熊猫 + 自然**
- 上午：大熊猫基地
- 下午：文殊院 → 昭觉寺
- 晚上：九眼桥酒吧街

**第三天：周边游**
- 全天：都江堰 + 青城山一日游

## 🏨 住宿推荐

根据预算不同，为您推荐以下住宿：

### 豪华酒店（500+/晚）
- 成都瑞吉酒店
- 成都香格里拉大酒店

### 精品酒店（200-500/晚）
- 博舍酒店
- 钓鱼台精品酒店

### 经济型（100-200/晚）
- 如家酒店
- 汉庭酒店

## 📞 实用信息

### 紧急联系方式
- 🚨 报警电话：110
- 🚑 急救电话：120
- 🔥 火警电话：119
- ℹ️ 旅游咨询：028-12301

### 天气提醒
成都属亚热带湿润气候：
- 春季（3-5月）：温和多雨，建议带雨具
- 夏季（6-8月）：炎热潮湿，注意防暑
- 秋季（9-11月）：凉爽舒适，最佳旅游季节
- 冬季（12-2月）：阴冷潮湿，注意保暖

---

*希望这份指南能让您的成都之旅更加精彩！如有任何问题，欢迎在下方留言交流。*

**标签：** #成都旅游 #美食 #熊猫 #攻略`;

export const addTestBlogPost = () => {
  const testPost = {
    id: 999,
    title: "成都旅游完整指南 - Markdown版本",
    content: testMarkdownContent,
    excerpt: "这是一份包含丰富Markdown格式的成都旅游指南，展示了我们新的Markdown渲染功能，包括表格、代码块、列表等多种格式。",
    author: "张导游",
    date: "2024-01-20",
    status: "published" as const,
    views: 2580,
    category: "tours",
    tags: ["成都", "旅游攻略", "Markdown", "美食", "景点"],
    thumbnail: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Chengdu%20travel%20guide%20comprehensive%20beautiful%20city&image_size=landscape_16_9",
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-01-20T10:00:00Z"
  };

  // 获取现有博客数据
  const existingPosts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
  
  // 检查是否已存在测试文章
  const existingTestPost = existingPosts.find((post: any) => post.id === 999);
  
  if (!existingTestPost) {
    // 添加测试文章
    const updatedPosts = [testPost, ...existingPosts];
    localStorage.setItem('blogPosts', JSON.stringify(updatedPosts));
    console.log('Test blog post with Markdown content added!');
  } else {
    console.log('Test blog post already exists');
  }
  
  return testPost;
};