import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Users, Star, Calendar, Eye, User, Tag, Utensils, Camera, Clock } from 'lucide-react';
import { usePageTracking } from '@/hooks/usePageTracking';

const HomePage = () => {
  const { t } = useTranslation();
  
  // 页面追踪
  usePageTracking(t('home.hero.title'));

  // 使用翻译系统中的服务数据
  const serviceIconMap = {
    'classic': MapPin,
    'food': Utensils,
    'history': Camera
  };

  const services = [
    {
      id: 'classic',
      category: 'classic',
      title: t('home.services.serviceData.classic.title'),
      description: t('home.services.serviceData.classic.description'),
      duration: t('home.services.serviceData.classic.duration'),
      highlights: t('home.services.serviceData.classic.highlights', { returnObjects: true }) as string[],
      price: 299,
      image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Beautiful%20traditional%20Chinese%20architecture%20in%20Chengdu%2C%20Kuanzhai%20Alley%20ancient%20street%2C%20traditional%20buildings%2C%20tourists%20walking%2C%20cultural%20atmosphere&image_size=landscape_4_3",
      icon: MapPin
    },
    {
      id: 'food',
      category: 'food',
      title: t('home.services.serviceData.food.title'),
      description: t('home.services.serviceData.food.description'),
      duration: t('home.services.serviceData.food.duration'),
      highlights: t('home.services.serviceData.food.highlights', { returnObjects: true }) as string[],
      price: 199,
      image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Authentic%20Sichuan%20hotpot%20with%20red%20spicy%20broth%2C%20fresh%20ingredients%2C%20traditional%20Chinese%20restaurant%20setting%2C%20warm%20lighting%2C%20food%20photography&image_size=landscape_4_3",
      icon: Utensils
    },
    {
      id: 'history',
      category: 'history',
      title: t('home.services.serviceData.history.title'),
      description: t('home.services.serviceData.history.description'),
      duration: t('home.services.serviceData.history.duration'),
      highlights: t('home.services.serviceData.history.highlights', { returnObjects: true }) as string[],
      price: 259,
      image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Ancient%20Chinese%20historical%20site%20in%20Chengdu%2C%20Jinsha%20archaeological%20museum%2C%20ancient%20artifacts%2C%20cultural%20heritage%2C%20educational%20atmosphere&image_size=landscape_4_3",
      icon: Camera
    }
  ];

  // 使用翻译系统中的博客数据
  const blogPosts = [
    {
      id: 'photography',
      title: t('home.blog.data.photography.title'),
      excerpt: t('home.blog.data.photography.excerpt'),
      category: t('home.blog.data.photography.category'),
      readTime: t('home.blog.data.photography.readTime'),
      views: t('home.blog.data.photography.views'),
      author: t('home.blog.author'),
      date: "2024-01-15",
      tags: t('home.blog.data.photography.tags', { returnObjects: true }) as string[],
      image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Beautiful%20photography%20spots%20in%20Chengdu%2C%20scenic%20locations%2C%20camera%20equipment%2C%20photographer%20taking%20pictures%2C%20golden%20hour%20lighting&image_size=landscape_4_3"
    },
    {
      id: 'cuisine',
      title: t('home.blog.data.cuisine.title'),
      excerpt: t('home.blog.data.cuisine.excerpt'),
      category: t('home.blog.data.cuisine.category'),
      readTime: t('home.blog.data.cuisine.readTime'),
      views: t('home.blog.data.cuisine.views'),
      author: t('home.blog.author'),
      date: "2024-01-10",
      tags: t('home.blog.data.cuisine.tags', { returnObjects: true }) as string[],
      image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Traditional%20Sichuan%20cuisine%20dishes%2C%20colorful%20spicy%20food%2C%20mapo%20tofu%2C%20kung%20pao%20chicken%2C%20elegant%20food%20presentation&image_size=landscape_4_3"
    },
    {
      id: 'metro',
      title: t('home.blog.data.metro.title'),
      excerpt: t('home.blog.data.metro.excerpt'),
      category: t('home.blog.data.metro.category'),
      readTime: t('home.blog.data.metro.readTime'),
      views: t('home.blog.data.metro.views'),
      author: t('home.blog.author'),
      date: "2024-01-05",
      tags: t('home.blog.data.metro.tags', { returnObjects: true }) as string[],
      image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Modern%20Chengdu%20metro%20station%2C%20clean%20subway%20platform%2C%20modern%20transportation%2C%20passengers%20waiting%2C%20urban%20infrastructure&image_size=landscape_4_3"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Beautiful%20panoramic%20view%20of%20Chengdu%20city%20with%20traditional%20Chinese%20architecture%2C%20pagodas%2C%20modern%20buildings%2C%20mountains%20in%20distance%2C%20soft%20morning%20light%2C%20peaceful%20atmosphere&image_size=landscape_16_9')] bg-cover bg-center opacity-20"></div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-text-primary mb-6 leading-tight">
              {t('home.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-2xl mx-auto">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/services"
                className="inline-flex items-center gap-3 bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                {t('home.hero.cta')}
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary-200 rounded-full opacity-60 animate-bounce"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-secondary-200 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '1s' }}></div>
      </section>

      {/* About Preview Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <h2 className="text-4xl font-bold text-text-primary mb-6">
                {t('home.about.title')}
              </h2>
              <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                {t('home.about.description')}
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                {(t('home.about.skills', { returnObjects: true }) as string[]).map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                {t('home.about.learnMore')} <ArrowRight size={16} />
              </Link>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <img
                src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20friendly%20Chinese%20tour%20guide%20portrait%2C%20smiling%20person%20in%20casual%20professional%20attire%2C%20Chengdu%20cityscape%20background%2C%20warm%20natural%20lighting%2C%20approachable%20and%20trustworthy&image_size=portrait_4_3"
                alt="Guide Portrait"
                className="w-full h-96 object-cover rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              {t('home.services.title')}
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              {t('home.services.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg">
                      <Icon className="text-primary-600" size={24} />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={16} className="text-text-secondary" />
                      <span className="text-sm text-text-secondary">
                        {service.duration}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-3">
                      {service.title}
                    </h3>
                    <p className="text-text-secondary mb-4 leading-relaxed">
                      {service.description}
                    </p>
                    <div className="space-y-2 mb-6">
                      {service.highlights.map((highlight: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Star size={14} className="text-accent-500" />
                          <span className="text-sm text-text-secondary">{highlight}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary-600">
                        ¥{service.price}
                      </span>
                      <Link
                        to="/services"
                        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                      >
                        {t('home.services.learnDetails')} <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Blog Preview Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              {t('home.blog.title')}
            </h2>
            <p className="text-xl text-text-secondary">
              {t('home.blog.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {blogPosts.map((post, index) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    {post.category}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3 text-sm text-text-secondary">
                    <span>{post.author}</span>
                    <span>•</span>
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                    <span>•</span>
                    <span>{post.views} {t('home.blog.views')}</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-text-secondary mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {post.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link
                      to="/blog"
                      className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                    >
                      {t('home.blog.readMore')} <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              {t('home.blog.viewMore')}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;