import { useState, useCallback, useMemo, memo } from 'react';
import { X, ChevronDown, ChevronUp, Bell, Mail, Phone, Link2, ListOrdered, Clock, Search, Sparkles, ArrowLeft } from 'lucide-react';
import { supabase, CURRENCIES, CATEGORIES, REMINDER_OPTIONS } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { AmountInput } from './AmountInput';

type AddSubscriptionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const popularServices = [
  { name: 'Netflix', category: 'Entertainment', emoji: '🎬', color: 'bg-red-500' },
  { name: 'Spotify', category: 'Entertainment', emoji: '🎵', color: 'bg-green-500' },
  { name: 'YouTube Premium', category: 'Entertainment', emoji: '📺', color: 'bg-red-600' },
  { name: 'Disney+', category: 'Entertainment', emoji: '🏰', color: 'bg-blue-600' },
  { name: 'HBO Max', category: 'Entertainment', emoji: '🎭', color: 'bg-violet-600' },
  { name: 'Amazon Prime', category: 'Entertainment', emoji: '📦', color: 'bg-orange-500' },
  { name: 'ChatGPT Plus', category: 'Productivity', emoji: '🤖', color: 'bg-teal-500' },
  { name: 'Notion', category: 'Productivity', emoji: '📝', color: 'bg-slate-800' },
  { name: 'Canva Pro', category: 'Productivity', emoji: '🎨', color: 'bg-cyan-500' },
  { name: 'Figma', category: 'Productivity', emoji: '🎯', color: 'bg-orange-400' },
  { name: 'Adobe Creative Cloud', category: 'Productivity', emoji: '🎨', color: 'bg-red-500' },
  { name: 'Google One', category: 'Cloud', emoji: '☁️', color: 'bg-blue-500' },
  { name: 'iCloud+', category: 'Cloud', emoji: '☁️', color: 'bg-slate-400' },
  { name: 'Dropbox', category: 'Cloud', emoji: '📁', color: 'bg-blue-600' },
  { name: 'Xbox Game Pass', category: 'Gaming', emoji: '🎮', color: 'bg-green-600' },
  { name: 'PlayStation Plus', category: 'Gaming', emoji: '🎮', color: 'bg-blue-700' },
  { name: 'Nintendo Switch Online', category: 'Gaming', emoji: '🎮', color: 'bg-red-500' },
  { name: 'Medium', category: 'Reading', emoji: '📰', color: 'bg-slate-900' },
  { name: 'Kindle Unlimited', category: 'Reading', emoji: '📚', color: 'bg-orange-400' },
  { name: 'Peloton', category: 'Fitness', emoji: '🚴', color: 'bg-red-600' },
  { name: 'Strava', category: 'Fitness', emoji: '🏃', color: 'bg-orange-500' },
  { name: 'DomainAsia', category: 'Domain', emoji: '🌐', color: 'bg-blue-600' },
  { name: 'IDWebHost', category: 'Domain', emoji: '🌐', color: 'bg-emerald-600' },
  { name: 'Niagahoster', category: 'Domain', emoji: '🌐', color: 'bg-orange-600' },
  { name: 'Rumahweb', category: 'Domain', emoji: '🌐', color: 'bg-sky-600' },
  { name: 'GoDaddy', category: 'Domain', emoji: '🌐', color: 'bg-green-700' },
  { name: 'Namecheap', category: 'Domain', emoji: '🌐', color: 'bg-orange-500' },
  { name: 'Cloudflare', category: 'Domain', emoji: '🌐', color: 'bg-orange-400' },
  { name: 'Custom', category: 'Other', emoji: '➕', color: 'bg-slate-500' },
];

const categoryTabs = ['All', 'Entertainment', 'Productivity', 'Cloud', 'Gaming', 'Reading', 'Fitness', 'Domain', 'Other'];


