import { useState, useMemo } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import AppLayout from '@/components/AppLayout';
import TransactionList from '@/components/TransactionList';
import CSVUploadDialog from '@/components/CSVUploadDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { MARKS, TransactionMark } from '@/types/expense';

export default function Transactions() {
  const { transactions, categories, accounts, addTransaction } = useExpenses();
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
            <AddTransactionDialog categories={categories} accounts={accounts} onAdd={addTransaction} />
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

function AddTransactionDialog({ categories, accounts, onAdd }: {
  categories: { id: string; name: string; parentId: string | null }[];
  accounts: { id: string; name: string; lastFour: string; type: string }[];
  onAdd: (t: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10), description: '', amount: '',
    isIncome: false, categoryId: '', accountId: '', note: '', mark: '', receiptUrl: '',
  });

  const handleSave = () => {
    if (!form.description.trim() || !form.amount || !form.categoryId) {
      toast.error('Please fill all required fields');
      return;
    }
    const amount = parseFloat(form.amount) * (form.isIncome ? -1 : 1);
    onAdd({
      date: form.date,
      description: form.description.trim(),
      amount,
      categoryId: form.categoryId,
      accountId: form.accountId || undefined,
      note: form.note.trim() || undefined,
      mark: (form.mark as TransactionMark) || undefined,
      receiptUrl: form.receiptUrl.trim() || undefined,
    });
    toast.success('Transaction added');
    setForm({ date: new Date().toISOString().slice(0, 10), description: '', amount: '', isIncome: false, categoryId: '', accountId: '', note: '', mark: '', receiptUrl: '' });
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
          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Amount ($)</Label>
              <Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="12.50" min={0} step={0.01} className="h-9 font-mono-num" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <select
                className="flex h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={form.isIncome ? 'income' : 'expense'}
                onChange={e => setForm(p => ({ ...p, isIncome: e.target.value === 'income' }))}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
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
          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Account</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.accountId}
                onChange={e => setForm(p => ({ ...p, accountId: e.target.value }))}
              >
                <option value="">None</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ··{a.lastFour}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Mark</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.mark}
                onChange={e => setForm(p => ({ ...p, mark: e.target.value }))}
              >
                <option value="">None</option>
                {MARKS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Note</Label>
            <Textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="Optional note..." className="min-h-[50px] text-sm" />
          </div>
          <Button onClick={handleSave} className="w-full">Add Transaction</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
