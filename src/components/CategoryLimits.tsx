import { useMemo } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2 } from 'lucide-react';
import { useState } from 'react';

export default function CategoryLimits() {
  const { categories, transactions, getParentCategories, updateCategoryLimit } = useExpenses();
  const parentCats = getParentCategories();

  const spending = useMemo(() => {
    const map: Record<string, number> = {};
    parentCats.forEach(cat => {
      const childIds = [cat.id, ...categories.filter(c => c.parentId === cat.id).map(c => c.id)];
      map[cat.id] = transactions
        .filter(t => {
          if (t.splits?.length) return t.splits.some(s => childIds.includes(s.categoryId));
          return childIds.includes(t.categoryId);
        })
        .reduce((sum, t) => {
          if (t.splits?.length) {
            return sum + t.splits.filter(s => childIds.includes(s.categoryId)).reduce((s, sp) => s + sp.amount, 0);
          }
          return sum + t.amount;
        }, 0);
    });
    return map;
  }, [parentCats, categories, transactions]);

  const catsWithLimits = parentCats.filter(c => c.limit);

  if (catsWithLimits.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        <p>No category limits set yet.</p>
        <SetLimitDialog categories={parentCats} onSet={updateCategoryLimit} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Budget Limits</h3>
        <SetLimitDialog categories={parentCats} onSet={updateCategoryLimit} />
      </div>
      {catsWithLimits.map(cat => {
        const spent = spending[cat.id] || 0;
        const pct = cat.limit ? Math.min((spent / cat.limit) * 100, 100) : 0;
        const over = cat.limit ? spent > cat.limit : false;
        return (
          <div key={cat.id} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span>{cat.name}</span>
              <span className={`font-mono-num ${over ? 'text-destructive' : 'text-muted-foreground'}`}>
                ${spent.toFixed(0)} / ${cat.limit?.toFixed(0)}
              </span>
            </div>
            <Progress value={pct} className={`h-2 ${over ? '[&>div]:bg-destructive' : ''}`} />
          </div>
        );
      })}
    </div>
  );
}

function SetLimitDialog({ categories, onSet }: {
  categories: { id: string; name: string; limit?: number }[];
  onSet: (id: string, limit: number | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState('');
  const [limitVal, setLimitVal] = useState('');

  const handleSave = () => {
    if (selectedCat && limitVal) {
      onSet(selectedCat, parseFloat(limitVal));
      setOpen(false);
      setSelectedCat('');
      setLimitVal('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Settings2 className="h-3.5 w-3.5" />
          Set Limit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Set Category Limit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Category</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={selectedCat}
              onChange={e => setSelectedCat(e.target.value)}
            >
              <option value="">Select a category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Monthly Limit ($)</Label>
            <Input
              type="number"
              placeholder="500"
              value={limitVal}
              onChange={e => setLimitVal(e.target.value)}
              min={0}
            />
          </div>
          <Button onClick={handleSave} className="w-full" disabled={!selectedCat || !limitVal}>
            Save Limit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
