export type TransactionMark = 'planned' | 'transfer' | 'regular' | 'living' | 'adjustment';

export interface Account {
  id: string;
  name: string;
  lastFour: string;
  type: 'credit' | 'savings' | 'checking';
  balance: number;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  limit?: number;
  color?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number; // positive = expense, negative = income
  categoryId: string;
  accountId?: string;
  note?: string;
  mark?: TransactionMark;
  splits?: TransactionSplit[];
  starred?: boolean;
  receiptUrl?: string;
  linkedTransferId?: string;
}

export interface TransactionSplit {
  categoryId: string;
  amount: number;
  description?: string;
}

export interface CategoryWithAmount extends Category {
  totalAmount: number;
  children?: CategoryWithAmount[];
}

export interface MonthlyNote {
  id: string;
  month: string; // YYYY-MM
  text: string;
  createdAt: string;
}

export const MARKS: { value: TransactionMark; label: string; color: string }[] = [
  { value: 'planned', label: 'Planned', color: 'hsl(var(--chart-2))' },
  { value: 'transfer', label: 'Transfer', color: 'hsl(var(--chart-4))' },
  { value: 'regular', label: 'Regular', color: 'hsl(var(--chart-6))' },
  { value: 'living', label: 'Living', color: 'hsl(var(--chart-1))' },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'chase-1234', name: 'Chase', lastFour: '1234', type: 'credit', balance: 2500 },
  { id: 'bofa-5678', name: 'Bank of America', lastFour: '5678', type: 'savings', balance: 15000 },
  { id: 'wells-9012', name: 'Wells Fargo', lastFour: '9012', type: 'checking', balance: 4200 },
];
