import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Category, Transaction, TransactionSplit, Account, MonthlyNote, DEFAULT_ACCOUNTS } from '@/types/expense';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'income', name: 'Income', parentId: null, color: 'hsl(var(--success))' },
  { id: 'income-salary', name: 'Salary', parentId: 'income' },
  { id: 'income-freelance', name: 'Freelance', parentId: 'income' },
  { id: 'income-other', name: 'Other Income', parentId: 'income' },
  { id: 'food', name: 'Food & Dining', parentId: null, color: 'hsl(var(--chart-1))' },
  { id: 'food-groceries', name: 'Groceries', parentId: 'food' },
  { id: 'food-restaurants', name: 'Restaurants', parentId: 'food' },
  { id: 'food-coffee', name: 'Coffee & Drinks', parentId: 'food' },
  { id: 'transport', name: 'Transportation', parentId: null, color: 'hsl(var(--chart-2))' },
  { id: 'transport-fuel', name: 'Fuel', parentId: 'transport' },
  { id: 'transport-public', name: 'Public Transit', parentId: 'transport' },
  { id: 'housing', name: 'Housing', parentId: null, color: 'hsl(var(--chart-3))' },
  { id: 'housing-rent', name: 'Rent', parentId: 'housing' },
  { id: 'housing-utilities', name: 'Utilities', parentId: 'housing' },
  { id: 'entertainment', name: 'Entertainment', parentId: null, color: 'hsl(var(--chart-4))' },
  { id: 'entertainment-streaming', name: 'Streaming', parentId: 'entertainment' },
  { id: 'entertainment-events', name: 'Events', parentId: 'entertainment' },
  { id: 'health', name: 'Health', parentId: null, color: 'hsl(var(--chart-5))' },
  { id: 'health-pharmacy', name: 'Pharmacy', parentId: 'health' },
  { id: 'health-gym', name: 'Gym', parentId: 'health' },
  { id: 'shopping', name: 'Shopping', parentId: null, color: 'hsl(var(--chart-6))' },
  { id: 'shopping-clothes', name: 'Clothes', parentId: 'shopping' },
  { id: 'shopping-electronics', name: 'Electronics', parentId: 'shopping' },
  { id: 'other', name: 'Other', parentId: null, color: 'hsl(var(--chart-7))' },
];

const SAMPLE_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2026-02-24', description: 'Whole Foods Market', amount: 87.50, categoryId: 'food-groceries', accountId: 'chase-1234', mark: 'living' },
  { id: '2', date: '2026-02-23', description: 'Shell Gas Station', amount: 52.00, categoryId: 'transport-fuel', accountId: 'chase-1234', mark: 'living' },
  { id: '3', date: '2026-02-22', description: 'Netflix', amount: 15.99, categoryId: 'entertainment-streaming', accountId: 'chase-1234', mark: 'regular' },
  { id: '4', date: '2026-02-21', description: 'Starbucks', amount: 6.75, categoryId: 'food-coffee', accountId: 'wells-9012' },
  { id: '5', date: '2026-02-20', description: 'Monthly Rent', amount: 1800.00, categoryId: 'housing-rent', accountId: 'wells-9012', mark: 'regular' },
  { id: '6', date: '2026-02-19', description: 'CVS Pharmacy', amount: 23.40, categoryId: 'health-pharmacy', accountId: 'chase-1234' },
  { id: '7', date: '2026-02-18', description: 'Uber Eats - Sushi Place', amount: 34.20, categoryId: 'food-restaurants', accountId: 'chase-1234' },
  { id: '8', date: '2026-02-17', description: 'Electric Bill', amount: 120.00, categoryId: 'housing-utilities', accountId: 'wells-9012', mark: 'regular' },
  { id: '9', date: '2026-02-16', description: 'Planet Fitness', amount: 25.00, categoryId: 'health-gym', accountId: 'chase-1234', mark: 'regular' },
  { id: '10', date: '2026-02-15', description: 'Amazon - Headphones', amount: 79.99, categoryId: 'shopping-electronics', accountId: 'chase-1234', mark: 'planned' },
  { id: '11', date: '2026-02-14', description: 'Concert Tickets', amount: 150.00, categoryId: 'entertainment-events', accountId: 'chase-1234', mark: 'planned' },
  { id: '12', date: '2026-02-13', description: 'Metro Card', amount: 33.00, categoryId: 'transport-public', accountId: 'wells-9012', mark: 'regular' },
  { id: '13', date: '2026-02-12', description: 'H&M', amount: 65.00, categoryId: 'shopping-clothes', accountId: 'chase-1234' },
  { id: '14', date: '2026-02-11', description: 'Trader Joes', amount: 54.30, categoryId: 'food-groceries', accountId: 'chase-1234', mark: 'living' },
  { id: '15', date: '2026-02-10', description: 'Spotify', amount: 9.99, categoryId: 'entertainment-streaming', accountId: 'chase-1234', mark: 'regular' },
  { id: '16', date: '2026-02-25', description: 'Salary - February', amount: -3500.00, categoryId: 'income-salary', accountId: 'wells-9012', mark: 'regular' },
  { id: '17', date: '2026-02-14', description: 'Freelance Project', amount: -800.00, categoryId: 'income-freelance', accountId: 'bofa-5678' },
  // Transfer pair example
  { id: '18', date: '2026-02-10', description: 'Transfer to Savings', amount: 500.00, categoryId: 'other', accountId: 'wells-9012', mark: 'transfer', linkedTransferId: '19' },
  { id: '19', date: '2026-02-10', description: 'Transfer from Checking', amount: -500.00, categoryId: 'other', accountId: 'bofa-5678', mark: 'transfer', linkedTransferId: '18' },
  { id: '20', date: '2026-01-25', description: 'Salary - January', amount: -3500.00, categoryId: 'income-salary', accountId: 'wells-9012', mark: 'regular' },
  { id: '21', date: '2026-01-15', description: 'Groceries', amount: 95.20, categoryId: 'food-groceries', accountId: 'chase-1234', mark: 'living' },
  { id: '22', date: '2026-01-10', description: 'Internet Bill', amount: 75.00, categoryId: 'housing-utilities', accountId: 'wells-9012', mark: 'regular' },
  { id: '23', date: '2025-12-25', description: 'Salary - December', amount: -3500.00, categoryId: 'income-salary', accountId: 'wells-9012', mark: 'regular' },
  { id: '24', date: '2025-12-20', description: 'Holiday Shopping', amount: 320.00, categoryId: 'shopping-clothes', accountId: 'chase-1234', mark: 'planned' },
  { id: '25', date: '2025-12-15', description: 'Groceries', amount: 110.00, categoryId: 'food-groceries', accountId: 'chase-1234', mark: 'living' },
];

