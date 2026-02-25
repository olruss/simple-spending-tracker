import { useState } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { TransactionSplit } from '@/types/expense';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  transactionId: string;
  totalAmount: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function TransactionSplitDialog({ transactionId, totalAmount, open, onOpenChange }: Props) {
  const { splitTransaction, categories } = useExpenses();
  const [splits, setSplits] = useState<{ categoryId: string; amount: string; description: string }[]>([
    { categoryId: '', amount: '', description: '' },
    { categoryId: '', amount: '', description: '' },
  ]);

  const allocated = splits.reduce((s, sp) => s + (parseFloat(sp.amount) || 0), 0);
  const remaining = totalAmount - allocated;

  const updateSplit = (index: number, field: string, value: string) => {
    setSplits(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addSplit = () => {
    setSplits(prev => [...prev, { categoryId: '', amount: '', description: '' }]);
  };

  const removeSplit = (index: number) => {
    if (splits.length <= 2) return;
    setSplits(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const validSplits: TransactionSplit[] = splits
      .filter(s => s.categoryId && parseFloat(s.amount) > 0)
      .map(s => ({
        categoryId: s.categoryId,
        amount: parseFloat(s.amount),
        description: s.description || undefined,
      }));

    if (validSplits.length < 2) {
      toast.error('Need at least 2 splits');
      return;
    }

    if (Math.abs(remaining) > 0.01) {
      toast.error('Split amounts must equal the total');
      return;
    }

    splitTransaction(transactionId, validSplits);
    toast.success('Transaction split successfully');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Split Transaction</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Total: <span className="font-mono-num font-medium text-foreground">${totalAmount.toFixed(2)}</span>
        </p>

        <div className="space-y-3 max-h-72 overflow-auto">
          {splits.map((split, i) => (
            <div key={i} className="flex items-end gap-2 rounded-md border p-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">Category</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={split.categoryId}
                  onChange={e => updateSplit(i, 'categoryId', e.target.value)}
                >
                  <option value="">Select</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.parentId ? '  · ' : ''}{c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24 space-y-1.5">
                <Label className="text-xs">Amount</Label>
                <Input
                  type="number"
                  className="h-8 font-mono-num"
                  value={split.amount}
                  onChange={e => updateSplit(i, 'amount', e.target.value)}
                  min={0}
                  step={0.01}
                />
              </div>
              {splits.length > 2 && (
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeSplit(i)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={addSplit}>
            <Plus className="h-3.5 w-3.5" /> Add Split
          </Button>
          <span className={`text-xs font-mono-num ${Math.abs(remaining) < 0.01 ? 'text-success' : 'text-destructive'}`}>
            {remaining >= 0 ? `$${remaining.toFixed(2)} remaining` : `-$${Math.abs(remaining).toFixed(2)} over`}
          </span>
        </div>

        <Button onClick={handleSave} disabled={Math.abs(remaining) > 0.01} className="w-full">
          Save Split
        </Button>
      </DialogContent>
    </Dialog>
  );
}
