import { useState, useMemo, useEffect } from 'react';
import { X, Search, Smile, Image, Sparkles, Clock, Trash2, Copy, Check } from 'lucide-react';

type IconPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (icon: string, type: 'emoji' | 'url') => void;
  currentIcon?: string;
};

const ICON_HISTORY_KEY = 'subscription-tracker-icon-history';
const MAX_HISTORY_ITEMS = 20;

// Popular emojis for subscriptions
const EMOJI_CATEGORIES = {
  'Popular': ['🎬', '🎵', '📺', '🎮', '☁️', '📝', '🤖', '🎨', '📦', '🌐', '💳', '📱', '💻', '🏠', '🚗'],
  'Entertainment': ['🎬', '🎵', '🎧', '📺', '🎭', '🎪', '🎤', '🎸', '🎹', '🎺', '🎻', '🥁', '📻', '📽️', '🎞️'],
  'Gaming': ['🎮', '🕹️', '👾', '🎯', '🎲', '♟️', '🃏', '🎰', '🏆', '🥇', '🏅', '⚔️', '🛡️', '🗡️', '🔫'],
  'Productivity': ['📝', '📋', '📊', '📈', '📉', '💼', '🗂️', '📁', '📂', '🗃️', '📌', '📍', '✏️', '🖊️', '🖋️'],
  'Cloud & Tech': ['☁️', '💾', '💿', '📀', '🖥️', '💻', '⌨️', '🖱️', '🖨️', '📱', '📲', '🔌', '🔋', '💡', '🔧'],
  'AI & Bots': ['🤖', '🧠', '💬', '🗣️', '👁️', '🔮', '✨', '⚡', '🌟', '💫', '🎇', '🎆', '🌈', '🔥', '💥'],
  'Design': ['🎨', '🖼️', '🖌️', '✒️', '📐', '📏', '🎭', '🎪', '🌈', '🎀', '💎', '👑', '🏵️', '🌸', '🌺'],
  'Reading': ['📚', '📖', '📰', '📄', '📃', '📜', '📑', '🔖', '📕', '📗', '📘', '📙', '📓', '📔', '📒'],
  'Fitness': ['🏃', '🚴', '🏋️', '🧘', '🤸', '⛹️', '🏊', '🚣', '🧗', '🏄', '🎿', '⛷️', '🏂', '🤾', '🏌️'],
  'Domain & Web': ['🌐', '🔗', '🌍', '🌎', '🌏', '🛜', '📡', '🔒', '🔓', '🔐', '🛡️', '⚙️', '🔧', '🔨', '🛠️'],
  'Finance': ['💰', '💵', '💴', '💶', '💷', '💳', '🏦', '💹', '📊', '📈', '💎', '🪙', '💲', '🤑', '💸'],
  'Food & Delivery': ['🍕', '🍔', '🍟', '🌮', '🍜', '🍣', '🍱', '🥡', '☕', '🧋', '🍺', '🍷', '🛒', '🛵', '📦'],
  'Travel': ['✈️', '🚗', '🚕', '🚌', '🚂', '🚢', '🏨', '🗺️', '🧳', '🎫', '🏖️', '🏔️', '🗼', '🎡', '🎢'],
  'Social': ['💬', '💭', '🗨️', '📧', '📩', '📨', '💌', '📮', '📪', '📫', '📬', '📭', '🔔', '🔕', '📢'],
  'Other': ['⭐', '🌟', '💫', '✨', '🔥', '💥', '💢', '💦', '💨', '🕐', '⏰', '⏳', '📅', '📆', '🗓️'],
};

const ALL_EMOJIS = Object.values(EMOJI_CATEGORIES).flat();