const SAMPLE_NOTES: MonthlyNote[] = [
  { id: 'n1', month: '2026-02', text: 'High spending month due to concert tickets and new headphones. Need to cut back on dining out.', createdAt: '2026-02-28' },
  { id: 'n2', month: '2026-01', text: 'Good month overall. Kept groceries under budget.', createdAt: '2026-01-31' },
];

interface ExpenseContextType {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  monthlyNotes: MonthlyNote[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  addTransactions: (txs: Omit<Transaction, 'id'>[]) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: string) => void;
  splitTransaction: (id: string, splits: TransactionSplit[]) => void;
  updateCategoryLimit: (categoryId: string, limit: number | undefined) => void;
  getCategoryById: (id: string) => Category | undefined;
  getParentCategories: () => Category[];
  getChildCategories: (parentId: string) => Category[];
  getAccountById: (id: string) => Account | undefined;
  addCategory: (c: Omit<Category, 'id'>) => void;
  toggleStar: (id: string) => void;
  linkTransfer: (id1: string, id2: string) => void;
  unlinkTransfer: (id: string) => void;
  suggestTransferPairs: () => Array<[Transaction, Transaction]>;
  addMonthlyNote: (month: string, text: string) => void;
  updateMonthlyNote: (id: string, text: string) => void;
  deleteMonthlyNote: (id: string) => void;
  updateAccountBalance: (accountId: string, newBalance: number) => void;
}

