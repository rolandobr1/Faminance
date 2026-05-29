'use client';

import { useMemo, useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Transaction, Category } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddTransactionSheet } from "@/components/faminance/transactions/add-transaction-sheet";
import { TransactionTable } from "../transactions/transaction-table";
import { useFamilyData } from "@/context/family-data-context";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  fill: string;
}

const CHART_COLORS = [
    'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))',
    'hsl(var(--chart-6))', 'hsl(var(--chart-7))', 'hsl(var(--chart-8))', 'hsl(var(--chart-9))', 'hsl(var(--chart-10))',
    'hsl(207, 82%, 67%)', 'hsl(142, 76%, 36%)', 'hsl(262, 82%, 67%)', 'hsl(34, 94%, 60%)', 'hsl(340, 82%, 67%)', 
    'hsl(48, 96%, 62%)', 'hsl(180, 70%, 45%)', 'hsl(0, 84%, 60%)', 'hsl(300, 80%, 60%)', 'hsl(210, 100%, 40%)',
    'hsl(220, 80%, 60%)', 'hsl(160, 80%, 40%)'
];


function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Categoría
            </span>
            <span className="font-bold text-muted-foreground">
              {payload[0].name}
            </span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Monto
            </span>
            <span className="font-bold">
              {payload[0].value.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't render label for small slices

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};


