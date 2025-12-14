import { Edit3, Trash2, Pin } from 'lucide-react';
import { Note, NOTE_COLORS } from '../lib/supabase';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onClick: (note: Note) => void;
  layoutMode: 'grid' | 'list';
  index: number;
}

export default function NoteCard({ note, onEdit, onDelete, onClick, layoutMode, index }: NoteCardProps) {
  const colorConfig = NOTE_COLORS.find(c => c.value === note.color) || NOTE_COLORS[0];
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(note);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  if (layoutMode === 'list') {
    return (
      <div
        onClick={() => onClick(note)}
        className={`group ${colorConfig.bg} ${colorConfig.border} border rounded-xl p-4 cursor-pointer
          transition-all duration-300 hover:shadow-md ${colorConfig.hover} animate-fade-in-up`}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {note.is_pinned && (
                <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
              )}
              <h3 className="font-semibold text-slate-900 truncate">{note.title}</h3>
            </div>
            <p className="text-sm text-slate-600 line-clamp-2">{truncateContent(note.content, 200)}</p>
            <p className="text-xs text-slate-400 mt-2">{formatDate(note.created_at)}</p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick(note)}
      className={`group ${colorConfig.bg} ${colorConfig.border} border rounded-2xl p-5 cursor-pointer
        transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${colorConfig.hover} animate-fade-in-up`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {note.is_pinned && (
            <Pin className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
          )}
          <h3 className="font-semibold text-slate-900 truncate">{note.title}</h3>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50/50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50/50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <p className="text-sm text-slate-600 line-clamp-4 mb-4 min-h-[4rem]">
        {truncateContent(note.content)}
      </p>
      
      <p className="text-xs text-slate-400">{formatDate(note.created_at)}</p>
    </div>
  );
}
