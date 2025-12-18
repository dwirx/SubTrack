import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Search, LayoutGrid, List, StickyNote, X, Folder
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
        .order('updated_at', { ascending: false });

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

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: userData.user.id,
        title: input.title,
        content: input.content,
        color: input.color || 'default',
        is_pinned: input.is_pinned || false,
      })
      .select()
      .single();

    if (error) throw error;
    
    // Open the new note for editing
    if (data) {
      await loadNotes();
      setSelectedNote(data);
      setShowNoteModal(false);
      setShowDetailModal(true);
    }
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
    
    // Update local state
    setNotes(notes.map(n => 
      n.id === selectedNote.id 
        ? { ...n, ...input, updated_at: new Date().toISOString() }
        : n
    ));
    
    // Update selected note
    setSelectedNote(prev => prev ? { ...prev, ...input, updated_at: new Date().toISOString() } : null);
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

  const openDetailModal = (note: Note) => {
    setSelectedNote(note);
    setShowDetailModal(true);
  };

  const openDeleteModal = (id: string) => {
    setNoteToDelete(id);
    setShowDeleteModal(true);
  };

  const noteToDeleteTitle = notes.find(n => n.id === noteToDelete)?.title || '';
  const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.is_pinned);

  return (
    <div className="fixed inset-0 bg-[#F2F2F7] flex flex-col overflow-hidden">
      {/* Header - iOS style */}
      <header className="bg-[#F2F2F7]/90 backdrop-blur-xl flex-shrink-0 z-40 border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 h-11">
            <button
              onClick={onBack}
              className="flex items-center gap-0.5 text-[#007AFF] font-medium text-[17px] -ml-2 px-2 py-1 
                rounded-lg active:bg-blue-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
            
            <div className="flex items-center gap-2">
              {/* Layout toggle */}
              <div className="flex items-center bg-slate-200/60 rounded-lg p-0.5">
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${
                    layoutMode === 'grid' ? 'bg-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLayoutMode('list')}
                  className={`p-1.5 rounded-md transition-all ${
                    layoutMode === 'list' ? 'bg-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={openCreateModal}
                className="p-2 text-[#007AFF] rounded-lg active:bg-blue-50 transition-colors"
              >
                <Plus className="w-6 h-6" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="px-4 pb-2">
            <h1 className="text-[34px] font-bold text-slate-900 tracking-tight">
              {t('notes.title') || 'Notes'}
            </h1>
          </div>

          {/* Search bar */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-slate-200/60 rounded-xl text-[15px]
                  placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30
                  transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 
                    hover:text-slate-600 rounded-full bg-slate-300/60"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content - scrollable */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-4xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-slate-200 border-t-[#007AFF] rounded-full animate-spin" />
            <p className="text-slate-400 mt-4 text-[15px]">Loading...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-200/60 rounded-3xl flex items-center justify-center mb-4">
              {searchTerm ? (
                <Search className="w-10 h-10 text-slate-300" />
              ) : (
                <StickyNote className="w-10 h-10 text-slate-300" />
              )}
            </div>
            {searchTerm ? (
              <>
                <p className="text-slate-500 text-[17px] font-medium">No Results</p>
                <p className="text-slate-400 text-[15px] mt-1">No notes match "{searchTerm}"</p>
              </>
            ) : (
              <>
                <p className="text-slate-500 text-[17px] font-medium">No Notes</p>
                <p className="text-slate-400 text-[15px] mt-1 mb-4">Tap + to create a note</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6 pb-24">
            {/* Pinned section */}
            {pinnedNotes.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-6 h-6 bg-amber-400 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs">📌</span>
                  </div>
                  <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide">
                    Pinned
                  </h2>
                  <span className="text-[13px] text-slate-400">{pinnedNotes.length}</span>
                </div>
                
                {layoutMode === 'grid' ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {pinnedNotes.map((note, index) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={openDetailModal}
                        onDelete={openDeleteModal}
                        onClick={openDetailModal}
                        layoutMode={layoutMode}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
                    {pinnedNotes.map((note, index) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={openDetailModal}
                        onDelete={openDeleteModal}
                        onClick={openDetailModal}
                        layoutMode={layoutMode}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* All notes section */}
            {unpinnedNotes.length > 0 && (
              <section>
                {pinnedNotes.length > 0 && (
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-6 h-6 bg-slate-400 rounded-lg flex items-center justify-center">
                      <Folder className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide">
                      Notes
                    </h2>
                    <span className="text-[13px] text-slate-400">{unpinnedNotes.length}</span>
                  </div>
                )}
                
                {layoutMode === 'grid' ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {unpinnedNotes.map((note, index) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={openDetailModal}
                        onDelete={openDeleteModal}
                        onClick={openDetailModal}
                        layoutMode={layoutMode}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
                    {unpinnedNotes.map((note, index) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={openDetailModal}
                        onDelete={openDeleteModal}
                        onClick={openDetailModal}
                        layoutMode={layoutMode}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
        </div>
      </main>

      {/* Floating action button */}
      <div className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 z-30">
        <button
          onClick={openCreateModal}
          className="w-14 h-14 bg-[#007AFF] text-white rounded-full shadow-xl shadow-blue-500/30 
            flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </button>
      </div>

      {/* Modals */}
      <NoteModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSave={handleCreateNote}
      />

      <NoteDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          loadNotes(); // Refresh list after closing
        }}
        note={selectedNote}
        onSave={handleUpdateNote}
        onDelete={openDeleteModal}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setNoteToDelete(null);
        }}
        onConfirm={handleDeleteNote}
        title="Delete Note"
        message={`Are you sure you want to delete "${noteToDeleteTitle}"? This cannot be undone.`}
      />
    </div>
  );
}
