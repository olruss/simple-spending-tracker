import { useMemo } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import AppLayout from '@/components/AppLayout';
import CategoryPieChart from '@/components/CategoryPieChart';
import CategoryLimits from '@/components/CategoryLimits';
import TransactionList from '@/components/TransactionList';
import { TrendingUp, TrendingDown, Receipt } from 'lucide-react';

export default function Dashboard() {
  const { transactions } = useExpenses();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const totalSpent = thisMonth.reduce((s, t) => s + t.amount, 0);
    const count = thisMonth.length;
    const avg = count > 0 ? totalSpent / count : 0;
    return { totalSpent, count, avg };
  }, [transactions]);

  const recentTxs = transactions.slice(0, 5);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="This Month"
            value={`$${stats.totalSpent.toFixed(2)}`}
          />
          <StatCard
            icon={<Receipt className="h-4 w-4" />}
            label="Transactions"
            value={stats.count.toString()}
          />
          <StatCard
            icon={<TrendingDown className="h-4 w-4" />}
            label="Avg per Transaction"
            value={`$${stats.avg.toFixed(2)}`}
          />
        </div>

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
      </div>
    </AppLayout>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-semibold font-mono-num">{value}</p>
    </div>
  );
}
