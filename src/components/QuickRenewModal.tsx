import { useState } from 'react';
import { X, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { supabase, Subscription } from '../lib/supabase';
import { usePreferences } from '../contexts/PreferencesContext';

type QuickRenewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription;
  onSuccess: () => void;
};

export default function QuickRenewModal({ isOpen, onClose, subscription, onSuccess }: QuickRenewModalProps) {
  const { t, formatCurrency, formatDate } = usePreferences();
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const renewalPeriods = [
    { months: 1, label: `1 ${t('modals.renew.month')}` },
    { months: 3, label: `3 ${t('modals.renew.months')}` },
    { months: 6, label: `6 ${t('modals.renew.months')}` },
    { months: 12, label: `12 ${t('modals.renew.months')}` },
  ];

  const getMonthlyPrice = () => {
    if (subscription.billing_cycle === 'yearly') {
      return subscription.price / 12;
    }
    return subscription.price;
  };

  const getTotalPrice = () => {
    return getMonthlyPrice() * selectedPeriod;
  };

  const getNewBillingDate = () => {
    const baseDate = subscription.next_billing_date
      ? new Date(subscription.next_billing_date)
      : new Date();

    const newDate = new Date(baseDate);
    newDate.setMonth(newDate.getMonth() + selectedPeriod);
    return newDate;
  };

  const handleRenew = async () => {
    setLoading(true);
    try {
      const newBillingDate = getNewBillingDate();

      const { error } = await supabase
        .from('subscriptions')
        .update({
          next_billing_date: newBillingDate.toISOString().split('T')[0],
          status: 'active',
        })
        .eq('id', subscription.id);

      if (error) throw error;
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error renewing subscription:', error);
      alert('Failed to renew subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-hidden animate-in"
        role="dialog"
        aria-labelledby="renew-modal-title"
      >
        {/* Mobile drag indicator */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
        
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-teal-600" />
            </div>
            <div className="min-w-0">
              <h2 id="renew-modal-title" className="text-base sm:text-lg font-bold text-slate-900">
                {t('modals.renew.title')}
              </h2>
              <p className="text-sm text-slate-500 truncate">{subscription.service_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(90vh-180px)] sm:max-h-none">
          <div className="bg-slate-50 rounded-xl p-3 sm:p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm text-slate-600">{t('modals.renew.currentBilling')}:</span>
              <span className="font-semibold text-slate-900 text-sm sm:text-base">
                {formatDate(subscription.next_billing_date)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-slate-600">{t('modals.renew.monthlyCost')}:</span>
              <span className="font-semibold text-slate-900 text-sm sm:text-base">
                {formatCurrency(getMonthlyPrice(), subscription.currency)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
              {t('modals.renew.selectPeriod')}:
            </label>
            <div className="space-y-2">
              {renewalPeriods.map((period) => (
                <button
                  key={period.months}
                  onClick={() => setSelectedPeriod(period.months)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all touch-manipulation active:scale-[0.98] ${
                    selectedPeriod === period.months
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedPeriod === period.months
                        ? 'border-teal-500 bg-teal-500'
                        : 'border-slate-300'
                    }`}>
                      {selectedPeriod === period.months && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className={`font-medium text-sm sm:text-base ${
                      selectedPeriod === period.months ? 'text-teal-700' : 'text-slate-700'
                    }`}>
                      {period.label}
                    </span>
                  </div>
                  <span className={`font-bold text-sm sm:text-base ${
                    selectedPeriod === period.months ? 'text-teal-700' : 'text-slate-900'
                  }`}>
                    {formatCurrency(getMonthlyPrice() * period.months, subscription.currency)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-teal-50 rounded-xl p-3 sm:p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-teal-700">{t('modals.renew.newBillingDate')}:</span>
              <span className="font-bold text-teal-800 text-sm sm:text-base">
                {formatDate(getNewBillingDate().toISOString())}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-teal-200">
              <span className="text-xs sm:text-sm text-teal-700 flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {t('modals.renew.totalPayment')}:
              </span>
              <span className="text-lg sm:text-xl font-bold text-teal-800">
                {formatCurrency(getTotalPrice(), subscription.currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 bg-white">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold transition-colors touch-manipulation active:scale-[0.98]"
          >
            {t('modals.renew.cancel')}
          </button>
          <button
            onClick={handleRenew}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>{t('modals.renew.renewNow')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes animate-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-in {
          animation: animate-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
