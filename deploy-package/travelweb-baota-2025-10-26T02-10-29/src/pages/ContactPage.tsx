import React, { useState } from 'react';
import { Phone, Mail, MessageCircle, MapPin, Clock, Send, CheckCircle, Star, Instagram } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageTracking } from '@/hooks/usePageTracking';

const ContactPage = () => {
  const { t } = useTranslation();
  usePageTracking(t('contact.hero.title'));
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    date: '',
    guests: '',
    message: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 这里可以添加表单提交逻辑
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // WhatsApp 图标组件
  const WhatsAppIcon = ({ size = 28, className = '' }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.386"/>
    </svg>
  );

  const contactInfo = [
    {
      icon: Phone,
      title: t('contact.info.phone.title'),
      value: '+86 138 0000 0000',
      description: t('contact.info.phone.description'),
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      icon: Mail,
      title: t('contact.info.email.title'),
      value: 'guide@chengdu-travel.com',
      description: t('contact.info.email.description'),
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
    },
    {
      icon: MessageCircle,
      title: t('contact.info.wechatConsult.title'),
      value: 'ChengduGuide2024',
      description: t('contact.info.wechatConsult.description'),
      color: 'text-accent-600',
      bgColor: 'bg-accent-50',
    },
    {
      icon: WhatsAppIcon,
      title: t('contact.info.whatsapp.title'),
      value: '+86 138 0000 0000',
      description: t('contact.info.whatsapp.description'),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Instagram,
      title: t('contact.info.instagram.title'),
      value: '@chengdu_travel_guide',
      description: t('contact.info.instagram.description'),
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      icon: MapPin,
      title: t('contact.info.office.title'),
      value: t('contact.info.office.value'),
      description: t('contact.info.office.description'),
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
    },
  ];

  const workingHours = [
    { day: t('contact.workingHours.schedule.weekdays'), hours: '09:00 - 18:00' },
    { day: t('contact.workingHours.schedule.saturday'), hours: '09:00 - 17:00' },
    { day: t('contact.workingHours.schedule.sunday'), hours: '10:00 - 16:00' },
  ];

  const services = [
    { key: 'classic', name: t('contact.services.classic') },
    { key: 'food', name: t('contact.services.food') },
    { key: 'history', name: t('contact.services.history') },
    { key: 'panda', name: t('contact.services.panda') },
    { key: 'custom', name: t('contact.services.custom') },
    { key: 'other', name: t('contact.services.other') },
  ];

  const faqs = [
    {
      question: t('contact.faqs.q1.question'),
      answer: t('contact.faqs.q1.answer'),
    },
    {
      question: t('contact.faqs.q2.question'),
      answer: t('contact.faqs.q2.answer'),
    },
    {
      question: t('contact.faqs.q3.question'),
      answer: t('contact.faqs.q3.answer'),
    },
    {
      question: t('contact.faqs.q4.question'),
      answer: t('contact.faqs.q4.answer'),
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-text-primary mb-6 animate-fade-in">
              {t('contact.title')}
            </h1>
            <p className="text-xl text-text-secondary mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {t('contact.subtitle')}
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                <Clock className="text-primary-600" size={20} />
                <span className="font-medium">{t('contact.features.quickResponse')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                <Star className="text-warning-600" size={20} />
                <span className="font-medium">{t('contact.features.professionalService')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                <CheckCircle className="text-accent-600" size={20} />
                <span className="font-medium">{t('contact.features.thoughtfulArrangement')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              {t('contact.info.title')}
            </h2>
            <p className="text-xl text-text-secondary">
              {t('contact.info.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-2 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`w-16 h-16 ${info.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={info.color} size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">{info.title}</h3>
                  <p className="text-lg font-semibold text-text-primary mb-2">{info.value}</p>
                  <p className="text-sm text-text-secondary">{info.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div className="animate-slide-up">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-text-primary mb-6">
                  {t('contact.form.title')}
                </h3>
                
                {isSubmitted && (
                  <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                    <CheckCircle size={20} />
                    <span>{t('contact.form.success')}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        {t('contact.form.name')} *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                        placeholder={t('contact.form.placeholders.name')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        {t('contact.form.email')} *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                        placeholder={t('contact.form.placeholders.email')}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        {t('contact.form.phone')}
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                        placeholder={t('contact.form.placeholders.phone')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        {t('contact.form.service')}
                      </label>
                      <select
                        name="service"
                        value={formData.service}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                      >
                        <option value="">{t('contact.form.placeholders.service')}</option>
                        {services.map((service) => (
                          <option key={service.key} value={service.key}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        {t('contact.form.date')}
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        {t('contact.form.guests')}
                      </label>
                      <select
                        name="guests"
                        value={formData.guests}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                      >
                        <option value="">{t('contact.form.placeholders.guests')}</option>
                        <option value="1">{t('contact.guestOptions.1')}</option>
                        <option value="2">{t('contact.guestOptions.2')}</option>
                        <option value="3-5">{t('contact.guestOptions.3-5')}</option>
                        <option value="6-10">{t('contact.guestOptions.6-10')}</option>
                        <option value="10+">{t('contact.guestOptions.10+')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t('contact.form.message')}
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all resize-none"
                      placeholder={t('contact.form.placeholders.message')}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Send size={20} />
                    {t('contact.form.submit')}
                  </button>
                </form>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {/* Working Hours */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
                  <Clock className="text-primary-600" size={24} />
                  {t('contact.workingHours.title')}
                </h3>
                <div className="space-y-4">
                  {workingHours.map((schedule, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-b-0">
                      <span className="font-medium text-text-primary">{schedule.day}</span>
                      <span className="text-text-secondary">{schedule.hours}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-primary-700">
                    {t('contact.workingHours.emergency')}
                  </p>
                </div>
              </div>

              {/* WeChat QR Code */}
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <h3 className="text-2xl font-bold text-text-primary mb-6">
                  {t('contact.wechatSection.title')}
                </h3>
                <div className="w-48 h-48 bg-neutral-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <img
                    src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=WeChat%20QR%20code%20for%20travel%20guide%20service%2C%20clean%20design%2C%20black%20and%20white%20pattern%2C%20square%20format&image_size=square"
                    alt="WeChat QR Code"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <p className="text-text-secondary" dangerouslySetInnerHTML={{ __html: t('contact.wechatSection.description') }}>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              {t('contact.faqs.title')}
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-neutral-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <h3 className="text-lg font-bold text-text-primary mb-3 flex items-start gap-2">
                  <span className="bg-primary-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    Q
                  </span>
                  {faq.question}
                </h3>
                <p className="text-text-secondary leading-relaxed ml-8">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              {t('contact.location.title')}
            </h2>
            <p className="text-xl text-text-secondary">
              {t('contact.location.subtitle')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="h-96 bg-neutral-200 flex items-center justify-center">
                <img
                  src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Chengdu%20city%20map%20with%20landmarks%20marked%2C%20street%20layout%2C%20tourist%20attractions%2C%20clean%20cartographic%20style%2C%20navigation%20interface&image_size=landscape_16_9"
                  alt="Chengdu Map"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">{t('contact.location.address.title')}</h3>
                    <p className="text-text-secondary mb-4" dangerouslySetInnerHTML={{ __html: t('contact.location.address.detail') }}>
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">{t('contact.location.transport.title')}</h3>
                    <p className="text-text-secondary" dangerouslySetInnerHTML={{ __html: t('contact.location.transport.detail') }}>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;