function PieChartDisplay({ 
  data, 
  title, 
  type, 
  onPieClick 
}: { 
  data: CategoryData[], 
  title: string, 
  type: 'income' | 'expense',
  onPieClick: (data: any, type: 'income' | 'expense') => void
}) {
  const combinedData = useMemo(() => {
    if (data.length <= 10) return data;

    const mainData = data.slice(0, 9);
    const otherData = data.slice(9);
    const otherValue = otherData.reduce((acc, item) => acc + item.value, 0);
    const totalValue = data.reduce((acc, item) => acc + item.value, 0);
    if (totalValue === 0 || otherValue === 0) return mainData;

    return [
      ...mainData,
      { name: 'Otros', value: otherValue, percentage: (otherValue / totalValue) * 100, fill: '#888888' }
    ];
  }, [data]);

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      {data.length > 0 ? (
        <>
            <div className="space-y-4">
                {data.map(entry => (
                    <div key={entry.name} className="space-y-1.5 cursor-pointer" onClick={() => onPieClick(entry, type)}>
                        <div className="flex justify-between items-baseline">
                            <span className="font-medium text-sm truncate pr-4">{entry.name}</span>
                             <div className="flex items-baseline gap-2 text-sm">
                                <span className="font-bold" style={{color: entry.fill}}>
                                    {entry.value.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                                </span>
                                <span className="text-xs font-semibold text-muted-foreground w-10 text-right">{entry.percentage.toFixed(0)}%</span>
                            </div>
                        </div>
                        <Progress value={entry.percentage} className="h-1.5 flex-grow" indicatorClassName="bg-primary" style={{ "--primary": entry.fill } as React.CSSProperties} />
                    </div>
                ))}
            </div>
            <div className="hidden md:block">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={combinedData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    onClick={(d) => onPieClick(d, type)}
                    className="cursor-pointer"
                  >
                    {combinedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
        </>
      ) : (
        <div className="flex h-[250px] w-full items-center justify-center text-muted-foreground md:col-span-2">
          No hay datos de {title.toLowerCase()} para mostrar.
        </div>
      )}
    </div>
  );
}


export function CategoryBreakdown({ transactions: filteredTransactions }: { transactions?: Transaction[] }) {
  const { transactions: allTransactions, categories, addDoc, updateDoc, deleteDoc, loading } = useFamilyData();
  const [selectedCategory, setSelectedCategory] = useState<{ name: string; type: 'income' | 'expense' } | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const transactionsToUse = filteredTransactions || allTransactions;

  const { incomeData, expenseData } = useMemo(() => {
    const income: { [key: string]: number } = {};
    const expense: { [key: string]: number } = {};

    transactionsToUse.forEach(t => {
      const categoryLabel = categories.find(c => c.value === t.category)?.label || t.category;
      if (t.type === 'income') {
        if (!income[categoryLabel]) income[categoryLabel] = 0;
        income[categoryLabel] += t.amount;
      } else {
        if (!expense[categoryLabel]) expense[categoryLabel] = 0;
        expense[categoryLabel] += t.amount;
      }
    });

    const processData = (data: {[key: string]: number}): CategoryData[] => {
        const total = Object.values(data).reduce((sum, value) => sum + value, 0);
        if (total === 0) return [];
        
        return Object.entries(data)
          .sort(([, a], [, b]) => b - a)
          .map(([name, value], index) => ({
            name,
            value,
            percentage: (value / total) * 100,
            fill: CHART_COLORS[index % CHART_COLORS.length],
        }));
    }

    return { incomeData: processData(income), expenseData: processData(expense) };
  }, [transactionsToUse, categories]);
  
  const selectedTransactions = useMemo(() => {
    if (!selectedCategory) return [];
    
    let originalCategoryName = selectedCategory.name;

    if (selectedCategory.name === 'Otros') {
      const mainCategories = (selectedCategory.type === 'income' ? incomeData : expenseData)
                                .slice(0, 9).map(d => d.name);

      return transactionsToUse.filter(t => {
        const categoryLabel = categories.find(c => c.value === t.category)?.label || t.category;
        return !mainCategories.includes(categoryLabel) && t.type === selectedCategory.type;
      });
    }

    return transactionsToUse.filter(t => {
        const categoryLabel = categories.find(c => c.value === t.category)?.label || t.category;
        return categoryLabel === selectedCategory.name && t.type === selectedCategory.type;
    });
  }, [selectedCategory, transactionsToUse, categories, incomeData, expenseData]);

  const handlePieClick = (data: any, type: 'income' | 'expense') => {
    if (data && data.name) {
      setSelectedCategory({ name: data.name, type });
    }
  };
  
  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  }

  const handleSaveTransaction = (transaction: Omit<Transaction, 'id' | 'user' | 'familyId'>, id?: string) => {
    if (id) {
        updateDoc('transactions', id, transaction);
    } else {
        addDoc('transactions', transaction);
    }
    setEditingTransaction(undefined);
  };
  
  const handleDelete = (id: string) => deleteDoc('transactions', id);


  return (
    <>
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">Desglose por Categoría</CardTitle>
            <CardDescription>Visualice sus ingresos y gastos por categoría.</CardDescription>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon">
              {isOpen ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              <span className="sr-only">Expandir/Contraer</span>
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <Tabs defaultValue="expenses">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="expenses">Gastos</TabsTrigger>
                <TabsTrigger value="income">Ingresos</TabsTrigger>
              </TabsList>
              <TabsContent value="expenses" className="pt-4">
                {isClient ? <PieChartDisplay data={expenseData} title="Gastos" type="expense" onPieClick={handlePieClick} /> : <div className="h-[350px]" />}
              </TabsContent>
              <TabsContent value="income" className="pt-4">
                {isClient ? <PieChartDisplay data={incomeData} title="Ingresos" type="income" onPieClick={handlePieClick} /> : <div className="h-[350px]" />}
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>

    <Dialog open={!!selectedCategory} onOpenChange={(isOpen) => {
        if (!isOpen) {
            setSelectedCategory(null);
        }
    }}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
            <DialogTitle>Transacciones en "{selectedCategory?.name}"</DialogTitle>
            <DialogDescription>
                Aquí están todas las transacciones para la categoría seleccionada.
            </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <TransactionTable transactions={selectedTransactions} onEdit={handleEdit} onDelete={handleDelete} isLoading={loading}/>
            </div>
        </DialogContent>
    </Dialog>
    
    <AddTransactionSheet
        transactionToEdit={editingTransaction}
        onSave={handleSaveTransaction}
        onClose={() => setEditingTransaction(undefined)}
        forceOpen={!!editingTransaction}
    />
    </>
  );
}
