import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Eye, Calendar, Clock, Tag, Filter, Grid, List, Youtube, Music, 
  Heart, Share2, Bookmark, Search, ChevronDown, TrendingUp, Star,
  Users, ThumbsUp, MessageCircle, MoreVertical, Sparkles,
  RefreshCw, AlertCircle, X
} from 'lucide-react';
import { useVideo, Video } from '../contexts/VideoContext';
import VideoCard from '../components/VideoCard';
import { VirtualScrollList } from '../components/VirtualScrollList';
import { performanceUtils } from '../components/PerformanceMonitor';
import { usePageTracking } from '@/hooks/usePageTracking';

const VideoPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // 页面追踪
  usePageTracking(t('videos.hero.title'));
  const { 
    videos, 
    filteredVideos, 
    loading, 
    error, 
    filters, 
    setFilters, 
    searchVideos, 
    clearFilters,
    likeVideo,
    bookmarkVideo,
    shareVideo,
    getRecommendedVideos,
    getPopularVideos
  } = useVideo();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [durationFilter, setDurationFilter] = useState<string>('');
  const [viewsFilter, setViewsFilter] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>('');
  const [useVirtualScroll, setUseVirtualScroll] = useState(false);


  // 获取所有分类
  const categories = ['all', ...Array.from(new Set(videos.flatMap(v => v.category)))];
  
  // 获取热门视频
  const popularVideos = getPopularVideos(3);
  
  // 获取推荐视频
  const recommendedVideos = videos.length > 0 ? getRecommendedVideos(videos[0].id, 4) : [];

  // 性能优化：使用 useMemo 缓存计算结果
  const memoizedFilteredVideos = useMemo(() => {
    return filteredVideos;
  }, [filteredVideos]);

  // 检查是否需要使用虚拟滚动
  useEffect(() => {
    setUseVirtualScroll(filteredVideos.length > 50);
  }, [filteredVideos.length]);

  // 性能优化的搜索函数
  const debouncedSearch = useMemo(
    () => performanceUtils.debounce((query: string) => {
      searchVideos(query);
    }, 300),
    [searchVideos]
  );

  // 性能优化的筛选函数
  const throttledFilter = useMemo(
    () => performanceUtils.throttle(() => {
      setFilters({
        platform: filters.platform,
        category: selectedCategory === '' ? undefined : selectedCategory,
        search: searchQuery,
        sort: sortBy as any,
        duration: durationFilter as 'short' | 'medium' | 'long' | undefined,
        views: viewsFilter as 'low' | 'medium' | 'high' | undefined,
        publishTime: timeFilter as 'today' | 'week' | 'month' | 'year' | undefined
      });
    }, 100),
    [filters.platform, selectedCategory, searchQuery, sortBy, durationFilter, viewsFilter, timeFilter]
  );

  useEffect(() => {
    // 使用节流的筛选函数
    throttledFilter();
  }, [selectedCategory, searchQuery, sortBy, durationFilter, viewsFilter, timeFilter]);

  const handleVideoClick = (video: Video) => {
    // 导航到视频详情页面
    navigate(`/videos/${video.id}`);
  };



  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    debouncedSearch(searchQuery);
  }, [debouncedSearch, searchQuery]);

  // 实时搜索
  const handleSearchInputChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (value.length > 2 || value.length === 0) {
      debouncedSearch(value);
    }
  }, [debouncedSearch]);

  const handleLike = async (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    await likeVideo(videoId);
  };

  const handleBookmark = async (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    await bookmarkVideo(videoId);
  };

  const handleShare = async (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    await shareVideo(videoId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-text-primary mb-6 animate-fade-in">
              {t('videos.hero.title')}
            </h1>
            <p className="text-xl text-text-secondary mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {t('videos.hero.subtitle')}
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder={t('videos.search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  {t('common.search')}
                </button>
              </div>
            </form>
            
            <div className="flex flex-wrap justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                <Play className="text-primary-600" size={20} />
                <span className="font-medium">{t('videos.features.hdVideo')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                <Eye className="text-secondary-600" size={20} />
                <span className="font-medium">{t('videos.features.onSiteFilming')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                <Tag className="text-accent-600" size={20} />
                <span className="font-medium">{t('videos.features.professionalNarration')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Videos */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              <TrendingUp className="inline-block mr-3 text-primary-600" size={36} />
              {t('videos.library.popularVideos')}
            </h2>
            <p className="text-xl text-text-secondary">
              {t('videos.featured.subtitle')}
            </p>
          </div>

          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
            {popularVideos.map((video, index) => (
              <VideoCard
                key={video.id}
                video={video}
                variant="featured"
                onClick={handleVideoClick}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Video Library */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              <Play className="inline-block mr-3 text-primary-600" size={36} />
              {t('videos.library.title')}
            </h2>
            <p className="text-xl text-text-secondary">
              {t('videos.subtitle')}
            </p>
          </div>

          {/* 筛选和搜索区域 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            {/* 搜索栏 */}
            <div className="mb-6">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    placeholder={t('videos.hero.subtitle')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                  <Search size={20} />
                  {t('common.search')}
                </button>
              </form>
            </div>

            {/* 筛选选项 */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {/* 平台筛选 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{t('videos.filtering.platform')}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({...filters, platform: undefined})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      !filters.platform
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('videos.filters.all')}
                  </button>
                  <button
                    onClick={() => setFilters({...filters, platform: 'youtube'})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                      filters.platform === 'youtube'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    <Youtube size={16} />
                    YouTube
                  </button>
                  <button
                    onClick={() => setFilters({...filters, platform: 'tiktok'})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                      filters.platform === 'tiktok'
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Music size={16} />
                    TikTok
                  </button>
                </div>
              </div>

              {/* 分类筛选 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{t('videos.filtering.category')}</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">{t('videos.filtering.allCategories')}</option>
                   {categories.filter(cat => cat !== 'all').map((category) => (
                     <option key={category} value={category}>
                       {category}
                     </option>
                   ))}
                </select>
              </div>

              {/* 排序选项 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{t('videos.sorting.label')}</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="newest">{t('videos.sorting.latest')}</option>
                   <option value="popular">{t('videos.sorting.popular')}</option>
                   <option value="views">{t('videos.sorting.views')}</option>
                   <option value="likes">{t('videos.sorting.likes')}</option>
                </select>
              </div>

              {/* 高级筛选切换 */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Filter size={16} />
                {t('videos.filtering.advanced')}
              </button>

              {/* 清除筛选 */}
              <button
                 onClick={() => {
                   setSelectedCategory('');
                   setSortBy('newest');
                   setSearchQuery('');
                   setDurationFilter('');
                   setViewsFilter('');
                   setTimeFilter('');
                   clearFilters();
                 }}
                 className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
               >
                 <X size={16} />
                 {t('videos.filtering.clear')}
               </button>
            </div>

            {/* 高级筛选面板 */}
            {showFilters && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('videos.filtering.duration')}</label>
                    <select 
                      value={durationFilter}
                      onChange={(e) => setDurationFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">{t('videos.filtering.allDurations')}</option>
                      <option value="short">{t('videos.filtering.short')}</option>
                      <option value="medium">{t('videos.filtering.medium')}</option>
                      <option value="long">{t('videos.filtering.long')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('videos.filtering.viewCount')}</label>
                    <select 
                      value={viewsFilter}
                      onChange={(e) => setViewsFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">{t('videos.filtering.allViews')}</option>
                      <option value="1000+">{t('videos.filtering.views1k')}</option>
                      <option value="10000+">{t('videos.filtering.views10k')}</option>
                      <option value="100000+">{t('videos.filtering.views100k')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('videos.filtering.publishTime')}</label>
                    <select 
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">{t('videos.filtering.allTime')}</option>
                      <option value="today">{t('videos.filtering.today')}</option>
                      <option value="week">{t('videos.filtering.thisWeek')}</option>
                      <option value="month">{t('videos.filtering.thisMonth')}</option>
                      <option value="year">{t('videos.filtering.thisYear')}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 视图模式切换 */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {t('videos.status.found').replace('{count}', memoizedFilteredVideos.length.toString())}
                {useVirtualScroll && <span className="ml-2 text-blue-600">{t('videos.status.virtualScroll')}</span>}
              </span>
              {loading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  {t('videos.status.loading')}
                </div>
              )}
            </div>
            <div className="bg-white rounded-lg p-1 shadow-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>

          {/* 错误状态 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex items-center gap-2 text-red-800">
                <span className="font-medium">{t('videos.status.loadFailed')}</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* 视频网格/列表 */}
          {useVirtualScroll && viewMode === 'list' ? (
            <VirtualScrollList
              items={memoizedFilteredVideos}
              itemHeight={200}
              containerHeight={800}
              renderItem={(video, index) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  variant="list"
                  onClick={() => handleVideoClick(video)}
                  className="mb-4"
                />
              )}
              className="bg-white rounded-lg shadow-sm"
            />
          ) : (
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-4'
            }`}>
              {memoizedFilteredVideos.map((video, index) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  variant={viewMode}
                  onClick={() => handleVideoClick(video)}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                />
              ))}
            </div>
          )}

          {/* 空状态 */}
          {!loading && memoizedFilteredVideos.length === 0 && (
            <div className="text-center py-16">
              <Play className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('videos.status.noVideosFound')}</h3>
              <p className="text-gray-500 mb-4">{t('videos.status.adjustSearchTerms')}</p>
              <button
                 onClick={() => {
                   setSelectedCategory('');
                   setSortBy('newest');
                   setSearchQuery('');
                   clearFilters();
                 }}
                 className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
               >
                 {t('videos.status.resetFilters')}
               </button>
            </div>
          )}

          {/* 性能信息 */}
          {useVirtualScroll && (
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <span className="font-medium">{t('videos.status.performanceEnabled')}</span>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                {t('videos.status.virtualScrollEnabled').replace('{count}', memoizedFilteredVideos.length.toString())}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Video Stats */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center animate-scale-in">
              <div className="text-3xl font-bold text-primary-600 mb-2">50+</div>
              <div className="text-text-secondary">{t('videos.stats.originalVideos')}</div>
            </div>
            <div className="text-center animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-3xl font-bold text-secondary-600 mb-2">100万+</div>
              <div className="text-text-secondary">{t('videos.stats.totalViews')}</div>
            </div>
            <div className="text-center animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-3xl font-bold text-accent-600 mb-2">5000+</div>
              <div className="text-text-secondary">{t('videos.stats.subscribers')}</div>
            </div>
            <div className="text-center animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-3xl font-bold text-warning-600 mb-2">4.9</div>
              <div className="text-text-secondary">{t('videos.stats.rating')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-500 to-secondary-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">
              {t('videos.cta.title')}
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              {t('videos.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-neutral-50 transition-all duration-300 hover:scale-105">
                {t('videos.labels.subscribe')}
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-all duration-300 hover:scale-105">
                {t('videos.labels.contact')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Videos */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              <Sparkles className="inline-block mr-3 text-primary-600" size={36} />
              {t('videos.recommendations.title')}
            </h2>
            <p className="text-xl text-text-secondary">
              {t('videos.recommendations.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {recommendedVideos.map((video, index) => (
              <VideoCard
                key={video.id}
                video={video}
                variant="grid"
                onClick={() => handleVideoClick(video)}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.15}s` }}
                showRecommendedBadge={true}
              />
            ))}
          </div>

          {/* 查看更多推荐 */}
          <div className="text-center mt-12">
            <button className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 mx-auto">
              <RefreshCw size={20} />
              {t('videos.recommendations.refresh')}
            </button>
          </div>
        </div>
      </section>


    </div>
  );
};

export default VideoPage;