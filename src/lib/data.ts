
import type { Transaction, Budget, SavingsGoal, User, Category, Account, CreditCard, Loan } from '@/lib/types';
import { ShoppingCart, Utensils, Car, Home, HeartPulse, Film, Plus, Briefcase, GraduationCap, Gift, Smile, PiggyBank, Landmark, Users, Phone, Tv, Bolt, Droplets, Scissors, Baby, UserSquare, HandCoins, CreditCard as CreditCardIcon, Banknote, ArrowDownUp, Receipt, BarChartBig, AlertTriangle, Repeat } from 'lucide-react';

export const users: User[] = [
  { id: 'user1', name: 'Sarah', role: 'Admin' },
  { id: 'user2', name: 'Rolando', role: 'Admin' },
];

export const CHART_COLORS = [
    'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))',
    'hsl(var(--chart-6))', 'hsl(var(--chart-7))', 'hsl(var(--chart-8))', 'hsl(var(--chart-9))', 'hsl(var(--chart-10))',
];


export const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  ShoppingCart,
  Utensils,
  Car,
  Home,
  HeartPulse,
  Film,
  Briefcase,
  GraduationCap,
  Gift,
  Plus,
  Smile,
  PiggyBank,
  Landmark,
  Users,
  Phone,
  Tv,
  Bolt,
  Droplets,
  Scissors,
  Baby,
  UserSquare,
  HandCoins,
  CreditCard: CreditCardIcon,
  Banknote,
  ArrowDownUp,
  Receipt,
  BarChartBig,
  AlertTriangle,
  Repeat,
};

export const availableIcons = [
    { value: 'ShoppingCart', icon: ShoppingCart, label: 'Compras' },
    { value: 'Utensils', icon: Utensils, label: 'Restaurantes' },
    { value: 'Car', icon: Car, label: 'Transporte' },
    { value: 'Home', icon: Home, label: 'Vivienda' },
    { value: 'HeartPulse', icon: HeartPulse, label: 'Salud' },
    { value: 'Film', icon: Film, label: 'Entretenimiento' },
    { value: 'Briefcase', icon: Briefcase, label: 'Trabajo' },
    { value: 'GraduationCap', icon: GraduationCap, label: 'Educación' },
    { value: 'Gift', icon: Gift, label: 'Regalos' },
    { value: 'Smile', icon: Smile, label: 'Cuidado Personal' },
    { value: 'PiggyBank', icon: PiggyBank, label: 'Ahorro' },
    { value: 'Landmark', icon: Landmark, label: 'Banco' },
    { value: 'Users', icon: Users, label: 'Familia/Social' },
    { value: 'Phone', icon: Phone, label: 'Móvil/Comunicaciones' },
    { value: 'Tv', icon: Tv, label: 'Suscripciones/TV' },
    { value: 'Bolt', icon: Bolt, label: 'Servicios Públicos' },
    { value: 'Droplets', icon: Droplets, label: 'Agua/Gas' },
    { value: 'Scissors', icon: Scissors, label: 'Belleza' },
    { value: 'Baby', icon: Baby, label: 'Bebé/Niños' },
    { value: 'UserSquare', icon: UserSquare, label: 'Personal' },
    { value: 'HandCoins', icon: HandCoins, label: 'Donaciones/Ayudas' },
    { value: 'CreditCard', icon: CreditCardIcon, label: 'Tarjeta de Crédito' },
    { value: 'Banknote', icon: Banknote, label: 'Salario' },
    { value: 'Repeat', icon: Repeat, label: 'Recurrente/Transferencia' },
    { value: 'Plus', icon: Plus, label: 'Otros' },
];

export const defaultCategories: Omit<Category, 'id' | 'familyId'>[] = [
    // Expenses
    { value: 'food', label: 'Comida & Bebida', icon: 'Utensils', type: 'expense', isActive: true },
    { value: 'groceries', label: 'Supermercado', icon: 'ShoppingCart', type: 'expense', isActive: true },
    { value: 'transport', label: 'Transporte', icon: 'Car', type: 'expense', isActive: true },
    { value: 'housing', label: 'Vivienda', icon: 'Home', type: 'expense', isActive: true },
    { value: 'bills', label: 'Servicios (Luz, Agua, etc)', icon: 'Bolt', type: 'expense', isActive: true },
    { value: 'subscriptions', label: 'Suscripciones', icon: 'Tv', type: 'expense', isActive: true },
    { value: 'health', label: 'Salud', icon: 'HeartPulse', type: 'expense', isActive: true },
    { value: 'entertainment', label: 'Entretenimiento', icon: 'Film', type: 'expense', isActive: true },
    { value: 'personal-care', label: 'Cuidado Personal', icon: 'Smile', type: 'expense', isActive: true },
    { value: 'education', label: 'Educación', icon: 'GraduationCap', type: 'expense', isActive: true },
    { value: 'shopping', label: 'Compras', icon: 'Briefcase', type: 'expense', isActive: true },
    { value: 'gifts', label: 'Regalos', icon: 'Gift', type: 'expense', isActive: true },
    { value: 'family', label: 'Familia', icon: 'Users', type: 'expense', isActive: false },
    { value: 'debt-payment', label: 'Pago de Deudas', icon: 'CreditCard', type: 'expense', isActive: true },
    { value: 'credit-card-payment', label: 'Pago de Tarjeta de Crédito', icon: 'CreditCard', type: 'expense', isActive: true },
    { value: 'transfer', label: 'Transferencia', icon: 'Repeat', type: 'expense', isActive: true },
    { value: 'other-expense', label: 'Otros Gastos', icon: 'Plus', type: 'expense', isActive: true },
    
    // Income
    { value: 'salary', label: 'Salario', icon: 'Banknote', type: 'income', isActive: true },
    { value: 'freelance', label: 'Trabajo Independiente', icon: 'Briefcase', type: 'income', isActive: true },
    { value: 'gifts-income', label: 'Regalos Recibidos', icon: 'Gift', type: 'income', isActive: true },
    { value: 'transfer-income', label: 'Transferencia', icon: 'Repeat', type: 'income', isActive: true },
    { value: 'other-income', label: 'Otros Ingresos', icon: 'Plus', type: 'income', isActive: true },
];

// Deprecated: Data below is now managed via Firestore and respective contexts.
export const initialCategories: Category[] = [];
export const transactions: Transaction[] = [];
export const budgets: Budget[] = [];
export const savingsGoals: SavingsGoal[] = [];
export const accounts: Account[] = [];
export const creditCards: CreditCard[] = [];
export const loans: Loan[] = [];
