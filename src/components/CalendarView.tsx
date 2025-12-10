import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, DollarSign } from 'lucide-react';
import { Subscription } from '../lib/supabase';
import { usePreferences } from '../contexts/PreferencesContext';

type CalendarViewProps = {
  subscriptions: Subscription[];
};

export default function CalendarView({ subscriptions }: CalendarViewProps) {
  const { t, formatCurrency, preferences } = usePreferences();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = preferences.language === 'id'
    ? ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayNames = preferences.language === 'id'
    ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const billingDates = useMemo(() => {
    const dates: Record<number, Subscription[]> = {};

    subscriptions.forEach(sub => {
      if (sub.next_billing_date) {
        const billingDate = new Date(sub.next_billing_date);
        if (billingDate.getFullYear() === year && billingDate.getMonth() === month) {
          const day = billingDate.getDate();
          if (!dates[day]) dates[day] = [];
          dates[day].push(sub);
        }
      }
    });

    return dates;
  }, [subscriptions, year, month]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Entertainment: 'bg-red-500',
      Productivity: 'bg-green-500',
      Cloud: 'bg-blue-500',
      Gaming: 'bg-purple-500',
      Reading: 'bg-yellow-500',
      Fitness: 'bg-orange-500',
      Other: 'bg-slate-500',
    };
    return colors[category] || 'bg-slate-500';
  };

  const totalThisMonth = useMemo(() => {
    return Object.values(billingDates)
      .flat()
      .reduce((sum, sub) => sum + sub.price, 0);
  }, [billingDates]);

  const renderCalendarDays = () => {
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 sm:h-32 bg-slate-50/50" />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && today.getDate() === day;
      const subs = billingDates[day] || [];

      days.push(
        <div
          key={day}
          className={`h-24 sm:h-32 border-t border-slate-100 p-1 sm:p-2 relative overflow-hidden ${
            isToday ? 'bg-teal-50' : 'bg-white hover:bg-slate-50'
          } transition-colors`}
        >
          <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full mb-1 ${
            isToday
              ? 'bg-teal-600 text-white font-bold'
              : 'text-slate-700'
          }`}>
            <span className="text-xs sm:text-sm">{day}</span>
          </div>

          <div className="space-y-1 overflow-hidden">
            {subs.slice(0, 2).map((sub) => (
              <div
                key={sub.id}
                className={`${getCategoryColor(sub.category)} text-white text-xs px-1.5 py-0.5 rounded truncate`}
                title={`${sub.service_name} - ${formatCurrency(sub.price, sub.currency)}`}
              >
                <span className="hidden sm:inline">{sub.service_name}</span>
                <span className="sm:hidden">{sub.service_name.substring(0, 3)}</span>
              </div>
            ))}
            {subs.length > 2 && (
              <div className="text-xs text-slate-500 font-medium">
                +{subs.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const upcomingBillings = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return subscriptions
      .filter(sub => sub.next_billing_date && sub.next_billing_date >= todayStr)
      .sort((a, b) => new Date(a.next_billing_date!).getTime() - new Date(b.next_billing_date!).getTime())
      .slice(0, 5);
  }, [subscriptions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    {monthNames[month]} {year}
                  </h2>
                  <p className="text-sm text-slate-500">{t('calendar.subtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToToday}
                  className="px-3 py-1.5 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors hidden sm:block"
                >
                  {t('calendar.today')}
                </button>
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100">
            {dayNames.map((day) => (
              <div
                key={day}
                className="py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-slate-600 bg-slate-50"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {renderCalendarDays()}
          </div>
        </div>

        <div className="w-full sm:w-80 space-y-4">
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl shadow-sm p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="font-medium opacity-90">
                {preferences.language === 'id' ? 'Total Bulan Ini' : 'This Month Total'}
              </span>
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(totalThisMonth, preferences.defaultCurrency)}
            </p>
            <p className="text-sm opacity-75 mt-1">
              {Object.values(billingDates).flat().length} {t('summary.subscriptions')}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">
                {preferences.language === 'id' ? 'Tagihan Mendatang' : 'Upcoming Billings'}
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {upcomingBillings.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  {t('calendar.noEvents')}
                </div>
              ) : (
                upcomingBillings.map((sub) => (
                  <div key={sub.id} className="p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${getCategoryColor(sub.category)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate text-sm">
                          {sub.service_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(sub.next_billing_date!).toLocaleDateString(
                            preferences.language === 'id' ? 'id-ID' : 'en-US',
                            { day: 'numeric', month: 'short' }
                          )}
                        </p>
                      </div>
                      <span className="font-semibold text-slate-900 text-sm">
                        {formatCurrency(sub.price, sub.currency)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
