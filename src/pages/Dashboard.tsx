import { useMemo, useState } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import AppLayout from '@/components/AppLayout';
import CategoryPieChart from '@/components/CategoryPieChart';
import CategoryLimits from '@/components/CategoryLimits';
import TransactionList from '@/components/TransactionList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Receipt, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Dashboard() {
  const { transactions } = useExpenses();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const expenses = thisMonth.filter(t => t.amount > 0);
    const income = thisMonth.filter(t => t.amount < 0);
    const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);
    const totalIncome = income.reduce((s, t) => s + Math.abs(t.amount), 0);
    const count = thisMonth.length;
    return { totalSpent, totalIncome, count };
  }, [transactions]);

  const recentTxs = transactions.slice(0, 5);

  // Month-to-month data
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; expenses: number; income: number }> = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!months[key]) months[key] = { month: label, expenses: 0, income: 0 };
      if (t.amount > 0) months[key].expenses += t.amount;
      else months[key].income += Math.abs(t.amount);
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [transactions]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <div className="grid gap-4 sm:grid-cols-3">
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
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border bg-card p-5">
                <h2 className="text-sm font-medium text-muted-foreground mb-4">Spending by Category</h2>
                <CategoryPieChart />
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

          <TabsContent value="monthly" className="mt-4">
            <div className="rounded-lg border bg-card p-5">
              <h2 className="text-sm font-medium text-muted-foreground mb-4">Monthly Income vs Expenses</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} barGap={4}>
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
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
