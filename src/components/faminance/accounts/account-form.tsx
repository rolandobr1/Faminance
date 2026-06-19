
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Account, Category } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { getNextDueDate, getAlignedRecurringDate } from "@/lib/services/recurring-service";

const accountFormSchema = z.object({
    name: z.string().min(1, "El nombre es requerido."),
    bank: z.string().min(1, "El banco es requerido."),
    type: z.enum(['ahorro', 'corriente'], {
        required_error: "Debe seleccionar un tipo de cuenta.",
    }),
    balance: z.preprocess(
        (val) => (val === '' || val === undefined ? 0 : typeof val === 'string' ? parseFloat(val) : val),
        z.number({ invalid_type_error: "El balance debe ser un número." }).min(0, "El balance no puede ser negativo.")
    ),
    isRecurringDeposit: z.boolean().optional(),
    depositAmount: z.preprocess(
        (val) => (val === '' || val === undefined ? undefined : typeof val === 'string' ? parseFloat(val) : val),
        z.number({ invalid_type_error: "El monto debe ser un número." }).min(0, "El monto no puede ser negativo.").optional()
    ),
    depositFrequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly', 'yearly']).optional(),
    depositSourceAccountId: z.string().optional(),
    depositCategory: z.string().optional(),
    recurringDay: z.preprocess(
        (val) => (val === '' || val === undefined ? undefined : typeof val === 'string' ? parseInt(val) : val),
        z.number().min(1, "El día debe ser entre 1 y 31").max(31, "El día debe ser entre 1 y 31").optional()
    ),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

export function AccountForm({ 
    account,
    accounts = [],
    categories = [],
    onSave,
    onClose,
    isSubmitting
}: { 
    account?: Account,
    accounts?: Account[],
    categories?: Category[],
    onSave: (data: AccountFormValues & { nextDepositDate?: string }) => void,
    onClose: () => void,
    isSubmitting: boolean
}) {
    const form = useForm<AccountFormValues>({
        resolver: zodResolver(accountFormSchema),
        defaultValues: {
            name: account?.name || '',
            bank: account?.bank || '',
            type: account?.type || undefined,
            balance: account?.balance || 0,
            isRecurringDeposit: account?.isRecurringDeposit || false,
            depositAmount: account?.depositAmount,
            depositFrequency: account?.depositFrequency,
            depositSourceAccountId: account?.depositSourceAccountId,
            depositCategory: account?.depositCategory || 'saving-contribution',
            recurringDay: account?.recurringDay,
        },
    });

    const isRecurringDeposit = form.watch("isRecurringDeposit");

    function onSubmit(data: AccountFormValues) {
        let nextDepositDate = account?.nextDepositDate;
        if (data.isRecurringDeposit && data.depositFrequency) {
            if (!nextDepositDate || data.recurringDay !== account?.recurringDay) {
                let baseDate = new Date();
                if (data.recurringDay) {
                    baseDate = getAlignedRecurringDate(baseDate, data.recurringDay);
                } else {
                    baseDate = getNextDueDate(baseDate, data.depositFrequency) || baseDate;
                }
                nextDepositDate = baseDate.toISOString();
            }
        }
        
        onSave({
            ...data,
            ...(data.isRecurringDeposit && nextDepositDate ? { nextDepositDate } : {})
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto pr-2 pb-2 space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Cuenta Principal" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="bank"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Banco <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Banco Popular" {...field} />
                            </FormControl>
                             <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo <span className="text-destructive">*</span></FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar tipo" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="ahorro">Ahorro</SelectItem>
                                    <SelectItem value="corriente">Corriente</SelectItem>
                                </SelectContent>
                            </Select>
                           <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="balance"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Balance Inicial</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="RD$0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isRecurringDeposit"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Aporte Automático</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                    Recibir fondos automáticamente en esta cuenta.
                                </div>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {isRecurringDeposit && (
                    <div className="space-y-4 border-l-2 border-primary/20 pl-4 py-2 mt-2">
                        <FormField
                            control={form.control}
                            name="depositAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto del Aporte</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="RD$0.00" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="depositFrequency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Frecuencia</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar frecuencia" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="daily">Diaria</SelectItem>
                                            <SelectItem value="weekly">Semanal</SelectItem>
                                            <SelectItem value="bi-weekly">Quincenal</SelectItem>
                                            <SelectItem value="monthly">Mensual</SelectItem>
                                            <SelectItem value="yearly">Anual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                   <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="recurringDay"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Día del mes para el aporte (1-31)</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            placeholder="Ej: 15" 
                                            {...field} 
                                            value={field.value ?? ''} 
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                            min={1}
                                            max={31}
                                            required
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="depositSourceAccountId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cuenta de Origen</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="¿De dónde sale el dinero?" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="cash">💵 Efectivo a Mano</SelectItem>
                                            {accounts.filter(a => a.id !== account?.id).map(a => (
                                                <SelectItem key={a.id} value={a.id}>🏦 {a.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                   <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="depositCategory"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoría del Gasto</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione una categoría" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.filter(c => c.type === 'expense').map(c => (
                                                <SelectItem key={c.id || c.value} value={c.value}>{c.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Bajo esta categoría se registrará el descuento del efectivo/cuenta.
                                    </div>
                                   <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
                </div>
                <DialogFooter className="pt-4 mt-2 border-t shrink-0">
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cuenta
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
