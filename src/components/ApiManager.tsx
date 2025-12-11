import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Key, Plus, Copy, Check, Eye, EyeOff, Trash2, Edit2,
  ExternalLink, Search, X, Download, Upload, Image, Link, Files
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type ApiKey = {
  id: string;
  user_id: string;
  name: string;
  api_key: string;
  description: string | null;
  service_url: string | null;
  icon_url: string | null;
  created_at: string;
  updated_at: string;
};

type ApiManagerProps = {
  onBack: () => void;
};

export default function ApiManager({ onBack }: ApiManagerProps) {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedIconId, setCopiedIconId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [showExportImport, setShowExportImport] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) loadApiKeys();
  }, [user]);

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, id: string, isIcon = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isIcon) {
        setCopiedIconId(id);
        setTimeout(() => setCopiedIconId(null), 2000);
      } else {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus API key ini?')) return;
    try {
      const { error } = await supabase.from('api_keys').delete().eq('id', id);
      if (error) throw error;
      setApiKeys(prev => prev.filter(k => k.id !== id));
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  // Duplicate API key
  const handleDuplicate = async (apiKey: ApiKey) => {
    if (!user || duplicatingId) return;
    setDuplicatingId(apiKey.id);
    try {
      const { error } = await supabase.from('api_keys').insert({
        user_id: user.id,
        name: `${apiKey.name} (Copy)`,
        api_key: apiKey.api_key,
        description: apiKey.description,
        service_url: apiKey.service_url,
        icon_url: apiKey.icon_url,
      });
      if (error) throw error;
      loadApiKeys();
    } catch (error) {
      console.error('Error duplicating API key:', error);
    } finally {
      setTimeout(() => setDuplicatingId(null), 500);
    }
  };

  // Export API keys as JSON
  const handleExport = () => {
    const exportData = apiKeys.map(({ id, user_id, created_at, updated_at, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-keys-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportImport(false);
  };

  // Import API keys from JSON
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!Array.isArray(data)) throw new Error('Invalid format');

      for (const item of data) {
        if (item.name && item.api_key) {
          await supabase.from('api_keys').insert({
            user_id: user.id,
            name: item.name,
            api_key: item.api_key,
            description: item.description || null,
            service_url: item.service_url || null,
            icon_url: item.icon_url || null,
          });
        }
      }

      loadApiKeys();
      setShowExportImport(false);
      alert('Import berhasil!');
    } catch (error) {
      console.error('Import error:', error);
      alert('Gagal import. Pastikan format file benar.');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredKeys = apiKeys.filter(key =>
    key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    key.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                onClick={onBack}
                className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">API Manager</h1>
                <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Kelola API keys dengan aman</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowExportImport(true)}
                className="p-2 sm:px-3 sm:py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                title="Export/Import"
              >
                <Download className="w-5 h-5 sm:hidden" />
                <span className="hidden sm:flex items-center gap-2 text-sm font-medium">
                  <Download className="w-4 h-4" /> Backup
                </span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Tambah</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Search */}
        <div className="relative mb-4 sm:mb-6">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari API key..."
            className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-slate-500">
          <span>{apiKeys.length} API keys</span>
        </div>

        {/* API Keys List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        ) : filteredKeys.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-white rounded-2xl border border-slate-200">
            <Key className="w-10 sm:w-12 h-10 sm:h-12 text-slate-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-700 mb-2">
              {searchQuery ? 'Tidak ada hasil' : 'Belum ada API key'}
            </h3>
            <p className="text-sm text-slate-500 mb-4 px-4">
              {searchQuery ? 'Coba kata kunci lain' : 'Tambahkan API key pertama Anda'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Tambah API Key
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Icon */}
                    <div
                      className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden
                        ${apiKey.icon_url ? 'bg-slate-100 cursor-pointer hover:ring-2 hover:ring-teal-400' : 'bg-gradient-to-br from-violet-500 to-purple-600'}`}
                      onClick={() => apiKey.icon_url && handleCopy(apiKey.icon_url, apiKey.id, true)}
                      title={apiKey.icon_url ? 'Klik untuk copy icon URL' : undefined}
                    >
                      {apiKey.icon_url ? (
                        <img src={apiKey.icon_url} alt={apiKey.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Key className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      )}
                      {copiedIconId === apiKey.id && (
                        <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 truncate text-sm sm:text-base">{apiKey.name}</h3>
                      {apiKey.description && (
                        <p className="text-xs sm:text-sm text-slate-500 truncate">{apiKey.description}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                    {apiKey.service_url && (
                      <a
                        href={apiKey.service_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Buka URL"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => setEditingKey(apiKey)}
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(apiKey)}
                      disabled={duplicatingId === apiKey.id}
                      className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                        duplicatingId === apiKey.id
                          ? 'text-green-600 bg-green-100'
                          : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'
                      }`}
                      title="Duplikasi"
                    >
                      {duplicatingId === apiKey.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Files className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(apiKey.id)}
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* API Key Display */}
                <div className="mt-3 sm:mt-4 flex items-center gap-1.5 sm:gap-2 bg-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3">
                  <code className="flex-1 font-mono text-xs sm:text-sm text-slate-700 truncate">
                    {visibleKeys.has(apiKey.id) ? apiKey.api_key : maskApiKey(apiKey.api_key)}
                  </code>
                  <button
                    onClick={() => toggleVisibility(apiKey.id)}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    title={visibleKeys.has(apiKey.id) ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {visibleKeys.has(apiKey.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleCopy(apiKey.api_key, apiKey.id)}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                      copiedId === apiKey.id ? 'text-green-600 bg-green-100' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                    }`}
                    title="Copy"
                  >
                    {copiedId === apiKey.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="mt-2 sm:mt-3 text-xs text-slate-400">
                  {new Date(apiKey.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingKey) && (
        <ApiKeyModal
          apiKey={editingKey}
          onClose={() => { setShowAddModal(false); setEditingKey(null); }}
          onSave={() => { loadApiKeys(); setShowAddModal(false); setEditingKey(null); }}
        />
      )}

      {/* Export/Import Modal */}
      {showExportImport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Backup & Restore</h2>
              <button onClick={() => setShowExportImport(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleExport}
                disabled={apiKeys.length === 0}
                className="w-full flex items-center justify-center gap-3 p-4 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                <span className="font-medium">Export JSON ({apiKeys.length})</span>
              </button>
              <label className="w-full flex items-center justify-center gap-3 p-4 bg-teal-50 text-teal-700 rounded-xl hover:bg-teal-100 transition-colors cursor-pointer">
                <Upload className="w-5 h-5" />
                <span className="font-medium">Import JSON</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">
              Export untuk backup, import untuk restore dari file backup.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


// Modal Component
function ApiKeyModal({
  apiKey,
  onClose,
  onSave,
}: {
  apiKey: ApiKey | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [iconPreviewError, setIconPreviewError] = useState(false);
  const [formData, setFormData] = useState({
    name: apiKey?.name || '',
    api_key: apiKey?.api_key || '',
    description: apiKey?.description || '',
    service_url: apiKey?.service_url || '',
    icon_url: apiKey?.icon_url || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name || !formData.api_key) return;

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        api_key: formData.api_key,
        description: formData.description || null,
        service_url: formData.service_url || null,
        icon_url: formData.icon_url || null,
        updated_at: new Date().toISOString(),
      };

      if (apiKey) {
        const { error } = await supabase.from('api_keys').update(payload).eq('id', apiKey.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('api_keys').insert({ ...payload, user_id: user.id });
        if (error) throw error;
      }
      onSave();
    } catch (error) {
      console.error('Error saving API key:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <Key className="w-5 h-5 text-violet-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {apiKey ? 'Edit API Key' : 'Tambah API Key'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Icon URL with Preview */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <span className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Icon URL
              </span>
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="url"
                  value={formData.icon_url}
                  onChange={(e) => {
                    setFormData({ ...formData, icon_url: e.target.value });
                    setIconPreviewError(false);
                  }}
                  placeholder="https://example.com/icon.png"
                  className="w-full px-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
              </div>
              {formData.icon_url && (
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                  {iconPreviewError ? (
                    <Image className="w-5 h-5 text-slate-400" />
                  ) : (
                    <img
                      src={formData.icon_url}
                      alt="Preview"
                      className="w-full h-full object-contain p-1"
                      onError={() => setIconPreviewError(true)}
                    />
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Logo service (PNG, SVG, atau URL gambar)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nama API <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., OpenAI, Stripe, GitHub"
              className="w-full px-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                placeholder="sk-xxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2.5 sm:py-3 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono text-xs sm:text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Deskripsi
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Production API key"
              className="w-full px-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <span className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                URL Service
              </span>
            </label>
            <input
              type="url"
              value={formData.service_url}
              onChange={(e) => setFormData({ ...formData, service_url: e.target.value })}
              placeholder="https://platform.openai.com/api-keys"
              className="w-full px-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base"
            />
          </div>

          <div className="flex gap-3 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 sm:py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold transition-colors text-sm sm:text-base"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || !formData.name || !formData.api_key}
              className="flex-1 px-4 py-2.5 sm:py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline">Menyimpan...</span>
                </>
              ) : (
                'Simpan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
