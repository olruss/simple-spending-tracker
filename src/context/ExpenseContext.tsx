import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Category, Transaction, TransactionSplit, Account, DEFAULT_ACCOUNTS } from '@/types/expense';

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
  { id: '18', date: '2026-01-25', description: 'Salary - January', amount: -3500.00, categoryId: 'income-salary', accountId: 'wells-9012', mark: 'regular' },
  { id: '19', date: '2026-01-15', description: 'Groceries', amount: 95.20, categoryId: 'food-groceries', accountId: 'chase-1234', mark: 'living' },
  { id: '20', date: '2026-01-10', description: 'Internet Bill', amount: 75.00, categoryId: 'housing-utilities', accountId: 'wells-9012', mark: 'regular' },
];

interface ExpenseContextType {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
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
}

const ExpenseContext = createContext<ExpenseContextType | null>(null);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(SAMPLE_TRANSACTIONS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const accounts = DEFAULT_ACCOUNTS;

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
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const splitTransaction = useCallback((id: string, splits: TransactionSplit[]) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, splits } : t));
  }, []);

  const updateCategoryLimit = useCallback((categoryId: string, limit: number | undefined) => {
    setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, limit } : c));
  }, []);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id);
  }, [categories]);

  const getParentCategories = useCallback(() => {
    return categories.filter(c => c.parentId === null);
  }, [categories]);

  const getChildCategories = useCallback((parentId: string) => {
    return categories.filter(c => c.parentId === parentId);
  }, [categories]);

  const getAccountById = useCallback((id: string) => {
    return accounts.find(a => a.id === id);
  }, [accounts]);

  const addCategory = useCallback((c: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...c, id: crypto.randomUUID() }]);
  }, []);

  const value = useMemo(() => ({
    transactions, categories, accounts, addTransaction, addTransactions,
    updateTransaction, deleteTransaction, splitTransaction, updateCategoryLimit,
    getCategoryById, getParentCategories, getChildCategories, getAccountById, addCategory,
  }), [transactions, categories, accounts, addTransaction, addTransactions,
    updateTransaction, deleteTransaction, splitTransaction, updateCategoryLimit,
    getCategoryById, getParentCategories, getChildCategories, getAccountById, addCategory]);

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpenseProvider');
  return ctx;
}
