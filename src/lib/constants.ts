/**
 * Faminance – Centralized Constants
 * Use these instead of hard-coded strings throughout the codebase.
 */

// ─── Firestore collection names ────────────────────────────────────────────
export const COLLECTIONS = {
  TRANSACTIONS:   'transactions',
  CATEGORIES:     'categories',
  BUDGETS:        'budgets',
  SAVINGS_GOALS:  'savingsGoals',
  ACCOUNTS:       'accounts',
  CREDIT_CARDS:   'creditCards',
  LOANS:          'loans',
  MEMBERS:        'members',
  SETTINGS:       'settings',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

// ─── App routes ─────────────────────────────────────────────────────────────
export const ROUTES = {
  HOME:         '/',
  DASHBOARD:    '/dashboard',
  TRANSACTIONS: '/transactions',
  ACCOUNTS:     '/accounts',
  BUDGETS:      '/budgets',
  GOALS:        '/goals',
  DEBTS:        '/debts',
  SETTINGS:     '/settings',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

// ─── Family ──────────────────────────────────────────────────────────────────
export const FAMILY_ID = 'main-family';

// ─── Currencies ──────────────────────────────────────────────────────────────
export const CURRENCIES = {
  DOP: 'DOP',
  USD: 'USD',
} as const;

// ─── Transaction types ───────────────────────────────────────────────────────
export const TRANSACTION_TYPES = {
  INCOME:  'income',
  EXPENSE: 'expense',
} as const;

// ─── Special category values ─────────────────────────────────────────────────
export const SPECIAL_CATEGORIES = {
  TRANSFER:        'transfer',
  TRANSFER_INCOME: 'transfer-income',
  CREDIT_PAYMENT:  'credit-card-payment',
  DEBT_PAYMENT:    'debt-payment',
} as const;

// ─── UI ──────────────────────────────────────────────────────────────────────
export const SEARCH_DEBOUNCE_MS = 300;
