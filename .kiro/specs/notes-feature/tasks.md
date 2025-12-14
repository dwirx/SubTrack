# Implementation Plan

- [x] 1. Setup database schema and types




  - [ ] 1.1 Create Supabase migration for notes table
    - Create `supabase/migrations/[timestamp]_create_notes_table.sql`


    - Include table definition, indexes, RLS policies, and updated_at trigger
    - _Requirements: 7.1, 7.2_




  - [ ] 1.2 Add Note type to supabase.ts
    - Export Note type interface
    - Add NOTE_COLORS constant
    - _Requirements: 2.2_

- [ ] 2. Implement core Notes components
  - [x] 2.1 Create NoteCard component


    - Create `src/components/NoteCard.tsx`
    - Support grid and list layout modes
    - Display title, content preview, date, and color
    - Include edit and delete action buttons
    - _Requirements: 2.2, 6.2_
  - [ ]* 2.2 Write property test for note display
    - **Property 3: Note display contains required information**


    - **Validates: Requirements 2.2**
  - [ ] 2.3 Create NoteModal component for create/edit
    - Create `src/components/NoteModal.tsx`


    - Form with title, content, and color picker
    - Validation for empty title




    - Support both create and edit modes
    - _Requirements: 1.1, 1.2, 1.3, 3.1_
  - [ ]* 2.4 Write property test for title validation
    - **Property 2: Empty/whitespace title validation rejects save**
    - **Validates: Requirements 1.3**
  - [ ] 2.5 Create NoteDetailModal component
    - Create `src/components/NoteDetailModal.tsx`
    - Display full note content

    - Include edit and delete buttons
    - _Requirements: 2.3_
  - [ ] 2.6 Create DeleteConfirmModal component
    - Create `src/components/DeleteConfirmModal.tsx`
    - Confirmation dialog with cancel and confirm buttons
    - _Requirements: 4.1, 4.3_

- [ ] 3. Implement NotesView main container
  - [ ] 3.1 Create NotesView component
    - Create `src/components/NotesView.tsx`
    - Implement notes loading from Supabase
    - Implement search functionality
    - Implement layout toggle (grid/list)




    - Handle empty state
    - _Requirements: 2.1, 2.4, 5.1, 5.2, 6.1, 6.2_

  - [ ]* 3.2 Write property test for search filtering
    - **Property 6: Search filters by title and content match**
    - **Validates: Requirements 5.1**




  - [ ] 3.3 Implement CRUD operations in NotesView
    - Create note function with Supabase insert

    - Update note function with Supabase update
    - Delete note function with Supabase delete
    - _Requirements: 1.2, 1.4, 3.2, 3.3, 4.2_
  - [ ]* 3.4 Write property test for note creation
    - **Property 1: Note creation with valid data adds to list**
    - **Validates: Requirements 1.2**
  - [ ]* 3.5 Write property test for note update
    - **Property 4: Note update persists changes and updates timestamp**
    - **Validates: Requirements 3.2, 3.3**
  - [ ]* 3.6 Write property test for note deletion
    - **Property 5: Note deletion removes from list**
    - **Validates: Requirements 4.2**

- [ ] 4. Integrate Notes into Dashboard
  - [ ] 4.1 Add Notes menu item to Dashboard
    - Add 'notes' to View type
    - Add Notes icon and menu button in user menu


    - _Requirements: 2.1_
  - [ ] 4.2 Add NotesView rendering in Dashboard
    - Import NotesView component
    - Add conditional rendering for notes view
    - _Requirements: 2.1, 7.3_

- [ ] 5. Add i18n translations
  - [ ] 5.1 Add notes translations to i18n
    - Add English translations for notes feature
    - Add Indonesian translations for notes feature
    - _Requirements: 6.1_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 7. Write unit tests for components
  - [ ]* 7.1 Write unit tests for NoteCard
    - Test rendering with different props
    - Test click handlers
    - _Requirements: 2.2_
  - [ ]* 7.2 Write unit tests for NoteModal
    - Test form validation
    - Test create vs edit mode
    - _Requirements: 1.1, 1.3, 3.1_
  - [ ]* 7.3 Write unit tests for NotesView
    - Test loading state
    - Test empty state
    - Test search functionality
    - _Requirements: 2.1, 2.4, 5.1, 5.2_

- [ ] 8. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

