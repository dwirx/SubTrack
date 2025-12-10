import { useState } from 'react';
import {
  Edit2, Check, X, Trash2, Clock, Bell, Users, Building2,
  ChevronDown, ChevronUp, ExternalLink, RefreshCw, Calendar
} from 'lucide-react';
import { supabase, Subscription, CURRENCIES, CATEGORIES } from '../lib/supabase';
import QuickRenewModal from './QuickRenewModal';

type SerpentineSubscriptionListProps = {
  subscriptions: Subscription[];
  onDelete: (id: string) => void;
  onUpdate: () => void;
};

export default function SerpentineSubscriptionList({
  subscriptions,
  onDelete,
  onUpdate
}: SerpentineSubscriptionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Subscription>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [renewingSub, setRenewingSub] = useState<Subscription | null>(null);
  const [saving, setSaving] = useState(false);

  const startEditing = (sub: Subscription) => {
    setEditingId(sub.id);
    setEditData({
      service_name: sub.service_name,
      price: sub.price,
      currency: sub.currency,
      billing_cycle: sub.billing_cycle,
      next_billing_date: sub.next_billing_date,
      status: sub.status,
      auto_renew: sub.auto_renew,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEditing = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update(editData)
        .eq('id', id);

      if (error) throw error;
      onUpdate();
      setEditingId(null);
      setEditData({});
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      Entertainment: { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-600' },
      Productivity: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-600' },
      Cloud: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-600' },
      Gaming: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-600' },
      Reading: { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-600' },
      Fitness: { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-600' },
      Other: { bg: 'bg-slate-50', border: 'border-slate-400', text: 'text-slate-600' },
    };
    return colors[category] || colors.Other;
  };

  const renderIcon = (category: string, iconEmoji?: string) => {
    // Handle URL-based icons
    if (iconEmoji?.startsWith('url:')) {
      const url = iconEmoji.replace('url:', '');
      return (
        <img 
          src={url} 
          alt="icon" 
          className="w-10 h-10 object-contain rounded-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }
    
    // Handle emoji icons
    if (iconEmoji) {
      return <span className="text-4xl">{iconEmoji}</span>;
    }
    
    // Default category emoji
    const cat = CATEGORIES.find(c => c.value === category);
    return <span className="text-4xl">{cat?.emoji || '📦'}</span>;
  };

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find(c => c.code === code)?.symbol || code;
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = getCurrencySymbol(currency);
    if (currency === 'IDR') {
      return `${symbol}${new Intl.NumberFormat('id-ID').format(amount)}`;
    }
    return `${symbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysUntilBilling = (nextDate?: string) => {
    if (!nextDate) return null;
    const days = Math.ceil(
      (new Date(nextDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const getBillingUrgency = (nextDate?: string) => {
    const days = getDaysUntilBilling(nextDate);
    if (days === null) return 'normal';
    if (days <= 1) return 'critical';
    if (days <= 7) return 'warning';
    return 'normal';
  };

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 text-lg">No subscriptions to display</p>
      </div>
    );
  }

  return (
    <div className="relative py-8">
      <div
        className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-blue-400 to-blue-200 -translate-x-1/2 hidden md:block"
        aria-hidden="true"
      />

      <div className="space-y-8 md:space-y-12">
        {subscriptions.map((sub, index) => {
          const isLeft = index % 2 === 0;
          const isEditing = editingId === sub.id;
          const isExpanded = expandedId === sub.id;
          const colors = getCategoryColor(sub.category);
          const urgency = getBillingUrgency(sub.next_billing_date);
          const daysLeft = getDaysUntilBilling(sub.next_billing_date);

          return (
            <div
              key={sub.id}
              className={`relative flex flex-col md:flex-row items-center ${
                isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
              }`}
              role="article"
              aria-label={`Subscription: ${sub.service_name}`}
            >
              <div
                className="absolute left-1/2 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-lg -translate-x-1/2 hidden md:block z-10"
                aria-hidden="true"
              />

              <div className={`w-full md:w-5/12 ${isLeft ? 'md:pr-8' : 'md:pl-8'}`}>
                <div
                  className={`
                    relative overflow-hidden rounded-2xl border-2 transition-all duration-300
                    ${colors.bg} ${colors.border}
                    ${isEditing ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:shadow-xl hover:-translate-y-1'}
                  `}
                >
                  <div
                    className={`absolute top-0 ${isLeft ? 'right-0' : 'left-0'} w-2 h-full ${
                      urgency === 'critical' ? 'bg-red-500' :
                      urgency === 'warning' ? 'bg-orange-500' :
                      'bg-green-500'
                    }`}
                    aria-hidden="true"
                  />

                  <div className="p-5 md:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/50 flex-shrink-0"
                          role="img"
                          aria-label={sub.category}
                        >
                          {renderIcon(sub.category, sub.icon_emoji)}
                        </div>
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData.service_name || ''}
                              onChange={(e) => setEditData({ ...editData, service_name: e.target.value })}
                              className="text-lg font-bold text-slate-900 bg-white border-2 border-slate-300 rounded-lg px-3 py-1 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              aria-label="Service name"
                            />
                          ) : (
                            <h3 className="text-lg font-bold text-slate-900 truncate">
                              {sub.service_name}
                            </h3>
                          )}
                          <p className={`text-sm font-medium ${colors.text}`}>
                            {sub.category}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEditing(sub.id)}
                              disabled={saving}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors touch-manipulation"
                              aria-label="Save changes"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors touch-manipulation"
                              aria-label="Cancel editing"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(sub)}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors touch-manipulation"
                              aria-label="Edit subscription"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setRenewingSub(sub)}
                              className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors touch-manipulation"
                              aria-label="Quick renew subscription"
                            >
                              <Calendar className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => onDelete(sub.id)}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors touch-manipulation"
                              aria-label="Delete subscription"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Amount</p>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={editData.currency || 'USD'}
                                onChange={(e) => setEditData({ ...editData, currency: e.target.value })}
                                className="bg-white border-2 border-slate-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                                aria-label="Currency"
                              >
                                {CURRENCIES.map(c => (
                                  <option key={c.code} value={c.code}>{c.symbol}</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                step="0.01"
                                value={editData.price || 0}
                                onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
                                className="w-24 bg-white border-2 border-slate-300 rounded-lg px-3 py-1 text-lg font-bold focus:ring-2 focus:ring-blue-500"
                                aria-label="Price"
                              />
                            </div>
                          ) : (
                            <p className="text-2xl font-bold text-slate-900">
                              {formatCurrency(sub.price, sub.currency)}
                              <span className="text-sm font-normal text-slate-500 ml-1">
                                {sub.currency}
                              </span>
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Billing</p>
                          {isEditing ? (
                            <select
                              value={editData.billing_cycle || 'monthly'}
                              onChange={(e) => setEditData({ ...editData, billing_cycle: e.target.value as 'monthly' | 'yearly' | 'once' })}
                              className="bg-white border-2 border-slate-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                              aria-label="Billing cycle"
                            >
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                              <option value="once">One-time</option>
                            </select>
                          ) : (
                            <p className="font-semibold text-slate-700 capitalize">
                              {sub.billing_cycle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className={`
                        flex items-center justify-between px-3 py-2 rounded-xl
                        ${urgency === 'critical' ? 'bg-red-100 text-red-700' :
                          urgency === 'warning' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'}
                      `}>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {daysLeft !== null ? (
                              daysLeft <= 0 ? 'Due today!' : `Renews in ${daysLeft} days`
                            ) : 'No billing date'}
                          </span>
                        </div>
                        {sub.reminder_days && sub.reminder_days.length > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <Bell className="w-3 h-3" />
                            <span>at {sub.notification_time || '09:00'}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Next billing</span>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editData.next_billing_date || ''}
                            onChange={(e) => setEditData({ ...editData, next_billing_date: e.target.value })}
                            className="bg-white border-2 border-slate-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                            aria-label="Next billing date"
                          />
                        ) : (
                          <span className="font-semibold text-slate-700">
                            {formatDate(sub.next_billing_date)}
                          </span>
                        )}
                      </div>

                      {(sub.is_shared || sub.paid_by_company) && (
                        <div className="flex flex-wrap gap-2">
                          {sub.is_shared && sub.shared_with_count && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              <Users className="w-3 h-3" />
                              {sub.shared_with_count} users
                            </span>
                          )}
                          {sub.paid_by_company && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              <Building2 className="w-3 h-3" />
                              Company paid
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <select
                              value={editData.status || 'active'}
                              onChange={(e) => setEditData({ ...editData, status: e.target.value as 'active' | 'trial' | 'cancelled' })}
                              className="bg-white border-2 border-slate-300 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500"
                              aria-label="Status"
                            >
                              <option value="active">Active</option>
                              <option value="trial">Trial</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          ) : (
                            <span className={`
                              px-2 py-1 rounded-full text-xs font-semibold
                              ${sub.status === 'active' ? 'bg-green-100 text-green-700' :
                                sub.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-700'}
                            `}>
                              {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                            </span>
                          )}

                          {isEditing ? (
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editData.auto_renew ?? true}
                                onChange={(e) => setEditData({ ...editData, auto_renew: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-xs text-slate-600">Auto-renew</span>
                            </label>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <RefreshCw className={`w-3 h-3 ${sub.auto_renew ? 'text-green-500' : 'text-slate-400'}`} />
                              {sub.auto_renew ? 'Auto' : 'Manual'}
                            </span>
                          )}
                        </div>

                        {(sub.description || sub.cancellation_url || sub.notes) && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors touch-manipulation"
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? 'Hide details' : 'Show details'}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                More
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {isExpanded && (
                        <div
                          className="pt-3 space-y-3 animate-in slide-in-from-top-2 duration-200"
                          role="region"
                          aria-label="Additional details"
                        >
                          {sub.description && (
                            <p className="text-sm text-slate-600">{sub.description}</p>
                          )}
                          {sub.cancellation_url && (
                            <a
                              href={sub.cancellation_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Manage subscription
                            </a>
                          )}
                          {sub.notes && (
                            <div className="bg-white/50 rounded-lg p-3">
                              <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
                              <p className="text-sm text-slate-700">{sub.notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden md:block w-2/12" aria-hidden="true" />
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slide-in-from-top-2 {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation: slide-in-from-top-2 0.2s ease-out;
        }
      `}</style>

      {renewingSub && (
        <QuickRenewModal
          isOpen={!!renewingSub}
          onClose={() => setRenewingSub(null)}
          subscription={renewingSub}
          onSuccess={() => {
            setRenewingSub(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
}
