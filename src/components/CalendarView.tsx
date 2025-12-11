import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, DollarSign, X, Clock } from 'lucide-react';
import { Subscription } from '../lib/supabase';
import { usePreferences } from '../contexts/PreferencesContext';

type CalendarViewProps = {
  subscriptions: Subscription[];
};

// Generate unique colors for subscriptions
const subscriptionColors = [
  { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300', dot: 'bg-rose-500' },
  { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500' },
  { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-300', dot: 'bg-violet-500' },
  { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-300', dot: 'bg-cyan-500' },
  { bg: 'bg-pink-500', light: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-300', dot: 'bg-pink-500' },
  { bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300', dot: 'bg-indigo-500' },
  { bg: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-300', dot: 'bg-teal-500' },
  { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' },
];

export default function CalendarView({ subscriptions }: CalendarViewProps) {
  const { t, formatCurrency, preferences } = usePreferences();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [hoveredSub, setHoveredSub] = useState<string | null>(null);

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

  // Create a color map for subscriptions
  const subscriptionColorMap = useMemo(() => {
    const map: Record<string, typeof subscriptionColors[0]> = {};
    subscriptions.forEach((sub, index) => {
      map[sub.id] = subscriptionColors[index % subscriptionColors.length];
    });
    return map;
  }, [subscriptions]);

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
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const totalThisMonth = useMemo(() => {
    return Object.values(billingDates)
      .flat()
      .reduce((sum, sub) => sum + sub.price, 0);
  }, [billingDates]);

  const selectedDaySubs = selectedDay ? billingDates[selectedDay] || [] : [];

  const renderCalendarDays = () => {
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[90px] sm:min-h-[110px] lg:min-h-[130px] bg-slate-50/30 border-b border-r border-slate-100" />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && today.getDate() === day;
      const subs = billingDates[day] || [];
      const isSelected = selectedDay === day;

      days.push(
        <div
          key={day}
          onClick={() => subs.length > 0 && setSelectedDay(selectedDay === day ? null : day)}
          className={`min-h-[90px] sm:min-h-[110px] lg:min-h-[130px] border-b border-r border-slate-100 p-1 sm:p-1.5 lg:p-2 relative 
            ${isToday ? 'bg-teal-50/50' : 'bg-white'} 
            ${isSelected ? 'ring-2 ring-teal-500 ring-inset bg-teal-50/30' : ''}
            ${subs.length > 0 ? 'cursor-pointer hover:bg-slate-50/80' : ''} 
            transition-all duration-200 group`}
        >
          {/* Day number */}
          <div className="flex items-center justify-between mb-1">
            <div className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm font-medium ${
              isToday
                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/30'
                : 'text-slate-600'
            }`}>
              {day}
            </div>
            {subs.length > 0 && (
              <div className="text-[10px] sm:text-xs text-slate-400 font-medium">
                {subs.length} {subs.length === 1 ? 'bill' : 'bills'}
              </div>
            )}
          </div>

          {/* Subscription list */}
          <div className="space-y-0.5 sm:space-y-1 overflow-hidden">
            {subs.map((sub, idx) => {
              const colors = subscriptionColorMap[sub.id];
              const isHovered = hoveredSub === sub.id;
              
              // Show max 2 on mobile, 3 on tablet, 4 on desktop
              if (idx >= 2 && window.innerWidth < 640) return null;
              if (idx >= 3 && window.innerWidth < 1024) return null;
              if (idx >= 4) return null;

              return (
                <div
                  key={sub.id}
                  onMouseEnter={() => setHoveredSub(sub.id)}
                  onMouseLeave={() => setHoveredSub(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDay(day);
                  }}
                  className={`${colors.light} ${colors.border} border-l-2 rounded-r px-1.5 py-0.5 sm:py-1 
                    cursor-pointer transition-all duration-200 ${isHovered ? 'shadow-md scale-[1.02]' : ''}`}
                >
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${colors.dot} rounded-full flex-shrink-0`} />
                    <span className={`${colors.text} text-[10px] sm:text-xs font-medium truncate`}>
                      {sub.service_name}
                    </span>
                  </div>
                  {/* Show price on hover or larger screens */}
                  <div className={`${colors.text} text-[9px] sm:text-[10px] font-semibold pl-2.5 sm:pl-3 opacity-70 hidden sm:block`}>
                    {formatCurrency(sub.price, sub.currency)}
                  </div>
                </div>
              );
            })}
            
            {/* More indicator */}
            {subs.length > 2 && (
              <div className="text-[10px] sm:text-xs text-slate-400 font-medium pl-1 sm:hidden">
                +{subs.length - 2} more
              </div>
            )}
            {subs.length > 3 && (
              <div className="text-[10px] sm:text-xs text-slate-400 font-medium pl-1 hidden sm:block lg:hidden">
                +{subs.length - 3} more
              </div>
            )}
            {subs.length > 4 && (
              <div className="text-[10px] sm:text-xs text-slate-400 font-medium pl-1 hidden lg:block">
                +{subs.length - 4} more
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
      .slice(0, 10);
  }, [subscriptions]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile: Stack layout, Desktop: Side by side */}
      <div className="flex flex-col xl:flex-row gap-4 xl:gap-6">
        {/* Calendar */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-3 sm:p-4 lg:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                  <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                    {monthNames[month]} {year}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">{t('calendar.subtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={goToToday}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                >
                  {preferences.language === 'id' ? 'Hari Ini' : 'Today'}
                </button>
                <button
                  onClick={goToPreviousMonth}
                  className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 border-b border-slate-200">
            {dayNames.map((day, index) => (
              <div
                key={day}
                className={`py-2 sm:py-3 text-center text-[10px] sm:text-xs lg:text-sm font-semibold border-r border-slate-100 last:border-r-0
                  ${index === 0 ? 'text-red-500 bg-red-50/50' : index === 6 ? 'text-blue-500 bg-blue-50/50' : 'text-slate-600 bg-slate-50'}`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {renderCalendarDays()}
          </div>

          {/* Legend */}
          <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[10px] sm:text-xs text-slate-500 mb-2 font-medium">
              {preferences.language === 'id' ? 'Keterangan:' : 'Legend:'}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 sm:gap-x-4 sm:gap-y-2">
              {subscriptions.slice(0, 8).map((sub) => {
                const colors = subscriptionColorMap[sub.id];
                return (
                  <div key={sub.id} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${colors.dot} rounded-full`} />
                    <span className="text-[10px] sm:text-xs text-slate-600 truncate max-w-[60px] sm:max-w-[100px]">
                      {sub.service_name}
                    </span>
                  </div>
                );
              })}
              {subscriptions.length > 8 && (
                <span className="text-[10px] sm:text-xs text-slate-400">+{subscriptions.length - 8} more</span>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full xl:w-80 2xl:w-96 space-y-4">
          {/* Total this month */}
          <div className="bg-gradient-to-br from-teal-600 via-teal-600 to-emerald-600 rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </div>
                <span className="text-sm sm:text-base font-medium opacity-90">
                  {preferences.language === 'id' ? 'Total Bulan Ini' : 'This Month Total'}
                </span>
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                {formatCurrency(totalThisMonth, preferences.defaultCurrency)}
              </p>
              <p className="text-xs sm:text-sm opacity-75 mt-1 sm:mt-2">
                {Object.values(billingDates).flat().length} {t('summary.subscriptions')}
              </p>
            </div>
          </div>

          {/* Selected day detail */}
          {selectedDay && selectedDaySubs.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-scale-in">
              <div className="p-3 sm:p-4 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {selectedDay} {monthNames[month]}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {selectedDaySubs.length} {preferences.language === 'id' ? 'tagihan' : 'billing(s)'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                </button>
              </div>
              <div className="divide-y divide-slate-100 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
                {selectedDaySubs.map((sub) => {
                  const colors = subscriptionColorMap[sub.id];
                  return (
                    <div key={sub.id} className={`p-3 sm:p-4 ${colors.light} border-l-4 ${colors.border}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold ${colors.text} text-sm sm:text-base truncate`}>
                            {sub.service_name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                            {sub.plan_name || sub.category} • {sub.billing_cycle}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900 text-base sm:text-lg whitespace-nowrap">
                          {formatCurrency(sub.price, sub.currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-slate-600 font-medium">
                    {preferences.language === 'id' ? 'Total Hari Ini' : 'Day Total'}
                  </span>
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    {formatCurrency(
                      selectedDaySubs.reduce((sum, sub) => sum + sub.price, 0),
                      preferences.defaultCurrency
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming billings */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {preferences.language === 'id' ? 'Tagihan Mendatang' : 'Upcoming Billings'}
              </h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[350px] sm:max-h-[400px] overflow-y-auto">
              {upcomingBillings.length === 0 ? (
                <div className="p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-xs sm:text-sm">{t('calendar.noEvents')}</p>
                </div>
              ) : (
                upcomingBillings.map((sub) => {
                  const colors = subscriptionColorMap[sub.id];
                  const billingDate = new Date(sub.next_billing_date!);
                  const daysUntil = Math.ceil((billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div 
                      key={sub.id} 
                      className="p-2.5 sm:p-3 lg:p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (billingDate.getMonth() === month && billingDate.getFullYear() === year) {
                          setSelectedDay(billingDate.getDate());
                        } else {
                          setCurrentDate(billingDate);
                          setSelectedDay(billingDate.getDate());
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-1 sm:w-1.5 h-10 sm:h-12 ${colors.dot} rounded-full flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                            {sub.service_name}
                          </p>
                          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <p className="text-[10px] sm:text-xs text-slate-500">
                              {billingDate.toLocaleDateString(
                                preferences.language === 'id' ? 'id-ID' : 'en-US',
                                { day: 'numeric', month: 'short' }
                              )}
                            </p>
                            <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              daysUntil <= 3 ? 'bg-red-100 text-red-700' :
                              daysUntil <= 7 ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {daysUntil === 0 ? (preferences.language === 'id' ? 'Hari ini' : 'Today') :
                               daysUntil === 1 ? (preferences.language === 'id' ? 'Besok' : 'Tomorrow') :
                               `${daysUntil}${preferences.language === 'id' ? 'h' : 'd'}`}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                          {formatCurrency(sub.price, sub.currency)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
