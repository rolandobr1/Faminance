'use client';

import { useState, useMemo, useEffect } from "react";
import type { Budget, Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useFamilyData } from "@/context/family-data-context";
import { startOfMonth, endOfMonth, parseISO, addMonths } from "date-fns";

export function useBudgetsPage() {
    const { budgets, addDoc, updateDoc, deleteDoc, transactions, categories, loading } = useFamilyData();
    const { toast } = useToast();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
    const [transactionSheetState, setTransactionSheetState] = useState<{open: boolean, categoryValue?: string}>({open: false});
    const [viewingTransactionsFor, setViewingTransactionsFor] = useState<Budget | undefined>(undefined);
    const [sortOption, setSortOption] = useState('progress-desc');
    const [currentDate, setCurrentDate] = useState<Date | null>(null);

    useEffect(() => {
      setCurrentDate(new Date());
    }, []);

    const addBudget = async (budget: Omit<Budget, 'id' | 'spent' | 'familyId'>) => {
        const dataToAdd = { ...budget, spent: 0 };
        await addDoc("budgets", dataToAdd);
    };

    const updateBudget = async (id: string, budget: Partial<Omit<Budget, 'id' | 'familyId'>>) => {
        await updateDoc("budgets", id, budget);
    };

    const deleteBudget = async (id: string) => {
        await deleteDoc("budgets", id);
    };

    const addTransaction = (transaction: Omit<Transaction, 'id' | 'user' | 'familyId'>) => addDoc('transactions', transaction);
    const updateTransaction = (id: string, transaction: Partial<Omit<Transaction, 'id' | 'user' | 'familyId'>>) => updateDoc('transactions', id, transaction);
    const deleteTransactionFromContext = (id: string) => deleteDoc('transactions', id);

    const budgetsWithSpent = useMemo(() => {
        if (!currentDate) return [];
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);

        const monthlyExpenses = transactions.filter(t => {
            const d = parseISO(t.date);
            return t.type === 'expense' && d >= monthStart && d <= monthEnd;
        });

        const getSpent = (cat: string) => monthlyExpenses.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0);

        const processedBudgets: any[] = [];
        const processedCategories = new Set<string>();

        const rootCategories = categories.filter(c => !c.parentId);

        for (const rootCat of rootCategories) {
            const rootBudget = budgets.find(b => b.category === rootCat.value);
            const childCats = categories.filter(c => c.parentId === rootCat.value);
            
            const subcategories = childCats.map(childCat => {
                const childBudget = budgets.find(b => b.category === childCat.value);
                const childSpent = getSpent(childCat.value);
                const childLimit = childBudget?.limit || 0;
                
                if (childBudget) processedCategories.add(childCat.value);
                
                if (childBudget || childSpent > 0) {
                    return {
                        id: childBudget?.id || `sub-${childCat.value}`,
                        category: childCat.value,
                        categoryInfo: childCat,
                        limit: childLimit,
                        spent: childSpent,
                        progress: childLimit > 0 ? (childSpent / childLimit) * 100 : 0,
                        remaining: childLimit - childSpent,
                    };
                }
                return null;
            }).filter(Boolean) as any[];

            const rootSpent = getSpent(rootCat.value);
            const totalSpent = rootSpent + subcategories.reduce((acc, sub) => acc + sub.spent, 0);
            
            let totalLimit = rootBudget?.limit || 0;
            if (!rootBudget) {
                totalLimit = subcategories.reduce((acc, sub) => acc + sub.limit, 0);
            }

            if (rootBudget) processedCategories.add(rootCat.value);

            if (rootBudget || totalLimit > 0) {
                processedBudgets.push({
                    id: rootBudget?.id || `root-${rootCat.value}`,
                    familyId: rootBudget?.familyId || 'main-family',
                    category: rootCat.value,
                    period: rootBudget?.period || 'mensual',
                    limit: totalLimit,
                    spent: totalSpent,
                    progress: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0,
                    remaining: totalLimit - totalSpent,
                    categoryInfo: rootCat,
                    subcategories,
                    isVirtualParent: !rootBudget
                });
            }
        }

        // Now, catch any budgets that belong to categories not found or missing parent references
        for (const budget of budgets) {
            if (!processedCategories.has(budget.category)) {
                const categoryInfo = categories.find(c => c.value === budget.category);
                const spent = getSpent(budget.category);
                processedBudgets.push({
                    ...budget,
                    spent,
                    progress: budget.limit > 0 ? (spent / budget.limit) * 100 : 0,
                    remaining: budget.limit - spent,
                    categoryInfo,
                    subcategories: [],
                    isVirtualParent: false
                });
            }
        }

        return processedBudgets.sort((a, b) => {
            switch (sortOption) {
                case 'progress-desc':
                    return b.progress - a.progress;
                case 'spent-desc':
                    return b.spent - a.spent;
                case 'limit-desc':
                    return b.limit - a.limit;
                case 'remaining-asc':
                    return a.remaining - b.remaining;
                case 'alpha-asc':
                    return a.categoryInfo?.label.localeCompare(b.categoryInfo?.label || '') || 0;
                default:
                    return 0;
            }
        });

    }, [budgets, transactions, categories, sortOption, currentDate]);
    
    const selectedBudgetTransactions = useMemo(() => {
        if (!viewingTransactionsFor || !currentDate) return [];
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return transactions.filter(t => 
            t.category === viewingTransactionsFor.category && 
            t.type === 'expense' &&
            parseISO(t.date) >= monthStart &&
            parseISO(t.date) <= monthEnd
        );
    }, [viewingTransactionsFor, transactions, currentDate]);
    
    const { totalSpent, totalBudgeted, totalProgress } = useMemo(() => {
        const spent = budgetsWithSpent.reduce((acc, budget) => acc + budget.spent, 0);
        const budgeted = budgetsWithSpent.reduce((acc, budget) => acc + budget.limit, 0);
        const progress = budgeted > 0 ? (spent / budgeted) * 100 : 0;
        return { totalSpent: spent, totalBudgeted: budgeted, totalProgress: progress };
    }, [budgetsWithSpent]);

    const handleSaveBudget = async (budgetData: Omit<Budget, 'id' | 'spent' | 'familyId'>) => {
        setIsSubmitting(true);
        if (editingBudget && !editingBudget.id.startsWith('root-')) {
            await updateBudget(editingBudget.id, budgetData);
            setEditingBudget(undefined);
            toast({ title: "Presupuesto actualizado", description: "El presupuesto ha sido actualizado exitosamente." });
        } else {
            await addBudget(budgetData);
            setIsCreateOpen(false);
            setEditingBudget(undefined);
            toast({ title: "Presupuesto creado", description: "El nuevo presupuesto ha sido creado." });
        }
        setIsSubmitting(false);
    };
    
    const handleSaveTransaction = async (transaction: Omit<Transaction, 'id' | 'user' | 'familyId'>, id?: string) => {
        setIsSubmitting(true);
        if (id) {
            await updateTransaction(id, transaction);
        } else {
            await addTransaction(transaction);
        }
        setIsSubmitting(false);
        setTransactionSheetState({ open: false });
        setEditingTransaction(undefined);
    };

    const handleEditTransaction = (transaction: Transaction) => {
        setEditingTransaction(transaction);
    };
    
    const changeMonth = (amount: number) => {
        setCurrentDate(prevDate => prevDate ? addMonths(prevDate, amount) : new Date());
    };

    return {
        budgets,
        categories,
        loading,
        isCreateOpen,
        setIsCreateOpen,
        editingBudget,
        setEditingBudget,
        isSubmitting,
        editingTransaction,
        setEditingTransaction,
        transactionSheetState,
        setTransactionSheetState,
        viewingTransactionsFor,
        setViewingTransactionsFor,
        sortOption,
        setSortOption,
        currentDate,
        budgetsWithSpent,
        selectedBudgetTransactions,
        totalSpent,
        totalBudgeted,
        totalProgress,
        handleSaveBudget,
        handleSaveTransaction,
        handleEditTransaction,
        deleteTransactionFromContext,
        deleteBudget,
        changeMonth,
    };
}
