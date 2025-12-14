import { useState, useEffect, useRef } from 'react';
import { NoteInput } from '../lib/supabase';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: NoteInput) => Promise<void>;
}

export default function NoteModal({ isOpen, onClose, onSave }: NoteModalProps) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        content: '',
        color: 'default',
        is_pinned: false,
      });
      onClose();
    } catch {
      // Error handled in parent
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl 
        shadow-2xl animate-slide-up sm:animate-scale-in overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <button
            onClick={onClose}
            className="text-[#007AFF] font-medium text-[17px] px-2 py-1 rounded-lg 
              active:bg-blue-50 transition-colors"
          >
            Cancel
          </button>
          
          <h2 className="text-[17px] font-semibold text-slate-900">New Note</h2>
          
          <button
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="text-[#007AFF] font-semibold text-[17px] px-2 py-1 rounded-lg 
              active:bg-blue-50 transition-colors disabled:text-slate-300"
          >
            {saving ? '...' : 'Create'}
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Note title"
            className="w-full text-[17px] text-slate-900 placeholder-slate-400
              bg-slate-100 rounded-xl px-4 py-3 border-none focus:outline-none 
              focus:ring-2 focus:ring-[#007AFF]/30"
          />
          <p className="text-[13px] text-slate-400 mt-3 text-center">
            Press Enter or tap Create to start writing
          </p>
        </div>
      </div>
    </div>
  );
}
