import { useState, useRef, useCallback } from 'react';
import { X, Download, Upload, FileJson, FileSpreadsheet, Check, AlertCircle, FileUp } from 'lucide-react';
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
  skipped: number;
  errors: string[];
};

export default function ExportImportModal({ isOpen, onClose, onSuccess, subscriptions }: ExportImportModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFile, setDraggedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Parse CSV helper
  const parseCSV = useCallback((text: string): Partial<Subscription>[] => {
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
  }, []);

  // Check if subscription already exists (duplicate detection)
  const isDuplicate = useCallback((item: Partial<Subscription>, existingSubs: Subscription[]): boolean => {
    const serviceName = (item.service_name || '').toLowerCase().trim();
    const price = parseFloat(String(item.price)) || 0;
    const billingCycle = item.billing_cycle || 'monthly';
    const planName = (item.plan_name || '').toLowerCase().trim();

    return existingSubs.some(sub => {
      const existingName = sub.service_name.toLowerCase().trim();
      const existingPlan = (sub.plan_name || '').toLowerCase().trim();
      
      // Match by service name + price + billing cycle + plan name
      return existingName === serviceName && 
             sub.price === price && 
             sub.billing_cycle === billingCycle &&
             existingPlan === planName;
    });
  }, []);

  // Process file for import
  const processFile = useCallback(async (file: File) => {
    if (!user) {
      setImportResult({
        success: 0,
        failed: 1,
        skipped: 0,
        errors: ['User tidak terautentikasi. Silakan login ulang.']
      });
      return;
    }

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
        throw new Error('Invalid data format - expected array');
      }

      if (data.length === 0) {
        throw new Error('File kosong atau tidak ada data valid');
      }

      const result: ImportResult = { success: 0, failed: 0, skipped: 0, errors: [] };
      
      // Create a copy of existing subscriptions to track newly added ones too
      const allSubs = [...subscriptions];

      for (const item of data) {
        try {
          // Check for duplicates against existing + newly imported
          if (isDuplicate(item, allSubs)) {
            result.skipped++;
            result.errors.push(`${item.service_name}: Sudah ada (duplikat)`);
            continue;
          }

          const newSub = {
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
          };

          const { error } = await supabase.from('subscriptions').insert(newSub);

          if (error) {
            result.failed++;
            result.errors.push(`${item.service_name}: ${error.message}`);
          } else {
            result.success++;
            // Add to tracking array to prevent duplicates within same import
            allSubs.push(newSub as Subscription);
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
        skipped: 0,
        errors: [`Gagal memproses file: ${error instanceof Error ? error.message : error}`]
      });
    } finally {
      setImporting(false);
      setDraggedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [user, parseCSV, onSuccess, subscriptions, isDuplicate]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.json') || file.name.endsWith('.csv')) {
        setDraggedFile(file);
        processFile(file);
      } else {
        setImportResult({
          success: 0,
          failed: 1,
          errors: ['Format file tidak didukung. Gunakan JSON atau CSV.']
        });
      }
    }
  }, [processFile]);

  // Handle file input change
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDraggedFile(file);
      processFile(file);
    }
  }, [processFile]);

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
                Import langganan dari file JSON atau CSV. Drag & drop atau klik untuk memilih file.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Drag and Drop Zone */}
              <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !importing && fileInputRef.current?.click()}
                className={`relative w-full flex flex-col items-center gap-3 p-8 border-2 border-dashed rounded-xl 
                  transition-all duration-300 cursor-pointer
                  ${isDragging 
                    ? 'border-teal-500 bg-teal-50 scale-[1.02]' 
                    : 'border-slate-300 hover:border-teal-400 hover:bg-teal-50/50'
                  }
                  ${importing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {/* Animated background when dragging */}
                {isDragging && (
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-100/50 to-blue-100/50 rounded-xl animate-pulse" />
                )}

                <div className="relative z-10 flex flex-col items-center gap-3">
                  {importing ? (
                    <>
                      <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                      <span className="text-sm font-medium text-teal-600">Importing...</span>
                    </>
                  ) : isDragging ? (
                    <>
                      <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center animate-bounce">
                        <FileUp className="w-8 h-8 text-teal-600" />
                      </div>
                      <span className="text-sm font-bold text-teal-600">Lepaskan file di sini!</span>
                    </>
                  ) : draggedFile ? (
                    <>
                      <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                        {draggedFile.name.endsWith('.json') ? (
                          <FileJson className="w-6 h-6 text-orange-500" />
                        ) : (
                          <FileSpreadsheet className="w-6 h-6 text-green-500" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{draggedFile.name}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                        <Upload className="w-8 h-8 text-slate-400" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-medium text-slate-700 block">
                          Drag & drop file di sini
                        </span>
                        <span className="text-xs text-slate-500">
                          atau klik untuk memilih file
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-full flex items-center gap-1">
                          <FileJson className="w-3 h-3" /> JSON
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-medium rounded-full flex items-center gap-1">
                          <FileSpreadsheet className="w-3 h-3" /> CSV
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {importResult && (
                <div className={`p-4 rounded-xl ${
                  importResult.failed === 0 && importResult.skipped === 0 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-amber-50 border border-amber-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {importResult.failed === 0 && importResult.skipped === 0 ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    )}
                    <span className="font-medium">
                      {importResult.success} berhasil
                      {importResult.skipped > 0 && `, ${importResult.skipped} dilewati`}
                      {importResult.failed > 0 && `, ${importResult.failed} gagal`}
                    </span>
                  </div>
                  {importResult.skipped > 0 && (
                    <p className="text-xs text-slate-500 mb-2">
                      ⚠️ Item yang dilewati sudah ada di database (duplikat)
                    </p>
                  )}
                  {importResult.errors.length > 0 && (
                    <ul className="text-xs text-slate-600 space-y-1 max-h-32 overflow-y-auto">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>...dan {importResult.errors.length - 5} lainnya</li>
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
