
'use client';

import { BudgetStatus } from "@/components/faminance/dashboard/budget-status";
import { SavingsOverview } from "@/components/faminance/dashboard/savings-overview";
import { SummaryCards } from "@/components/faminance/dashboard/summary-cards";
import { FloatingTransactionButtons } from "@/components/faminance/transactions/floating-action-buttons";
import { PaymentReminders } from "@/components/faminance/dashboard/payment-reminders";
import { Header } from "@/components/faminance/header";
import { ExpenseOverview } from "@/components/faminance/dashboard/expense-overview";
import { OnboardingCard } from "@/components/faminance/dashboard/onboarding-card";
import { useAuth } from "@/context/auth-context";
import { useFamilyData } from "@/context/family-data-context";

import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { transactions, categories, members, budgets, goals, loans, creditCards, loading } = useFamilyData();
  const { currentUser } = useAuth();
  
  const userConfig = members.find(m => m.id === currentUser?.id);
  const showExpenseOverview = userConfig?.showExpenseOverview ?? true;

  if (loading) {
    return (
      <>
        <Header title="Panel de Control" />
        <main className="flex flex-col items-center justify-center min-h-[50vh] p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-slate-400 mt-2 animate-pulse">Cargando datos de Faminance...</p>
        </main>
      </>
    );
  }

  const isDashboardEmpty = 
    transactions.length === 0 && 
    budgets.length === 0 && 
    (goals?.length ?? 0) === 0 && 
    loans.length === 0 && 
    creditCards.length === 0;

  return (
    <>
      <Header title="Panel de Control" />
      <main className="grid flex-1 items-start gap-8 p-4 sm:px-6 sm:py-0 md:gap-8 pb-20 sm:pb-8">
        {isDashboardEmpty ? (
            <OnboardingCard />
        ) : (
            <>
                <PaymentReminders />
                <SummaryCards />
                {showExpenseOverview && (
                    <ExpenseOverview transactions={transactions} categories={categories} />
                )}
                <BudgetStatus />
                <SavingsOverview />
            </>
        )}
      </main>

      <FloatingTransactionButtons />
    </>
  );
}
