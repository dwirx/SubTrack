import { useState } from 'react';
import { Trash2, Edit2, Users, AlertCircle, Building2, Mail, Phone, ExternalLink, Bell, Clock, ChevronDown, ChevronUp, Calendar, Copy, Check } from 'lucide-react';
import { Subscription, REMINDER_OPTIONS, supabase } from '../lib/supabase';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../contexts/AuthContext';
import { getServiceIcon, getServiceBgColor } from '../lib/serviceIcons';
import EditSubscriptionModal from './EditSubscriptionModal';
import QuickRenewModal from './QuickRenewModal';

type SubscriptionCardProps = {
  subscription: Subscription;
  onDelete: (id: string) => void;
  onUpdate: () => void;
  index?: number;
};

export default function SubscriptionCard({ subscription, onDelete, onUpdate, index = 0 }: SubscriptionCardProps) {
  const { t, formatCurrency, formatDate } = usePreferences();
  const { user } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRenew, setShowRenew] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateSuccess, setDuplicateSuccess] = useState(false);
  const [iconCopied, setIconCopied] = useState(false);

  const serviceIcon = getServiceIcon(subscription.service_name);

  // Copy icon URL to clipboard and save to history
  const handleCopyIcon = async () => {
    if (!subscription.icon_emoji?.startsWith('url:')) return;
    
    const url = subscription.icon_emoji.replace('url:', '');
    try {
      await navigator.clipboard.writeText(url);
      
      // Save to icon history in localStorage
      const ICON_HISTORY_KEY = 'subscription-tracker-icon-history';
      const MAX_HISTORY_ITEMS = 20;
      const saved = localStorage.getItem(ICON_HISTORY_KEY);
      const history: string[] = saved ? JSON.parse(saved) : [];
      const newHistory = [url, ...history.filter(u => u !== url)].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(ICON_HISTORY_KEY, JSON.stringify(newHistory));
      
      setIconCopied(true);
      setTimeout(() => setIconCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy icon URL:', err);
    }
  };

  const getIconContent = () => {
    // Check if icon is a URL
    if (subscription.icon_emoji?.startsWith('url:')) {
      const url = subscription.icon_emoji.replace('url:', '');
      return (
        <img src={url} alt={subscription.service_name} className="w-8 h-8 object-contain rounded" />
      );
    }
    
    // Check if we have a custom emoji
    if (subscription.icon_emoji) {
      return subscription.icon_emoji;
    }
    
    // Check service icon
    if (serviceIcon) {
      return serviceIcon.icon;
    }
    
    // Default category icons
    const icons: Record<string, string> = {
      Entertainment: '🎬',
      Productivity: '📝',
      Cloud: '☁️',
      Gaming: '🎮',
      Reading: '📚',
      Fitness: '🏃',
      Domain: '🌐',
      Other: '📦',
    };
    return icons[subscription.category] || '📦';
  };

  const getCategoryColor = () => {
    return getServiceBgColor(subscription.service_name, subscription.category);
  };

  const getCategoryGradient = () => {
    const gradients: Record<string, string> = {
      Entertainment: 'from-red-500 to-pink-500',
      Productivity: 'from-blue-500 to-indigo-500',
      Cloud: 'from-cyan-500 to-blue-500',
      Gaming: 'from-green-500 to-emerald-500',
      Reading: 'from-amber-500 to-orange-500',
      Fitness: 'from-rose-500 to-red-500',
      Domain: 'from-violet-500 to-purple-500',
      Other: 'from-slate-500 to-gray-500',
    };
    return gradients[subscription.category] || gradients.Other;
  };

  const getBillingProgress = () => {
    if (!subscription.next_billing_date) return 0;
    
    const end = new Date(subscription.next_billing_date).getTime();
    const now = Date.now();
    
    // Calculate cycle duration based on billing_cycle
    let cycleDays = 30; // default monthly
    switch (subscription.billing_cycle) {
      case 'weekly':
        cycleDays = 7;
        break;
      case 'monthly':
        cycleDays = 30;
        break;
      case 'quarterly':
        cycleDays = 90;
        break;
      case 'yearly':
        cycleDays = 365;
        break;
    }
    
    // If we have start_date, use it; otherwise calculate from billing cycle
    let start: number;
    if (subscription.start_date) {
      const startDate = new Date(subscription.start_date).getTime();
      // If start_date is too old, calculate the most recent cycle start
      const cycleMs = cycleDays * 24 * 60 * 60 * 1000;
      const cyclesSinceStart = Math.floor((end - startDate) / cycleMs);
      start = end - cycleMs; // Start of current cycle
    } else {
      // Calculate start based on billing cycle
      start = end - (cycleDays * 24 * 60 * 60 * 1000);
    }
    
    const total = end - start;
    const elapsed = now - start;
    
    // Ensure we return a valid percentage
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const getDaysUntilBilling = () => {
    if (!subscription.next_billing_date) return null;
    const days = Math.ceil(
      (new Date(subscription.next_billing_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const getBillingColor = () => {
    const days = getDaysUntilBilling();
    if (days === null) return 'text-slate-600 bg-slate-50';
    if (days <= 1) return 'text-red-600 bg-red-50';
    if (days <= 7) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const costPerPerson = subscription.is_shared && subscription.shared_with_count
    ? subscription.price / subscription.shared_with_count
    : null;

  const hasAdvancedInfo = subscription.subscription_email || subscription.phone_number ||
    subscription.cancellation_url || subscription.cancellation_steps || subscription.description;

  const handleDuplicate = async () => {
    if (!user || duplicating) return;
    
    setDuplicating(true);
    try {
      const { error } = await supabase.from('subscriptions').insert({
        user_id: user.id,
        service_name: `${subscription.service_name} (Copy)`,
        category: subscription.category,
        plan_name: subscription.plan_name,
        price: subscription.price,
        currency: subscription.currency,
        billing_cycle: subscription.billing_cycle,
        start_date: new Date().toISOString().split('T')[0],
        next_billing_date: subscription.next_billing_date,
        payment_method: subscription.payment_method,
        status: subscription.status,
        auto_renew: subscription.auto_renew,
        notes: subscription.notes,
        is_shared: subscription.is_shared,
        shared_with_count: subscription.shared_with_count,
        paid_by_company: subscription.paid_by_company,
        icon_emoji: subscription.icon_emoji,
        tags: subscription.tags,
        description: subscription.description,
        subscription_email: subscription.subscription_email,
        phone_number: subscription.phone_number,
        cancellation_url: subscription.cancellation_url,
        cancellation_steps: subscription.cancellation_steps,
        reminder_days: subscription.reminder_days,
        notification_time: subscription.notification_time,
      });

      if (error) throw error;
      
      setDuplicateSuccess(true);
      setTimeout(() => setDuplicateSuccess(false), 2000);
      onUpdate();
    } catch (err) {
      console.error('Failed to duplicate subscription:', err);
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <>
      <div 
        className="group bg-white rounded-2xl shadow-sm border border-slate-200/80 hover:shadow-xl hover:border-slate-300/80 
          transition-all duration-500 overflow-hidden hover:-translate-y-1 animate-fade-in-up"
        style={{ animationDelay: `${index * 50}ms` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated top border */}
        <div className={`h-1.5 bg-gradient-to-r ${getCategoryGradient()} relative overflow-hidden`}>
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent 
            ${isHovered ? 'animate-shimmer' : ''}`} />
        </div>

        <div className="p-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div 
                className={`relative w-12 h-12 sm:w-14 sm:h-14 ${getCategoryColor()} rounded-xl flex items-center justify-center 
                  text-2xl sm:text-3xl shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-500
                  ${subscription.icon_emoji?.startsWith('url:') ? 'cursor-pointer hover:ring-2 hover:ring-cyan-400 hover:ring-offset-2' : ''}`}
                onClick={subscription.icon_emoji?.startsWith('url:') ? handleCopyIcon : undefined}
                title={subscription.icon_emoji?.startsWith('url:') ? 'Klik untuk copy icon URL' : undefined}
              >
                {getIconContent()}
                {/* Copy indicator */}
                {iconCopied && (
                  <div className="absolute inset-0 bg-green-500/90 rounded-xl flex items-center justify-center animate-fade-in">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                )}
                {/* Glow effect */}
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${getCategoryGradient()} opacity-0 
                  group-hover:opacity-20 transition-opacity duration-500 blur-sm`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate group-hover:text-slate-800 transition-colors">
                    {subscription.service_name}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 
                    transition-all duration-300 ${
                    subscription.status === 'active' 
                      ? 'bg-green-100 text-green-700 group-hover:bg-green-200' 
                      : subscription.status === 'trial' 
                      ? 'bg-blue-100 text-blue-700 group-hover:bg-blue-200' 
                      : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                  }`}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </span>
                </div>
                {subscription.description ? (
                  <p className="text-xs sm:text-sm text-slate-600 truncate">{subscription.description}</p>
                ) : subscription.plan_name ? (
                  <p className="text-xs sm:text-sm text-slate-600 truncate">{subscription.plan_name}</p>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-wide">{subscription.category}</p>
                )}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 self-end sm:self-start flex-shrink-0 
              opacity-70 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={() => setShowEdit(true)}
                className="p-2.5 sm:p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg 
                  transition-all duration-200 touch-manipulation hover:scale-110 active:scale-95"
                aria-label="Edit subscription"
              >
                <Edit2 className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => setShowRenew(true)}
                className="p-2.5 sm:p-2 text-slate-500 hover:text-green-600 hover:bg-green-100 rounded-lg 
                  transition-all duration-200 touch-manipulation hover:scale-110 active:scale-95"
                aria-label="Quick renew subscription"
              >
                <Calendar className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={handleDuplicate}
                disabled={duplicating}
                className={`p-2.5 sm:p-2 rounded-lg transition-all duration-200 touch-manipulation hover:scale-110 active:scale-95
                  ${duplicateSuccess 
                    ? 'text-green-600 bg-green-100' 
                    : 'text-slate-500 hover:text-purple-600 hover:bg-purple-100'
                  } ${duplicating ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Duplicate subscription"
                title="Duplikasi"
              >
                {duplicating ? (
                  <div className="w-5 h-5 sm:w-4 sm:h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                ) : duplicateSuccess ? (
                  <Check className="w-5 h-5 sm:w-4 sm:h-4" />
                ) : (
                  <Copy className="w-5 h-5 sm:w-4 sm:h-4" />
                )}
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2.5 sm:p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-lg 
                  transition-all duration-200 touch-manipulation hover:scale-110 active:scale-95"
                aria-label="Delete subscription"
                title="Hapus"
              >
                <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline justify-between mb-4">
            <div className="group-hover:scale-105 transition-transform duration-300 origin-left">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {formatCurrency(subscription.price, subscription.currency)}
              </span>
              <span className="text-xs sm:text-sm text-slate-500 ml-1">
                {subscription.currency}
              </span>
            </div>
            <span className="text-xs sm:text-sm font-medium text-slate-600 capitalize px-3 py-1 bg-slate-100 rounded-full">
              {subscription.billing_cycle}
            </span>
          </div>

          {/* Shared subscription info */}
          {costPerPerson && (
            <div className="flex items-center space-x-2 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 
              text-blue-700 px-3 py-2.5 rounded-xl mb-3 border border-blue-100">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">
                {formatCurrency(costPerPerson, subscription.currency)}/person ({subscription.shared_with_count} users)
              </span>
            </div>
          )}

          {/* Paid by company badge */}
          {subscription.paid_by_company && (
            <div className="flex items-center space-x-2 text-sm bg-gradient-to-r from-green-50 to-emerald-50 
              text-green-700 px-3 py-2.5 rounded-xl mb-3 border border-green-100">
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{t('card.paidByCompany')}</span>
            </div>
          )}

          {/* Billing info */}
          {subscription.next_billing_date && (
            <div className="mb-3 rounded-xl overflow-hidden border border-slate-100">
              <div className={`flex items-center justify-between px-3 py-2.5 ${getBillingColor()} transition-colors duration-300`}>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{t('card.nextBilling')}</span>
                </div>
                <div className="text-sm font-bold">
                  {formatDate(subscription.next_billing_date)}
                  {getDaysUntilBilling() !== null && (
                    <span className="ml-1.5 opacity-80">
                      ({getDaysUntilBilling()}{t('card.days').charAt(0)})
                    </span>
                  )}
                </div>
              </div>
              {subscription.start_date && (
                <div className="bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                    <span>{t('card.cycleProgress')}</span>
                    <span className="font-medium">{Math.round(getBillingProgress())}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        getBillingProgress() >= 90 ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                        getBillingProgress() >= 70 ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
                        'bg-gradient-to-r from-teal-500 to-cyan-500'
                      }`}
                      style={{ width: `${getBillingProgress()}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reminders */}
          {subscription.reminder_days && subscription.reminder_days.length > 0 && (
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-3 px-2">
              <Bell className="w-3.5 h-3.5" />
              <span>
                Reminders: {subscription.reminder_days.map(d => {
                  const opt = REMINDER_OPTIONS.find(o => o.value === d);
                  return opt ? `H-${d}` : null;
                }).filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {/* Footer info */}
          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3 mt-3">
            <span className="flex items-center gap-1.5">
              {t('card.autoRenew')}: 
              <span className={`font-medium ${subscription.auto_renew ? 'text-green-600' : 'text-slate-400'}`}>
                {subscription.auto_renew ? t('card.on') : t('card.off')}
              </span>
            </span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
              {t(`categories.${subscription.category}`)}
            </span>
          </div>

          {/* Tags */}
          {subscription.tags && subscription.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {subscription.tags.map((tag, idx) => (
                <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full 
                  hover:bg-slate-200 transition-colors cursor-default">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Expand button */}
          {hasAdvancedInfo && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-center w-full mt-3 py-2.5 text-sm text-slate-500 
                hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-300"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1.5" />
                  {t('card.hideDetails')}
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1.5" />
                  {t('card.showDetails')}
                </>
              )}
            </button>
          )}

          {/* Expanded details */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
            expanded ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'
          }`}>
            <div className="pt-3 border-t border-slate-100 space-y-3">
              {subscription.subscription_email && (
                <div className="flex items-center space-x-2 text-sm text-slate-600 p-2 bg-slate-50 rounded-lg">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{subscription.subscription_email}</span>
                </div>
              )}

              {subscription.phone_number && (
                <div className="flex items-center space-x-2 text-sm text-slate-600 p-2 bg-slate-50 rounded-lg">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{subscription.phone_number}</span>
                </div>
              )}

              {subscription.cancellation_url && (
                <a
                  href={subscription.cancellation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 
                    p-2 bg-blue-50 rounded-lg transition-colors hover:bg-blue-100"
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  <span>Cancellation link</span>
                </a>
              )}

              {subscription.cancellation_steps && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Cancellation Steps:</p>
                  <p className="text-xs text-slate-600 whitespace-pre-line">{subscription.cancellation_steps}</p>
                </div>
              )}

              {subscription.notes && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-700 mb-1">Notes:</p>
                  <p className="text-xs text-slate-600">{subscription.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center animate-bounce-in">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('modals.delete.title')}</h3>
                <p className="text-sm text-slate-600">{t('modals.delete.subtitle')}</p>
              </div>
            </div>
            <p className="text-slate-700 mb-6">
              {t('modals.delete.confirm')} <strong>{subscription.service_name}</strong>?
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-xl 
                  hover:bg-slate-50 font-semibold transition-all duration-200 hover:border-slate-400 active:scale-98"
              >
                {t('modals.delete.cancel')}
              </button>
              <button
                onClick={() => {
                  onDelete(subscription.id);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 
                  font-semibold transition-all duration-200 shadow-lg shadow-red-500/25 
                  hover:shadow-xl hover:shadow-red-500/30 active:scale-98"
              >
                {t('modals.delete.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      <EditSubscriptionModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        subscription={subscription}
        onSuccess={() => {
          setShowEdit(false);
          onUpdate();
        }}
      />

      <QuickRenewModal
        isOpen={showRenew}
        onClose={() => setShowRenew(false)}
        subscription={subscription}
        onSuccess={() => {
          setShowRenew(false);
          onUpdate();
        }}
      />
    </>
  );
}
