import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 统计数据管理器
 * 负责统计数据的存储、查询和聚合计算
 */
export class AnalyticsDataManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../data/analytics');
    this.ensureDirectories();
  }

  /**
   * 确保数据目录存在
   */
  async ensureDirectories() {
    const dirs = ['pageviews', 'videoplays', 'comments', 'external-video-clicks', 'external-video-returns'];
    for (const dir of dirs) {
      const dirPath = path.join(this.dataPath, dir);
      try {
        await fs.access(dirPath);
      } catch {
        await fs.mkdir(dirPath, { recursive: true });
      }
    }
  }

  /**
   * 获取日期字符串 (YYYY-MM-DD)
   */
  getDateString(date = new Date()) {
    return date.toISOString().split('T')[0];
  }

  /**
   * 获取文件路径
   */
  getFilePath(type, date = new Date()) {
    const dateStr = this.getDateString(date);
    return path.join(this.dataPath, type, `${dateStr}.json`);
  }

  /**
   * 追加数据到文件
   */
  async appendToFile(filePath, data) {
    try {
      let records = [];
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        records = JSON.parse(content);
      } catch {
        // 文件不存在或为空，创建新数组
      }

      records.push(data);
      await fs.writeFile(filePath, JSON.stringify(records, null, 2));
    } catch (error) {
      console.error('Error appending to file:', error);
      throw error;
    }
  }

  /**
   * 记录页面浏览
   */
  async recordPageView(data) {
    const filePath = this.getFilePath('pageviews');
    await this.appendToFile(filePath, data);
  }

  /**
   * 记录视频播放
   */
  async recordVideoPlay(data) {
    const filePath = this.getFilePath('videoplays');
    await this.appendToFile(filePath, data);
  }

  /**
   * 记录评论事件
   */
  async recordComment(data) {
    const filePath = this.getFilePath('comments');
    await this.appendToFile(filePath, data);
  }

  /**
   * 批量记录事件
   */
  async recordBatch(events) {
    const results = [];
    for (const event of events) {
      try {
        switch (event.type) {
          case 'pageview':
            await this.recordPageView(event.data);
            break;
          case 'videoplay':
            await this.recordVideoPlay(event.data);
            break;
          case 'comment':
            await this.recordComment(event.data);
            break;
          default:
            console.warn('Unknown event type:', event.type);
        }
        results.push({ success: true, event: event.type });
      } catch (error) {
        console.error(`Error recording ${event.type}:`, error);
        results.push({ success: false, event: event.type, error: error.message });
      }
    }
    return results;
  }

  /**
   * 获取时间范围内的文件列表
   */
  async getFilesInRange(timeRange, type) {
    const files = [];
    const days = this.parseTimeRange(timeRange);
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const filePath = this.getFilePath(type, date);
      
      try {
        await fs.access(filePath);
        files.push(filePath);
      } catch {
        // 文件不存在，跳过
      }
    }
    
    return files;
  }

  /**
   * 解析时间范围
   */
  parseTimeRange(timeRange) {
    switch (timeRange) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      default:
        return 7;
    }
  }

  /**
   * 加载记录
   */
  async loadRecords(files) {
    const allRecords = [];
    
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const records = JSON.parse(content);
        allRecords.push(...records);
      } catch (error) {
        console.error(`Error loading file ${file}:`, error);
      }
    }
    
    return allRecords;
  }

  /**
   * 获取页面浏览统计
   */
  async getPageViewStats(timeRange = '7d') {
    try {
      const response = await fetch(`http://localhost:3001/api/analytics/page-views?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'API返回错误');
      }
      return data.data;
    } catch (error) {
      console.error('获取页面浏览统计失败:', error);
      // 返回默认数据
      return {
        totalViews: 0,
        uniqueVisitors: 0,
        topPages: []
      };
    }
  }

  /**
   * 计算页面浏览统计
   */
  calculatePageViewStats(records) {
    const totalViews = records.length;
    const uniqueVisitors = new Set(records.map(r => r.sessionId)).size;
    
    // 计算热门页面
    const pageStats = {};
    records.forEach(record => {
      const key = record.pageUrl;
      if (!pageStats[key]) {
        pageStats[key] = {
          url: record.pageUrl,
          title: record.pageTitle,
          views: 0,
          uniqueVisitors: new Set()
        };
      }
      pageStats[key].views++;
      pageStats[key].uniqueVisitors.add(record.sessionId);
    });

    const topPages = Object.values(pageStats)
      .map(page => ({
        url: page.url,
        title: page.title,
        views: page.views,
        uniqueVisitors: page.uniqueVisitors.size
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return {
      totalViews,
      uniqueVisitors,
      averageTimeOnPage: 0, // 需要额外的时间跟踪
      bounceRate: 0, // 需要会话分析
      topPages
    };
  }

  /**
   * 获取视频统计
   */
  async getVideoStats(timeRange = '7d') {
    const files = await this.getFilesInRange(timeRange, 'videoplays');
    const records = await this.loadRecords(files);
    
    return this.calculateVideoStats(records);
  }

  /**
   * 计算视频统计
   */
  calculateVideoStats(records) {
    const totalPlays = records.length;
    const uniqueViewers = new Set(records.map(r => r.sessionId)).size;
    
    // 计算热门视频
    const videoStats = {};
    records.forEach(record => {
      const key = record.videoId;
      if (!videoStats[key]) {
        videoStats[key] = {
          id: record.videoId,
          title: record.videoTitle,
          plays: 0,
          totalWatchTime: 0,
          completions: 0
        };
      }
      videoStats[key].plays++;
      if (record.playPosition && record.duration) {
        videoStats[key].totalWatchTime += record.playPosition;
        if (record.playPosition >= record.duration * 0.9) {
          videoStats[key].completions++;
        }
      }
    });

    const topVideos = Object.values(videoStats)
      .map(video => ({
        id: video.id,
        title: video.title,
        plays: video.plays,
        completionRate: video.plays > 0 ? (video.completions / video.plays) * 100 : 0
      }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 10);

    return {
      totalPlays,
      uniqueViewers,
      averageWatchTime: 0, // 需要更精确的计算
      completionRate: 0, // 需要更精确的计算
      topVideos
    };
  }

  /**
   * 获取评论统计
   */
  async getCommentStats(timeRange = '7d') {
    const files = await this.getFilesInRange(timeRange, 'comments');
    const records = await this.loadRecords(files);
    
    return this.calculateCommentStats(records);
  }

  /**
   * 计算评论统计
   */
  calculateCommentStats(records) {
    const totalComments = records.length;
    const activeCommenters = new Set(records.map(r => r.sessionId)).size;
    
    // 按日期统计评论趋势
    const commentsByDate = {};
    records.forEach(record => {
      const date = record.timestamp.split('T')[0];
      commentsByDate[date] = (commentsByDate[date] || 0) + 1;
    });

    const commentTrends = Object.entries(commentsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 计算内容参与度
    const contentStats = {};
    records.forEach(record => {
      const key = record.contentId;
      if (!contentStats[key]) {
        contentStats[key] = 0;
      }
      contentStats[key]++;
    });

    const averageCommentsPerContent = Object.keys(contentStats).length > 0 
      ? totalComments / Object.keys(contentStats).length 
      : 0;

    return {
      totalComments,
      averageCommentsPerContent,
      engagementRate: 0, // 需要结合浏览量计算
      activeCommenters,
      commentTrends
    };
  }

  /**
   * 获取仪表板数据
   */
  async getDashboardStats(timeRange = '7d') {
    try {
      const response = await fetch(`http://localhost:3001/api/analytics/dashboard`);
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'API返回错误');
      }
      return data.data;
    } catch (error) {
      console.error('获取仪表板统计失败:', error);
      // 返回默认数据
      return {
        totalBlogs: 0,
        publishedBlogs: 0,
        draftBlogs: 0,
        totalVideos: 0,
        publishedVideos: 0,
        activeVideos: 0,
        totalPageViews: 0,
        uniqueVisitors: 0,
        todayViews: 0,
        weeklyViews: 0,
        monthlyViews: 0
      };
    }
  }

  /**
   * 获取今日浏览量
   */
  async getTodayViews() {
    try {
      const today = new Date();
      const pageViewFile = this.getFilePath('pageviews', today);
      const videoPlayFile = this.getFilePath('videoplays', today);
      
      let pageViews = 0;
      let videoPlays = 0;
      
      try {
        const pageViewContent = await fs.readFile(pageViewFile, 'utf-8');
        pageViews = JSON.parse(pageViewContent).length;
      } catch {}
      
      try {
        const videoPlayContent = await fs.readFile(videoPlayFile, 'utf-8');
        videoPlays = JSON.parse(videoPlayContent).length;
      } catch {}
      
      return pageViews + videoPlays;
    } catch (error) {
      console.error('Error getting today views:', error);
      return 0;
    }
  }

  /**
   * 获取本周浏览量
   */
  async getWeeklyViews() {
    try {
      const stats = await this.getPageViewStats('7d');
      const videoStats = await this.getVideoStats('7d');
      return stats.totalViews + videoStats.totalPlays;
    } catch (error) {
      console.error('Error getting weekly views:', error);
      return 0;
    }
  }

  /**
   * 获取本月浏览量
   */
  async getMonthlyViews() {
    try {
      const stats = await this.getPageViewStats('30d');
      const videoStats = await this.getVideoStats('30d');
      return stats.totalViews + videoStats.totalPlays;
    } catch (error) {
      console.error('Error getting monthly views:', error);
      return 0;
    }
  }

  /**
   * 计算趋势数据
   */
  async calculateTrends(days) {
    const pageViews = [];
    const comments = [];
    const videoPlays = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      try {
        // 页面浏览量
        const pvFile = this.getFilePath('pageviews', date);
        let pvCount = 0;
        try {
          const pvContent = await fs.readFile(pvFile, 'utf-8');
          pvCount = JSON.parse(pvContent).length;
        } catch {}
        pageViews.push(pvCount);

        // 评论数
        const commentFile = this.getFilePath('comments', date);
        let commentCount = 0;
        try {
          const commentContent = await fs.readFile(commentFile, 'utf-8');
          commentCount = JSON.parse(commentContent).length;
        } catch {}
        comments.push(commentCount);

        // 视频播放量
        const videoFile = this.getFilePath('videoplays', date);
        let videoCount = 0;
        try {
          const videoContent = await fs.readFile(videoFile, 'utf-8');
          videoCount = JSON.parse(videoContent).length;
        } catch {}
        videoPlays.push(videoCount);
      } catch (error) {
        console.error(`Error calculating trends for date ${date}:`, error);
        pageViews.push(0);
        comments.push(0);
        videoPlays.push(0);
      }
    }

    return {
      pageViews,
      comments,
      videoPlays
    };
  }

  // ==================== 外部视频追踪方法 ====================

  /**
   * 记录外部视频点击事件
   */
  async recordExternalVideoClick(data) {
    const filePath = this.getFilePath('external-video-clicks');
    await this.appendToFile(filePath, data);
  }

  /**
   * 记录外部视频返回事件
   */
  async recordExternalVideoReturn(data) {
    const filePath = this.getFilePath('external-video-returns');
    await this.appendToFile(filePath, data);
  }

  /**
   * 批量记录外部视频追踪事件
   */
  async recordExternalVideoTrackingBatch(events) {
    const results = [];
    for (const event of events) {
      try {
        switch (event.type) {
          case 'external-video-click':
            await this.recordExternalVideoClick(event.data);
            break;
          case 'external-video-return':
            await this.recordExternalVideoReturn(event.data);
            break;
          default:
            console.warn('Unknown external video tracking event type:', event.type);
        }
        results.push({ success: true, event: event.type });
      } catch (error) {
        console.error(`Error recording ${event.type}:`, error);
        results.push({ success: false, event: event.type, error: error.message });
      }
    }
    return results;
  }

  /**
   * 获取外部视频统计
   */
  async getExternalVideoStats(timeRange = '7d') {
    const clickFiles = await this.getFilesInRange(timeRange, 'external-video-clicks');
    const returnFiles = await this.getFilesInRange(timeRange, 'external-video-returns');
    
    const clickRecords = await this.loadRecords(clickFiles);
    const returnRecords = await this.loadRecords(returnFiles);
    
    return this.calculateExternalVideoStats(clickRecords, returnRecords);
  }

  /**
   * 计算外部视频统计
   */
  calculateExternalVideoStats(clickRecords, returnRecords) {
    const totalClicks = clickRecords.length;
    const totalReturns = returnRecords.length;
    const returnRate = totalClicks > 0 ? (totalReturns / totalClicks) * 100 : 0;

    // 按视频统计
    const videoStats = {};
    clickRecords.forEach(record => {
      const key = record.videoId;
      if (!videoStats[key]) {
        videoStats[key] = {
          id: record.videoId,
          title: record.videoTitle,
          platform: record.platform,
          clicks: 0,
          returns: 0,
          totalTimeSpent: 0,
          estimatedCompletions: 0,
          estimatedCompletionRate: 0
        };
      }
      videoStats[key].clicks++;
    });

    // 统计返回数据和时间
    returnRecords.forEach(record => {
      const key = record.videoId;
      if (videoStats[key]) {
        videoStats[key].returns++;
        if (record.timeSpent) {
          videoStats[key].totalTimeSpent += record.timeSpent;
        }
        if (record.estimatedWatchPercentage) {
          if (record.estimatedWatchPercentage >= 90) {
            videoStats[key].estimatedCompletions++;
          }
        }
      }
    });

    // 计算预估完播率
    Object.values(videoStats).forEach(video => {
      if (video.returns > 0) {
        video.estimatedCompletionRate = (video.estimatedCompletions / video.returns) * 100;
        video.averageTimeSpent = video.totalTimeSpent / video.returns;
      }
    });

    // 按平台统计
    const platformStats = {};
    clickRecords.forEach(record => {
      const platform = record.platform;
      if (!platformStats[platform]) {
        platformStats[platform] = {
          platform,
          clicks: 0,
          returns: 0,
          totalTimeSpent: 0,
          estimatedCompletions: 0
        };
      }
      platformStats[platform].clicks++;
    });

    returnRecords.forEach(record => {
      const platform = record.platform;
      if (platformStats[platform]) {
        platformStats[platform].returns++;
        if (record.timeSpent) {
          platformStats[platform].totalTimeSpent += record.timeSpent;
        }
        if (record.estimatedWatchPercentage >= 90) {
          platformStats[platform].estimatedCompletions++;
        }
      }
    });

    // 计算平台完播率
    Object.values(platformStats).forEach(platform => {
      if (platform.returns > 0) {
        platform.returnRate = (platform.returns / platform.clicks) * 100;
        platform.estimatedCompletionRate = (platform.estimatedCompletions / platform.returns) * 100;
        platform.averageTimeSpent = platform.totalTimeSpent / platform.returns;
      }
    });

    // 热门外部视频
    const topExternalVideos = Object.values(videoStats)
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    return {
      totalClicks,
      totalReturns,
      returnRate,
      averageTimeSpent: returnRecords.length > 0 
        ? returnRecords.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / returnRecords.length 
        : 0,
      estimatedOverallCompletionRate: returnRecords.length > 0 
        ? (returnRecords.filter(r => r.estimatedWatchPercentage >= 90).length / returnRecords.length) * 100 
        : 0,
      topExternalVideos,
      platformStats: Object.values(platformStats),
      videoStats: Object.values(videoStats)
    };
  }

  /**
   * 获取外部视频完播率预估
   */
  async getExternalVideoCompletionEstimates(timeRange = '7d', filters = {}) {
    const clickFiles = await this.getFilesInRange(timeRange, 'external-video-clicks');
    const returnFiles = await this.getFilesInRange(timeRange, 'external-video-returns');
    
    const clickRecords = await this.loadRecords(clickFiles);
    const returnRecords = await this.loadRecords(returnFiles);

    // 应用过滤器
    let filteredClickRecords = clickRecords;
    let filteredReturnRecords = returnRecords;

    if (filters.videoId) {
      filteredClickRecords = clickRecords.filter(r => r.videoId === filters.videoId);
      filteredReturnRecords = returnRecords.filter(r => r.videoId === filters.videoId);
    }

    if (filters.platform) {
      filteredClickRecords = filteredClickRecords.filter(r => r.platform === filters.platform);
      filteredReturnRecords = filteredReturnRecords.filter(r => r.platform === filters.platform);
    }

    return this.calculateCompletionEstimates(filteredClickRecords, filteredReturnRecords);
  }

  /**
   * 计算完播率预估
   */
  calculateCompletionEstimates(clickRecords, returnRecords) {
    const estimates = [];

    // 按视频分组计算
    const videoGroups = {};
    clickRecords.forEach(record => {
      const key = record.videoId;
      if (!videoGroups[key]) {
        videoGroups[key] = {
          videoId: record.videoId,
          videoTitle: record.videoTitle,
          platform: record.platform,
          clicks: [],
          returns: []
        };
      }
      videoGroups[key].clicks.push(record);
    });

    returnRecords.forEach(record => {
      const key = record.videoId;
      if (videoGroups[key]) {
        videoGroups[key].returns.push(record);
      }
    });

    // 为每个视频计算预估
    Object.values(videoGroups).forEach(group => {
      const totalClicks = group.clicks.length;
      const totalReturns = group.returns.length;
      
      if (totalReturns > 0) {
        const completions = group.returns.filter(r => r.estimatedWatchPercentage >= 90).length;
        const estimatedCompletionRate = (completions / totalReturns) * 100;
        
        const averageTimeSpent = group.returns.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / totalReturns;
        const averageWatchPercentage = group.returns.reduce((sum, r) => sum + (r.estimatedWatchPercentage || 0), 0) / totalReturns;
        
        // 计算置信度
        const sampleSize = totalReturns;
        let confidence = 'low';
        if (sampleSize >= 50) confidence = 'high';
        else if (sampleSize >= 20) confidence = 'medium';

        estimates.push({
          videoId: group.videoId,
          videoTitle: group.videoTitle,
          platform: group.platform,
          totalClicks,
          totalReturns,
          returnRate: (totalReturns / totalClicks) * 100,
          estimatedCompletionRate,
          averageTimeSpent,
          averageWatchPercentage,
          confidence,
          sampleSize,
          dataQuality: this.assessDataQuality(group.returns)
        });
      }
    });

    return {
      estimates: estimates.sort((a, b) => b.totalClicks - a.totalClicks),
      summary: {
        totalVideosTracked: estimates.length,
        averageCompletionRate: estimates.length > 0 
          ? estimates.reduce((sum, e) => sum + e.estimatedCompletionRate, 0) / estimates.length 
          : 0,
        highConfidenceEstimates: estimates.filter(e => e.confidence === 'high').length,
        mediumConfidenceEstimates: estimates.filter(e => e.confidence === 'medium').length,
        lowConfidenceEstimates: estimates.filter(e => e.confidence === 'low').length
      }
    };
  }

  /**
   * 评估数据质量
   */
  assessDataQuality(returnRecords) {
    if (returnRecords.length === 0) return 'no-data';
    
    const hasTimeData = returnRecords.filter(r => r.timeSpent > 0).length;
    const hasWatchPercentage = returnRecords.filter(r => r.estimatedWatchPercentage > 0).length;
    
    const timeDataRatio = hasTimeData / returnRecords.length;
    const watchPercentageRatio = hasWatchPercentage / returnRecords.length;
    
    if (timeDataRatio >= 0.8 && watchPercentageRatio >= 0.8) return 'high';
    if (timeDataRatio >= 0.5 && watchPercentageRatio >= 0.5) return 'medium';
    return 'low';
  }
}