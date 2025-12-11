import { useMemo, useState } from 'react';
import { DollarSign, TrendingUp, Calendar, AlertCircle, XCircle, ChevronRight, X } from 'lucide-react';
import { Subscription } from '../lib/supabase';
import { usePreferences } from '../contexts/PreferencesContext';

type SummaryCardsProps = {
  subscriptions: Subscription[];
  onFilterChange?: (filter: string | null) => void;
};

export default function SummaryCards({ subscriptions, onFilterChange }: SummaryCardsProps) {
  const { t, formatCurrency, preferences } = usePreferences();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  // Calculate totals
  const stats = useMemo(() => {
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active' || sub.status === 'trial');
    const cancelledSubscriptions = subscriptions.filter(sub => sub.status === 'cancelled');
    
    let monthly = 0;
    let yearly = 0;
    let cancelledMonthly = 0;

    activeSubscriptions.forEach(sub => {
      const price = sub.price || 0;
      if (sub.billing_cycle === 'monthly') {
        monthly += price;
        yearly += price * 12;
      } else if (sub.billing_cycle === 'yearly') {
        monthly += price / 12;
        yearly += price;
      } else if ((sub.billing_cycle as string) === 'quarterly') {
        monthly += price / 3;
        yearly += price * 4;
      } else if ((sub.billing_cycle as string) === 'weekly') {
        monthly += price * 4;
        yearly += price * 52;
      } else {
        monthly += price;
      }
    });

    // Calculate cancelled savings
    cancelledSubscriptions.forEach(sub => {
      const price = sub.price || 0;
      if (sub.billing_cycle === 'monthly') {
        cancelledMonthly += price;
      } else if (sub.billing_cycle === 'yearly') {
        cancelledMonthly += price / 12;
      } else if ((sub.billing_cycle as string) === 'quarterly') {
        cancelledMonthly += price / 3;
      } else if ((sub.billing_cycle as string) === 'weekly') {
        cancelledMonthly += price * 4;
      }
    });

    // Calculate expiring this week
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiringThisWeek = activeSubscriptions.filter(sub => {
      if (!sub.next_billing_date) return false;
      const billingDate = new Date(sub.next_billing_date);
      billingDate.setHours(0, 0, 0, 0);
      const diffTime = billingDate.getTime() - today.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return daysUntil <= 7 && daysUntil >= -1;
    });

    return {
      monthlyTotal: monthly,
      yearlyTotal: yearly,
      activeCount: activeSubscriptions.length,
      activeSubscriptions,
      cancelledCount: cancelledSubscriptions.length,
      cancelledSubscriptions,
      cancelledMonthly,
      expiringCount: expiringThisWeek.length,
      expiringSubscriptions: expiringThisWeek,
    };
  }, [subscriptions]);

  // Get display currency
  const displayCurrency = useMemo(() => {
    if (subscriptions.length === 0) return preferences.defaultCurrency;
    const currencies = subscriptions.map(s => s.currency);
    const counts = currencies.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'IDR';
  }, [subscriptions, preferences.defaultCurrency]);

  const handleCardClick = (cardType: string) => {
    if (selectedCard === cardType) {
      setSelectedCard(null);
      onFilterChange?.(null);
    } else {
      setSelectedCard(cardType);
      onFilterChange?.(cardType);
    }
  };

  const getDetailSubscriptions = () => {
    switch (selectedCard) {
      case 'active':
        return stats.activeSubscriptions;
      case 'cancelled':
        return stats.cancelledSubscriptions;
      case 'expiring':
        return stats.expiringSubscriptions;
      default:
        return [];
    }
  };

  const getDetailTitle = () => {
    switch (selectedCard) {
      case 'active':
        return preferences.language === 'id' ? 'Langganan Aktif' : 'Active Subscriptions';
      case 'cancelled':
        return preferences.language === 'id' ? 'Langganan Dibatalkan' : 'Cancelled Subscriptions';
      case 'expiring':
        return preferences.language === 'id' ? 'Jatuh Tempo Minggu Ini' : 'Expiring This Week';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Monthly Total */}
        <SummaryCard
          icon={<DollarSign className="w-5 h-5" />}
          title={t('summary.monthlyTotal')}
          value={formatCurrency(stats.monthlyTotal, displayCurrency)}
          color="teal"
          onClick={() => {}}
        />

        {/* Yearly Total */}
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5" />}
          title={t('summary.yearlyTotal')}
          value={formatCurrency(stats.yearlyTotal, displayCurrency)}
          color="blue"
          onClick={() => {}}
        />

        {/* Active */}
        <SummaryCard
          icon={<Calendar className="w-5 h-5" />}
          title={t('summary.active')}
          value={stats.activeCount.toString()}
          subtitle={t('summary.subscriptions')}
          color="green"
          isSelected={selectedCard === 'active'}
          onClick={() => handleCardClick('active')}
          clickable
        />

        {/* Expiring This Week */}
        <SummaryCard
          icon={<AlertCircle className="w-5 h-5" />}
          title={t('summary.expiringThisWeek')}
          value={stats.expiringCount.toString()}
          subtitle={t('summary.subscriptions')}
          color="orange"
          pulse={stats.expiringCount > 0}
          isSelected={selectedCard === 'expiring'}
          onClick={() => handleCardClick('expiring')}
          clickable
        />

        {/* Cancelled / Saved */}
        <SummaryCard
          icon={<XCircle className="w-5 h-5" />}
          title={preferences.language === 'id' ? 'Dibatalkan' : 'Cancelled'}
          value={stats.cancelledCount.toString()}
          subtitle={stats.cancelledMonthly > 0 
            ? `${preferences.language === 'id' ? 'Hemat' : 'Saved'} ${formatCurrency(stats.cancelledMonthly, displayCurrency)}/mo`
            : t('summary.subscriptions')
          }
          color="red"
          isSelected={selectedCard === 'cancelled'}
          onClick={() => handleCardClick('cancelled')}
          clickable
        />
      </div>

      {/* Detail Panel */}
      {selectedCard && getDetailSubscriptions().length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-scale-in">
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">{getDetailTitle()}</h3>
              <p className="text-sm text-slate-500">
                {getDetailSubscriptions().length} {preferences.language === 'id' ? 'item' : 'items'}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCard(null);
                onFilterChange?.(null);
              }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
            {getDetailSubscriptions().map((sub) => (
              <SubscriptionDetailRow 
                key={sub.id} 
                subscription={sub} 
                formatCurrency={formatCurrency}
                language={preferences.language}
              />
            ))}
          </div>
          {selectedCard !== 'cancelled' && (
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 font-medium">
                  {preferences.language === 'id' ? 'Total' : 'Total'}
                </span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(
                    getDetailSubscriptions().reduce((sum, sub) => sum + sub.price, 0),
                    displayCurrency
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type SummaryCardProps = {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  color: 'teal' | 'blue' | 'green' | 'orange' | 'red';
  pulse?: boolean;
  isSelected?: boolean;
  onClick: () => void;
  clickable?: boolean;
};

function SummaryCard({ icon, title, value, subtitle, color, pulse, isSelected, onClick, clickable }: SummaryCardProps) {
  const colorClasses = {
    teal: {
      bg: 'bg-gradient-to-br from-teal-50 to-cyan-50',
      bgSelected: 'bg-gradient-to-br from-teal-100 to-cyan-100',
      icon: 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30',
      border: 'border-teal-200/50',
      borderSelected: 'border-teal-400 ring-2 ring-teal-400/30',
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      bgSelected: 'bg-gradient-to-br from-blue-100 to-indigo-100',
      icon: 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30',
      border: 'border-blue-200/50',
      borderSelected: 'border-blue-400 ring-2 ring-blue-400/30',
    },
    green: {
      bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
      bgSelected: 'bg-gradient-to-br from-green-100 to-emerald-100',
      icon: 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30',
      border: 'border-green-200/50',
      borderSelected: 'border-green-400 ring-2 ring-green-400/30',
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
      bgSelected: 'bg-gradient-to-br from-orange-100 to-amber-100',
      icon: 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30',
      border: 'border-orange-200/50',
      borderSelected: 'border-orange-400 ring-2 ring-orange-400/30',
    },
    red: {
      bg: 'bg-gradient-to-br from-red-50 to-rose-50',
      bgSelected: 'bg-gradient-to-br from-red-100 to-rose-100',
      icon: 'bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30',
      border: 'border-red-200/50',
      borderSelected: 'border-red-400 ring-2 ring-red-400/30',
    },
  };

  const colors = colorClasses[color];

  return (
    <div 
      onClick={clickable ? onClick : undefined}
      className={`group ${isSelected ? colors.bgSelected : colors.bg} rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border 
        ${isSelected ? colors.borderSelected : colors.border} 
        hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5
        ${clickable ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-slate-600 leading-tight pr-2">{title}</p>
        <div className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${colors.icon} flex-shrink-0 ${pulse ? 'animate-pulse' : ''}`}>
          {icon}
        </div>
      </div>
      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 truncate">{value}</p>
      {subtitle && (
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] sm:text-xs text-slate-500 truncate flex-1">
            {subtitle}
          </p>
          {clickable && (
            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
          )}
        </div>
      )}
      {pulse && (
        <span className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
        </span>
      )}
    </div>
  );
}

type SubscriptionDetailRowProps = {
  subscription: Subscription;
  formatCurrency: (amount: number, currency: string) => string;
  language: string;
};

function SubscriptionDetailRow({ subscription, formatCurrency, language }: SubscriptionDetailRowProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-700',
    trial: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    expired: 'bg-slate-100 text-slate-700',
  };

  const getDaysUntil = () => {
    if (!subscription.next_billing_date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const billingDate = new Date(subscription.next_billing_date);
    billingDate.setHours(0, 0, 0, 0);
    return Math.ceil((billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysUntil = getDaysUntil();

  return (
    <div className="p-3 sm:p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
          {subscription.icon_emoji?.startsWith('url:') ? (
            <img 
              src={subscription.icon_emoji.replace('url:', '')} 
              alt={subscription.service_name}
              className="w-6 h-6 sm:w-8 sm:h-8 object-contain rounded"
            />
          ) : (
            subscription.icon_emoji || '📦'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">
              {subscription.service_name}
            </p>
            <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColors[subscription.status as keyof typeof statusColors] || statusColors.active}`}>
              {subscription.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-slate-500">
              {subscription.plan_name || subscription.category}
            </p>
            {daysUntil !== null && subscription.status !== 'cancelled' && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                daysUntil <= 0 ? 'bg-red-100 text-red-700' :
                daysUntil <= 3 ? 'bg-orange-100 text-orange-700' :
                daysUntil <= 7 ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {daysUntil === 0 ? (language === 'id' ? 'Hari ini' : 'Today') :
                 daysUntil < 0 ? (language === 'id' ? 'Lewat' : 'Overdue') :
                 daysUntil === 1 ? (language === 'id' ? 'Besok' : 'Tomorrow') :
                 `${daysUntil}${language === 'id' ? ' hari' : 'd'}`}
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-slate-900 text-sm sm:text-base">
            {formatCurrency(subscription.price, subscription.currency)}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 capitalize">
            {subscription.billing_cycle}
          </p>
        </div>
      </div>
    </div>
  );
}
