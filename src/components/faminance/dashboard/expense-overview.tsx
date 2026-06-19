'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Transaction, Category } from '@/lib/types';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExpenseOverviewProps {
  transactions: Transaction[];
  categories: Category[];
}

// Generate an array of nice colors for the pie chart
const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f43f5e', // rose
  '#84cc16', // lime
];

export function ExpenseOverview({ transactions, categories }: ExpenseOverviewProps) {
  const { chartData, recentTransactions } = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    // 1. Calculate Expenses for the current month
    const monthlyExpenses = transactions.filter(t => {
      const tDate = parseISO(t.date);
      return tDate >= start && 
             tDate <= end && 
             t.type === 'expense' &&
             t.category !== 'transfer' && 
             t.category !== 'transfer-income' &&
             t.category !== 'credit-card-payment' &&
             t.category !== 'debt-payment';
    });

    const expensesByCategory = new Map<string, number>();
    
    monthlyExpenses.forEach(t => {
      const current = expensesByCategory.get(t.category) || 0;
      expensesByCategory.set(t.category, current + t.amount);
    });

    const data = Array.from(expensesByCategory.entries()).map(([categoryValue, amount]) => {
      const categoryLabel = categories.find(c => c.value === categoryValue)?.label || categoryValue;
      return {
        name: categoryLabel,
        value: amount,
      };
    }).sort((a, b) => b.value - a.value); // Sort by largest expense first

    // 2. Get last 5 transactions of the current month
    const recentTransactions: Transaction[] = [];
    for (const t of transactions) {
      if (recentTransactions.length >= 5) break;
      const tDate = parseISO(t.date);
      if (tDate >= start && tDate <= end) {
        recentTransactions.push(t);
      }
    }

    return { chartData: data, recentTransactions };
  }, [transactions, categories]);

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-card/60 backdrop-blur-md border shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline font-semibold text-lg flex items-center gap-2">
          Resumen de Gastos
        </CardTitle>
        <CardDescription>
          Distribución de gastos de este mes y últimas 5 transacciones del mes.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-8 w-full pt-4">
        {/* Pie Chart Section */}
        {chartData.length > 0 ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                    }}
                    itemStyle={{
                      color: 'hsl(var(--popover-foreground))',
                      fontWeight: 600
                    }}
                    formatter={(value: any) => [
                      Number(value).toLocaleString('es-DO', { style: 'currency', currency: 'DOP' }),
                      'Gastado'
                    ]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle" 
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
        ) : (
            <div className="h-[200px] w-full flex items-center justify-center text-muted-foreground text-sm">
                No hay gastos registrados este mes.
            </div>
        )}

        <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">Últimas 5 transacciones del mes</h4>
            <div className="space-y-3">
                {recentTransactions.length > 0 ? recentTransactions.map(tx => {
                     const isIncome = tx.type === 'income';
                     const formattedAmount = tx.amount.toLocaleString(tx.currency === 'USD' ? 'en-US' : 'es-DO', { 
                        style: 'currency', 
                        currency: tx.currency 
                     });

                     return (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-card border hover:border-primary/30 transition-colors">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{tx.description || tx.category}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-muted-foreground">
                                        {format(parseISO(tx.date), 'dd MMM, yyyy', { locale: es })}
                                    </span>
                                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground">{categories.find(c => c.value === tx.category)?.label || tx.category}</span>
                                </div>
                            </div>
                            <p className={`font-bold text-sm ml-3 shrink-0 ${isIncome ? 'text-green-500' : 'text-red-400'}`}>
                                {isIncome ? '+' : '-'}{formattedAmount}
                            </p>
                        </div>
                     );
                }) : (
                    <div className="text-muted-foreground text-sm">No hay transacciones este mes.</div>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
