import { useState, useEffect } from 'react';
import { X, Bell, Calendar, CreditCard, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { supabase, Subscription } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';

type ReminderNotificationProps = {
  isOpen: boolean;
  onClose: () => void;
};

type UpcomingSubscription = Subscription & {
  daysUntilBilling: number;
};

export default function ReminderNotification({ isOpen, onClose }: ReminderNotificationProps) {
  const { user } = useAuth();
  const { formatCurrency } = usePreferences();
  const [upcomingSubs, setUpcomingSubs] = useState<UpcomingSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      loadUpcomingSubscriptions();
    }
  }, [isOpen, user]);

  const loadUpcomingSubscriptions = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active')
        .not('next_billing_date', 'is', null)
        .lte('next_billing_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .gte('next_billing_date', today.toISOString().split('T')[0])
        .order('next_billing_date', { ascending: true });

      if (error) throw error;

      const subsWithDays = (data || []).map((sub) => {
        const nextBilling = new Date(sub.next_billing_date!);
        const daysUntil = Math.ceil((nextBilling.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { ...sub, daysUntilBilling: daysUntil };
      });

      setUpcomingSubs(subsWithDays);
    } catch (error) {
      console.error('Error loading upcoming subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };


  const getUrgencyColor = (days: number) => {
    if (days === 0) return 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200';
    if (days <= 3) return 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200';
    if (days <= 7) return 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200';
    return 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200';
  };

  const getUrgencyIcon = (days: number) => {
    if (days === 0) return <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />;
    if (days <= 3) return <Bell className="w-5 h-5 text-orange-500 animate-wiggle" />;
    if (days <= 7) return <Clock className="w-5 h-5 text-yellow-600" />;
    return <Calendar className="w-5 h-5 text-blue-500" />;
  };

  const formatDaysText = (days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-6 flex items-center justify-between animate-gradient">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Upcoming Renewals
                {upcomingSubs.length > 0 && (
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">{upcomingSubs.length}</span>
                )}
              </h2>
              <p className="text-white/80 text-sm">Subscriptions due in the next 30 days</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-all p-2 hover:bg-white/10 rounded-full hover:rotate-90 duration-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
                <Sparkles className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-slate-500 animate-pulse">Loading reminders...</p>
            </div>
          ) : upcomingSubs.length === 0 ? (
            <div className="text-center py-16 animate-fade-in-up">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">All Clear! 🎉</h3>
              <p className="text-slate-500">No subscriptions due in the next 30 days</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSubs.map((sub, index) => (
                <div key={sub.id} className={`${getUrgencyColor(sub.daysUntilBilling)} border-2 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 animate-fade-in-up`}
                  style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">{getUrgencyIcon(sub.daysUntilBilling)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {sub.icon_emoji && (
                            sub.icon_emoji.startsWith('url:') ? (
                              <img 
                                src={sub.icon_emoji.replace('url:', '')} 
                                alt={sub.service_name}
                                className="w-8 h-8 object-contain rounded-lg"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="text-2xl">{sub.icon_emoji}</span>
                            )
                          )}
                          <h3 className="font-bold text-lg truncate text-slate-900">{sub.service_name}</h3>
                        </div>
                        {sub.plan_name && <p className="text-sm text-slate-600 mb-2">{sub.plan_name}</p>}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4" />
                            <span className="font-semibold">{formatCurrency(sub.price, sub.currency)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(sub.next_billing_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${sub.daysUntilBilling === 0 ? 'text-red-600' : sub.daysUntilBilling <= 3 ? 'text-orange-600' : sub.daysUntilBilling <= 7 ? 'text-yellow-600' : 'text-blue-600'}`}>
                        {sub.daysUntilBilling}
                      </div>
                      <div className="text-xs font-medium text-slate-500">{formatDaysText(sub.daysUntilBilling)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}


          {/* Stats summary */}
          {upcomingSubs.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Due Today', count: upcomingSubs.filter(s => s.daysUntilBilling === 0).length, color: 'from-red-500 to-rose-500', bg: 'from-red-50 to-rose-50' },
                  { label: 'Next 3 Days', count: upcomingSubs.filter(s => s.daysUntilBilling > 0 && s.daysUntilBilling <= 3).length, color: 'from-orange-500 to-amber-500', bg: 'from-orange-50 to-amber-50' },
                  { label: 'This Week', count: upcomingSubs.filter(s => s.daysUntilBilling > 3 && s.daysUntilBilling <= 7).length, color: 'from-yellow-500 to-amber-500', bg: 'from-yellow-50 to-amber-50' },
                  { label: 'This Month', count: upcomingSubs.filter(s => s.daysUntilBilling > 7).length, color: 'from-blue-500 to-indigo-500', bg: 'from-blue-50 to-indigo-50' },
                ].map((stat, i) => (
                  <div key={i} className={`bg-gradient-to-br ${stat.bg} rounded-xl p-4 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
                    <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.count}</div>
                    <div className="text-xs text-slate-600 font-medium mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Close button */}
          <div className="mt-6 flex justify-end">
            <button onClick={onClose}
              className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 flex items-center gap-2">
              <span>Got it</span>
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
