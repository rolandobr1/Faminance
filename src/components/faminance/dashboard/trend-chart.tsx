'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Transaction } from '@/lib/types';
import { subMonths, format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface TrendChartProps {
  transactions: Transaction[];
}

export function TrendChart({ transactions }: TrendChartProps) {
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();

    // Calculate details for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      // Filter transactions for this month (excluding transfers)
      const monthlyTransactions = transactions.filter(t => {
        const tDate = parseISO(t.date);
        return tDate >= start && 
               tDate <= end && 
               t.category !== 'transfer' && 
               t.category !== 'transfer-income';
      });

      const income = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({
        name: format(monthDate, 'MMM', { locale: es }).toUpperCase(),
        Ingresos: income,
        Gastos: expenses,
        formattedIncome: income.toLocaleString('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }),
        formattedExpenses: expenses.toLocaleString('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }),
      });
    }

    return data;
  }, [transactions]);

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-[#0d121f]/40 backdrop-blur-md border-white/[0.08] shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline font-semibold text-lg text-slate-100 flex items-center gap-2">
          Tendencia de Ingresos y Gastos
        </CardTitle>
        <CardDescription className="text-slate-400">
          Evolución histórica de los últimos 6 meses (excluyendo transferencias).
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `RD$${value >= 1000 ? (value / 1000) + 'k' : value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0d121f',
                borderColor: 'rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: any, name: any) => [
                Number(value).toLocaleString('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }),
                name
              ]}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle" 
              iconSize={8}
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Area 
              type="monotone" 
              dataKey="Ingresos" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorIngresos)" 
            />
            <Area 
              type="monotone" 
              dataKey="Gastos" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorGastos)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
