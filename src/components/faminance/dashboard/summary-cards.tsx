'use client';

import { Button } from "@/components/ui/button";
import { CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { startOfMonth, endOfMonth, parseISO } from "date-fns";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useFamilyData } from "@/context/family-data-context";

export function SummaryCards() {
  const { transactions, loading: transactionsLoading } = useFamilyData();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const summary = useMemo(() => {
    if (!isClient) {
        return { income: 0, expenses: 0, balance: 0 };
    }
    const now = new Date();
    const firstDay = startOfMonth(now);
    const lastDay = endOfMonth(now);

    const thisMonthTransactions = transactions.filter(t => {
        const transactionDate = parseISO(t.date);
        return transactionDate >= firstDay && transactionDate <= lastDay;
    });

    const income = thisMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = thisMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expenses;
    
    return { income, expenses, balance };
  }, [transactions, isClient]);


  return (
    <TooltipProvider>
      <div className="relative overflow-hidden rounded-3xl p-6 border border-slate-700 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 min-h-[200px]">
          {/* Decorative circles */}
          <div className="absolute top-[-50px] right-[-50px] h-40 w-40 bg-gradient-to-t from-cyan-500/20 to-blue-500/20 rounded-full blur-2xl opacity-50"></div>
          <div className="absolute bottom-[-60px] left-[-60px] h-40 w-40 bg-gradient-to-t from-purple-500/10 to-pink-500/10 rounded-full blur-3xl opacity-40"></div>

          <div className="relative z-10">
            {transactionsLoading || !isClient ? (
                <div className="flex items-center justify-center h-full min-h-[150px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                  <div className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div>
                          <p className="text-sm font-medium text-muted-foreground">Balance del Mes</p>
                           <p className={cn(
                              "text-4xl font-bold font-headline",
                              summary.balance > 0 ? "text-green-400" : (summary.balance < 0 ? "text-destructive" : ""),
                            )}>
                              {summary.balance.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                          </p>
                      </div>
                      <div className="flex items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href="/debts" passHref>
                                        <Button variant="ghost" size="icon" className="border-2 border-primary/20 rounded-lg bg-primary/10 text-primary/80 h-9 w-9">
                                            <CreditCard className="h-5 w-5" />
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Ver Deudas y Tarjetas</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href="/goals" passHref>
                                        <Button variant="ghost" size="icon" className="border-2 border-green-500/20 rounded-lg bg-green-500/10 text-green-400 h-9 w-9">
                                            <ShieldCheck className="h-5 w-5" />
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Ver Metas de Ahorro</p>
                                </TooltipContent>
                           </Tooltip>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-left mt-6 pt-4 border-t border-slate-700/50">
                      <div>
                          <p className="text-sm text-muted-foreground">Ingresos</p>
                          <p className="text-lg font-semibold text-green-400">{summary.income.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</p>
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Gastos</p>
                          <p className="text-lg font-semibold text-red-400">{summary.expenses.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</p>
                      </div>
                  </div>
                </>
            )}
          </div>
      </div>
    </TooltipProvider>
  );
}
