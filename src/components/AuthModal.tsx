import { useState, useRef } from 'react';
import { X, Mail, Lock, ArrowRight, Sparkles, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';

// Cloudflare Turnstile Site Key
// Untuk localhost testing: 0x4AAAAAACF8Q9z0AJs8m5ir
// Untuk production: 0x4AAAAAACF8N9xkU--OBYBc
// Test key (always passes): 1x00000000000000000000AA
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

// Debug: log site key saat development
if (import.meta.env.DEV) {
  console.log('Turnstile Site Key:', TURNSTILE_SITE_KEY);
}

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
  onToggleMode: () => void;
};

export default function AuthModal({ isOpen, onClose, mode, onToggleMode }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaStatus, setCaptchaStatus] = useState<'idle' | 'solving' | 'solved' | 'error'>('idle');
  const turnstileRef = useRef<TurnstileInstance>(null);
  const { signIn, signUp } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validasi CAPTCHA
    if (!captchaToken) {
      setError('Silakan selesaikan verifikasi CAPTCHA');
      return;
    }

    setLoading(true);

    try {
      const { error } = mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        setError(error.message);
        // Reset CAPTCHA on error
        turnstileRef.current?.reset();
        setCaptchaToken(null);
        setCaptchaStatus('idle');
      } else {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaSuccess = (token: string) => {
    setCaptchaToken(token);
    setCaptchaStatus('solved');
  };

  const handleCaptchaError = (error?: string | Error) => {
    console.error('Turnstile CAPTCHA Error:', error);
    setCaptchaToken(null);
    setCaptchaStatus('error');
    
    // Provide more helpful error messages
    let errorMessage = 'Verifikasi CAPTCHA gagal. ';
    if (typeof error === 'string' && error.includes('400020')) {
      errorMessage += 'Domain tidak valid. Pastikan localhost sudah ditambahkan di Cloudflare Turnstile dashboard.';
    } else {
      errorMessage += 'Silakan refresh halaman dan coba lagi.';
    }
    setError(errorMessage);
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
    setCaptchaStatus('idle');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in max-h-[95vh] overflow-y-auto">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-500 px-6 sm:px-8 py-6 sm:py-8 animate-gradient">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-all p-2 hover:bg-white/10 rounded-full hover:rotate-90 duration-300"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {mode === 'signin' ? 'Selamat Datang' : 'Mulai Sekarang'}
              </h2>
              <p className="text-white/80 text-xs sm:text-sm">
                {mode === 'signin' ? 'Masuk ke akun Anda' : 'Buat akun gratis Anda'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 sm:py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all hover:border-slate-300 text-sm sm:text-base"
                  placeholder="email@contoh.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-12 py-3 sm:py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all hover:border-slate-300 text-sm sm:text-base"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {mode === 'signup' && (
                <p className="text-xs text-slate-500">Minimal 6 karakter</p>
              )}
            </div>

            {/* Cloudflare Turnstile CAPTCHA */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Shield className="w-4 h-4 text-teal-500" />
                <span>Verifikasi Keamanan</span>
                {captchaStatus === 'solved' && (
                  <span className="text-xs text-green-600 font-normal">✓ Terverifikasi</span>
                )}
              </div>
              <div className="flex justify-center bg-slate-50 rounded-xl p-3 border border-slate-200">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={handleCaptchaSuccess}
                  onError={handleCaptchaError}
                  onExpire={handleCaptchaExpire}
                  options={{
                    theme: 'light',
                    size: 'normal',
                  }}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-fade-in-up flex items-start gap-2">
                <span className="text-red-500 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !captchaToken}
              className="group w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 sm:py-4 rounded-xl font-semibold hover:from-teal-600 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Mohon tunggu...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Masuk' : 'Buat Akun'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600 text-sm">
              {mode === 'signin' ? 'Belum punya akun?' : 'Sudah punya akun?'}
            </p>
            <button
              onClick={onToggleMode}
              className="mt-1 text-teal-600 hover:text-teal-700 font-semibold transition-colors hover:underline"
            >
              {mode === 'signin' ? 'Daftar gratis' : 'Masuk di sini'}
            </button>
          </div>

          {/* Security note */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              Dilindungi oleh Cloudflare Turnstile
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
