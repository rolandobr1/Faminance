'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AddTransactionSheet } from '@/components/faminance/transactions/add-transaction-sheet';
import { useFamilyData } from '@/context/family-data-context';
import type { Transaction } from '@/lib/types';
import { usePathname } from 'next/navigation';

export function MobileAddButton() {
    const { addDoc } = useFamilyData();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const pathname = usePathname();

    const handleAddTransaction = async (newTransaction: Omit<Transaction, 'id' | 'user' | 'familyId'>) => {
        setIsSubmitting(true);
        await addDoc('transactions', newTransaction);
        setIsSubmitting(false);
        setIsOpen(false);
    };

    const handleClick = () => {
        if (pathname.startsWith('/budgets')) {
            document.dispatchEvent(new CustomEvent('open-add-budget'));
        } else if (pathname.startsWith('/accounts')) {
            document.dispatchEvent(new CustomEvent('open-add-account'));
        } else if (pathname.startsWith('/goals')) {
            document.dispatchEvent(new CustomEvent('open-add-goal'));
        } else if (pathname.startsWith('/debts')) {
            document.dispatchEvent(new CustomEvent('open-add-debt'));
        } else {
            setIsOpen(true);
        }
    };

    // Escuchar el evento de abrir transacciones por si otro botón lo llama
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        document.addEventListener('open-add-transaction', handleOpen);
        return () => document.removeEventListener('open-add-transaction', handleOpen);
    }, []);

    return (
        <>
            <button
                onClick={handleClick}
                aria-label="Añadir"
                className="
                    relative h-14 w-14 rounded-full
                    flex items-center justify-center
                    backdrop-blur-xl
                    bg-primary/90 dark:bg-primary/25
                    border border-primary/50
                    shadow-lg shadow-primary/40 dark:shadow-[0_0_28px_rgba(99,102,241,0.5),0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.25)]
                    hover:bg-primary dark:hover:bg-primary/40
                    hover:border-primary/70
                    dark:hover:shadow-[0_0_36px_rgba(99,102,241,0.7),0_6px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]
                    hover:scale-110
                    active:scale-95
                    transition-all duration-200 ease-out
                    cursor-pointer
                "
            >
                {/* Top glass highlight */}
                <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-white/5 to-transparent pointer-events-none" />
                {/* Icon */}
                <Plus className="h-6 w-6 text-white relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" strokeWidth={2.5} />
            </button>

            <AddTransactionSheet
                onSave={handleAddTransaction}
                onClose={() => setIsOpen(false)}
                forceOpen={isOpen}
                isSubmitting={isSubmitting}
            />
        </>
    );
}
