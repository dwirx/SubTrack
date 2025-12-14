import { useState, useEffect } from 'react';
import { X, Pin, PinOff } from 'lucide-react';
import { Note, NoteInput, NOTE_COLORS } from '../lib/supabase';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: NoteInput) => Promise<void>;
  note?: Note;
}

export default function NoteModal({ isOpen, onClose, onSave, note }: NoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('default');
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
      setColor(note.color || 'default');
      setIsPinned(note.is_pinned);
    } else {
      setTitle('');
      setContent('');
      setColor('default');
      setIsPinned(false);
    }
    setError('');
  }, [note, isOpen]);

  const validateTitle = (value: string): boolean => {
    return value.trim().length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateTitle(title)) {
      setError('Title is required');
      return;
    }

    if (title.length > 255) {
      setError('Title must be less than 255 characters');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        color,
        is_pinned: isPinned,
      });
      onClose();
    } catch (err) {
      setError('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const selectedColor = NOTE_COLORS.find(c => c.value === color) || NOTE_COLORS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      <div className={`relative w-full max-w-lg ${selectedColor.bg} rounded-2xl shadow-2xl animate-scale-in`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200/50">
          <h2 className="text-lg font-semibold text-slate-900">
            {note ? 'Edit Note' : 'New Note'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-shake">
              {error}
            </div>
          )}

          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="Note title..."
              className={`w-full px-4 py-3 bg-white/50 border ${error ? 'border-red-300' : 'border-slate-200'} 
                rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 
                placeholder-slate-400 transition-all`}
              autoFocus
            />
          </div>

          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here..."
              rows={6}
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl 
                focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 
                placeholder-slate-400 resize-none transition-all"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Color:</span>
              <div className="flex gap-1">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-6 h-6 rounded-full ${c.bg} ${c.border} border-2 transition-all
                      ${color === c.value ? 'ring-2 ring-teal-500 ring-offset-1' : 'hover:scale-110'}`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors
                ${isPinned ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
              <span className="text-sm">{isPinned ? 'Pinned' : 'Pin'}</span>
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl 
                hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white 
                rounded-xl hover:from-teal-600 hover:to-cyan-600 font-medium transition-all
                shadow-lg shadow-teal-500/25 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : note ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
