import { useState, useMemo } from 'react';
import { X, Search, Smile, Image, Sparkles } from 'lucide-react';

type IconPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (icon: string, type: 'emoji' | 'url') => void;
  currentIcon?: string;
};

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
      onSelect(customUrl.trim(), 'url');
      onClose();
    }
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
