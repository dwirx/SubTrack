import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Pin, Trash2, MoreHorizontal, Check } from 'lucide-react';
import { Note, NoteInput, NOTE_COLORS } from '../lib/supabase';

interface NoteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  onSave: (note: NoteInput) => Promise<void>;
  onDelete: (id: string) => void;
}

export default function NoteDetailModal({ isOpen, onClose, note, onSave, onDelete }: NoteDetailModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('default');
  const [isPinned, setIsPinned] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && note) {
      setTitle(note.title);
      setContent(note.content || '');
      setColor(note.color || 'default');
      setIsPinned(note.is_pinned);
      setHasChanges(false);
    }
  }, [note, isOpen]);

  // Auto-resize textarea
  const autoResize = (element: HTMLTextAreaElement | null) => {
    if (element) {
      element.style.height = 'auto';
      element.style.height = element.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    autoResize(titleRef.current);
    autoResize(contentRef.current);
  }, [title, content, isOpen]);

  const handleSave = async () => {
    if (!title.trim() || !hasChanges) return;
    
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        color,
        is_pinned: isPinned,
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    if (hasChanges && title.trim()) {
      await handleSave();
    }
    onClose();
  };

  const handleDelete = () => {
    if (note) {
      setShowMenu(false);
      onDelete(note.id);
      onClose();
    }
  };

  const handleChange = () => {
    setHasChanges(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!isOpen || !note) return null;

  const selectedColor = NOTE_COLORS.find(c => c.value === color) || NOTE_COLORS[0];

  return (
    <div className="fixed inset-0 z-50 bg-[#F2F2F7]">
      {/* Header */}
      <header className="bg-[#F2F2F7]/90 backdrop-blur-xl sticky top-0 z-10 border-b border-slate-200/50">
        <div className="flex items-center justify-between px-2 h-11 safe-area-top">
          <button
            onClick={handleClose}
            className="flex items-center gap-0.5 text-[#007AFF] font-medium text-[17px] px-2 py-1 
              rounded-lg active:bg-blue-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Notes</span>
          </button>
          
          <div className="flex items-center gap-1">
            {/* Save indicator */}
            {saving && (
              <span className="text-[13px] text-slate-400 mr-2">Saving...</span>
            )}
            {hasChanges && !saving && (
              <button
                onClick={handleSave}
                className="text-[#007AFF] font-medium text-[15px] px-3 py-1 rounded-lg 
                  active:bg-blue-50 transition-colors"
              >
                Save
              </button>
            )}
            
            {/* Pin toggle */}
            <button
              onClick={() => {
                setIsPinned(!isPinned);
                handleChange();
              }}
              className={`p-2 rounded-lg transition-colors ${
                isPinned ? 'text-amber-500' : 'text-[#007AFF]'
              } active:bg-slate-100`}
            >
              <Pin className={`w-5 h-5 ${isPinned ? 'fill-amber-500' : ''}`} />
            </button>
            
            {/* More menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-[#007AFF] rounded-lg active:bg-blue-50 transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl 
                    border border-slate-200 overflow-hidden z-20 animate-scale-in origin-top-right">
                    
                    {/* Color picker in menu */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-[13px] text-slate-500 mb-2">Note Color</p>
                      <div className="flex items-center gap-2">
                        {NOTE_COLORS.map((c) => (
                          <button
                            key={c.value}
                            onClick={() => {
                              setColor(c.value);
                              handleChange();
                            }}
                            className={`w-7 h-7 rounded-full ${c.bg} ${c.border} border-2 
                              transition-all flex items-center justify-center
                              ${color === c.value ? 'ring-2 ring-[#007AFF] ring-offset-1' : ''}`}
                          >
                            {color === c.value && <Check className="w-3.5 h-3.5 text-slate-600" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 
                        hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-[15px]">Delete Note</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content - Full screen editable */}
      <main className={`min-h-[calc(100vh-44px)] ${selectedColor.bg} transition-colors duration-200`}>
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Date */}
          <p className="text-[13px] text-slate-400 text-center mb-4">
            {formatDate(note.updated_at)}
          </p>
          
          {/* Title - Editable */}
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              handleChange();
              autoResize(e.target);
            }}
            placeholder="Title"
            className="w-full text-[28px] font-bold text-slate-900 placeholder-slate-300
              bg-transparent border-none focus:outline-none focus:ring-0 resize-none
              leading-tight mb-4 overflow-hidden"
            rows={1}
          />
          
          {/* Content - Editable */}
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              handleChange();
              autoResize(e.target);
            }}
            placeholder="Start typing..."
            className="w-full text-[17px] text-slate-700 placeholder-slate-400 leading-relaxed
              bg-transparent border-none focus:outline-none focus:ring-0 resize-none
              min-h-[50vh] overflow-hidden"
          />
        </div>
      </main>
    </div>
  );
}
