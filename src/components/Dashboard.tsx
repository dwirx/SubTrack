import { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, LayoutGrid, GitBranch, ChevronDown, User,
  Calendar, TrendingUp, LogOut, Moon, Filter, Bell, Sparkles,
  Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { supabase, Subscription } from '../lib/supabase';
import SummaryCards from './SummaryCards';
import SubscriptionCard from './SubscriptionCard';
import SerpentineSubscriptionList from './SerpentineSubscriptionList';
import AddSubscriptionModal from './AddSubscriptionModal';
import AnalyticsView from './AnalyticsView';
import UserProfile from './UserProfile';
import CalendarView from './CalendarView';
import ReminderNotification from './ReminderNotification';
import ExportImportModal from './ExportImportModal';

type View = 'dashboard' | 'analytics' | 'profile' | 'calendar';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { preferences, updatePreferences, t } = usePreferences();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubs, setFilteredSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showExportImportModal, setShowExportImportModal] = useState(false);
  const [view, setView] = useState<View>('dashboard');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'serpentine'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'nextBilling'>('nextBilling');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    filterAndSortSubscriptions();
  }, [subscriptions, searchTerm, statusFilter, sortBy]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('next_billing_date', { ascending: true });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSubscriptions = () => {
    let filtered = [...subscriptions];

    if (searchTerm) {
      filtered = filtered.filter(sub =>
        sub.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.price - a.price;
        case 'name':
          return a.service_name.localeCompare(b.service_name);
        case 'nextBilling':
          if (!a.next_billing_date) return 1;
          if (!b.next_billing_date) return -1;
          return new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime();
        default:
          return 0;
      }
    });

    setFilteredSubs(filtered);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSubscriptions(subscriptions.filter(sub => sub.id !== id));
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
  };

  const displayName = preferences.displayName || user?.email?.split('@')[0] || 'User';

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'id', name: 'Indonesia', flag: '🇮🇩' },
  ];

  // Count upcoming renewals for notification badge
  const upcomingCount = subscriptions.filter(sub => {
    if (!sub.next_billing_date || sub.status !== 'active') return false;
    const days = Math.ceil(
      (new Date(sub.next_billing_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days <= 7 && days >= 0;
  }).length;

  if (view === 'profile') {
    return <UserProfile onBack={() => setView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-teal-50/30">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-400/10 to-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/5 to-pink-400/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:h-20 gap-3 sm:gap-0">
            <div className="animate-fade-in-down">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
                {t('app.title')}
              </h1>
              <p className="text-sm text-slate-500">{t('app.subtitle')}</p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap animate-fade-in-down animation-delay-100">
              {/* Export/Import button */}
              <button
                onClick={() => setShowExportImportModal(true)}
                className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 
                  hover:border-slate-300 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                title="Export / Import"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline text-sm font-medium text-slate-700">Export</span>
              </button>

              {/* Reminder button */}
              <button
                onClick={() => setShowReminderModal(true)}
                className="relative flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white 
                  rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/25 
                  hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 btn-press"
                title="View Upcoming Renewals"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">Reminders</span>
                {upcomingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-bold 
                    rounded-full flex items-center justify-center animate-bounce-in shadow-lg">
                    {upcomingCount}
                  </span>
                )}
              </button>

              {/* Language selector */}
              <div className="relative" ref={langMenuRef}>
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 
                    hover:border-slate-300 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                >
                  <span className="text-lg">{languages.find(l => l.code === preferences.language)?.flag}</span>
                  <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                    {languages.find(l => l.code === preferences.language)?.name}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showLangMenu ? 'rotate-180' : ''}`} />
                </button>

                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-scale-in origin-top-right">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          updatePreferences({ language: lang.code as 'en' | 'id' });
                          setShowLangMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors ${
                          preferences.language === lang.code ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
                        }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="text-sm font-medium">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dark mode toggle */}
              <button
                onClick={() => {}}
                className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 
                  transition-all duration-200 bg-white/80 backdrop-blur-sm"
                aria-label="Toggle dark mode"
              >
                <Moon className="w-5 h-5 text-slate-600" />
              </button>

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 
                    hover:border-slate-300 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 hidden sm:inline max-w-[100px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-scale-in origin-top-right">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <MenuButton icon={LayoutGrid} onClick={() => { setView('dashboard'); setShowUserMenu(false); }}>
                        {t('nav.dashboard')}
                      </MenuButton>
                      <MenuButton icon={User} onClick={() => { setView('profile'); setShowUserMenu(false); }}>
                        {t('nav.myProfile')}
                      </MenuButton>
                      <MenuButton icon={Calendar} onClick={() => { setView('calendar'); setShowUserMenu(false); }}>
                        {t('nav.calendar')}
                      </MenuButton>
                      <MenuButton icon={TrendingUp} onClick={() => { setView('analytics'); setShowUserMenu(false); }}>
                        {t('nav.analytics')}
                      </MenuButton>
                    </div>
                    <div className="border-t border-slate-100 py-1">
                      <button
                        onClick={() => { signOut(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('nav.signOut')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-teal-200 rounded-full animate-spin border-t-teal-600"></div>
              <Sparkles className="w-6 h-6 text-teal-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-500 animate-pulse">Loading your subscriptions...</p>
          </div>
        ) : view === 'analytics' ? (
          <AnalyticsView subscriptions={subscriptions} />
        ) : view === 'calendar' ? (
          <CalendarView subscriptions={subscriptions} />
        ) : (
          <>
            {/* Summary Cards */}
            <SummaryCards subscriptions={subscriptions} />

            {/* Subscriptions Section */}
            <div className="mt-8 mb-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 animate-fade-in-up">
                  {t('subscriptions.title')}
                </h2>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto animate-fade-in-up animation-delay-100">
                  {/* Search */}
                  <div className="relative flex-1 lg:flex-none lg:w-64 group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 
                      group-focus-within:text-teal-500 transition-colors" />
                    <input
                      type="text"
                      placeholder={t('subscriptions.search')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 
                        focus:border-teal-500 text-sm bg-white/80 backdrop-blur-sm transition-all duration-200
                        hover:border-slate-300"
                    />
                  </div>

                  {/* Status filter */}
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 
                        focus:border-teal-500 text-sm appearance-none bg-white/80 backdrop-blur-sm cursor-pointer
                        hover:border-slate-300 transition-all duration-200"
                    >
                      <option value="all">{t('subscriptions.allStatus')}</option>
                      <option value="active">{t('status.active')}</option>
                      <option value="trial">{t('status.trial')}</option>
                      <option value="cancelled">{t('status.cancelled')}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  </div>

                  {/* Sort */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'nextBilling')}
                      className="pl-4 pr-8 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 
                        focus:border-teal-500 text-sm appearance-none bg-white/80 backdrop-blur-sm cursor-pointer
                        hover:border-slate-300 transition-all duration-200"
                    >
                      <option value="nextBilling">{t('subscriptions.nextBillingDate')}</option>
                      <option value="price">{t('sort.priceHighLow')}</option>
                      <option value="name">{t('sort.name')}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Layout toggle and Add button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up animation-delay-200">
                <div className="flex items-center bg-slate-100/80 backdrop-blur-sm rounded-xl p-1">
                  <button
                    onClick={() => setLayoutMode('grid')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      layoutMode === 'grid'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>{t('subscriptions.grid')}</span>
                  </button>
                  <button
                    onClick={() => setLayoutMode('serpentine')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      layoutMode === 'serpentine'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    aria-label="Timeline view"
                  >
                    <GitBranch className="w-4 h-4" />
                    <span>{t('subscriptions.timeline')}</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="group flex items-center gap-2 px-5 sm:px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 
                    text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 font-semibold transition-all duration-300 
                    shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5 
                    w-full sm:w-auto justify-center btn-press"
                >
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span>{t('subscriptions.add')}</span>
                </button>
              </div>
            </div>

            {/* Subscription list */}
            {filteredSubs.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 p-12 text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-slate-600 text-lg mb-4">{t('subscriptions.noSubscriptions')}</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold 
                    hover:underline transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('subscriptions.addFirst')}
                </button>
              </div>
            ) : layoutMode === 'serpentine' ? (
              <SerpentineSubscriptionList
                subscriptions={filteredSubs}
                onDelete={handleDelete}
                onUpdate={loadSubscriptions}
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredSubs.map((subscription, index) => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    onDelete={handleDelete}
                    onUpdate={loadSubscriptions}
                    index={index}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddSubscriptionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadSubscriptions}
      />

      <ReminderNotification
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
      />

      <ExportImportModal
        isOpen={showExportImportModal}
        onClose={() => setShowExportImportModal(false)}
        onSuccess={loadSubscriptions}
        subscriptions={subscriptions}
      />
    </div>
  );
}

// Menu button component
function MenuButton({ icon: Icon, onClick, children }: { icon: React.ElementType; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 transition-colors"
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{children}</span>
    </button>
  );
}
