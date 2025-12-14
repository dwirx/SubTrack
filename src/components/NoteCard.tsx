import { Trash2, Pin } from 'lucide-react';
import { Note, NOTE_COLORS } from '../lib/supabase';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onClick: (note: Note) => void;
  layoutMode: 'grid' | 'list';
  index: number;
}

export default function NoteCard({ note, onDelete, onClick, layoutMode, index }: NoteCardProps) {
  const colorConfig = NOTE_COLORS.find(c => c.value === note.color) || NOTE_COLORS[0];
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getFirstLine = (content: string) => {
    if (!content) return 'No additional text';
    const firstLine = content.split('\n')[0].trim();
    if (!firstLine) return 'No additional text';
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
  };

  const getPreview = (content: string, maxLines: number = 3) => {
    if (!content) return '';
    const lines = content.split('\n').filter(l => l.trim()).slice(0, maxLines);
    return lines.join('\n');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  // List layout
  if (layoutMode === 'list') {
    return (
      <div
        onClick={() => onClick(note)}
        className={`group relative ${colorConfig.bg} cursor-pointer
          transition-all duration-200 active:bg-slate-50 touch-manipulation px-4 py-3`}
        style={{ animationDelay: `${index * 20}ms` }}
      >
        <div className="flex items-start gap-3">
          {/* Pin indicator */}
          {note.is_pinned && (
            <Pin className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0 mt-0.5" />
          )}
          
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="font-semibold text-slate-900 text-[15px] leading-tight truncate">
              {note.title}
            </h3>
            
            {/* Date + Preview */}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[13px] text-slate-400 font-medium flex-shrink-0">
                {formatDate(note.updated_at)}
              </span>
              <span className="text-[13px] text-slate-500 truncate">
                {getFirstLine(note.content)}
              </span>
            </div>
          </div>

          {/* Delete button - visible on hover */}
          <button
            onClick={handleDelete}
            className="p-2 text-slate-300 hover:text-red-500 rounded-full 
              opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Grid layout - Card style
  return (
    <div
      onClick={() => onClick(note)}
      className={`group relative ${colorConfig.bg} rounded-2xl cursor-pointer
        transition-all duration-200 hover:shadow-lg active:scale-[0.98] 
        touch-manipulation border ${colorConfig.border} overflow-hidden
        flex flex-col h-[180px] sm:h-[200px]`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Pin badge */}
      {note.is_pinned && (
        <div className="absolute top-2.5 right-2.5 z-10">
          <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
            <Pin className="w-3 h-3 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4 overflow-hidden">
        {/* Title */}
        <h3 className="font-semibold text-slate-900 text-[15px] leading-tight mb-2 line-clamp-2 pr-6">
          {note.title}
        </h3>
        
        {/* Preview */}
        {note.content ? (
          <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-4 whitespace-pre-wrap">
            {getPreview(note.content, 4)}
          </p>
        ) : (
          <p className="text-[13px] text-slate-400 italic">No additional text</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-slate-100/80 bg-white/40 flex items-center justify-between">
        <span className="text-[12px] text-slate-400 font-medium">
          {formatDate(note.updated_at)}
        </span>
        
        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="p-1.5 text-slate-300 hover:text-red-500 rounded-full 
            opacity-0 group-hover:opacity-100 transition-all -mr-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
