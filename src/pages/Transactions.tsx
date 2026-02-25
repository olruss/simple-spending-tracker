import { useState, useMemo } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import AppLayout from '@/components/AppLayout';
import TransactionList from '@/components/TransactionList';
import CSVUploadDialog from '@/components/CSVUploadDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function Transactions() {
  const { transactions, categories, addTransaction } = useExpenses();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = !filterCat || t.categoryId === filterCat ||
        categories.find(c => c.id === t.categoryId)?.parentId === filterCat;
      return matchSearch && matchCat;
    });
  }, [transactions, search, filterCat, categories]);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <div className="flex gap-2">
            <CSVUploadDialog />
            <AddTransactionDialog categories={categories} onAdd={addTransaction} />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <select
            className="flex h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.filter(c => !c.parentId).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <TransactionList transactions={filtered} />
      </div>
    </AppLayout>
  );
}

function AddTransactionDialog({ categories, onAdd }: {
  categories: { id: string; name: string; parentId: string | null }[];
  onAdd: (t: { date: string; description: string; amount: number; categoryId: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), description: '', amount: '', categoryId: '' });

  const handleSave = () => {
    if (!form.description.trim() || !form.amount || !form.categoryId) {
      toast.error('Please fill all fields');
      return;
    }
    onAdd({
      date: form.date,
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      categoryId: form.categoryId,
    });
    toast.success('Transaction added');
    setForm({ date: new Date().toISOString().slice(0, 10), description: '', amount: '', categoryId: '' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Coffee at Blue Bottle" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Amount ($)</Label>
            <Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="12.50" min={0} step={0.01} className="h-9 font-mono-num" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.categoryId}
              onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
            >
              <option value="">Select</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.parentId ? '  · ' : ''}{c.name}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleSave} className="w-full">Add Transaction</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
