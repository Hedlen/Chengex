import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Utensils, Camera, Heart, Building, Star, Clock, CheckCircle, Users, Calendar, Phone, Mail } from 'lucide-react';
import { usePageTracking } from '@/hooks/usePageTracking';

const ServicesPage = () => {
  const { t } = useTranslation();
  usePageTracking(t('services.hero.title'));

  // 使用翻译系统中的服务数据
  const serviceIconMap = {
    'classic': MapPin,
    'food': Utensils,
    'history': Camera
  };

  // 从翻译系统获取服务数据
  const services = [
    {
      id: '1',
      category: 'classic',
      title: t('services.serviceData.classic.title'),
      description: t('services.serviceData.classic.description'),
      duration: t('services.serviceData.classic.duration'),
      price: 299,
      highlights: t('services.serviceData.classic.highlights', { returnObjects: true }) as string[],
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=chengdu%20classic%20tour%20traditional%20streets%20ancient%20architecture%20cultural%20sites&image_size=landscape_4_3',
      icon: MapPin,
      popular: true
    },
    {
      id: '2',
      category: 'food',
      title: t('services.serviceData.food.title'),
      description: t('services.serviceData.food.description'),
      duration: t('services.serviceData.food.duration'),
      price: 199,
      highlights: t('services.serviceData.food.highlights', { returnObjects: true }) as string[],
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=chengdu%20food%20culture%20hotpot%20sichuan%20cuisine%20street%20food%20tea%20house&image_size=landscape_4_3',
      icon: Utensils,
      popular: false
    },
    {
      id: '3',
      category: 'history',
      title: t('services.serviceData.history.title'),
      description: t('services.serviceData.history.description'),
      duration: t('services.serviceData.history.duration'),
      price: 259,
      highlights: t('services.serviceData.history.highlights', { returnObjects: true }) as string[],
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=chengdu%20historical%20sites%20ancient%20temples%20cultural%20heritage%20traditional%20gardens&image_size=landscape_4_3',
      icon: Camera,
      popular: false
    }
  ];

  const features = [
    {
      icon: Users,
      title: t('services.features.professionalGuide.title'),
      description: t('services.features.professionalGuide.description'),
    },
    {
      icon: MapPin,
      title: t('services.features.routePlanning.title'),
      description: t('services.features.routePlanning.description'),
    },
    {
      icon: Camera,
      title: t('services.features.photography.title'),
      description: t('services.features.photography.description'),
    },
    {
      icon: Utensils,
      title: t('services.features.foodRecommendations.title'),
      description: t('services.features.foodRecommendations.description'),
    },
  ];

  const testimonials = [
    {
      name: t('services.testimonialData.zhang.name'),
      location: t('services.testimonialData.zhang.location'),
      rating: 5,
      comment: t('services.testimonialData.zhang.comment'),
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20portrait%20of%20middle-aged%20Chinese%20woman%2C%20friendly%20smile%2C%20business%20casual%20attire%2C%20clean%20background%2C%20natural%20lighting&image_size=square',
    },
    {
      name: t('services.testimonialData.john.name'),
      location: t('services.testimonialData.john.location'),
      rating: 5,
      comment: t('services.testimonialData.john.comment'),
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20portrait%20of%20middle-aged%20Western%20man%2C%20friendly%20smile%2C%20business%20casual%20attire%2C%20clean%20background%2C%20natural%20lighting&image_size=square',
    },
    {
      name: t('services.testimonialData.li.name'),
      location: t('services.testimonialData.li.location'),
      rating: 5,
      comment: t('services.testimonialData.li.comment'),
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20portrait%20of%20middle-aged%20Chinese%20man%2C%20friendly%20smile%2C%20business%20casual%20attire%2C%20clean%20background%2C%20natural%20lighting&image_size=square',
    },
  ];

  const packages = [
    {
      name: t('services.packageDetails.classic.name'),
      duration: t('services.packageDetails.classic.duration'),
      price: t('services.packageDetails.classic.price'),
      includes: t('services.packageDetails.classic.includes', { returnObjects: true }) as string[],
      popular: true,
    },
    {
      name: t('services.packageDetails.indepth.name'),
      duration: t('services.packageDetails.indepth.duration'),
      price: t('services.packageDetails.indepth.price'),
      includes: t('services.packageDetails.indepth.includes', { returnObjects: true }) as string[],
      popular: false,
    },
    {
      name: t('services.packageDetails.custom.name'),
      duration: t('services.packageDetails.custom.duration'),
      price: t('services.packageDetails.custom.price'),
      includes: t('services.packageDetails.custom.includes', { returnObjects: true }) as string[],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-text-primary mb-6 animate-fade-in">
              {t('services.hero.title')}
            </h1>
            <p className="text-xl text-text-secondary mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {t('services.hero.subtitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                    <Icon className="text-primary-600" size={20} />
                    <span className="font-medium text-text-primary">{feature.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              {t('services.tours.title')}
            </h2>
            <p className="text-xl text-text-secondary">
              {t('services.tours.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {service.popular && (
                    <div className="absolute top-4 right-4 bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
                      {t('services.labels.popular')}
                    </div>
                  )}
                  
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
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-text-secondary" />
                        <span className="text-sm text-text-secondary">
                          {service.duration}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-primary-600">
                        ¥{service.price}
                      </div>
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
                          <CheckCircle size={14} className="text-accent-500" />
                          <span className="text-sm text-text-secondary">{highlight}</span>
                        </div>
                      ))}
                    </div>
                    
                    <button className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105">
                      {t('services.labels.bookNow')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Package Deals */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              {t('services.packages.title')}
            </h2>
            <p className="text-xl text-text-secondary">
              {t('services.packages.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-slide-up ${
                  pkg.popular ? 'ring-2 ring-primary-500' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {pkg.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white px-6 py-2 rounded-b-lg text-sm font-medium">
                    {t('services.labels.mostPopular')}
                  </div>
                )}
                
                <div className="p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-text-primary mb-2">{pkg.name}</h3>
                    <div className="text-3xl font-bold text-primary-600 mb-2">{pkg.price}</div>
                    <div className="text-text-secondary">{pkg.duration}</div>
                  </div>
                  
                  <div className="space-y-3 mb-8">
                    {pkg.includes.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <CheckCircle size={16} className="text-accent-500 flex-shrink-0" />
                        <span className="text-text-secondary">{item}</span>
                      </div>
                    ))}
                  </div>
                  
                  <button className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 ${
                    pkg.popular
                      ? 'bg-primary-500 hover:bg-primary-600 text-white'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-text-primary'
                  }`}>
                    {t('services.labels.selectPackage')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              {t('services.testimonials.title')}
            </h2>
            <p className="text-xl text-text-secondary">
              {t('services.testimonials.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-neutral-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-text-primary">{testimonial.name}</div>
                    <div className="text-sm text-text-secondary">{testimonial.location}</div>
                  </div>
                </div>
                
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-warning-500 fill-current" />
                  ))}
                </div>
                
                <p className="text-text-secondary leading-relaxed italic">
                  "{testimonial.comment}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-500 to-secondary-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">
              {t('services.cta.title')}
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              {t('services.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-neutral-50 transition-all duration-300 hover:scale-105">
                {t('services.labels.contactNow')}
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-all duration-300 hover:scale-105">
                {t('services.labels.viewMoreServices')}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;