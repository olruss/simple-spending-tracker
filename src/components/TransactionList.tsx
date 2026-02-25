import { useState } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { Transaction } from '@/types/expense';
import { Trash2, Split, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TransactionSplitDialog from './TransactionSplitDialog';

export default function TransactionList({ transactions: txs }: { transactions?: Transaction[] }) {
  const { transactions: allTxs, getCategoryById, deleteTransaction } = useExpenses();
  const transactions = txs || allTxs;
  const [splitTarget, setSplitTarget] = useState<{ id: string; amount: number } | null>(null);
  const [expandedSplits, setExpandedSplits] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedSplits(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className="rounded-lg border bg-card">
        <div className="divide-y">
          {transactions.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">No transactions yet</p>
          )}
          {transactions.map(t => {
            const cat = getCategoryById(t.categoryId);
            const parentCat = cat?.parentId ? getCategoryById(cat.parentId) : null;
            const hasSplits = t.splits && t.splits.length > 0;
            const isExpanded = expandedSplits.has(t.id);

            return (
              <div key={t.id}>
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                  {hasSplits ? (
                    <button onClick={() => toggleExpand(t.id)} className="text-muted-foreground hover:text-foreground">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  ) : (
                    <div className="w-4" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {parentCat ? `${parentCat.name} › ` : ''}{cat?.name || 'Uncategorized'}
                      {hasSplits && <span className="ml-1.5 text-primary">· split</span>}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(t.date)}</span>
                  <span className="font-mono-num text-sm font-medium w-24 text-right">
                    ${t.amount.toFixed(2)}
                  </span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7"
                      onClick={() => setSplitTarget({ id: t.id, amount: t.amount })}
                      title="Split"
                    >
                      <Split className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteTransaction(t.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {hasSplits && isExpanded && (
                  <div className="border-t bg-muted/20 px-4 py-2 space-y-1">
                    {t.splits!.map((s, i) => {
                      const sCat = getCategoryById(s.categoryId);
                      return (
                        <div key={i} className="flex items-center gap-3 pl-8 text-xs text-muted-foreground">
                          <span className="flex-1">{s.description || sCat?.name || 'Unknown'}</span>
                          <span className="font-mono-num">${s.amount.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {splitTarget && (
        <TransactionSplitDialog
          transactionId={splitTarget.id}
          totalAmount={splitTarget.amount}
          open={!!splitTarget}
          onOpenChange={(v) => !v && setSplitTarget(null)}
        />
      )}
    </>
  );
}
