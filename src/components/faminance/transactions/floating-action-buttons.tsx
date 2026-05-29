
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Minus, Plus } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { AddTransactionSheet } from './add-transaction-sheet';
import { useFamilyData } from '@/context/family-data-context';

export function FloatingTransactionButtons() {
    const { addDoc } = useFamilyData();
    const [transactionTypeToAdd, setTransactionTypeToAdd] = useState<'income' | 'expense' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddTransaction = async (newTransaction: Omit<Transaction, 'id' | 'user' | 'familyId'>) => {
        setIsSubmitting(true);
        await addDoc('transactions', newTransaction);
        setIsSubmitting(false);
        setTransactionTypeToAdd(null);
    };

    return (
        <TooltipProvider>
            <div className="fixed bottom-20 right-6 sm:bottom-6 z-20 flex flex-col gap-3">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="icon"
                            className="h-14 w-14 rounded-full shadow-lg bg-destructive hover:bg-destructive/90"
                            onClick={() => setTransactionTypeToAdd('expense')}
                        >
                            <Minus className="h-6 w-6" />
                            <span className="sr-only">Registrar Gasto</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        <p>Registrar Gasto</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="icon"
                            className="h-14 w-14 rounded-full shadow-lg"
                            onClick={() => setTransactionTypeToAdd('income')}
                        >
                            <Plus className="h-6 w-6" />
                            <span className="sr-only">Añadir Ingreso</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        <p>Añadir Ingreso</p>
                    </TooltipContent>
                </Tooltip>
            </div>

            <AddTransactionSheet
                onSave={handleAddTransaction}
                onClose={() => setTransactionTypeToAdd(null)}
                forceOpen={!!transactionTypeToAdd}
                defaultType={transactionTypeToAdd}
                isSubmitting={isSubmitting}
            />
        </TooltipProvider>
    );
}

    