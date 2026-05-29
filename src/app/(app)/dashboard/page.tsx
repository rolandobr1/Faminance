
'use client';

import { BudgetStatus } from "@/components/faminance/dashboard/budget-status";
import { SavingsOverview } from "@/components/faminance/dashboard/savings-overview";
import { SummaryCards } from "@/components/faminance/dashboard/summary-cards";
import { FloatingTransactionButtons } from "@/components/faminance/transactions/floating-action-buttons";
import { PaymentReminders } from "@/components/faminance/dashboard/payment-reminders";
import { Header } from "@/components/faminance/header";
import { TrendChart } from "@/components/faminance/dashboard/trend-chart";
import { useFamilyData } from "@/context/family-data-context";

export default function DashboardPage() {
  const { transactions } = useFamilyData();

  return (
    <>
      <Header title="Panel de Control" />
      <main className="grid flex-1 items-start gap-8 p-4 sm:px-6 sm:py-0 md:gap-8 pb-20 sm:pb-8">
        <PaymentReminders />
        <SummaryCards />
        <TrendChart transactions={transactions} />
        <BudgetStatus />
        <SavingsOverview />
      </main>

      <FloatingTransactionButtons />
    </>
  );
}