const ExpenseContext = createContext<ExpenseContextType | null>(null);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(SAMPLE_TRANSACTIONS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [monthlyNotes, setMonthlyNotes] = useState<MonthlyNote[]>(SAMPLE_NOTES);

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [{ ...t, id: crypto.randomUUID() }, ...prev]);
  }, []);

  const addTransactions = useCallback((txs: Omit<Transaction, 'id'>[]) => {
    const newTxs = txs.map(t => ({ ...t, id: crypto.randomUUID() }));
    setTransactions(prev => [...newTxs, ...prev]);
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Omit<Transaction, 'id'>>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => {
      const target = prev.find(t => t.id === id);
      // Unlink partner if linked
      if (target?.linkedTransferId) {
        return prev
          .filter(t => t.id !== id)
          .map(t => t.id === target.linkedTransferId ? { ...t, linkedTransferId: undefined } : t);
      }
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const splitTransaction = useCallback((id: string, splits: TransactionSplit[]) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, splits } : t));
  }, []);

  const updateCategoryLimit = useCallback((categoryId: string, limit: number | undefined) => {
    setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, limit } : c));
  }, []);

  const getCategoryById = useCallback((id: string) => categories.find(c => c.id === id), [categories]);
  const getParentCategories = useCallback(() => categories.filter(c => c.parentId === null), [categories]);
  const getChildCategories = useCallback((parentId: string) => categories.filter(c => c.parentId === parentId), [categories]);
  const getAccountById = useCallback((id: string) => accounts.find(a => a.id === id), [accounts]);

  const addCategory = useCallback((c: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...c, id: crypto.randomUUID() }]);
  }, []);

  const toggleStar = useCallback((id: string) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, starred: !t.starred } : t));
  }, []);

  const linkTransfer = useCallback((id1: string, id2: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id1) return { ...t, linkedTransferId: id2, mark: 'transfer' as const };
      if (t.id === id2) return { ...t, linkedTransferId: id1, mark: 'transfer' as const };
      return t;
    }));
  }, []);

  const unlinkTransfer = useCallback((id: string) => {
    setTransactions(prev => {
      const target = prev.find(t => t.id === id);
      if (!target?.linkedTransferId) return prev;
      const partnerId = target.linkedTransferId;
      return prev.map(t => {
        if (t.id === id || t.id === partnerId) return { ...t, linkedTransferId: undefined, mark: undefined };
        return t;
      });
    });
  }, []);

  const suggestTransferPairs = useCallback(() => {
    const unlinked = transactions.filter(t => !t.linkedTransferId && t.accountId);
    const pairs: Array<[Transaction, Transaction]> = [];
    const used = new Set<string>();

    for (let i = 0; i < unlinked.length; i++) {
      if (used.has(unlinked[i].id)) continue;
      for (let j = i + 1; j < unlinked.length; j++) {
        if (used.has(unlinked[j].id)) continue;
        const a = unlinked[i], b = unlinked[j];
        // Same absolute amount, different accounts, opposite signs, within 3 days
        if (
          Math.abs(Math.abs(a.amount) - Math.abs(b.amount)) < 0.01 &&
          a.accountId !== b.accountId &&
          ((a.amount > 0 && b.amount < 0) || (a.amount < 0 && b.amount > 0))
        ) {
          const daysDiff = Math.abs(new Date(a.date).getTime() - new Date(b.date).getTime()) / (1000 * 60 * 60 * 24);
          if (daysDiff <= 3) {
            pairs.push([a, b]);
            used.add(a.id);
            used.add(b.id);
          }
        }
      }
    }
    return pairs;
  }, [transactions]);

  const addMonthlyNote = useCallback((month: string, text: string) => {
    setMonthlyNotes(prev => [...prev, { id: crypto.randomUUID(), month, text, createdAt: new Date().toISOString().slice(0, 10) }]);
  }, []);

  const updateMonthlyNote = useCallback((id: string, text: string) => {
    setMonthlyNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n));
  }, []);

  const deleteMonthlyNote = useCallback((id: string) => {
    setMonthlyNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const updateAccountBalance = useCallback((accountId: string, newBalance: number) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    const diff = newBalance - account.balance;
    // Create adjustment transaction
    const adjTx: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      description: `Balance adjustment - ${account.name}`,
      amount: diff > 0 ? diff : diff, // positive diff = expense-like (balance increased = money came in = negative amount)
      categoryId: 'other',
      accountId,
      mark: 'adjustment',
    };
    // Actually: if balance goes up, that means money came in (income = negative amount)
    // If balance goes down, money went out (expense = positive amount)
    adjTx.amount = -diff; // negative diff means balance went down = expense (positive), positive diff = income (negative)
    setTransactions(prev => [adjTx, ...prev]);
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, balance: newBalance } : a));
  }, [accounts]);

  const value = useMemo(() => ({
    transactions, categories, accounts, monthlyNotes,
    addTransaction, addTransactions, updateTransaction, deleteTransaction,
    splitTransaction, updateCategoryLimit, getCategoryById, getParentCategories,
    getChildCategories, getAccountById, addCategory, toggleStar,
    linkTransfer, unlinkTransfer, suggestTransferPairs,
    addMonthlyNote, updateMonthlyNote, deleteMonthlyNote, updateAccountBalance,
  }), [transactions, categories, accounts, monthlyNotes,
    addTransaction, addTransactions, updateTransaction, deleteTransaction,
    splitTransaction, updateCategoryLimit, getCategoryById, getParentCategories,
    getChildCategories, getAccountById, addCategory, toggleStar,
    linkTransfer, unlinkTransfer, suggestTransferPairs,
    addMonthlyNote, updateMonthlyNote, deleteMonthlyNote, updateAccountBalance]);

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpenseProvider');
  return ctx;
}
