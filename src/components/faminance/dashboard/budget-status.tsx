'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { iconMap } from "@/lib/data";
import type { Budget, Transaction, Category } from "@/lib/types";
import { cn, getProgressColor } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";
import { Sparkles, ReceiptText, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useFamilyData } from "@/context/family-data-context";
import { AddTransactionSheet } from "../transactions/add-transaction-sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TransactionTable } from "../transactions/transaction-table";
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

interface BudgetData extends Budget {
    spent: number;
    progress: number;
    categoryInfo: Category | undefined;
    icon: React.ComponentType<{ className?: string }> | null;
}

export function BudgetStatus() {
  const { budgets, categories, transactions, loading, deleteDoc, updateDoc, addDoc } = useFamilyData();
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
      setIsClient(true);
      setCurrentDate(new Date());
  }, []);

  const budgetData = useMemo(() => {
    if (!isClient || loading || !currentDate) return [];

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    return budgets.map(budget => {
      const spent = transactions
        .filter(t => {
            const transactionDate = parseISO(t.date);
            return t.category === budget.category && 
                   t.type === 'expense' &&
                   transactionDate >= monthStart &&
                   transactionDate <= monthEnd;
        })
        .reduce((acc, t) => acc + t.amount, 0);
      const progress = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      const categoryInfo = categories.find(c => c.value === budget.category);
      const Icon = categoryInfo ? iconMap[categoryInfo.icon] : null;

      return { ...budget, spent, progress, categoryInfo, icon: Icon };
    }).sort((a, b) => b.spent - a.spent);
  }, [budgets, transactions, categories, isClient, loading, currentDate]);
  
  const { totalSpent, totalBudgeted, totalProgress } = useMemo(() => {
    const spent = budgetData.reduce((acc, budget) => acc + budget.spent, 0);
    const budgeted = budgetData.reduce((acc, budget) => acc + budget.limit, 0);
    const progress = budgeted > 0 ? (spent / budgeted) * 100 : 0;
    return { totalSpent: spent, totalBudgeted: budgeted, totalProgress: progress };
  }, [budgetData]);

    const handleSaveTransaction = (transaction: Omit<Transaction, 'id' | 'user' | 'familyId'>, id?: string) => {
        if (id) {
            updateDoc('transactions', id, transaction);
        } else {
            addDoc('transactions', transaction);
        }
        setEditingTransaction(undefined);
    };

    const handleEditTransaction = (transaction: Transaction) => {
        setEditingTransaction(transaction);
    };

    const deleteTransaction = (id: string) => deleteDoc('transactions', id);


  return (
    <>
      <section>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                  <ReceiptText className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-headline font-semibold">Estado del Presupuesto</h2>
              </div>
              <Button asChild variant="link" className="text-primary">
                <Link href="/budgets">
                    Ver Todas
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
          </div>
            <Card className="bg-gradient-to-tr from-primary/10 to-background hover:bg-muted transition-colors mb-4 relative">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
                        {isExpanded ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                         <span className="sr-only">Ver/Ocultar detalles</span>
                    </Button>
                </CollapsibleTrigger>
                <Link href="/budgets" className="md:col-span-2 block">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            Resumen General
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Progress value={totalProgress} className="h-3" indicatorClassName={cn(getProgressColor(totalProgress))} />
                            <div className="flex justify-between items-baseline text-sm">
                                <p className="font-medium">
                                    Gastado: <span className="font-bold">{totalSpent.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</span>
                                </p>
                                <p className="text-muted-foreground">
                                    Límite Total: {totalBudgeted.toLocaleString('es-do', { style: 'currency', currency: 'DOP' })}
                                </p>
                            </div>
                            <div className="text-right text-xs font-bold mt-1 text-muted-foreground">
                                {totalProgress.toFixed(0)}% del presupuesto total utilizado
                            </div>
                        </div>
                    </CardContent>
                </Link>
            </Card>
          <CollapsibleContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {budgetData.slice(0, 5).map(budget => {
                    const isOverBudget = budget.progress > 100;
                    const remaining = budget.limit - budget.spent;

                    return (
                        <Dialog key={budget.id} onOpenChange={(isOpen) => !isOpen && setSelectedBudget(null)}>
                            <DialogTrigger asChild>
                                <Card className="bg-card border-border/50 hover:bg-muted transition-colors relative cursor-pointer" onClick={() => setSelectedBudget(budget)}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                {budget.icon && <div className="p-2 bg-muted rounded-md"><budget.icon className="h-5 w-5 text-primary" /></div>}
                                                <p className="font-semibold font-headline">{budget.categoryInfo?.label}</p>
                                            </div>
                                             <div className={cn(
                                                  "text-xs font-semibold", 
                                                  isOverBudget ? "text-destructive" : "text-muted-foreground"
                                              )}>
                                                {remaining.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                                                <span className="ml-1">{isOverBudget ? 'sobre' : 'restante'}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end text-sm mb-1">
                                            <p className="text-muted-foreground">
                                                {budget.spent.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Límite: {budget.limit.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                                            </p>
                                        </div>
                                        <Progress value={Math.min(100, budget.progress)} className="h-2" indicatorClassName={cn(getProgressColor(budget.progress))} />
                                        <div className="text-right text-xs font-bold mt-1 text-muted-foreground">
                                            {budget.progress.toFixed(0)}%
                                        </div>
                                    </CardContent>
                                </Card>
                            </DialogTrigger>
                             <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Transacciones en &quot;{budget.categoryInfo?.label}&quot;</DialogTitle>
                                  <DialogDescription>
                                      Aquí están todas las transacciones para la categoría del presupuesto seleccionado.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="max-h-[60vh] overflow-y-auto">
                                  <TransactionTable 
                                      transactions={transactions.filter(t => t.category === budget.category && t.type === 'expense')}
                                      onEdit={handleEditTransaction}
                                      onDelete={deleteTransaction} 
                                      isLoading={loading}
                                  />
                                </div>
                            </DialogContent>
                        </Dialog>
                    )
                })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>
      {editingTransaction && (
          <AddTransactionSheet
              transactionToEdit={editingTransaction}
              onSave={handleSaveTransaction}
              onClose={() => setEditingTransaction(undefined)}
              forceOpen={!!editingTransaction}
          />
      )}
    </>
  );
}
