import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { useExpenses } from '@/context/ExpenseContext';
import { CategoryWithAmount } from '@/types/expense';
import { ArrowLeft } from 'lucide-react';

const CHART_COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--chart-6))',
  'hsl(var(--chart-7))', 'hsl(var(--chart-8))',
];

import { TransactionMark } from '@/types/expense';

export default function CategoryPieChart({ filterMark }: { filterMark?: TransactionMark | null }) {
  const { transactions: allTransactions, categories, getParentCategories, getChildCategories } = useExpenses();
  
  const transactions = useMemo(() => {
    let txs = allTransactions.filter(t => !t.linkedTransferId && t.mark !== 'adjustment');
    if (filterMark) txs = txs.filter(t => t.mark === filterMark);
    return txs;
  }, [allTransactions, filterMark]);
  const [drillParentId, setDrillParentId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const data = useMemo(() => {
    const cats = drillParentId ? getChildCategories(drillParentId) : getParentCategories();
    
    return cats.map(cat => {
      const childIds = drillParentId
        ? [cat.id]
        : [cat.id, ...categories.filter(c => c.parentId === cat.id).map(c => c.id)];

      const totalAmount = transactions
        .filter(t => {
          if (t.splits?.length) {
            return t.splits.some(s => childIds.includes(s.categoryId));
          }
          return childIds.includes(t.categoryId);
        })
        .reduce((sum, t) => {
          if (t.splits?.length) {
            return sum + t.splits
              .filter(s => childIds.includes(s.categoryId))
              .reduce((s, sp) => s + sp.amount, 0);
          }
          return sum + t.amount;
        }, 0);

      return { ...cat, totalAmount } as CategoryWithAmount;
    }).filter(c => c.totalAmount > 0);
  }, [transactions, categories, drillParentId, getParentCategories, getChildCategories]);

  const total = data.reduce((s, d) => s + d.totalAmount, 0);
  const parentName = drillParentId ? categories.find(c => c.id === drillParentId)?.name : null;

  const handleClick = (entry: CategoryWithAmount) => {
    if (!drillParentId && categories.some(c => c.parentId === entry.id)) {
      setDrillParentId(entry.id);
      setActiveIndex(undefined);
    }
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
    return (
      <g>
        <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground text-sm font-medium">
          {payload.name}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted-foreground text-xs font-mono-num">
          ${payload.totalAmount.toFixed(0)} ({(percent * 100).toFixed(0)}%)
        </text>
        <Sector
          cx={cx} cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <div className="flex flex-col items-center">
      {drillParentId && (
        <button
          onClick={() => { setDrillParentId(null); setActiveIndex(undefined); }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 self-start"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to all categories
        </button>
      )}
      {parentName && (
        <p className="text-sm font-medium mb-1">{parentName}</p>
      )}
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={100}
            dataKey="totalAmount"
            nameKey="name"
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(undefined)}
            onClick={(_, index) => handleClick(data[index])}
            className="cursor-pointer outline-none"
            stroke="hsl(var(--card))"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={entry.id} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {activeIndex === undefined && (
        <p className="text-center font-mono-num text-lg font-semibold -mt-4">
          ${total.toFixed(2)}
        </p>
      )}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {data.map((entry, i) => (
          <button
            key={entry.id}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => handleClick(entry)}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(undefined)}
          >
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color || CHART_COLORS[i % CHART_COLORS.length] }}
            />
            {entry.name}
          </button>
        ))}
      </div>
    </div>
  );
}
