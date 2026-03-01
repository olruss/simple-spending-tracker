import { useState } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { MonthlyNote } from '@/types/expense';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  months: string[];
  editNote?: MonthlyNote;
}

export default function MonthlyNoteDialog({ months, editNote }: Props) {
  const { addMonthlyNote, updateMonthlyNote, deleteMonthlyNote, monthlyNotes } = useExpenses();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(editNote?.month || '');
  const [text, setText] = useState(editNote?.text || '');

  const handleSave = () => {
    if (!text.trim()) { toast.error('Please enter a note'); return; }
    if (editNote) {
      updateMonthlyNote(editNote.id, text.trim());
      toast.success('Note updated');
    } else {
      if (!month) { toast.error('Please select a month'); return; }
      addMonthlyNote(month, text.trim());
      toast.success('Note added');
    }
    setOpen(false);
    if (!editNote) { setMonth(''); setText(''); }
  };

  const handleDelete = () => {
    if (editNote) {
      deleteMonthlyNote(editNote.id);
      toast.success('Note deleted');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editNote ? (
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Pencil className="h-3 w-3" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
            <Plus className="h-3 w-3" />
            Add Note
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{editNote ? 'Edit Note' : 'Add Monthly Note'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {!editNote && (
            <div className="space-y-1.5">
              <Label className="text-xs">Month</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={month}
                onChange={e => setMonth(e.target.value)}
              >
                <option value="">Select month</option>
                {months.map(m => {
                  const [y, mo] = m.split('-');
                  const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  const exists = monthlyNotes.some(n => n.month === m);
                  return <option key={m} value={m} disabled={exists}>{label}{exists ? ' (has note)' : ''}</option>;
                })}
              </select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Note</Label>
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Your analysis, observations, goals..."
              className="min-h-[100px] text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              {editNote ? 'Update' : 'Add Note'}
            </Button>
            {editNote && (
              <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
