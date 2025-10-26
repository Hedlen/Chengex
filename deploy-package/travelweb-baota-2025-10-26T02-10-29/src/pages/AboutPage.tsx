import { useTranslation } from 'react-i18next';
import { MapPin, Heart, Camera, Users, Award, Globe, Clock, Star } from 'lucide-react';
import { usePageTracking } from '@/hooks/usePageTracking';

const AboutPage = () => {
  const { t } = useTranslation();
  usePageTracking(t('about.hero.title'));

  const stats = [
    { key: 'experience', icon: Clock, value: '8+', color: 'text-primary-600' },
    { key: 'clients', icon: Users, value: '500+', color: 'text-secondary-600' },
    { key: 'tours', icon: MapPin, value: '200+', color: 'text-accent-600' },
    { key: 'rating', icon: Star, value: '4.9', color: 'text-warning-600' },
  ];

  const skills = [
    { name: t('about.skills.chineseGuide'), level: 100, color: 'bg-primary-500' },
    { name: t('about.skills.englishGuide'), level: 95, color: 'bg-secondary-500' },
    { name: t('about.skills.photography'), level: 90, color: 'bg-accent-500' },
    { name: t('about.skills.history'), level: 95, color: 'bg-warning-500' },
    { name: t('about.skills.foodRecommendation'), level: 98, color: 'bg-primary-600' },
    { name: t('about.skills.routePlanning'), level: 92, color: 'bg-secondary-600' },
  ];

  const certifications = [
    {
      title: t('about.certifications.nationalLicense.title'),
      issuer: t('about.certifications.nationalLicense.issuer'),
      year: '2016',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20certificate%20document%20with%20official%20seal%2C%20Chinese%20government%20tourism%20certification%2C%20formal%20layout%2C%20blue%20and%20gold%20colors&image_size=landscape_4_3',
    },
    {
      title: t('about.certifications.englishCertificate.title'),
      issuer: t('about.certifications.englishCertificate.issuer'),
      year: '2017',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=English%20language%20tourism%20certificate%2C%20professional%20qualification%20document%2C%20bilingual%20text%2C%20elegant%20design&image_size=landscape_4_3',
    },
    {
      title: t('about.certifications.culturalHeritage.title'),
      issuer: t('about.certifications.culturalHeritage.issuer'),
      year: '2018',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Cultural%20heritage%20certificate%20with%20traditional%20Chinese%20design%20elements%2C%20official%20government%20seal%2C%20cultural%20symbols&image_size=landscape_4_3',
    },
  ];

  const chengduHighlights = [
    {
      title: t('about.highlights.kuanzhai.title'),
      description: t('about.highlights.kuanzhai.description'),
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Traditional%20Chinese%20alley%20in%20Chengdu%20Kuanzhai%20with%20ancient%20architecture%2C%20stone%20pathways%2C%20red%20lanterns%2C%20tourists%20walking%2C%20peaceful%20atmosphere&image_size=square',
    },
    {
      title: t('about.highlights.jinli.title'),
      description: t('about.highlights.jinli.description'),
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Ancient%20Chinese%20street%20with%20traditional%20shops%2C%20colorful%20lanterns%2C%20historical%20architecture%2C%20cultural%20atmosphere%2C%20evening%20lighting&image_size=square',
    },
    {
      title: t('about.highlights.panda.title'),
      description: t('about.highlights.panda.description'),
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Cute%20giant%20pandas%20in%20natural%20bamboo%20habitat%2C%20peaceful%20research%20center%20environment%2C%20green%20vegetation%2C%20family-friendly%20atmosphere&image_size=square',
    },
    {
      title: t('about.highlights.sichuanMuseum.title'),
      description: t('about.highlights.sichuanMuseum.description'),
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Traditional%20Sichuan%20cuisine%20display%20in%20museum%20setting%2C%20colorful%20spices%2C%20cooking%20utensils%2C%20educational%20exhibits%2C%20cultural%20presentation&image_size=square',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <h1 className="text-5xl font-bold text-text-primary mb-6">
                {t('about.hero.title')}
              </h1>
              <p className="text-xl text-text-secondary mb-8 leading-relaxed">
                {t('about.hero.subtitle')}
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                  <MapPin className="text-primary-600" size={20} />
                  <span className="font-medium">{t('about.hero.location')}</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                  <Globe className="text-secondary-600" size={20} />
                  <span className="font-medium">{t('about.hero.languages')}</span>
                </div>
              </div>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                <img
                  src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20friendly%20Chinese%20tour%20guide%20portrait%2C%20smiling%20person%20in%20professional%20attire%2C%20Chengdu%20landmarks%20background%2C%20warm%20natural%20lighting%2C%20confident%20and%20approachable&image_size=portrait_4_3"
                  alt="Guide Portrait"
                  className="w-full h-96 object-cover rounded-2xl shadow-xl"
                />
                <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-lg">
                  <div className="flex items-center gap-2">
                    <Heart className="text-red-500" size={20} />
                    <span className="font-semibold text-text-primary">{t('about.experience')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.key}
                  className="text-center animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-neutral-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className={stat.color} size={28} />
                  </div>
                  <div className="text-3xl font-bold text-text-primary mb-2">{stat.value}</div>
                  <div className="text-text-secondary font-medium">
                    {t(`about.stats.${stat.key}`)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Personal Story Section */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-text-primary mb-4">
                {t('about.story.title')}
              </h2>
              <p className="text-xl text-text-secondary">
                {t('about.story.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div className="animate-slide-up">
                <h3 className="text-2xl font-bold text-text-primary mb-6">
                  {t('about.story.passion.title')}
                </h3>
                <p className="text-text-secondary mb-6 leading-relaxed">
                  {t('about.story.passion.content')}
                </p>
                <div className="space-y-4">
                  {(t('about.story.passion.points', { returnObjects: true }) as string[]).map((point: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <Heart className="text-red-500 mt-1 flex-shrink-0" size={16} />
                      <span className="text-text-secondary">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <img
                  src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Female%20tour%20guide%20explaining%20to%20tourists%20at%20famous%20Chengdu%20landmark%2C%20professional%20woman%20guide%20in%20casual%20attire%2C%20group%20of%20people%20listening%20attentively%2C%20cultural%20site%20background%2C%20educational%20atmosphere&image_size=landscape_4_3"
                  alt="Guiding Experience"
                  className="w-full h-64 object-cover rounded-xl shadow-lg"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="animate-slide-up order-2 md:order-1">
                <img
                  src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Beautiful%20Chengdu%20cityscape%20with%20traditional%20and%20modern%20architecture%2C%20peaceful%20parks%2C%20cultural%20landmarks%2C%20golden%20hour%20lighting%2C%20urban%20harmony&image_size=landscape_4_3"
                  alt="Chengdu Love"
                  className="w-full h-64 object-cover rounded-xl shadow-lg"
                />
              </div>
              <div className="animate-slide-up order-1 md:order-2" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-2xl font-bold text-text-primary mb-6">
                  {t('about.story.chengdu.title')}
                </h3>
                <p className="text-text-secondary mb-6 leading-relaxed">
                  {t('about.story.chengdu.content')}
                </p>
                <div className="space-y-4">
                  {(t('about.story.chengdu.features', { returnObjects: true }) as string[]).map((feature: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <MapPin className="text-primary-500 mt-1 flex-shrink-0" size={16} />
                      <span className="text-text-secondary">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-text-primary mb-4">
                {t('about.skills.title')}
              </h2>
              <p className="text-xl text-text-secondary">
                {t('about.skills.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {skills.map((skill, index) => (
                <div
                  key={skill.name}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-text-primary">{skill.name}</span>
                    <span className="text-text-secondary">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${skill.color} transition-all duration-1000 ease-out`}
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              {t('about.certifications.title')}
            </h2>
            <p className="text-xl text-text-secondary">
              {t('about.certifications.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {certifications.map((cert, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={cert.image}
                    alt={cert.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="text-warning-500" size={20} />
                    <span className="text-sm font-medium text-warning-600">{cert.year}</span>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">
                    {cert.title}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    {cert.issuer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chengdu Highlights Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              {t('about.chengdu.title')}
            </h2>
            <p className="text-xl text-text-secondary">
              {t('about.chengdu.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {chengduHighlights.map((highlight, index) => (
              <div
                key={index}
                className="group cursor-pointer animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative overflow-hidden rounded-xl mb-4">
                  <img
                    src={highlight.image}
                    alt={highlight.title}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Camera size={20} />
                  </div>
                </div>
                <h3 className="font-bold text-text-primary mb-2">{highlight.title}</h3>
                <p className="text-sm text-text-secondary">{highlight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;