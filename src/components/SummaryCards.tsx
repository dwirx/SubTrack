import { useMemo } from 'react';
import { DollarSign, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { Subscription } from '../lib/supabase';
import { usePreferences } from '../contexts/PreferencesContext';

type SummaryCardsProps = {
  subscriptions: Subscription[];
};

export default function SummaryCards({ subscriptions }: SummaryCardsProps) {
  const { t, formatCurrency, preferences } = usePreferences();

  // Calculate totals - convert all to default currency for display
  const { monthlyTotal, yearlyTotal, activeCount, upcomingCount } = useMemo(() => {
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active' || sub.status === 'trial');
    
    let monthly = 0;
    let yearly = 0;

    activeSubscriptions.forEach(sub => {
      const price = sub.price || 0;
      if (sub.billing_cycle === 'monthly') {
        monthly += price;
        yearly += price * 12;
      } else if (sub.billing_cycle === 'yearly') {
        monthly += price / 12;
        yearly += price;
      } else {
        // one-time - add to monthly only
        monthly += price;
      }
    });

    // Calculate expiring this week - check all active/trial subscriptions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = activeSubscriptions.filter(sub => {
      if (!sub.next_billing_date) return false;
      
      const billingDate = new Date(sub.next_billing_date);
      billingDate.setHours(0, 0, 0, 0);
      
      const diffTime = billingDate.getTime() - today.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Include subscriptions expiring within 7 days (including today and past due)
      return daysUntil <= 7 && daysUntil >= -1;
    }).length;

    return {
      monthlyTotal: monthly,
      yearlyTotal: yearly,
      activeCount: activeSubscriptions.length,
      upcomingCount: upcoming,
    };
  }, [subscriptions]);

  // Get the most common currency from subscriptions, default to IDR
  const displayCurrency = useMemo(() => {
    if (subscriptions.length === 0) return preferences.defaultCurrency;
    const currencies = subscriptions.map(s => s.currency);
    const counts = currencies.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'IDR';
  }, [subscriptions, preferences.defaultCurrency]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      <SummaryCard
        icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />}
        title={t('summary.monthlyTotal')}
        value={formatCurrency(monthlyTotal, displayCurrency)}
        color="teal"
      />
      <SummaryCard
        icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
        title={t('summary.yearlyTotal')}
        value={formatCurrency(yearlyTotal, displayCurrency)}
        color="blue"
      />
      <SummaryCard
        icon={<Calendar className="w-5 h-5 sm:w-6 sm:h-6" />}
        title={t('summary.active')}
        value={activeCount.toString()}
        subtitle={t('summary.subscriptions')}
        color="green"
      />
      <SummaryCard
        icon={<AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />}
        title={t('summary.expiringThisWeek')}
        value={upcomingCount.toString()}
        subtitle={t('summary.subscriptions')}
        color="orange"
        pulse={upcomingCount > 0}
      />
    </div>
  );
}

type SummaryCardProps = {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  color: 'teal' | 'blue' | 'green' | 'orange';
  pulse?: boolean;
};

function SummaryCard({ icon, title, value, subtitle, color, pulse }: SummaryCardProps) {
  const colorClasses = {
    teal: {
      bg: 'bg-gradient-to-br from-teal-50 to-cyan-50',
      icon: 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30',
      border: 'border-teal-200/50',
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      icon: 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30',
      border: 'border-blue-200/50',
    },
    green: {
      bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
      icon: 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30',
      border: 'border-green-200/50',
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
      icon: 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30',
      border: 'border-orange-200/50',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`group ${colors.bg} rounded-xl sm:rounded-2xl p-4 sm:p-6 border ${colors.border} hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs sm:text-sm font-medium text-slate-600 leading-tight pr-2">{title}</p>
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${colors.icon} flex-shrink-0 ${pulse ? 'animate-pulse' : ''}`}>
          {icon}
        </div>
      </div>
      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 truncate">{value}</p>
      {subtitle && (
        <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1">
          {subtitle}
          {pulse && (
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
          )}
        </p>
      )}
    </div>
  );
}
