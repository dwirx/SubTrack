import { useState, useEffect } from 'react';
import { Bell, CreditCard, BarChart3, Shield, CheckCircle2, Sparkles, ArrowRight, Star, Zap, Globe } from 'lucide-react';
import AuthModal from './AuthModal';

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-float animation-delay-200" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-gradient-to-br from-orange-400/15 to-yellow-400/15 rounded-full blur-3xl animate-float animation-delay-400" />
      </div>

      {/* Navigation */}
      <nav className="relative bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className={`flex items-center space-x-2 sm:space-x-3 transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <div className="relative">
                <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
                SubTrack
              </span>
            </div>
            <div className={`flex items-center space-x-2 sm:space-x-4 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <button
                onClick={() => openAuth('signin')}
                className="px-3 sm:px-5 py-2 sm:py-2.5 text-slate-700 hover:text-slate-900 font-medium transition-all hover:bg-slate-100 rounded-xl text-sm sm:text-base"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuth('signup')}
                className="group px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:from-teal-600 hover:to-blue-700 font-semibold transition-all shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5 flex items-center gap-2 text-sm sm:text-base btn-press"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-24 pb-16 sm:pb-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200/50 rounded-full mb-6 sm:mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-medium text-teal-700">Smart subscription management</span>
          </div>
          
          <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 sm:mb-8 leading-tight transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Track all your{' '}
            <span className="relative inline-block">
              <span className="gradient-text">subscriptions</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 10C50 2 150 2 198 10" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="200" y2="0">
                    <stop stopColor="#0d9488"/>
                    <stop offset="1" stopColor="#0284c7"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
            {' '}in one place
          </h1>
          
          <p className={`text-lg sm:text-xl text-slate-600 mb-8 sm:mb-12 leading-relaxed max-w-2xl mx-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Never miss a billing date again. Manage Netflix, Spotify, ChatGPT Plus, and all your subscriptions with smart reminders and beautiful insights.
          </p>
          
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <button
              onClick={() => openAuth('signup')}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-2xl hover:from-teal-600 hover:to-blue-700 font-semibold text-lg transition-all shadow-xl shadow-teal-500/25 hover:shadow-2xl hover:shadow-teal-500/30 hover:-translate-y-1 btn-press"
            >
              <Zap className="w-5 h-5" />
              <span>Start Tracking Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-2 text-slate-500">
              <div className="flex -space-x-2">
                {['🧑‍💻', '👩‍🎨', '👨‍💼', '👩‍🔬'].map((emoji, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white flex items-center justify-center text-sm">
                    {emoji}
                  </div>
                ))}
              </div>
              <span className="text-sm font-medium">Join 10k+ users</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-16 sm:mt-20 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {[
            { value: '50+', label: 'Services Supported', icon: Globe },
            { value: '10k+', label: 'Active Users', icon: Star },
            { value: '$2M+', label: 'Tracked Monthly', icon: BarChart3 },
            { value: '99.9%', label: 'Uptime', icon: Shield },
          ].map((stat, i) => (
            <div key={i} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-4 sm:p-6 text-center hover:bg-white/80 transition-all hover:-translate-y-1 hover:shadow-lg">
                <stat.icon className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Everything you need to{' '}
            <span className="gradient-text">stay organized</span>
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Powerful features designed to help you manage subscriptions effortlessly
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {[
            {
              icon: Bell,
              title: 'Smart Reminders',
              description: 'Get notified before billing dates so you never get surprised by charges',
              color: 'from-orange-500 to-amber-500',
              bgColor: 'from-orange-50 to-amber-50',
            },
            {
              icon: BarChart3,
              title: 'Spending Insights',
              description: 'See total monthly and yearly costs with beautiful analytics',
              color: 'from-blue-500 to-cyan-500',
              bgColor: 'from-blue-50 to-cyan-50',
            },
            {
              icon: CheckCircle2,
              title: 'All Categories',
              description: 'Entertainment, productivity, cloud, gaming, fitness, and more',
              color: 'from-green-500 to-emerald-500',
              bgColor: 'from-green-50 to-emerald-50',
            },
            {
              icon: Shield,
              title: 'Secure & Private',
              description: 'Your data is encrypted and stored safely in the cloud',
              color: 'from-purple-500 to-violet-500',
              bgColor: 'from-purple-50 to-violet-50',
            },
          ].map((feature, i) => (
            <FeatureCard key={i} {...feature} index={i} />
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="relative bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-xl border border-slate-200/50 p-6 sm:p-8 md:p-12 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-400/10 to-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl" />
          
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 rounded-full mb-6">
              <Globe className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-700">50+ Services</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Supported Services
            </h2>
            <p className="text-slate-600 mb-8 sm:mb-10">
              Track popular services or add custom subscriptions
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {[
                { name: 'Netflix', emoji: '🎬' },
                { name: 'Spotify', emoji: '🎵' },
                { name: 'YouTube', emoji: '📺' },
                { name: 'Disney+', emoji: '🏰' },
                { name: 'ChatGPT', emoji: '🤖' },
                { name: 'Notion', emoji: '📝' },
                { name: 'Canva', emoji: '🎨' },
                { name: 'Adobe', emoji: '🎯' },
                { name: 'Google One', emoji: '☁️' },
                { name: 'iCloud+', emoji: '📱' },
                { name: 'Xbox', emoji: '🎮' },
                { name: 'PlayStation', emoji: '🕹️' },
                { name: '+ Custom', emoji: '➕' },
              ].map((service, i) => (
                <ServiceBadge key={i} {...service} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="relative bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 rounded-3xl p-8 sm:p-12 md:p-16 text-center overflow-hidden animate-gradient">
          {/* Animated background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl animate-pulse-soft" />
          </div>
          
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Ready to take control?
            </h2>
            <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of users who have simplified their subscription management
            </p>
            <button
              onClick={() => openAuth('signup')}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl hover:bg-slate-50 font-semibold text-lg transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 btn-press"
            >
              <span>Get Started for Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-200/50 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">SubTrack</span>
            </div>
            <p className="text-sm text-slate-500">
              © 2024 SubTrack. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        mode={authMode}
        onToggleMode={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
      />
    </div>
  );
}

type FeatureCardProps = {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  index: number;
};

function FeatureCard({ icon: Icon, title, description, color, bgColor, index }: FeatureCardProps) {
  return (
    <div 
      className="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 hover:-translate-y-2 card-hover"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${bgColor} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative">
        <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
          <Icon className="w-7 h-7" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

type ServiceBadgeProps = {
  name: string;
  emoji: string;
  index: number;
};

function ServiceBadge({ name, emoji, index }: ServiceBadgeProps) {
  return (
    <span 
      className="group inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <span className="text-lg group-hover:scale-125 transition-transform duration-300">{emoji}</span>
      <span className="text-sm sm:text-base">{name}</span>
    </span>
  );
}
