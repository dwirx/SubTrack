import { X, Edit3, Trash2, Pin, Calendar, Clock } from 'lucide-react';
import { Note, NOTE_COLORS } from '../lib/supabase';

interface NoteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

export default function NoteDetailModal({ isOpen, onClose, note, onEdit, onDelete }: NoteDetailModalProps) {
  if (!isOpen || !note) return null;

  const colorConfig = NOTE_COLORS.find(c => c.value === note.color) || NOTE_COLORS[0];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = () => {
    onEdit(note);
    onClose();
  };

  const handleDelete = () => {
    onDelete(note.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      <div className={`relative w-full max-w-2xl ${colorConfig.bg} rounded-2xl shadow-2xl animate-scale-in max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-200/50">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              {note.is_pinned && (
                <Pin className="w-5 h-5 text-amber-500 fill-amber-500 flex-shrink-0" />
              )}
              <h2 className="text-xl font-bold text-slate-900 break-words">{note.title}</h2>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(note.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(note.created_at)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleEdit}
              className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {note.content ? (
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
          ) : (
            <p className="text-slate-400 italic">No content</p>
          )}
        </div>

        {/* Footer */}
        {note.updated_at !== note.created_at && (
          <div className="px-5 py-3 border-t border-slate-200/50 text-xs text-slate-400">
            Last updated: {formatDate(note.updated_at)} at {formatTime(note.updated_at)}
          </div>
        )}
      </div>
    </div>
  );
}
