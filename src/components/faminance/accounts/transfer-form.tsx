
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Account } from "@/lib/types";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useFamilyData } from "@/context/family-data-context";
import { Loader2 } from "lucide-react";

const transferFormSchema = z.object({
    from: z.string().min(1, "Debe seleccionar una cuenta de origen."),
    to: z.string().min(1, "Debe seleccionar una cuenta de destino."),
    amount: z.preprocess(
        (val) => (typeof val === 'string' ? parseFloat(val) : val),
        z.number({ required_error: "El monto es requerido.", invalid_type_error: "El monto debe ser un número."}).positive("El monto debe ser mayor a cero.")
    )
});

export type TransferFormValues = z.infer<typeof transferFormSchema>;

export function TransferForm({ 
    accounts,
    cashBalance,
    onSave,
    onClose,
    isSubmitting,
}: { 
    accounts: Account[],
    cashBalance: number,
    onSave: (fromId: string, toId: string, amount: number) => void,
    onClose: () => void,
    isSubmitting: boolean,
}) {
    const { getAccountBalance } = useFamilyData();
    
    // Origin can be cash or a non-savings account
    const allOriginAccounts = [
        { id: 'cash', name: 'Efectivo en Mano', balance: cashBalance, type: 'efectivo' },
        ...accounts.filter(acc => acc.type !== 'ahorro').map(acc => ({...acc, balance: getAccountBalance(acc.id)})),
    ];
    // Destination can be cash or a savings account
     const allDestinationAccounts = [
        { id: 'cash', name: 'Efectivo en Mano', balance: cashBalance, type: 'efectivo' },
        ...accounts.filter(acc => acc.type === 'ahorro').map(acc => ({...acc, balance: getAccountBalance(acc.id)})),
    ];

    const form = useForm<TransferFormValues>({
        resolver: zodResolver(transferFormSchema),
    });

    function onSubmit(data: TransferFormValues) {
        if (data.from === data.to) {
            form.setError("to", { type: "manual", message: "La cuenta de destino no puede ser la misma que la de origen." });
            return;
        }

        const fromAccount = allOriginAccounts.find(acc => acc.id === data.from);
        if (fromAccount && fromAccount.balance < data.amount) {
            form.setError("amount", { type: "manual", message: "Fondos insuficientes en la cuenta de origen." });
            return;
        }
        
        onSave(data.from, data.to, data.amount);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField
                    control={form.control}
                    name="from"
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">Desde</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                     <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Seleccionar cuenta origen" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {allOriginAccounts.map(acc => (
                                        <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.balance.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage className="col-span-4 text-right" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="to"
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">Hacia</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                     <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Seleccionar cuenta destino" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {allDestinationAccounts.map(acc => (
                                        <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.balance.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage className="col-span-4 text-right" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">Monto</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="RD$0.00" className="col-span-3" {...field} />
                            </FormControl>
                            <FormMessage className="col-span-4 text-right" />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Realizar Transferencia
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

    
