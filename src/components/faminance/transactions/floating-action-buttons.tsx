
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
            <div className="fixed bottom-20 right-6 sm:bottom-6 z-20 hidden sm:flex flex-col gap-3">
                {/* Expense button — red glass */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => setTransactionTypeToAdd('expense')}
                            className="
                                group relative h-14 w-14 rounded-full
                                flex items-center justify-center
                                backdrop-blur-xl
                                bg-red-500/20
                                border border-red-400/30
                                shadow-[0_8px_32px_rgba(239,68,68,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]
                                hover:bg-red-500/35
                                hover:border-red-400/50
                                hover:shadow-[0_12px_40px_rgba(239,68,68,0.55),inset_0_1px_0_rgba(255,255,255,0.2)]
                                hover:scale-110
                                active:scale-95
                                transition-all duration-200 ease-out
                                cursor-pointer
                            "
                        >
                            {/* Inner glass highlight */}
                            <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                            <Minus className="h-6 w-6 text-red-200 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)] relative z-10" />
                            <span className="sr-only">Registrar Gasto</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        <p>Registrar Gasto</p>
                    </TooltipContent>
                </Tooltip>

                {/* Income button — green/primary glass */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => setTransactionTypeToAdd('income')}
                            className="
                                group relative h-14 w-14 rounded-full
                                flex items-center justify-center
                                backdrop-blur-xl
                                bg-emerald-500/20
                                border border-emerald-400/30
                                shadow-[0_8px_32px_rgba(52,211,153,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]
                                hover:bg-emerald-500/35
                                hover:border-emerald-400/50
                                hover:shadow-[0_12px_40px_rgba(52,211,153,0.55),inset_0_1px_0_rgba(255,255,255,0.2)]
                                hover:scale-110
                                active:scale-95
                                transition-all duration-200 ease-out
                                cursor-pointer
                            "
                        >
                            {/* Inner glass highlight */}
                            <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                            <Plus className="h-6 w-6 text-emerald-200 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)] relative z-10" />
                            <span className="sr-only">Añadir Ingreso</span>
                        </button>
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

    