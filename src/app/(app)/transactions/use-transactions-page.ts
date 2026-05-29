'use client';

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Transaction } from "@/lib/types";
import { useFamilyData } from "@/context/family-data-context";
import { addDays, format, parseISO, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { es } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function useTransactionsPage() {
  const { transactions, addDoc, updateDoc, deleteDoc, loading, categories, budgets, members } = useFamilyData();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [date, setDate] = useState<DateRange | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [activePreset, setActivePreset] = useState<'thisMonth' | 'lastMonth' | 'thisYear' | null>('thisMonth');
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

  useEffect(() => {
    setDate({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });
  }, []);
  
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'user' | 'familyId'>) => addDoc('transactions', transaction);
  const updateTransaction = (id: string, transaction: Partial<Omit<Transaction, 'id' | 'user' | 'familyId'>>) => updateDoc('transactions', id, transaction);
  const deleteTransaction = (id: string) => deleteDoc('transactions', id);
  
  const clearFilters = useCallback(() => {
    setDate(undefined);
    setSelectedCategory("all");
    setSearchQuery("");
    setActivePreset(null);
  }, []);

  const handleSaveTransaction = async (transaction: Omit<Transaction, 'id' | 'user' | 'familyId'>, id?: string) => {
    setIsSubmitting(true);
    if (id) {
        await updateTransaction(id, transaction);
    } else {
        await addTransaction(transaction);
    }
    clearFilters();
    setEditingTransaction(undefined);
    setIsSubmitting(false);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };
  
  const handleDelete = (transactionId: string) => {
    deleteTransaction(transactionId);
  };

  const filteredTransactions = useMemo(() => {
    let dateFiltered = transactions;
    
    if (date?.from) {
        dateFiltered = transactions.filter(transaction => {
            const transactionDate = parseISO(transaction.date);
            const from = date.from as Date;
            const to = date.to ? addDays(date.to, 1) : addDays(from, 1);
            return transactionDate >= from && transactionDate < to;
        });
    }

    return dateFiltered.filter(transaction => {
      const category = categories.find(c => c.value === transaction.category);
      const isCategoryMatch = selectedCategory === 'all' || transaction.category === selectedCategory;
      
      const searchLower = searchQuery.toLowerCase();
      const isSearchMatch = !searchQuery || 
        (transaction.description && transaction.description.toLowerCase().includes(searchLower)) ||
        (category?.label && category.label.toLowerCase().includes(searchLower)) ||
        transaction.amount.toString().includes(searchQuery) ||
        (transaction.user && transaction.user.toLowerCase().includes(searchLower));

      return isCategoryMatch && isSearchMatch;
    });
  }, [transactions, date, selectedCategory, searchQuery, categories]);
  
  const { totalIncome, totalExpenses, balance, budgetedExpenses, unbudgetedExpenses, totalSavings } = useMemo(() => {
      if (!filteredTransactions || filteredTransactions.length === 0) {
          return { totalIncome: 0, totalExpenses: 0, balance: 0, budgetedExpenses: 0, unbudgetedExpenses: 0, totalSavings: 0 };
      }
      const relevantTransactions = filteredTransactions.filter(t => t.category !== 'transfer' && t.category !== 'transfer-income');

      const income = relevantTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

      const expenses = relevantTransactions
          .filter(t => t.type === 'expense');

      const totalExpensesValue = expenses.reduce((sum, t) => sum + t.amount, 0);

      const budgetedCategoryValues = new Set(budgets.map(b => b.category));
      
      const budgeted = expenses
          .filter(t => budgetedCategoryValues.has(t.category))
          .reduce((sum, t) => sum + t.amount, 0);

      const unbudgeted = totalExpensesValue - budgeted;

      const netBalance = income - totalExpensesValue;
      
      const savings = netBalance;

      return { 
          totalIncome: income, 
          totalExpenses: totalExpensesValue,
          balance: netBalance,
          budgetedExpenses: budgeted,
          unbudgetedExpenses: unbudgeted,
          totalSavings: savings,
          isSummaryExpanded,
      };
  }, [filteredTransactions, budgets]);

  const { totalSharedDOP, totalSharedUSD } = useMemo(() => {
    const shared = filteredTransactions.filter(t => t.isShared && t.type === 'expense');
    const dop = shared.filter(t => t.currency === 'DOP').reduce((sum, t) => sum + t.amount, 0);
    const usd = shared.filter(t => t.currency === 'USD').reduce((sum, t) => sum + t.amount, 0);
    return { totalSharedDOP: dop, totalSharedUSD: usd };
  }, [filteredTransactions]);

  const handleExportPDF = useCallback(() => {
      setIsExporting(true);
      const doc = new jsPDF();
      
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text("Faminance - Informe de Transacciones", 105, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const dateRangeText = `Período: ${date?.from ? format(date.from, "d MMM, yyyy", { locale: es }) : 'N/A'} - ${date?.to ? format(date.to, "d MMM, yyyy", { locale: es }) : 'N/A'}`;
      doc.text(dateRangeText, 105, 30, { align: 'center' });

      autoTable(doc, {
          startY: 40,
          head: [['Resumen General', 'Monto']],
          body: [
              ['Ingresos Totales', totalIncome.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })],
              ['Gastos Totales', totalExpenses.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })],
              ['Balance Neto', balance.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })],
          ],
          theme: 'striped',
          styles: { font: 'helvetica' },
          headStyles: { fontStyle: 'bold', halign: 'center', fillColor: [30, 80, 130] },
          bodyStyles: { halign: 'right' },
          columnStyles: { 0: { fontStyle: 'bold', halign: 'left' } }
      });
      
      // Category Breakdown Logic
      const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
      const categoryTotals: {[key: string]: number} = {};
      
      expenseTransactions.forEach(t => {
          const categoryInfo = categories.find(c => c.value === t.category);
          const categoryLabel = categoryInfo?.label || t.category;
          if (!categoryTotals[categoryLabel]) {
              categoryTotals[categoryLabel] = 0;
          }
          categoryTotals[categoryLabel] += t.amount;
      });

      const categoryBreakdownBody = Object.entries(categoryTotals)
          .sort(([, a], [, b]) => b - a)
          .map(([category, total]) => {
              const percentage = totalExpenses > 0 ? ((total / totalExpenses) * 100).toFixed(2) + '%' : '0.00%';
              return [
                  category,
                  total.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' }),
                  percentage,
              ];
          });
      
      if (categoryBreakdownBody.length > 0) {
          autoTable(doc, {
              startY: (doc as any).lastAutoTable.finalY + 15,
              head: [['Desglose de Gastos por Categoría', 'Total', '% del Total']],
              body: categoryBreakdownBody,
              theme: 'grid',
              headStyles: { fillColor: [30, 80, 130] },
              bodyStyles: { halign: 'right' },
              columnStyles: { 0: { halign: 'left' } },
          });
      }

      const transactionsTableBody = filteredTransactions.map((t: Transaction) => {
          const category = categories.find(c => c.value === t.category);
          const currency = t.currency || 'DOP';
          const locale = currency === 'USD' ? 'en-US' : 'es-DO';
          const amountStr = `${t.type === 'income' ? '+' : '-'} ${t.amount.toLocaleString(locale, { style: 'currency', currency })}`;
          return [
              format(parseISO(t.date), "dd/MM/yyyy"),
              t.description || '',
              category?.label || t.category,
              t.user,
              amountStr,
          ];
      });

      autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 15,
          head: [['Fecha', 'Descripción', 'Categoría', 'Usuario', 'Monto']],
          body: transactionsTableBody,
          theme: 'grid',
          headStyles: { fillColor: [30, 80, 130] },
      });

      doc.save(`informe-transacciones-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      setIsExporting(false);
  }, [date, filteredTransactions, totalIncome, totalExpenses, balance, categories]);

  const sharedTransactions = useMemo(() => filteredTransactions.filter(t => t.isShared), [filteredTransactions]);

  const setDatePreset = (preset: 'thisMonth' | 'lastMonth' | 'thisYear') => {
        const now = new Date();
        let fromDate: Date, toDate: Date;

        switch (preset) {
            case 'thisMonth':
                fromDate = startOfMonth(now);
                toDate = endOfMonth(now);
                break;
            case 'lastMonth':
                const lastMonth = subMonths(now, 1);
                fromDate = startOfMonth(lastMonth);
                toDate = endOfMonth(lastMonth);
                break;
            case 'thisYear':
                fromDate = startOfYear(now);
                toDate = endOfYear(now);
                break;
        }
        setDate({ from: fromDate, to: toDate });
        setActivePreset(preset);
  };

  return {
    loading,
    editingTransaction,
    setEditingTransaction,
    isSubmitting,
    date,
    setDate,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    isExporting,
    activePreset,
    isSummaryExpanded,
    setIsSummaryExpanded,
    categories,
    clearFilters,
    handleSaveTransaction,
    handleEdit,
    handleDelete,
    filteredTransactions,
    sharedTransactions,
    totalIncome,
    totalExpenses,
    balance,
    budgetedExpenses,
    unbudgetedExpenses,
    totalSavings,
    handleExportPDF,
    setDatePreset,
    members,
    totalSharedDOP,
    totalSharedUSD,
  };
}
