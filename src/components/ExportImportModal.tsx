import { useState, useRef } from 'react';
import { X, Download, Upload, FileJson, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { supabase, Subscription } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';


type ExportImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subscriptions: Subscription[];
};

type ImportResult = {
  success: number;
  failed: number;
  errors: string[];
};

export default function ExportImportModal({ isOpen, onClose, onSuccess, subscriptions }: ExportImportModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const exportToJSON = () => {
    setExporting(true);
    try {
      const exportData = subscriptions.map(sub => ({
        service_name: sub.service_name,
        category: sub.category,
        plan_name: sub.plan_name,
        price: sub.price,
        currency: sub.currency,
        billing_cycle: sub.billing_cycle,
        start_date: sub.start_date,
        next_billing_date: sub.next_billing_date,
        payment_method: sub.payment_method,
        status: sub.status,
        auto_renew: sub.auto_renew,
        notes: sub.notes,
        is_shared: sub.is_shared,
        shared_with_count: sub.shared_with_count,
        paid_by_company: sub.paid_by_company,
        icon_emoji: sub.icon_emoji,
        tags: sub.tags,
        description: sub.description,
        subscription_email: sub.subscription_email,
        phone_number: sub.phone_number,
        cancellation_url: sub.cancellation_url,
        cancellation_steps: sub.cancellation_steps,
        reminder_days: sub.reminder_days,
        notification_time: sub.notification_time,
      }));

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscriptions_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    setExporting(true);
    try {
      const headers = [
        'Service Name', 'Category', 'Plan', 'Price', 'Currency', 'Billing Cycle',
        'Start Date', 'Next Billing', 'Status', 'Auto Renew', 'Icon', 'Notes'
      ];
      
      const rows = subscriptions.map(sub => [
        sub.service_name,
        sub.category,
        sub.plan_name || '',
        sub.price.toString(),
        sub.currency,
        sub.billing_cycle,
        sub.start_date,
        sub.next_billing_date || '',
        sub.status,
        sub.auto_renew ? 'Yes' : 'No',
        sub.icon_emoji || '',
        sub.notes || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscriptions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      let data: Partial<Subscription>[];

      if (file.name.endsWith('.json')) {
        data = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        data = parseCSV(text);
      } else {
        throw new Error('Unsupported file format');
      }

      if (!Array.isArray(data)) {
        throw new Error('Invalid data format');
      }

      const result: ImportResult = { success: 0, failed: 0, errors: [] };

      for (const item of data) {
        try {
          const { error } = await supabase.from('subscriptions').insert({
            user_id: user.id,
            service_name: item.service_name || 'Unknown',
            category: item.category || 'Other',
            plan_name: item.plan_name || null,
            price: parseFloat(String(item.price)) || 0,
            currency: item.currency || 'IDR',
            billing_cycle: item.billing_cycle || 'monthly',
            start_date: item.start_date || new Date().toISOString().split('T')[0],
            next_billing_date: item.next_billing_date || null,
            payment_method: item.payment_method || null,
            status: item.status || 'active',
            auto_renew: item.auto_renew ?? true,
            notes: item.notes || null,
            is_shared: item.is_shared ?? false,
            shared_with_count: item.shared_with_count || null,
            paid_by_company: item.paid_by_company ?? false,
            icon_emoji: item.icon_emoji || '📦',
            tags: item.tags || [],
            description: item.description || null,
            subscription_email: item.subscription_email || null,
            phone_number: item.phone_number || null,
            cancellation_url: item.cancellation_url || null,
            cancellation_steps: item.cancellation_steps || null,
            reminder_days: item.reminder_days || [1, 3, 7],
            notification_time: item.notification_time || '09:00',
          });

          if (error) {
            result.failed++;
            result.errors.push(`${item.service_name}: ${error.message}`);
          } else {
            result.success++;
          }
        } catch (err) {
          result.failed++;
          result.errors.push(`${item.service_name || 'Unknown'}: ${err}`);
        }
      }

      setImportResult(result);
      if (result.success > 0) {
        onSuccess();
      }
    } catch (error) {
      setImportResult({
        success: 0,
        failed: 1,
        errors: [`Failed to parse file: ${error}`]
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const parseCSV = (text: string): Partial<Subscription>[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    const data: Partial<Subscription>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/("([^"]|"")*"|[^,]*)/g)?.map(v => 
        v.replace(/^"|"$/g, '').replace(/""/g, '"').trim()
      ) || [];

      const item: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        const key = header.replace(/\s+/g, '_');
        
        if (key === 'price') {
          item[key] = parseFloat(value) || 0;
        } else if (key === 'auto_renew') {
          item[key] = value.toLowerCase() === 'yes' || value === 'true';
        } else {
          item[key] = value;
        }
      });

      data.push(item as Partial<Subscription>);
    }

    return data;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Export / Import</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Export
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Import
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Export {subscriptions.length} langganan ke file untuk backup atau pindah ke device lain.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={exportToJSON}
                  disabled={exporting || subscriptions.length === 0}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-slate-200 rounded-xl hover:border-teal-400 hover:bg-teal-50/50 transition-all disabled:opacity-50"
                >
                  <FileJson className="w-10 h-10 text-orange-500" />
                  <span className="text-sm font-medium">JSON</span>
                  <span className="text-xs text-slate-500">Full data</span>
                </button>

                <button
                  onClick={exportToCSV}
                  disabled={exporting || subscriptions.length === 0}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-slate-200 rounded-xl hover:border-teal-400 hover:bg-teal-50/50 transition-all disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-10 h-10 text-green-500" />
                  <span className="text-sm font-medium">CSV</span>
                  <span className="text-xs text-slate-500">Excel compatible</span>
                </button>
              </div>

              {subscriptions.length === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  Tidak ada langganan untuk di-export.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Import langganan dari file JSON atau CSV.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="w-full flex flex-col items-center gap-3 p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-teal-400 hover:bg-teal-50/50 transition-all disabled:opacity-50"
              >
                {importing ? (
                  <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                ) : (
                  <Upload className="w-10 h-10 text-slate-400" />
                )}
                <span className="text-sm font-medium text-slate-600">
                  {importing ? 'Importing...' : 'Pilih file JSON atau CSV'}
                </span>
              </button>

              {importResult && (
                <div className={`p-4 rounded-xl ${
                  importResult.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {importResult.failed === 0 ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    )}
                    <span className="font-medium">
                      {importResult.success} berhasil, {importResult.failed} gagal
                    </span>
                  </div>
                  {importResult.errors.length > 0 && (
                    <ul className="text-xs text-slate-600 space-y-1 max-h-32 overflow-y-auto">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>...dan {importResult.errors.length - 5} error lainnya</li>
                      )}
                    </ul>
                  )}
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-600 font-medium mb-1">Format yang didukung:</p>
                <ul className="text-xs text-slate-500 space-y-0.5">
                  <li>• JSON: Export dari aplikasi ini</li>
                  <li>• CSV: Kolom minimal: service_name, price, currency</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
