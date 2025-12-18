import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, CURRENCIES } from '../lib/supabase';
import { Language, translations, getNestedTranslation } from '../lib/i18n';
import { useAuth } from './AuthContext';

type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD MMMM YYYY';
type Theme = 'light' | 'dark' | 'system';

type UserPreferences = {
  language: Language;
  defaultCurrency: string;
  dateFormat: DateFormat;
  theme: Theme;
  emailNotifications: boolean;
  displayName: string;
  telegramChatId: string | null;
  telegramNotifications: boolean;
  telegramConnectedAt: string | null;
};

type PreferencesContextType = {
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  connectTelegram: (chatId: string) => Promise<boolean>;
  disconnectTelegram: () => Promise<void>;
  t: (key: string) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  convertCurrency: (amount: number, fromCurrency: string, toCurrency?: string) => number;
  convertAndFormat: (amount: number, fromCurrency: string) => string;
  formatDate: (dateString: string | undefined) => string;
  loading: boolean;
};

// Exchange rates (base: USD) - update these periodically or fetch from API
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  IDR: 16000,    // 1 USD = 16,000 IDR (approximate)
  EUR: 0.92,     // 1 USD = 0.92 EUR
  GBP: 0.79,     // 1 USD = 0.79 GBP
  JPY: 150,      // 1 USD = 150 JPY
  SGD: 1.35,     // 1 USD = 1.35 SGD
  MYR: 4.70,     // 1 USD = 4.70 MYR
  AUD: 1.55,     // 1 USD = 1.55 AUD
  CAD: 1.36,     // 1 USD = 1.36 CAD
  CNY: 7.25,     // 1 USD = 7.25 CNY
  INR: 83,       // 1 USD = 83 INR
  KRW: 1350,     // 1 USD = 1350 KRW
  THB: 36,       // 1 USD = 36 THB
  VND: 24500,    // 1 USD = 24,500 VND
  PHP: 56,       // 1 USD = 56 PHP
};

const defaultPreferences: UserPreferences = {
  language: 'en',
  defaultCurrency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  theme: 'light',
  emailNotifications: true,
  displayName: '',
  telegramChatId: null,
  telegramNotifications: false,
  telegramConnectedAt: null,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      const savedLang = localStorage.getItem('language') as Language;
      const savedCurrency = localStorage.getItem('defaultCurrency');
      setPreferences({
        ...defaultPreferences,
        language: savedLang || 'en',
        defaultCurrency: savedCurrency || 'USD',
      });
      setLoading(false);
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences({
          language: data.language || 'en',
          defaultCurrency: data.default_currency || 'USD',
          dateFormat: data.date_format || 'MM/DD/YYYY',
          theme: data.theme || 'light',
          emailNotifications: data.email_notifications ?? true,
          displayName: data.display_name || user?.email?.split('@')[0] || '',
          telegramChatId: data.telegram_chat_id || null,
          telegramNotifications: data.telegram_notifications ?? false,
          telegramConnectedAt: data.telegram_connected_at || null,
        });
      } else {
        setPreferences({
          ...defaultPreferences,
          displayName: user?.email?.split('@')[0] || '',
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (prefs: Partial<UserPreferences>) => {
    const newPrefs = { ...preferences, ...prefs };
    setPreferences(newPrefs);

    localStorage.setItem('language', newPrefs.language);
    localStorage.setItem('defaultCurrency', newPrefs.defaultCurrency);

    if (user) {
      try {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            language: newPrefs.language,
            default_currency: newPrefs.defaultCurrency,
            date_format: newPrefs.dateFormat,
            theme: newPrefs.theme,
            email_notifications: newPrefs.emailNotifications,
            display_name: newPrefs.displayName,
            telegram_chat_id: newPrefs.telegramChatId,
            telegram_notifications: newPrefs.telegramNotifications,
            telegram_connected_at: newPrefs.telegramConnectedAt,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error saving preferences:', error);
      }
    }
  };

  const connectTelegram = async (chatId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const connectedAt = new Date().toISOString();
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          telegram_chat_id: chatId,
          telegram_notifications: true,
          telegram_connected_at: connectedAt,
          updated_at: connectedAt,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setPreferences(prev => ({
        ...prev,
        telegramChatId: chatId,
        telegramNotifications: true,
        telegramConnectedAt: connectedAt,
      }));

      return true;
    } catch (error) {
      console.error('Error connecting Telegram:', error);
      return false;
    }
  };

  const disconnectTelegram = async (): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({
          telegram_chat_id: null,
          telegram_notifications: false,
          telegram_connected_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences(prev => ({
        ...prev,
        telegramChatId: null,
        telegramNotifications: false,
        telegramConnectedAt: null,
      }));
    } catch (error) {
      console.error('Error disconnecting Telegram:', error);
    }
  };

  const t = (key: string): string => {
    const langTranslations = translations[preferences.language] || translations.en;
    return getNestedTranslation(langTranslations as unknown as Record<string, unknown>, key);
  };

  // Convert amount from one currency to another
  const convertCurrency = (amount: number, fromCurrency: string, toCurrency?: string): number => {
    const targetCurrency = toCurrency || preferences.defaultCurrency;
    
    // If same currency, no conversion needed
    if (fromCurrency === targetCurrency) return amount;
    
    // Get exchange rates (default to 1 if not found)
    const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
    const toRate = EXCHANGE_RATES[targetCurrency] || 1;
    
    // Convert: first to USD, then to target currency
    const amountInUSD = amount / fromRate;
    const convertedAmount = amountInUSD * toRate;
    
    return convertedAmount;
  };

  const formatCurrency = (amount: number, currency?: string): string => {
    const curr = currency || preferences.defaultCurrency;
    const currencyInfo = CURRENCIES.find(c => c.code === curr);
    const symbol = currencyInfo?.symbol || curr;

    const locale = preferences.language === 'id' ? 'id-ID' : 'en-US';

    if (curr === 'IDR' || curr === 'JPY' || curr === 'KRW' || curr === 'VND') {
      return `${symbol}${new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.round(amount))}`;
    }

    return `${symbol}${new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  // Convert amount to default currency and format it
  const convertAndFormat = (amount: number, fromCurrency: string): string => {
    const convertedAmount = convertCurrency(amount, fromCurrency);
    return formatCurrency(convertedAmount, preferences.defaultCurrency);
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    const locale = preferences.language === 'id' ? 'id-ID' : 'en-US';

    switch (preferences.dateFormat) {
      case 'DD/MM/YYYY':
        return date.toLocaleDateString(locale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      case 'YYYY-MM-DD':
        return date.toISOString().split('T')[0];
      case 'DD MMMM YYYY':
        return date.toLocaleDateString(locale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      case 'MM/DD/YYYY':
      default:
        return date.toLocaleDateString(locale, {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric',
        });
    }
  };

  return (
    <PreferencesContext.Provider value={{
      preferences,
      updatePreferences,
      connectTelegram,
      disconnectTelegram,
      t,
      formatCurrency,
      convertCurrency,
      convertAndFormat,
      formatDate,
      loading,
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