export default function IconPicker({ isOpen, onClose, onSelect, currentIcon }: IconPickerProps) {
  const [activeTab, setActiveTab] = useState<'emoji' | 'url'>('emoji');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Popular');
  const [customUrl, setCustomUrl] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const [urlHistory, setUrlHistory] = useState<string[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Load URL history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ICON_HISTORY_KEY);
      if (saved) {
        setUrlHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load icon history:', e);
    }
  }, [isOpen]);

  // Save URL to history
  const saveToHistory = (url: string) => {
    const newHistory = [url, ...urlHistory.filter(u => u !== url)].slice(0, MAX_HISTORY_ITEMS);
    setUrlHistory(newHistory);
    localStorage.setItem(ICON_HISTORY_KEY, JSON.stringify(newHistory));
  };

  // Remove URL from history
  const removeFromHistory = (url: string) => {
    const newHistory = urlHistory.filter(u => u !== url);
    setUrlHistory(newHistory);
    localStorage.setItem(ICON_HISTORY_KEY, JSON.stringify(newHistory));
  };

  // Clear all history
  const clearHistory = () => {
    setUrlHistory([]);
    localStorage.removeItem(ICON_HISTORY_KEY);
  };

  // Copy URL to clipboard
  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const filteredEmojis = useMemo(() => {
    if (searchTerm) {
      return ALL_EMOJIS.filter(emoji => emoji.includes(searchTerm));
    }
    return EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES] || [];
  }, [searchTerm, selectedCategory]);

  if (!isOpen) return null;

  const handleEmojiSelect = (emoji: string) => {
    onSelect(emoji, 'emoji');
    onClose();
  };

  const handleUrlSubmit = () => {
    if (customUrl.trim()) {
      saveToHistory(customUrl.trim());
      onSelect(customUrl.trim(), 'url');
      onClose();
    }
  };

  const handleHistorySelect = (url: string) => {
    saveToHistory(url); // Move to top of history
    onSelect(url, 'url');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Pilih Icon
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 flex-shrink-0">
          <button
            onClick={() => setActiveTab('emoji')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'emoji'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smile className="w-4 h-4" />
            Emoji
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'url'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Image className="w-4 h-4" />
            Image URL
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {activeTab === 'emoji' ? (
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari emoji..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Category tabs */}
              {!searchTerm && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
                  {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Current selection */}
              {currentIcon && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Current:</span>
                  <span className="text-2xl">{currentIcon}</span>
                </div>
              )}

              {/* Emoji grid */}
              <div className="grid grid-cols-8 gap-1">
                {filteredEmojis.map((emoji, index) => (
                  <button
                    key={`${emoji}-${index}`}
                    onClick={() => handleEmojiSelect(emoji)}
                    className={`w-10 h-10 flex items-center justify-center text-2xl rounded-lg hover:bg-purple-100 transition-colors ${
                      currentIcon === emoji ? 'bg-purple-100 ring-2 ring-purple-500' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {filteredEmojis.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Smile className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Tidak ada emoji ditemukan</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Masukkan URL gambar untuk icon custom (PNG, JPG, SVG).
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Image URL</label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    setPreviewError(false);
                  }}
                  placeholder="https://example.com/icon.png"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Preview */}
              {customUrl && (
                <div className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-600">Preview:</p>
                  {previewError ? (
                    <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center">
                      <X className="w-8 h-8 text-red-400" />
                    </div>
                  ) : (
                    <img
                      src={customUrl}
                      alt="Preview"
                      className="w-16 h-16 object-contain rounded-xl bg-white border border-slate-200"
                      onError={() => setPreviewError(true)}
                    />
                  )}
                </div>
              )}

              <button
                onClick={handleUrlSubmit}
                disabled={!customUrl.trim() || previewError}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Gunakan Image Ini
              </button>

              {/* URL History */}
              {urlHistory.length > 0 && (
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Clock className="w-4 h-4" />
                      <span>Icon Terakhir Digunakan</span>
                    </div>
                    <button
                      onClick={clearHistory}
                      className="text-xs text-red-500 hover:text-red-600 transition-colors"
                    >
                      Hapus Semua
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {urlHistory.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="relative group"
                      >
                        <button
                          onClick={() => handleHistorySelect(url)}
                          className="w-full aspect-square bg-white border border-slate-200 rounded-xl p-1.5 hover:border-purple-400 hover:bg-purple-50 transition-all overflow-hidden"
                        >
                          <img
                            src={url}
                            alt="Saved icon"
                            className="w-full h-full object-contain rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
                            }}
                          />
                        </button>
                        {/* Action buttons on hover */}
                        <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(url);
                            }}
                            className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-sm"
                            title="Copy URL"
                          >
                            {copiedUrl === url ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromHistory(url);
                            }}
                            className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                            title="Hapus dari history"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-amber-50 p-3 rounded-lg">
                <p className="text-xs text-amber-700">
                  💡 Tips: Gunakan icon dari layanan seperti:
                </p>
                <ul className="text-xs text-amber-600 mt-1 space-y-0.5">
                  <li>• clearbit.com/logo</li>
                  <li>• simpleicons.org</li>
                  <li>• icons8.com</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
