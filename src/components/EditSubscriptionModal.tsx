import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Calendar, Bell, Mail, Phone, Link2, ListOrdered, Clock, AlertTriangle } from 'lucide-react';
import { supabase, Subscription, CURRENCIES, CATEGORIES, REMINDER_OPTIONS } from '../lib/supabase';
import { usePreferences } from '../contexts/PreferencesContext';
import { getServiceIcon, SERVICE_ICONS } from '../lib/serviceIcons';

type EditSubscriptionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription;
  onSuccess: () => void;
};

export default function EditSubscriptionModal({ isOpen, onClose, subscription, onSuccess }: EditSubscriptionModalProps) {
  const { t } = usePreferences();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCancelFlow, setShowCancelFlow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    service_name: subscription.service_name,
    category: subscription.category,
    plan_name: subscription.plan_name || '',
    price: subscription.price.toString(),
    displayPrice: formatNumberWithSeparator(subscription.price.toString()),
    currency: subscription.currency,
    billing_cycle: subscription.billing_cycle,
    start_date: subscription.start_date,
    next_billing_date: subscription.next_billing_date || '',
    payment_method: subscription.payment_method || '',
    status: subscription.status,
    auto_renew: subscription.auto_renew,
    notes: subscription.notes || '',
    is_shared: subscription.is_shared,
    shared_with_count: subscription.shared_with_count?.toString() || '',
    paid_by_company: subscription.paid_by_company,
    icon_emoji: subscription.icon_emoji || '',
    tags: subscription.tags?.join(', ') || '',
    description: subscription.description || '',
    subscription_email: subscription.subscription_email || '',
    phone_number: subscription.phone_number || '',
    cancellation_url: subscription.cancellation_url || '',
    cancellation_steps: subscription.cancellation_steps || '',
    reminder_days: subscription.reminder_days || [1, 3, 7],
    notification_time: subscription.notification_time || '09:00',
  });

  const serviceIcon = getServiceIcon(formData.service_name);

  useEffect(() => {
    setFormData({
      service_name: subscription.service_name,
      category: subscription.category,
      plan_name: subscription.plan_name || '',
      price: subscription.price.toString(),
      displayPrice: formatNumberWithSeparator(subscription.price.toString()),
      currency: subscription.currency,
      billing_cycle: subscription.billing_cycle,
      start_date: subscription.start_date,
      next_billing_date: subscription.next_billing_date || '',
      payment_method: subscription.payment_method || '',
      status: subscription.status,
      auto_renew: subscription.auto_renew,
      notes: subscription.notes || '',
      is_shared: subscription.is_shared,
      shared_with_count: subscription.shared_with_count?.toString() || '',
      paid_by_company: subscription.paid_by_company,
      icon_emoji: subscription.icon_emoji || '',
      tags: subscription.tags?.join(', ') || '',
      description: subscription.description || '',
      subscription_email: subscription.subscription_email || '',
      phone_number: subscription.phone_number || '',
      cancellation_url: subscription.cancellation_url || '',
      cancellation_steps: subscription.cancellation_steps || '',
      reminder_days: subscription.reminder_days || [1, 3, 7],
      notification_time: subscription.notification_time || '09:00',
    });
  }, [subscription]);

  if (!isOpen) return null;

  function formatNumberWithSeparator(value: string): string {
    const numericValue = value.replace(/[^\d.]/g, '');
    const parts = numericValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  function parseFormattedNumber(value: string): string {
    return value.replace(/,/g, '');
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d.,]/g, '');
    const numericValue = parseFormattedNumber(rawValue);
    const displayValue = formatNumberWithSeparator(numericValue);

    setFormData({
      ...formData,
      price: numericValue,
      displayPrice: displayValue,
    });
  };

  const toggleReminder = (day: number) => {
    const current = formData.reminder_days;
    if (current.includes(day)) {
      setFormData({ ...formData, reminder_days: current.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, reminder_days: [...current, day].sort((a, b) => a - b) });
    }
  };

  const calculateNextBilling = () => {
    if (!formData.start_date) return;
    const start = new Date(formData.start_date);
    let next: Date;
    if (formData.billing_cycle === 'monthly') {
      next = new Date(start);
      next.setMonth(next.getMonth() + 1);
    } else if (formData.billing_cycle === 'yearly') {
      next = new Date(start);
      next.setFullYear(next.getFullYear() + 1);
    } else {
      return;
    }
    setFormData({ ...formData, next_billing_date: next.toISOString().split('T')[0] });
  };

  const getDaysUntilBilling = () => {
    if (!formData.next_billing_date) return null;
    const days = Math.ceil(
      (new Date(formData.next_billing_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const getBillingProgress = () => {
    if (!formData.start_date || !formData.next_billing_date) return 0;
    const start = new Date(formData.start_date).getTime();
    const end = new Date(formData.next_billing_date).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tags = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

      const { error } = await supabase
        .from('subscriptions')
        .update({
          service_name: formData.service_name,
          category: formData.category,
          plan_name: formData.plan_name || null,
          price: parseFloat(formData.price),
          currency: formData.currency,
          billing_cycle: formData.billing_cycle,
          start_date: formData.start_date,
          next_billing_date: formData.next_billing_date || null,
          payment_method: formData.payment_method || null,
          status: formData.status,
          auto_renew: formData.auto_renew,
          notes: formData.notes || null,
          is_shared: formData.is_shared,
          shared_with_count: formData.shared_with_count ? parseInt(formData.shared_with_count) : null,
          paid_by_company: formData.paid_by_company,
          icon_emoji: formData.icon_emoji || null,
          tags: tags,
          description: formData.description || null,
          subscription_email: formData.subscription_email || null,
          phone_number: formData.phone_number || null,
          cancellation_url: formData.cancellation_url || null,
          cancellation_steps: formData.cancellation_steps || null,
          reminder_days: formData.reminder_days,
          notification_time: formData.notification_time,
        })
        .eq('id', subscription.id);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          auto_renew: false,
        })
        .eq('id', subscription.id);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find(c => c.code === code)?.symbol || code;
  };

  const daysUntil = getDaysUntilBilling();
  const progress = getBillingProgress();

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-start justify-center z-50 p-0 sm:p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl sm:my-8 max-h-[95vh] sm:max-h-none overflow-hidden flex flex-col">
        {/* Mobile drag indicator */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 bg-slate-100">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
        
        <div className={`px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between flex-shrink-0 ${serviceIcon ? serviceIcon.bgColor : 'bg-gradient-to-r from-teal-600 to-teal-700'}`}>
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
              {serviceIcon ? (
                <span className="text-white text-lg sm:text-2xl font-bold">{serviceIcon.icon}</span>
              ) : (
                <span className="text-2xl sm:text-3xl">{formData.icon_emoji || '📦'}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-xl font-bold text-white truncate">
                {t('modals.add.title').replace('Add New', 'Edit')} {subscription.service_name}
              </h2>
              <p className="text-white/80 text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">
                {formData.description || t('app.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formData.next_billing_date && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-slate-600">{t('card.nextBilling')}</span>
              <span className={`text-xs sm:text-sm font-bold ${
                daysUntil !== null && daysUntil <= 7 ? 'text-orange-600' : 'text-slate-900'
              }`}>
                {daysUntil !== null && `${daysUntil} ${t('card.days')}`}
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  progress > 80 ? 'bg-orange-500' : progress > 50 ? 'bg-yellow-500' : 'bg-teal-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>{formData.start_date}</span>
              <span>{formData.next_billing_date}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                {t('modals.add.serviceName')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl sm:text-2xl">
                  {serviceIcon ? (
                    <span className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${serviceIcon.bgColor} text-white text-xs sm:text-sm font-bold`}>
                      {serviceIcon.icon}
                    </span>
                  ) : (
                    formData.icon_emoji || '📦'
                  )}
                </span>
                <input
                  type="text"
                  required
                  value={formData.service_name}
                  onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                  className="w-full pl-12 sm:pl-14 pr-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-base sm:text-lg"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                {SERVICE_ICONS.slice(0, 8).map((service) => (
                  <button
                    key={service.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, service_name: service.name })}
                    className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium transition-all touch-manipulation ${
                      formData.service_name.toLowerCase().includes(service.keywords[0])
                        ? `${service.bgColor} text-white`
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4 rounded text-[8px] sm:text-[10px] font-bold ${
                      formData.service_name.toLowerCase().includes(service.keywords[0])
                        ? 'bg-white/30'
                        : service.bgColor + ' text-white'
                    }`}>
                      {service.icon}
                    </span>
                    {service.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                {t('modals.add.price')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm sm:text-base">
                  {getCurrencySymbol(formData.currency)}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={formData.displayPrice}
                  onChange={handlePriceChange}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-base sm:text-lg font-semibold"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                {t('modals.add.currency')}
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all appearance-none bg-white cursor-pointer text-sm sm:text-base"
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                {t('modals.add.billingCycle')} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'monthly', label: t('cycle.monthly'), icon: '🗓️' },
                  { value: 'yearly', label: t('cycle.yearly'), icon: '📅' },
                  { value: 'once', label: t('cycle.once'), icon: '🎯' },
                ].map((cycle) => (
                  <button
                    key={cycle.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, billing_cycle: cycle.value as 'monthly' | 'yearly' | 'once' })}
                    className={`py-2.5 sm:py-3 px-2 rounded-xl border-2 text-xs sm:text-sm font-medium transition-all touch-manipulation ${
                      formData.billing_cycle === cycle.value
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-base sm:text-lg mb-0.5 sm:mb-1">{cycle.icon}</span>
                    {cycle.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                {t('modals.add.category')}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Subscription['category'] })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all appearance-none bg-white cursor-pointer text-sm sm:text-base"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                {t('modals.add.startDate')}
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="flex items-center text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                {t('modals.add.nextBillingDate')}
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={formData.next_billing_date}
                  onChange={(e) => setFormData({ ...formData, next_billing_date: e.target.value })}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={calculateNextBilling}
                  className="px-2.5 sm:px-3 py-2 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors touch-manipulation"
                  title="Auto-calculate from start date"
                >
                  Auto
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                {t('modals.add.notes')}
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm sm:text-base"
                placeholder="e.g., Premium plan, Family account"
              />
            </div>
          </div>

          <div className="border-2 border-slate-200 rounded-xl p-3 sm:p-4">
            <label className="flex items-center text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Reminder Schedule
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
              {REMINDER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleReminder(option.value)}
                  className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all touch-manipulation ${
                    formData.reminder_days.includes(option.value)
                      ? 'bg-teal-100 text-teal-700 border-2 border-teal-300'
                      : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100'
                  }`}
                >
                  <span className="mr-1 sm:mr-2 text-sm sm:text-base">{option.emoji}</span>
                  <span className="truncate">{option.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-2">
              Selected: {formData.reminder_days.length} reminder{formData.reminder_days.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <label className="flex items-center text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                Notification Time
              </label>
              <input
                type="time"
                value={formData.notification_time}
                onChange={(e) => setFormData({ ...formData, notification_time: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm sm:text-base"
              />
            </div>
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                {t('modals.add.status')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Subscription['status'] })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm sm:text-base"
              >
                <option value="active">{t('status.active')}</option>
                <option value="trial">{t('status.trial')}</option>
                <option value="cancelled">{t('status.cancelled')}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-4">
            <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer touch-manipulation">
              <input
                type="checkbox"
                checked={formData.auto_renew}
                onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 border-2 border-slate-300 rounded focus:ring-teal-500"
              />
              <span className="text-xs sm:text-sm font-medium text-slate-700">{t('card.autoRenew')}</span>
            </label>

            <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer touch-manipulation">
              <input
                type="checkbox"
                checked={formData.is_shared}
                onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 border-2 border-slate-300 rounded focus:ring-teal-500"
              />
              <span className="text-xs sm:text-sm font-medium text-slate-700">Shared</span>
            </label>

            <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer touch-manipulation">
              <input
                type="checkbox"
                checked={formData.paid_by_company}
                onChange={(e) => setFormData({ ...formData, paid_by_company: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 border-2 border-slate-300 rounded focus:ring-teal-500"
              />
              <span className="text-xs sm:text-sm font-medium text-slate-700">{t('card.paidByCompany')}</span>
            </label>
          </div>

          {formData.is_shared && (
            <div className="bg-teal-50 rounded-xl p-3 sm:p-4">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                Number of People Sharing
              </label>
              <input
                type="number"
                min="2"
                value={formData.shared_with_count}
                onChange={(e) => setFormData({ ...formData, shared_with_count: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all bg-white text-sm sm:text-base"
                placeholder="4"
              />
              {formData.shared_with_count && formData.price && (
                <p className="text-xs sm:text-sm text-teal-700 mt-2">
                  Cost per person: {getCurrencySymbol(formData.currency)}
                  {formatNumberWithSeparator((parseFloat(formData.price) / parseInt(formData.shared_with_count)).toFixed(2))}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors touch-manipulation"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="flex items-center text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                    Subscription Email
                  </label>
                  <input
                    type="email"
                    value={formData.subscription_email}
                    onChange={(e) => setFormData({ ...formData, subscription_email: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm sm:text-base"
                    placeholder="account@email.com"
                  />
                </div>

                <div>
                  <label className="flex items-center text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm sm:text-base"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    Payment Method
                  </label>
                  <input
                    type="text"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm sm:text-base"
                    placeholder="Credit Card, PayPal, GoPay"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm sm:text-base"
                    placeholder="work, family, entertainment"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                    Cancellation URL
                  </label>
                  <input
                    type="url"
                    value={formData.cancellation_url}
                    onChange={(e) => setFormData({ ...formData, cancellation_url: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm sm:text-base"
                    placeholder="https://service.com/cancel"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    <ListOrdered className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                    Cancellation Steps
                  </label>
                  <textarea
                    value={formData.cancellation_steps}
                    onChange={(e) => setFormData({ ...formData, cancellation_steps: e.target.value })}
                    rows={2}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm sm:text-base"
                    placeholder="1. Go to Account Settings&#10;2. Click Cancel Subscription&#10;3. Confirm cancellation"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm sm:text-base"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>
          )}

          {formData.status !== 'cancelled' && (
            <div className="pt-3 sm:pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowCancelFlow(!showCancelFlow)}
                className="flex items-center gap-2 text-xs sm:text-sm font-medium text-red-600 hover:text-red-700 transition-colors touch-manipulation"
              >
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {showCancelFlow ? 'Hide cancellation options' : 'Cancel this subscription'}
              </button>

              {showCancelFlow && (
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 rounded-xl border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2 text-sm sm:text-base">Cancel Subscription</h4>
                  <p className="text-xs sm:text-sm text-red-700 mb-3 sm:mb-4">
                    Are you sure you want to cancel {subscription.service_name}? This will mark it as cancelled and disable auto-renewal.
                  </p>
                  {formData.cancellation_url && (
                    <a
                      href={formData.cancellation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs sm:text-sm text-red-700 hover:text-red-800 underline mb-3 sm:mb-4"
                    >
                      <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Go to official cancellation page
                    </a>
                  )}
                  {formData.cancellation_steps && (
                    <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-white rounded-lg text-xs sm:text-sm text-slate-700">
                      <p className="font-medium mb-1">Cancellation steps:</p>
                      <p className="whitespace-pre-line">{formData.cancellation_steps}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-xs sm:text-sm transition-colors disabled:opacity-50 touch-manipulation"
                  >
                    {loading ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-200 sticky bottom-0 bg-white pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold transition-colors touch-manipulation active:scale-[0.98] text-sm sm:text-base"
            >
              {t('modals.add.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-semibold transition-colors disabled:bg-teal-400 disabled:cursor-not-allowed shadow-lg shadow-teal-600/30 touch-manipulation active:scale-[0.98] text-sm sm:text-base"
            >
              {loading ? 'Saving...' : t('modals.add.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
