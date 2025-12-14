import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Search, LayoutGrid, List, Sparkles, StickyNote
} from 'lucide-react';
import { supabase, Note, NoteInput } from '../lib/supabase';
import { usePreferences } from '../contexts/PreferencesContext';
import NoteCard from './NoteCard';
import NoteModal from './NoteModal';
import NoteDetailModal from './NoteDetailModal';
import DeleteConfirmModal from './DeleteConfirmModal';

interface NotesViewProps {
  onBack: () => void;
}

export default function NotesView({ onBack }: NotesViewProps) {
  const { t } = usePreferences();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  
  // Modal states
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [notes, searchTerm]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterNotes = () => {
    if (!searchTerm.trim()) {
      setFilteredNotes(notes);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = notes.filter(note =>
      note.title.toLowerCase().includes(term) ||
      (note.content && note.content.toLowerCase().includes(term))
    );
    setFilteredNotes(filtered);
  };

  const handleCreateNote = async (input: NoteInput) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('notes')
      .insert({
        user_id: userData.user.id,
        title: input.title,
        content: input.content,
        color: input.color || 'default',
        is_pinned: input.is_pinned || false,
      });

    if (error) throw error;
    await loadNotes();
  };

  const handleUpdateNote = async (input: NoteInput) => {
    if (!selectedNote) return;

    const { error } = await supabase
      .from('notes')
      .update({
        title: input.title,
        content: input.content,
        color: input.color,
        is_pinned: input.is_pinned,
      })
      .eq('id', selectedNote.id);

    if (error) throw error;
    await loadNotes();
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteToDelete);

      if (error) throw error;
      setNotes(notes.filter(n => n.id !== noteToDelete));
      setNoteToDelete(null);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const openCreateModal = () => {
    setSelectedNote(null);
    setShowNoteModal(true);
  };

  const openEditModal = (note: Note) => {
    setSelectedNote(note);
    setShowNoteModal(true);
  };

  const openDetailModal = (note: Note) => {
    setSelectedNote(note);
    setShowDetailModal(true);
  };

  const openDeleteModal = (id: string) => {
    setNoteToDelete(id);
    setShowDeleteModal(true);
  };

  const noteToDeleteTitle = notes.find(n => n.id === noteToDelete)?.title || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-teal-50/30">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-400/10 to-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/5 to-pink-400/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent flex items-center gap-2">
                  <StickyNote className="w-6 h-6 text-teal-600" />
                  {t('notes.title') || 'My Notes'}
                </h1>
                <p className="text-sm text-slate-500 hidden sm:block">
                  {t('notes.subtitle') || 'Capture your thoughts and ideas'}
                </p>
              </div>
            </div>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 
                text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 font-medium transition-all
                shadow-lg shadow-teal-500/25 hover:shadow-xl hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">{t('notes.add') || 'New Note'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 
              group-focus-within:text-teal-500 transition-colors" />
            <input
              type="text"
              placeholder={t('notes.search') || 'Search notes...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 
                focus:ring-teal-500 focus:border-teal-500 bg-white/80 backdrop-blur-sm 
                transition-all hover:border-slate-300"
            />
          </div>

          <div className="flex items-center bg-slate-100/80 backdrop-blur-sm rounded-xl p-1">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                layoutMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">{t('notes.grid') || 'Grid'}</span>
            </button>
            <button
              onClick={() => setLayoutMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                layoutMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">{t('notes.list') || 'List'}</span>
            </button>
          </div>
        </div>

        {/* Notes count */}
        <p className="text-sm text-slate-500 mb-4">
          {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
          {searchTerm && ` matching "${searchTerm}"`}
        </p>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-teal-200 rounded-full animate-spin border-t-teal-600" />
              <Sparkles className="w-6 h-6 text-teal-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-500 animate-pulse">{t('notes.loading') || 'Loading notes...'}</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 p-12 text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <StickyNote className="w-10 h-10 text-slate-400" />
            </div>
            {searchTerm ? (
              <>
                <p className="text-slate-600 text-lg mb-2">{t('notes.noResults') || 'No notes found'}</p>
                <p className="text-slate-400 text-sm">Try a different search term</p>
              </>
            ) : (
              <>
                <p className="text-slate-600 text-lg mb-4">{t('notes.empty') || 'No notes yet'}</p>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  {t('notes.createFirst') || 'Create your first note'}
                </button>
              </>
            )}
          </div>
        ) : layoutMode === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNotes.map((note, index) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
                onClick={openDetailModal}
                layoutMode={layoutMode}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note, index) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
                onClick={openDetailModal}
                layoutMode={layoutMode}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <NoteModal
        isOpen={showNoteModal}
        onClose={() => {
          setShowNoteModal(false);
          setSelectedNote(null);
        }}
        onSave={selectedNote ? handleUpdateNote : handleCreateNote}
        note={selectedNote || undefined}
      />

      <NoteDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedNote(null);
        }}
        note={selectedNote}
        onEdit={(note) => {
          setShowDetailModal(false);
          openEditModal(note);
        }}
        onDelete={(id) => {
          setShowDetailModal(false);
          openDeleteModal(id);
        }}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setNoteToDelete(null);
        }}
        onConfirm={handleDeleteNote}
        title={`Delete "${noteToDeleteTitle}"?`}
        message="This note will be permanently deleted. This action cannot be undone."
      />
    </div>
  );
}
