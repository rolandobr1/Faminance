'use client';

import { useFamilyData } from "@/context/family-data-context";
import { AlertTriangle, Clock, Settings2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import type { OverduePayment, Transaction } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddTransactionSheet } from "../transactions/add-transaction-sheet";
import { cn } from "@/lib/utils";
import { addDays, subMonths, differenceInDays, parseISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export function PaymentReminders() {
    const { loans, creditCards, transactions, addDoc, settings, updateSettings } = useFamilyData();
    const [selectedPayment, setSelectedPayment] = useState<OverduePayment | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [today, setToday] = useState<Date | null>(null);
    const [showConfig, setShowConfig] = useState(false);

    const reminderDays = settings?.reminderDays ?? 7;

    useEffect(() => {
        setIsClient(true);
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        setToday(date);
    }, []);

    const handleDaysChange = (value: string) => {
        const days = Number(value);
        updateSettings({ reminderDays: days });
    };

    const overduePayments = useMemo(() => {
        if (!isClient || !today) return [];

        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const reminders: (OverduePayment & { daysUntilDue: number })[] = [];

        // Check loans
        loans.forEach(loan => {
            const dueDate = new Date(currentYear, currentMonth, loan.paymentDate);
            const daysUntilDue = differenceInDays(dueDate, today);

            if (daysUntilDue <= reminderDays) {
                const paymentMade = transactions.some(t =>
                    t.loanId === loan.id &&
                    t.category === 'debt-payment' &&
                    parseISO(t.date).getMonth() === currentMonth &&
                    parseISO(t.date).getFullYear() === currentYear
                );
                if (!paymentMade) {
                    reminders.push({
                        id: loan.id,
                        name: `Préstamo: ${loan.name}`,
                        dueDate: dueDate,
                        amount: loan.monthlyPayment,
                        type: 'loan',
                        currency: 'DOP',
                        status: daysUntilDue < 0 ? 'overdue' : 'dueSoon',
                        daysUntilDue,
                    });
                }
            }
        });

        // Check credit cards
        creditCards.forEach(card => {
            const cutoffDateThisMonth = new Date(currentYear, currentMonth, card.cutoffDate);
            let paymentDueDate: Date;
            let cycleStart: Date;

            if (today.getDate() <= card.cutoffDate) {
                const lastMonthCutoff = subMonths(cutoffDateThisMonth, 1);
                paymentDueDate = addDays(lastMonthCutoff, card.paymentDays);
                cycleStart = subMonths(lastMonthCutoff, 1);
            } else {
                paymentDueDate = addDays(cutoffDateThisMonth, card.paymentDays);
                cycleStart = subMonths(cutoffDateThisMonth, 1);
            }
            
            const daysUntilDue = differenceInDays(paymentDueDate, today);

            if (daysUntilDue <= reminderDays) {
                 const paymentMade = transactions.some(t =>
                    t.creditCardId === card.id &&
                    t.paymentMethod === 'Pago de Tarjeta' &&
                    parseISO(t.date) > cycleStart &&
                    parseISO(t.date) <= paymentDueDate
                );

                if (!paymentMade) {
                    if (card.spentDOP > 0) {
                         reminders.push({
                            id: card.id,
                            name: `Tarjeta: ${card.name} (DOP)`,
                            dueDate: paymentDueDate,
                            amount: card.spentDOP,
                            type: 'card',
                            currency: 'DOP',
                            status: daysUntilDue < 0 ? 'overdue' : 'dueSoon',
                            daysUntilDue,
                        });
                    }
                     if (card.spentUSD > 0) {
                         reminders.push({
                            id: card.id,
                            name: `Tarjeta: ${card.name} (USD)`,
                            dueDate: paymentDueDate,
                            amount: card.spentUSD,
                            type: 'card',
                            currency: 'USD',
                            status: daysUntilDue < 0 ? 'overdue' : 'dueSoon',
                            daysUntilDue,
                        });
                    }
                }
            }
        });
        return reminders;
    }, [isClient, loans, creditCards, transactions, today, reminderDays]);

    const handleRegisterPayment = (payment: OverduePayment) => {
        setSelectedPayment(payment);
    };
    
    const handleSaveTransaction = (transaction: Omit<Transaction, 'id' | 'user' | 'familyId'>) => {
        addDoc('transactions', transaction);
        toast({
            title: "Pago registrado",
            description: `Se ha registrado el pago de ${transaction.amount.toLocaleString(transaction.currency === 'USD' ? 'en-US' : 'es-DO', { style: 'currency', currency: transaction.currency })}.`,
        });
        setSelectedPayment(null);
    };

    if (!isClient) {
        return null;
    }

    return (
        <>
            <section className="space-y-3 w-full">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Recordatorios de Pagos
                    </h3>
                    <div className="flex items-center gap-2">
                        {showConfig && (
                            <Select value={String(reminderDays)} onValueChange={handleDaysChange}>
                                <SelectTrigger className="h-7 text-xs w-[140px] bg-background/60 border-border">
                                    <SelectValue placeholder="Días de aviso" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3">Próximos 3 días</SelectItem>
                                    <SelectItem value="7">Próximos 7 días</SelectItem>
                                    <SelectItem value="15">Próximos 15 días</SelectItem>
                                    <SelectItem value="30">Próximos 30 días</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowConfig(!showConfig)}
                        >
                            <Settings2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {overduePayments.length > 0 ? (
                    overduePayments.map((payment, index) => {
                        const isOverdue = payment.status === 'overdue';
                        const daysLeft = payment.daysUntilDue;
                        
                        let cardColorClass = "border-amber-500 bg-amber-500/10 text-amber-500";
                        let textColorClass = "text-amber-500";
                        let badgeText = `Vence en ${daysLeft} días`;

                        if (isOverdue) {
                            cardColorClass = "border-destructive bg-destructive/10 text-destructive";
                            textColorClass = "text-destructive";
                            badgeText = "Pago Vencido";
                        } else if (daysLeft > 3) {
                            cardColorClass = "border-yellow-500 bg-yellow-500/10 text-yellow-500";
                            textColorClass = "text-yellow-500";
                            badgeText = `Vence en ${daysLeft} días`;
                        }

                        return (
                            <Card 
                                key={`${payment.id}-${payment.currency}-${index}`} 
                                className={cn(
                                    "border-l-4 bg-card/40 border-border backdrop-blur-md shadow-md",
                                    cardColorClass
                                )}
                            >
                                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className={cn("h-6 w-6 shrink-0", textColorClass)} />
                                        <div>
                                            <p className="font-bold font-headline text-foreground">
                                                <span className="text-xs font-semibold uppercase mr-2 px-1.5 py-0.5 rounded bg-muted border border-border">
                                                    {badgeText}
                                                </span>
                                                {payment.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Fecha límite: {payment.dueDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                                {' - '}
                                                <span className="font-semibold text-foreground">
                                                    {payment.amount.toLocaleString(payment.currency === 'USD' ? 'en-US' : 'es-DO', { style: 'currency', currency: payment.currency })}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        className="w-full sm:w-auto sm:ml-auto shrink-0 bg-primary hover:bg-primary/90 text-white font-medium"
                                        onClick={() => handleRegisterPayment(payment)}
                                    >
                                        Registrar Pago
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })
                ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-xl bg-muted/10">
                        No hay pagos vencidos o próximos en el período configurado.
                    </div>
                )}
            </section>
            
            {selectedPayment && (
                <AddTransactionSheet
                    forceOpen={!!selectedPayment}
                    onClose={() => setSelectedPayment(null)}
                    onSave={handleSaveTransaction}
                    defaultType="expense"
                    defaultCategoryValue={selectedPayment.type === 'loan' ? 'debt-payment' : 'credit-card-payment'}
                    defaultPaymentMethod={'Pago de Tarjeta'}
                    defaultCreditCardId={selectedPayment.type === 'card' ? selectedPayment.id : undefined}
                    defaultLoanId={selectedPayment.type === 'loan' ? selectedPayment.id : undefined}
                    defaultAmount={selectedPayment.amount}
                    defaultCurrency={selectedPayment.currency}
                />
            )}
        </>
    );
}
