import { useMemo, useState } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import AppLayout from '@/components/AppLayout';
import CategoryPieChart from '@/components/CategoryPieChart';
import CategoryLimits from '@/components/CategoryLimits';
import TransactionList from '@/components/TransactionList';
import MonthlyNoteDialog from '@/components/MonthlyNoteDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Receipt, PiggyBank, StickyNote, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { MARKS, TransactionMark } from '@/types/expense';

export default function Dashboard() {
  const { transactions, monthlyNotes, categories, getParentCategories } = useExpenses();
  const [overviewMark, setOverviewMark] = useState<TransactionMark | null>(null);

  // M2M state
  const [m2mMetric, setM2mMetric] = useState<'expenses' | 'income' | 'savings'>('expenses');
  const [m2mCategoryIds, setM2mCategoryIds] = useState<string[]>([]);
  const [m2mMarkFilter, setM2mMarkFilter] = useState<TransactionMark | ''>('');
  const [noteMonth, setNoteMonth] = useState<string | null>(null);

  // Filter transactions by mark for overview
  const overviewTxs = useMemo(() => {
    if (!overviewMark) return transactions;
    return transactions.filter(t => t.mark === overviewMark);
  }, [transactions, overviewMark]);

  // Exclude linked transfers from spending/income
  const nonTransferTxs = useMemo(() =>
    overviewTxs.filter(t => !t.linkedTransferId && t.mark !== 'adjustment'),
    [overviewTxs]
  );

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = nonTransferTxs.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const expenses = thisMonth.filter(t => t.amount > 0);
    const income = thisMonth.filter(t => t.amount < 0);
    const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);
    const totalIncome = income.reduce((s, t) => s + Math.abs(t.amount), 0);
    const count = thisMonth.length;
    return { totalSpent, totalIncome, count, savings: totalIncome - totalSpent };
  }, [nonTransferTxs]);

  const recentTxs = overviewTxs.slice(0, 5);

  // All available months sorted
  const allMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      const d = new Date(t.date);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(set).sort();
  }, [transactions]);

  // M2M data with filters
  const monthlyData = useMemo(() => {
    const relevantTxs = transactions.filter(t => {
      if (t.linkedTransferId || t.mark === 'adjustment') return false;
      if (m2mMarkFilter && t.mark !== m2mMarkFilter) return false;
      if (m2mCategoryIds.length > 0) {
        const catMatch = m2mCategoryIds.some(cid => {
          if (t.categoryId === cid) return true;
          const cat = categories.find(c => c.id === t.categoryId);
          return cat?.parentId === cid;
        });
        if (!catMatch) return false;
      }
      return true;
    });

    const months: Record<string, { month: string; key: string; expenses: number; income: number; savings: number }> = {};
    relevantTxs.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!months[key]) months[key] = { month: label, key, expenses: 0, income: 0, savings: 0 };
      if (t.amount > 0) months[key].expenses += t.amount;
      else months[key].income += Math.abs(t.amount);
    });
    Object.values(months).forEach(m => { m.savings = m.income - m.expenses; });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [transactions, categories, m2mMarkFilter, m2mCategoryIds]);

  const parentCats = getParentCategories();

  const toggleCategoryFilter = (catId: string) => {
    setM2mCategoryIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Spent This Month"
            value={`$${stats.totalSpent.toFixed(2)}`}
          />
          <StatCard
            icon={<TrendingDown className="h-4 w-4 text-[hsl(var(--success))]" />}
            label="Income This Month"
            value={`$${stats.totalIncome.toFixed(2)}`}
            valueClass="text-[hsl(var(--success))]"
          />
          <StatCard
            icon={<PiggyBank className="h-4 w-4" />}
            label="Savings"
            value={`$${stats.savings.toFixed(2)}`}
            valueClass={stats.savings >= 0 ? 'text-[hsl(var(--success))]' : 'text-destructive'}
          />
          <StatCard
            icon={<Receipt className="h-4 w-4" />}
            label="Transactions"
            value={stats.count.toString()}
          />
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="monthly">Month to Month</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Mark quick filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={overviewMark === null ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setOverviewMark(null)}
              >
                All
              </Button>
              {MARKS.filter(m => m.value !== 'adjustment').map(m => (
                <Button
                  key={m.value}
                  variant={overviewMark === m.value ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setOverviewMark(overviewMark === m.value ? null : m.value)}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
                  {m.label}
                </Button>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border bg-card p-5">
                <h2 className="text-sm font-medium text-muted-foreground mb-4">Spending by Category</h2>
                <CategoryPieChart filterMark={overviewMark} />
              </div>
              <div className="rounded-lg border bg-card p-5">
                <CategoryLimits />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent Transactions</h2>
              <TransactionList transactions={recentTxs} />
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="mt-4 space-y-4">
            {/* M2M Filters */}
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Metric</label>
                  <div className="flex gap-1">
                    {(['expenses', 'income', 'savings'] as const).map(m => (
                      <Button
                        key={m}
                        variant={m2mMetric === m ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs capitalize"
                        onClick={() => setM2mMetric(m)}
                      >
                        {m}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Mark</label>
                  <div className="flex gap-1">
                    <Button
                      variant={!m2mMarkFilter ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setM2mMarkFilter('')}
                    >
                      All
                    </Button>
                    {MARKS.filter(m => m.value !== 'adjustment').map(m => (
                      <Button
                        key={m.value}
                        variant={m2mMarkFilter === m.value ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setM2mMarkFilter(m2mMarkFilter === m.value ? '' : m.value)}
                      >
                        {m.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Categories</label>
                <div className="flex flex-wrap gap-1">
                  {parentCats.filter(c => c.id !== 'income').map(c => (
                    <Button
                      key={c.id}
                      variant={m2mCategoryIds.includes(c.id) ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => toggleCategoryFilter(c.id)}
                    >
                      {c.name}
                    </Button>
                  ))}
                  {m2mCategoryIds.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setM2mCategoryIds([])}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="rounded-lg border bg-card p-5">
              <h2 className="text-sm font-medium text-muted-foreground mb-4">
                {m2mMetric === 'expenses' ? 'Monthly Expenses' : m2mMetric === 'income' ? 'Monthly Income' : 'Monthly Savings'}
                {m2mCategoryIds.length > 0 && (
                  <span className="text-xs ml-2">
                    ({m2mCategoryIds.map(id => parentCats.find(c => c.id === id)?.name).filter(Boolean).join(', ')})
                  </span>
                )}
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `$${v}`} />
                    <RechartsTooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`]}
                    />
                    <Bar
                      dataKey={m2mMetric}
                      name={m2mMetric.charAt(0).toUpperCase() + m2mMetric.slice(1)}
                      fill={m2mMetric === 'income' ? 'hsl(var(--success))' : m2mMetric === 'savings' ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-3))'}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Notes */}
            <div className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Monthly Notes
                </h2>
                <MonthlyNoteDialog months={allMonths} />
              </div>
              {monthlyNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No monthly notes yet.</p>
              ) : (
                <div className="space-y-2">
                  {monthlyNotes
                    .sort((a, b) => b.month.localeCompare(a.month))
                    .map(note => {
                      const [y, m] = note.month.split('-');
                      const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      return (
                        <div key={note.id} className="rounded-md border bg-muted/30 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">{label}</span>
                            <MonthlyNoteDialog months={allMonths} editNote={note} />
                          </div>
                          <p className="text-sm text-muted-foreground">{note.text}</p>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function StatCard({ icon, label, value, valueClass }: { icon: React.ReactNode; label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-semibold font-mono-num ${valueClass || ''}`}>{value}</p>
    </div>
  );
}
