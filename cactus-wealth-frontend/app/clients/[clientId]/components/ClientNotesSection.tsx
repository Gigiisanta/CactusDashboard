import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiClientInterceptor } from '@/lib/apiClient';
import { useSession } from 'next-auth/react';

interface ClientNote {
  id: number;
  client_id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  created_by: number;
}

interface ClientNotesSectionProps {
  clientId: number;
  onDataChange?: () => void;
}

export function ClientNotesSection({
  clientId,
  onDataChange,
}: ClientNotesSectionProps) {
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ClientNote | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const fetchNotes = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const notesData = await apiClientInterceptor
        .getClient()
        .get(`/clients/${clientId}/notes`);
      setNotes(notesData.data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setError('Error al cargar las notas');
    } finally {
      setIsLoading(false);
    }
  }, [clientId, isAuthenticated]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAddNote = async (noteData: {
    title: string;
    content: string;
  }) => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para crear notas');
      return;
    }
    try {
      await apiClientInterceptor
        .getClient()
        .post(`/clients/${clientId}/notes`, noteData);
      setIsAddModalOpen(false);
      await fetchNotes();
      // Only call onDataChange if it exists and after successful operation
      if (onDataChange) {
        onDataChange();
      }
      toast.success('Nota creada');
    } catch (e) {
      toast.error('Error al crear nota');
    }
  };

  const handleEditNote = async (
    noteId: number,
    noteData: { title?: string; content?: string }
  ) => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para editar notas');
      return;
    }
    try {
      await apiClientInterceptor
        .getClient()
        .put(`/clients/${clientId}/notes/${noteId}`, noteData);
      setEditingNote(null);
      await fetchNotes();
      // Only call onDataChange if it exists and after successful operation
      if (onDataChange) {
        onDataChange();
      }
      toast.success('Nota actualizada');
    } catch (e) {
      toast.error('Error al actualizar nota');
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para eliminar notas');
      return;
    }
    if (!confirm('¿Eliminar esta nota?')) return;
    setDeletingNoteId(noteId);
    try {
      await apiClientInterceptor
        .getClient()
        .delete(`/clients/${clientId}/notes/${noteId}`);
      await fetchNotes();
      // Only call onDataChange if it exists and after successful operation
      if (onDataChange) {
        onDataChange();
      }
      toast.success('Nota eliminada');
    } catch (e) {
      toast.error('Error al eliminar nota');
    } finally {
      setDeletingNoteId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Notas</CardTitle>
            <p className='mt-1 text-sm text-muted-foreground'>
              {Array.isArray(notes) ? notes.length : 0} nota
              {Array.isArray(notes) && notes.length !== 1 ? 's' : ''}
            </p>
          </div>
          {isAuthenticated && (
            <Button onClick={() => setIsAddModalOpen(true)} size='sm'>
              <Plus className='mr-2 h-4 w-4' /> Añadir Nota
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isAuthenticated ? (
          <div className='py-8 text-center text-muted-foreground'>
            <p>Debes iniciar sesión para ver las notas</p>
            <Button
              onClick={() => (window.location.href = '/login')}
              variant='outline'
              size='sm'
              className='mt-2'
            >
              Iniciar Sesión
            </Button>
          </div>
        ) : isLoading ? (
          <div className='py-8 text-center text-muted-foreground'>
            Cargando notas...
          </div>
        ) : !Array.isArray(notes) || notes.length === 0 ? (
          <div className='py-8 text-center text-muted-foreground'>
            No hay notas registradas
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Contenido</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className='text-right'>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell className='font-medium'>{note.title}</TableCell>
                  <TableCell>{note.content}</TableCell>
                  <TableCell>
                    {new Date(note.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className='text-right'>
                    {isAuthenticated && (
                      <div className='flex items-center justify-end space-x-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setEditingNote(note)}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          disabled={deletingNoteId === note.id}
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add Note Modal */}
        {isAddModalOpen && (
          <NoteDialog
            open={isAddModalOpen}
            onOpenChange={setIsAddModalOpen}
            onSubmit={handleAddNote}
          />
        )}

        {/* Edit Note Modal */}
        {editingNote && (
          <NoteDialog
            open={!!editingNote}
            onOpenChange={(open) => !open && setEditingNote(null)}
            onSubmit={(data) => handleEditNote(editingNote.id, data)}
            initialData={{
              title: editingNote.title,
              content: editingNote.content,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; content: string }) => void;
  initialData?: { title: string; content: string };
}

function NoteDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: NoteDialogProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Título y contenido son requeridos');
      return;
    }
    onSubmit({ title: title.trim(), content: content.trim() });
    setTitle('');
    setContent('');
  };

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30'>
      <form
        className='w-full max-w-md rounded-lg bg-white p-6 shadow-lg'
        onSubmit={handleSubmit}
      >
        <h2 className='mb-4 text-lg font-bold'>
          {initialData ? 'Editar Nota' : 'Nueva Nota'}
        </h2>
        <div className='mb-4'>
          <input
            type='text'
            placeholder='Título de la nota'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className='w-full rounded border p-2'
            required
          />
        </div>
        <div className='mb-4'>
          <textarea
            placeholder='Contenido de la nota'
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className='h-32 w-full rounded border p-2'
            required
          />
        </div>
        <div className='flex justify-end space-x-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type='submit'>
            {initialData ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </div>
  );
}
