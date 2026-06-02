'use client';

import { useState, useMemo } from "react";
import { Account, CreditCard, Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useFamilyData } from "@/context/family-data-context";
import { AccountFormValues } from "@/components/faminance/accounts/account-form";
import { CreditCardFormValues } from "@/components/faminance/accounts/credit-card-form";

export function useAccountsPage() {
    const { accounts, creditCards, cashBalance, addDoc, updateDoc, deleteDoc, getAccountBalance, categories, settings, updateSettings } = useFamilyData();
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isTransferOpen, setTransferOpen] = useState(false);
    const [isCashEditOpen, setCashEditOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);
    const [editingCard, setEditingCard] = useState<CreditCard | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const addAccount = (account: Omit<Account, 'id' | 'familyId'>) => addDoc('accounts', account);
    const updateAccount = (id: string, account: Partial<Omit<Account, 'id' | 'familyId'>>) => updateDoc('accounts', id, account);
    const deleteAccount = (id: string) => deleteDoc('accounts', id);
    const addCreditCard = (card: Omit<CreditCard, 'id' | 'familyId' | 'spentDOP' | 'spentUSD'>) => addDoc('creditCards', { ...card, spentDOP: 0, spentUSD: 0 });
    const updateCreditCard = (id: string, card: Partial<Omit<CreditCard, 'id' | 'familyId'>>) => updateDoc('creditCards', id, card);
    const deleteCreditCard = (id: string) => deleteDoc('creditCards', id);

    const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user' | 'familyId'>) => {
        await addDoc('transactions', transaction);
    };

    const totalSavings = useMemo(() => {
        if (!accounts) return 0;
        return accounts
            .filter(acc => acc.type === 'ahorro')
            .reduce((total, acc) => total + getAccountBalance(acc.id), 0);
    }, [accounts, getAccountBalance]);

    const handleSaveAccount = async (accountData: AccountFormValues & { nextDepositDate?: string }) => {
        setIsSubmitting(true);
        if (editingAccount) {
            await updateAccount(editingAccount.id, accountData);
            toast({ title: "Cuenta actualizada", description: `La cuenta "${accountData.name}" ha sido actualizada.`});
        } else {
            await addAccount(accountData);
            toast({ title: "Cuenta creada", description: `La cuenta "${accountData.name}" ha sido creada exitosamente.`});
        }
        setIsSubmitting(false);
        setEditingAccount(undefined);
        setCreateOpen(false);
    };

    const handleSaveCreditCard = async (cardData: CreditCardFormValues) => {
        setIsSubmitting(true);
        if (editingCard) {
            await updateCreditCard(editingCard.id, cardData);
            toast({ title: "Tarjeta actualizada", description: `La tarjeta "${cardData.name}" ha sido actualizada.`});
        } else {
            const dataToSave = {
                ...cardData,
                limitDOP: cardData.limitDOP ?? 0,
                limitUSD: cardData.limitUSD ?? 0,
            };
            await addCreditCard(dataToSave);
            toast({ title: "Tarjeta creada", description: `La tarjeta "${cardData.name}" ha sido creada exitosamente.`});
        }
        setIsSubmitting(false);
        setEditingCard(undefined);
        setCreateOpen(false);
    };

    const handleTransfer = async (fromId: string, toId: string, amount: number) => {
        setIsSubmitting(true);
        if (!accounts) {
            setIsSubmitting(false);
            return;
        }
        const fromAccount = accounts.find(acc => acc.id === fromId);
        const toAccount = accounts.find(acc => acc.id === toId);
        const fromName = fromId === 'cash' ? 'Efectivo' : fromAccount?.name;
        const toName = toId === 'cash' ? 'Efectivo' : toAccount?.name;

        // Create two transactions to represent the transfer
        // 1. Expense from the source
        await addTransaction({
            date: new Date().toISOString(),
            amount: amount,
            type: 'expense',
            category: 'transfer',
            description: `Transferencia hacia ${toName}`,
            paymentMethod: fromId === 'cash' ? 'Efectivo' : 'Transferencia Bancaria',
            currency: 'DOP',
            isShared: false,
            sharedWith: [],
            accountId: fromId === 'cash' ? undefined : fromId,
        });
        // 2. Income to the destination
        await addTransaction({
            date: new Date().toISOString(),
            amount: amount,
            type: 'income',
            category: 'transfer-income',
            description: `Transferencia desde ${fromName}`,
            paymentMethod: toId === 'cash' ? 'Efectivo' : 'Transferencia Bancaria',
            currency: 'DOP',
            isShared: false,
            sharedWith: [],
            accountId: toId === 'cash' ? undefined : toId,
        });
        
        toast({ title: 'Éxito', description: 'Transferencia realizada correctamente.' });
        setIsSubmitting(false);
        setTransferOpen(false);
    };
    
    const handleCashAdjustment = async (newBalance: number) => {
        setIsSubmitting(true);
        const difference = newBalance - cashBalance;
        
        if (difference !== 0) {
            // Calculate the new initial balance to make the current balance equal to newBalance
            // current balance = initialBalance + transactionsSum
            // transactionsSum = current balance - initialBalance
            // new initialBalance = newBalance - transactionsSum
            // Or simpler: new initialBalance = old initialBalance + difference
            const oldInitialBalance = settings?.initialCashBalance || 0;
            const newInitialBalance = oldInitialBalance + difference;
            
            await updateSettings({ initialCashBalance: newInitialBalance });
            toast({ title: 'Efectivo actualizado', description: 'El balance inicial de efectivo ha sido ajustado.' });
        }
        
        setIsSubmitting(false);
        setCashEditOpen(false);
    };
    
    const openEditAccountDialog = (account: Account) => {
        setEditingAccount(account);
        setCreateOpen(true); // Re-use the same dialog for editing
    };
    
    const openEditCardDialog = (card: CreditCard) => {
        setEditingCard(card);
        setCreateOpen(true); // Re-use the same dialog for editing
    };

    return {
        accounts,
        creditCards,
        cashBalance,
        isCreateOpen,
        setCreateOpen,
        isTransferOpen,
        setTransferOpen,
        editingAccount,
        setEditingAccount,
        editingCard,
        setEditingCard,
        isSubmitting,
        totalSavings,
        handleSaveAccount,
        handleSaveCreditCard,
        handleTransfer,
        openEditAccountDialog,
        openEditCardDialog,
        deleteAccount,
        deleteCreditCard,
        getAccountBalance,
        categories,
        isCashEditOpen,
        setCashEditOpen,
        handleCashAdjustment,
    };
}