const initialFormData = {
  service_name: '',
  category: 'Entertainment',
  plan_name: '',
  price: '',
  currency: 'IDR',
  billing_cycle: 'monthly',
  start_date: new Date().toISOString().split('T')[0],
  next_billing_date: '',
  payment_method: '',
  status: 'active',
  auto_renew: true,
  notes: '',
  is_shared: false,
  shared_with_count: '',
  paid_by_company: false,
  icon_emoji: '',
  tags: '',
  description: '',
  subscription_email: '',
  phone_number: '',
  cancellation_url: '',
  cancellation_steps: '',
  reminder_days: [1, 3, 7] as number[],
  notification_time: '09:00',
};

// Memoized service button component
const ServiceButton = memo(({ service, onClick }: { service: typeof popularServices[0]; onClick: () => void }) => (
  <button onClick={onClick}
    className="group flex flex-col items-center p-2.5 sm:p-3 border border-slate-200 rounded-xl hover:border-teal-400 hover:bg-teal-50/50 transition-all active:scale-95">
    <div className={`w-10 h-10 sm:w-11 sm:h-11 ${service.color} rounded-lg flex items-center justify-center text-xl sm:text-2xl mb-1.5 group-hover:scale-105 transition-transform shadow-sm`}>
      {service.emoji}
    </div>
    <span className="text-[10px] sm:text-xs font-medium text-slate-700 text-center leading-tight line-clamp-2">{service.name}</span>
  </button>
));
ServiceButton.displayName = 'ServiceButton';

