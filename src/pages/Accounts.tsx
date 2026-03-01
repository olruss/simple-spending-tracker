import { useState, useMemo } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import AppLayout from '@/components/AppLayout';
import { CreditCard, Landmark, PiggyBank, Pencil, Link2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const accountIcons = {
  credit: CreditCard,
  checking: Landmark,
  savings: PiggyBank,
};

const accountColors: Record<string, string> = {
  credit: 'hsl(var(--chart-3))',
  checking: 'hsl(var(--chart-2))',
  savings: 'hsl(var(--success))',
};

export default function Accounts() {
  const { accounts, transactions, updateAccountBalance, getAccountById, suggestTransferPairs, linkTransfer, unlinkTransfer } = useExpenses();
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState('');

  const suggestedPairs = useMemo(() => suggestTransferPairs(), [suggestTransferPairs]);

  // Calculate balance history per account
  const balanceHistory = useMemo(() => {
    const sortedTxs = [...transactions]
      .filter(t => t.accountId)
      .sort((a, b) => a.date.localeCompare(b.date));

    const monthlyBalances: Record<string, Record<string, number>> = {};

    // Get all unique months
    const months = new Set<string>();
    sortedTxs.forEach(t => {
      const d = new Date(t.date);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    const sortedMonths = Array.from(months).sort();

    // For each account, compute running balance backwards from current
    accounts.forEach(acc => {
      const accTxs = sortedTxs.filter(t => t.accountId === acc.id);
      // Current balance is known. Work backwards month by month.
      let balance = acc.balance;
      const monthMap: Record<string, number> = {};

      // Process transactions from newest to oldest to reconstruct
      const reverseTxs = [...accTxs].reverse();
      // First, record current month balance
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Group txs by month
      const txsByMonth: Record<string, typeof accTxs> = {};
      accTxs.forEach(t => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!txsByMonth[key]) txsByMonth[key] = [];
        txsByMonth[key].push(t);
      });

      // Start from current balance and go backwards
      let runningBalance = balance;
      const allMonths = [...sortedMonths];
      if (!allMonths.includes(currentMonth)) allMonths.push(currentMonth);
      allMonths.sort();

      // Forward approach: start from earliest estimated balance
      // Total transaction effect
      const totalEffect = accTxs.reduce((sum, t) => {
        // Expense (positive amount) = money out, Income (negative amount) = money in
        return sum + (t.amount < 0 ? Math.abs(t.amount) : -t.amount);
      }, 0);
      let startBalance = balance - totalEffect;

      let running = startBalance;
      allMonths.forEach(month => {
        const mTxs = txsByMonth[month] || [];
        mTxs.forEach(t => {
          // Income (negative amount) adds to balance, expense (positive) subtracts
          running += (t.amount < 0 ? Math.abs(t.amount) : -t.amount);
        });
        monthMap[month] = running;
      });

      monthlyBalances[acc.id] = monthMap;
    });

    // Build chart data
    const allMonthsSorted = Array.from(new Set(
      Object.values(monthlyBalances).flatMap(m => Object.keys(m))
    )).sort();

    return allMonthsSorted.map(month => {
      const d = new Date(month + '-01');
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const entry: Record<string, any> = { month: label };
      accounts.forEach(acc => {
        entry[acc.id] = monthlyBalances[acc.id]?.[month] ?? 0;
      });
      return entry;
    });
  }, [accounts, transactions]);

  const handleBalanceUpdate = (accountId: string) => {
    const val = parseFloat(newBalance);
    if (isNaN(val)) { toast.error('Enter a valid number'); return; }
    updateAccountBalance(accountId, val);
    toast.success('Balance updated');
    setEditingAccount(null);
    setNewBalance('');
  };

  // Linked transfers
  const linkedTxs = transactions.filter(t => t.linkedTransferId);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Accounts</h1>

        {/* Account Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {accounts.map(acc => {
            const Icon = accountIcons[acc.type];
            return (
              <div key={acc.id} className="rounded-lg border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{acc.name}</p>
                      <p className="text-xs text-muted-foreground">··{acc.lastFour} · {acc.type}</p>
                    </div>
                  </div>
                  {editingAccount === acc.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={newBalance}
                        onChange={e => setNewBalance(e.target.value)}
                        className="h-7 w-28 text-sm font-mono-num"
                        autoFocus
                        placeholder={acc.balance.toFixed(2)}
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleBalanceUpdate(acc.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingAccount(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingAccount(acc.id); setNewBalance(acc.balance.toString()); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <p className="text-2xl font-semibold font-mono-num">
                  ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            );
          })}
        </div>

        {/* Balance History Chart */}
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Balance Over Time</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`]}
                />
                {accounts.map(acc => (
                  <Line
                    key={acc.id}
                    type="monotone"
                    dataKey={acc.id}
                    name={`${acc.name} ··${acc.lastFour}`}
                    stroke={accountColors[acc.type]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transfer Suggestions */}
        {suggestedPairs.length > 0 && (
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Suggested Transfer Pairs
            </h2>
            <p className="text-xs text-muted-foreground">These transactions look like they might be transfers between accounts.</p>
            <div className="space-y-2">
              {suggestedPairs.map(([a, b], i) => {
                const accA = a.accountId ? getAccountById(a.accountId) : null;
                const accB = b.accountId ? getAccountById(b.accountId) : null;
                return (
                  <div key={i} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{a.description}</p>
                      <p className="text-xs text-muted-foreground">{accA?.name} ··{accA?.lastFour} · {a.date}</p>
                    </div>
                    <span className="text-muted-foreground">↔</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{b.description}</p>
                      <p className="text-xs text-muted-foreground">{accB?.name} ··{accB?.lastFour} · {b.date}</p>
                    </div>
                    <span className="font-mono-num text-sm">${Math.abs(a.amount).toFixed(2)}</span>
                    <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { linkTransfer(a.id, b.id); toast.success('Transfer linked'); }}>
                      <Link2 className="h-3 w-3" />
                      Link
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Linked Transfers */}
        {linkedTxs.length > 0 && (
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Linked Transfers</h2>
            <div className="space-y-2">
              {(() => {
                const seen = new Set<string>();
                return linkedTxs.filter(t => {
                  if (seen.has(t.id)) return false;
                  seen.add(t.id);
                  if (t.linkedTransferId) seen.add(t.linkedTransferId);
                  return true;
                }).map(t => {
                  const partner = transactions.find(tx => tx.id === t.linkedTransferId);
                  if (!partner) return null;
                  const accA = t.accountId ? getAccountById(t.accountId) : null;
                  const accB = partner.accountId ? getAccountById(partner.accountId) : null;
                  const outgoing = t.amount > 0 ? t : partner;
                  const incoming = t.amount < 0 ? t : partner;
                  const fromAcc = outgoing.accountId ? getAccountById(outgoing.accountId) : null;
                  const toAcc = incoming.accountId ? getAccountById(incoming.accountId) : null;
                  return (
                    <div key={t.id} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">{outgoing.date}</p>
                        <p>{fromAcc?.name} → {toAcc?.name}</p>
                      </div>
                      <span className="font-mono-num">${Math.abs(t.amount).toFixed(2)}</span>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { unlinkTransfer(t.id); toast.success('Transfer unlinked'); }}>
                        Unlink
                      </Button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
