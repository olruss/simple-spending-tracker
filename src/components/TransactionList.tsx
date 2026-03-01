import { useState } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { Transaction, MARKS, TransactionMark } from '@/types/expense';
import { Trash2, Split, ChevronDown, ChevronRight, Pencil, CreditCard, Landmark, PiggyBank, StickyNote, Star, Paperclip, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import TransactionSplitDialog from './TransactionSplitDialog';
import TransactionEditDialog from './TransactionEditDialog';

const accountIcons = {
  credit: CreditCard,
  checking: Landmark,
  savings: PiggyBank,
};

export default function TransactionList({ transactions: txs }: { transactions?: Transaction[] }) {
  const { transactions: allTxs, getCategoryById, getAccountById, deleteTransaction, toggleStar } = useExpenses();
  const transactions = txs || allTxs;
  const [splitTarget, setSplitTarget] = useState<{ id: string; amount: number } | null>(null);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
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

  const getMarkInfo = (mark?: string) => MARKS.find(m => m.value === mark);

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
            const account = t.accountId ? getAccountById(t.accountId) : null;
            const hasSplits = t.splits && t.splits.length > 0;
            const isExpanded = expandedSplits.has(t.id);
            const isIncome = t.amount < 0;
            const markInfo = getMarkInfo(t.mark);
            const AccountIcon = account ? accountIcons[account.type] : null;
            const isLinkedTransfer = !!t.linkedTransferId;

            return (
              <div key={t.id}>
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                  {hasSplits ? (
                    <button onClick={() => toggleExpand(t.id)} className="text-muted-foreground hover:text-foreground">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleStar(t.id)}
                      className={`transition-colors ${t.starred ? 'text-[hsl(var(--warning))]' : 'text-muted-foreground/30 hover:text-[hsl(var(--warning))]'}`}
                    >
                      <Star className="h-4 w-4" fill={t.starred ? 'currentColor' : 'none'} />
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      {t.note && (
                        <Tooltip>
                          <TooltipTrigger>
                            <StickyNote className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">{t.note}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {t.receiptUrl && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Paperclip className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">Receipt attached</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {isLinkedTransfer && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Link2 className="h-3 w-3 text-[hsl(var(--chart-4))]" />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">Linked transfer</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>
                        {parentCat ? `${parentCat.name} › ` : ''}{cat?.name || 'Uncategorized'}
                      </span>
                      {hasSplits && <span className="text-primary">· split</span>}
                      {markInfo && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal" style={{ borderColor: markInfo.color, color: markInfo.color }}>
                          {markInfo.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {account && AccountIcon && (
                    <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                      <AccountIcon className="h-3.5 w-3.5" />
                      <span>··{account.lastFour}</span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">{formatDate(t.date)}</span>
                  <span className={`font-mono-num text-sm font-medium w-24 text-right ${isIncome ? 'text-[hsl(var(--success))]' : ''}`}>
                    {isIncome ? '+' : ''}${Math.abs(t.amount).toFixed(2)}
                  </span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditTarget(t)} title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSplitTarget({ id: t.id, amount: t.amount })} title="Split">
                      <Split className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteTransaction(t.id)} title="Delete">
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

      {editTarget && (
        <TransactionEditDialog
          transaction={editTarget}
          open={!!editTarget}
          onOpenChange={(v) => !v && setEditTarget(null)}
        />
      )}
    </>
  );
}