export default function AddSubscriptionModal({ isOpen, onClose, onSuccess }: AddSubscriptionModalProps) {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [serviceSearch, setServiceSearch] = useState('');
  const [formData, setFormData] = useState(initialFormData);

  const locale = preferences.language === 'id' ? 'id-ID' : 'en-US';

  const filteredServices = useMemo(() => {
    const search = serviceSearch.toLowerCase();
    return popularServices.filter(s => 
      (categoryFilter === 'All' || s.category === categoryFilter) &&
      s.name.toLowerCase().includes(search)
    );
  }, [categoryFilter, serviceSearch]);

  const getCurrencySymbol = useCallback((code: string) => 
    CURRENCIES.find(c => c.code === code)?.symbol || code, []);

  const handleServiceSelect = useCallback((service: typeof popularServices[0]) => {
    setFormData(prev => ({
      ...prev,
      service_name: service.name === 'Custom' ? '' : service.name,
      category: service.name === 'Custom' ? 'Other' : service.category,
      icon_emoji: service.name === 'Custom' ? '📦' : service.emoji,
    }));
    setStep('form');
  }, []);

  const handleClose = useCallback(() => {
    setStep('select');
    setShowAdvanced(false);
    setCategoryFilter('All');
    setServiceSearch('');
    setFormData(initialFormData);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl min-h-screen sm:min-h-0 sm:rounded-2xl sm:my-4 overflow-hidden shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {step === 'form' && (
              <button onClick={() => setStep('select')} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white truncate flex items-center gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                {step === 'select' ? 'Add Subscription' : formData.service_name || 'New Subscription'}
              </h2>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-4">
          {step === 'select' ? (
            <ServiceSelector
              services={filteredServices}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              serviceSearch={serviceSearch}
              setServiceSearch={setServiceSearch}
              onSelect={handleServiceSelect}
            />
          ) : (
            <SubscriptionForm
              formData={formData}
              setFormData={setFormData}
              showAdvanced={showAdvanced}
              setShowAdvanced={setShowAdvanced}
              loading={loading}
              setLoading={setLoading}
              user={user}
              locale={locale}
              getCurrencySymbol={getCurrencySymbol}
              onSuccess={onSuccess}
              onClose={handleClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}


// Service selector component
const ServiceSelector = memo(({ services, categoryFilter, setCategoryFilter, serviceSearch, setServiceSearch, onSelect }: {
  services: typeof popularServices;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  serviceSearch: string;
  setServiceSearch: (v: string) => void;
  onSelect: (s: typeof popularServices[0]) => void;
}) => (
  <div className="space-y-3">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input type="text" placeholder="Search services..." value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)}
        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
    </div>
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
      {categoryTabs.map((cat) => (
        <button key={cat} onClick={() => setCategoryFilter(cat)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            categoryFilter === cat ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}>{cat}</button>
      ))}
    </div>
    {services.length === 0 ? (
      <div className="text-center py-8">
        <Search className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">No services found</p>
      </div>
    ) : (
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {services.map((service) => (
          <ServiceButton key={service.name} service={service} onClick={() => onSelect(service)} />
        ))}
      </div>
    )}
  </div>
));
ServiceSelector.displayName = 'ServiceSelector';

// Subscription form component
type FormDataType = typeof initialFormData;

const SubscriptionForm = memo(({ formData, setFormData, showAdvanced, setShowAdvanced, loading, setLoading, user, locale, getCurrencySymbol, onSuccess, onClose }: {
  formData: FormDataType;
  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  user: { id: string } | null;
  locale: string;
  getCurrencySymbol: (code: string) => string;
  onSuccess: () => void;
  onClose: () => void;
}) => {
  const updateField = useCallback(<K extends keyof FormDataType>(key: K, value: FormDataType[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, [setFormData]);

  const toggleReminder = useCallback((day: number) => {
    setFormData(prev => ({
      ...prev,
      reminder_days: prev.reminder_days.includes(day)
        ? prev.reminder_days.filter(d => d !== day)
        : [...prev.reminder_days, day].sort((a, b) => a - b)
    }));
  }, [setFormData]);

  const calculateNextBilling = useCallback(() => {
    if (!formData.start_date) return;
    const start = new Date(formData.start_date);
    if (formData.billing_cycle === 'monthly') {
      start.setMonth(start.getMonth() + 1);
    } else if (formData.billing_cycle === 'yearly') {
      start.setFullYear(start.getFullYear() + 1);
    } else return;
    updateField('next_billing_date', start.toISOString().split('T')[0]);
  }, [formData.start_date, formData.billing_cycle, updateField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tags = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const { error } = await supabase.from('subscriptions').insert({
        user_id: user?.id,
        service_name: formData.service_name,
        category: formData.category,
        plan_name: formData.plan_name || null,
        price: parseFloat(formData.price) || 0,
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
        tags,
        description: formData.description || null,
        subscription_email: formData.subscription_email || null,
        phone_number: formData.phone_number || null,
        cancellation_url: formData.cancellation_url || null,
        cancellation_steps: formData.cancellation_steps || null,
        reminder_days: formData.reminder_days,
        notification_time: formData.notification_time,
      });
      if (error) throw error;
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to add subscription');
    } finally {
      setLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Service name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Service Name *</label>
        <div className="flex gap-2">
          <input type="text" value={formData.icon_emoji || '📦'} onChange={(e) => updateField('icon_emoji', e.target.value)}
            className="w-12 py-2.5 border border-slate-200 rounded-xl text-xl text-center" maxLength={2} />
          <input type="text" required value={formData.service_name} onChange={(e) => updateField('service_name', e.target.value)}
            className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="Service name" />
        </div>
      </div>

      {/* Amount and Currency */}
      <div className="grid grid-cols-5 gap-2">
        <div className="col-span-3">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount *</label>
          <AmountInput value={formData.price} onChange={(v) => updateField('price', v)} currencySymbol={getCurrencySymbol(formData.currency)} locale={locale} required />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Currency</label>
          <select value={formData.currency} onChange={(e) => updateField('currency', e.target.value)}
            className="w-full px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-sm">
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
        </div>
      </div>

      {/* Billing cycle */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Billing Cycle *</label>
        <div className="grid grid-cols-3 gap-2">
          {[{ v: 'monthly', l: 'Monthly', i: '🗓️' }, { v: 'yearly', l: 'Yearly', i: '📅' }, { v: 'once', l: 'One-time', i: '🎯' }].map((c) => (
            <button key={c.v} type="button" onClick={() => updateField('billing_cycle', c.v)}
              className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                formData.billing_cycle === c.v ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 hover:border-slate-300'
              }`}>
              <span className="text-base mr-1">{c.i}</span>{c.l}
            </button>
          ))}
        </div>
      </div>

      {/* Category and Start Date */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
          <select value={formData.category} onChange={(e) => updateField('category', e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-sm">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label>
          <input type="date" required value={formData.start_date} onChange={(e) => updateField('start_date', e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm" />
        </div>
      </div>

      {/* Next billing */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Next Billing Date</label>
        <div className="flex gap-2">
          <input type="date" value={formData.next_billing_date} onChange={(e) => updateField('next_billing_date', e.target.value)}
            className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm" />
          <button type="button" onClick={calculateNextBilling} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium transition-colors">Auto</button>
        </div>
      </div>

      {/* Reminders */}
      <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
        <label className="flex items-center text-sm font-medium text-slate-700 mb-2"><Bell className="w-4 h-4 mr-1.5 text-teal-600" />Reminders</label>
        <div className="grid grid-cols-3 gap-1.5">
          {REMINDER_OPTIONS.map((opt) => (
            <button key={opt.value} type="button" onClick={() => toggleReminder(opt.value)}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                formData.reminder_days.includes(opt.value) ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300'
              }`}>
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status and checkboxes */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
          <select value={formData.status} onChange={(e) => updateField('status', e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-sm">
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex flex-col justify-end gap-1">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formData.auto_renew} onChange={(e) => updateField('auto_renew', e.target.checked)} className="w-4 h-4 text-teal-600 rounded" />
            Auto-renew
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formData.is_shared} onChange={(e) => updateField('is_shared', e.target.checked)} className="w-4 h-4 text-teal-600 rounded" />
            Shared
          </label>
        </div>
      </div>

      {formData.is_shared && (
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">People Sharing</label>
          <input type="number" min="2" value={formData.shared_with_count} onChange={(e) => updateField('shared_with_count', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="4" />
        </div>
      )}


      {/* Advanced toggle */}
      <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 py-1">
        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {showAdvanced ? 'Hide' : 'Show'} Advanced
      </button>

      {showAdvanced && (
        <div className="space-y-3 pt-3 border-t border-slate-200">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <input type="text" value={formData.description} onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" placeholder="Premium plan, Family account" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="flex items-center text-sm font-medium text-slate-700 mb-1.5"><Mail className="w-3.5 h-3.5 mr-1" />Email</label>
              <input type="email" value={formData.subscription_email} onChange={(e) => updateField('subscription_email', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="email@example.com" />
            </div>
            <div>
              <label className="flex items-center text-sm font-medium text-slate-700 mb-1.5"><Phone className="w-3.5 h-3.5 mr-1" />Phone</label>
              <input type="tel" value={formData.phone_number} onChange={(e) => updateField('phone_number', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="+62..." />
            </div>
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1.5"><Link2 className="w-3.5 h-3.5 mr-1" />Cancel URL</label>
            <input type="url" value={formData.cancellation_url} onChange={(e) => updateField('cancellation_url', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="https://..." />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1.5"><ListOrdered className="w-3.5 h-3.5 mr-1" />Cancel Steps</label>
            <textarea value={formData.cancellation_steps} onChange={(e) => updateField('cancellation_steps', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none" rows={2} placeholder="1. Go to settings..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tags</label>
            <input type="text" value={formData.tags} onChange={(e) => updateField('tags', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="work, essential" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea value={formData.notes} onChange={(e) => updateField('notes', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none" rows={2} placeholder="Notes..." />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1.5"><Clock className="w-3.5 h-3.5 mr-1" />Notification Time</label>
            <input type="time" value={formData.notification_time} onChange={(e) => updateField('notification_time', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm p-2 border border-slate-200 rounded-lg">
            <input type="checkbox" checked={formData.paid_by_company} onChange={(e) => updateField('paid_by_company', e.target.checked)} className="w-4 h-4 text-teal-600 rounded" />
            Paid by company
          </label>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-2 pt-3 border-t border-slate-200">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>
    </form>
  );
});
SubscriptionForm.displayName = 'SubscriptionForm';
