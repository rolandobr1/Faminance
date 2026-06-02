
export type FirestoreDocument = {
  id: string;
  familyId: string; // To support multi-tenancy
}

export type FamilySettings = FirestoreDocument & {
  initialCashBalance: number;
  reminderDays?: number; // Days before due date to show payment reminders
};

export type RecurringFrequency = 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'yearly';

export type Transaction = FirestoreDocument & {
  date: string;
  description?: string;
  amount: number;
  type: 'income' | 'expense';
  currency: 'DOP' | 'USD';
  category: string;
  paymentMethod: 'Tarjeta de Crédito' | 'Tarjeta de Débito' | 'Transferencia Bancaria' | 'Efectivo' | 'Pago de Tarjeta';
  creditCardId?: string; // Link to the specific credit card used
  accountId?: string; // Link to a bank account, for deposits/withdrawals
  user: string;
  receiptUrl?: string;
  isShared: boolean;
  sharedWith: string[];
  isRecurring?: boolean;
  frequency?: RecurringFrequency;
  nextDueDate?: string; // New field for recurring transactions
  budgetId?: string;
  loanId?: string;
  goalId?: string; // Link to savings goal for automatic contributions
};

export type Category = FirestoreDocument & {
  value: string;
  label: string;
  icon: string;
  type: 'income' | 'expense';
  isActive: boolean;
  parentId?: string;
};

export type Budget = FirestoreDocument & {
  category: string;
  limit: number;
  spent: number;
  period: 'mensual' | 'semanal' | 'anual';
  loanId?: string;
};

export type SavingsGoal = FirestoreDocument & {
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: 'Alta' | 'Media' | 'Baja';
  accountId?: string;
  icon?: string;
  isRecurring?: boolean;
  frequency?: RecurringFrequency;
  contributionAmount?: number;
  nextContributionDate?: string;
};

export type User = {
  id: string;
  name: string;
  role: 'Admin' | 'Usuario';
  avatar?: string;      // emoji or initials override
  allowance?: number;   // monthly allowance in DOP
  showBottomNav?: boolean;
  bottomNavItems?: string[];
  showExpenseOverview?: boolean;
};

export type Account = FirestoreDocument & {
  name: string;
  type: 'ahorro' | 'corriente';
  balance: number;
  bank: string;
  isRecurringDeposit?: boolean;
  depositAmount?: number;
  depositFrequency?: RecurringFrequency;
  depositSourceAccountId?: string; // "cash" or an account ID
  depositCategory?: string; // User selected category for the deposit expense
  nextDepositDate?: string;
};

export type CreditCard = FirestoreDocument & {
  name: string;
  bank: string;
  last4: string;
  limitDOP: number;
  limitUSD: number;
  spentDOP: number;
  spentUSD: number;
  cutoffDate: number;
  paymentDays: number;
};

export type Loan = FirestoreDocument & {
  name: string;
  totalAmount: number;
  paidAmount: number;
  monthlyPayment: number;
  paymentDate: number; // Day of the month
};

export type OverduePayment = {
  id: string;
  name: string;
  dueDate: Date;
  amount: number;
  type: 'loan' | 'card';
  currency: 'DOP' | 'USD';
  status: 'overdue' | 'dueSoon';
};

export type FamilyData = {
  familyId: string;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  accounts: Account[];
  creditCards: CreditCard[];
  loans: Loan[];
  settings?: FamilySettings;
};
