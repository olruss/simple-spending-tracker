import { useState } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { Transaction, MARKS, TransactionMark } from '@/types/expense';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Props {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function TransactionEditDialog({ transaction, open, onOpenChange }: Props) {
  const { categories, accounts, updateTransaction } = useExpenses();
  const [form, setForm] = useState({
    date: transaction.date,
    description: transaction.description,
    amount: Math.abs(transaction.amount).toString(),
    isIncome: transaction.amount < 0,
    categoryId: transaction.categoryId,
    accountId: transaction.accountId || '',
    note: transaction.note || '',
    mark: transaction.mark || '',
    receiptUrl: transaction.receiptUrl || '',
  });

  const handleSave = () => {
    if (!form.description.trim() || !form.amount || !form.categoryId) {
      toast.error('Please fill required fields');
      return;
    }
    const amount = parseFloat(form.amount) * (form.isIncome ? -1 : 1);
    updateTransaction(transaction.id, {
      date: form.date,
      description: form.description.trim(),
      amount,
      categoryId: form.categoryId,
      accountId: form.accountId || undefined,
      note: form.note.trim() || undefined,
      mark: (form.mark as TransactionMark) || undefined,
      receiptUrl: form.receiptUrl.trim() || undefined,
    });
    toast.success('Transaction updated');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="h-9" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Amount ($)</Label>
              <Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} min={0} step={0.01} className="h-9 font-mono-num" />
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
                  <option key={a.id} value={a.id}>{a.name} ··{a.lastFour} ({a.type})</option>
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
            <Label className="text-xs">Receipt URL</Label>
            <Input value={form.receiptUrl} onChange={e => setForm(p => ({ ...p, receiptUrl: e.target.value }))} placeholder="https://... or paste image URL" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Note</Label>
            <Textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="Add a note..." className="min-h-[60px] text-sm" />
          </div>
          <Button onClick={handleSave} className="w-full">Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
