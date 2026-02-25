export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  limit?: number; // monthly limit
  color?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number; // positive = expense, negative = income
  categoryId: string;
  splits?: TransactionSplit[];
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
