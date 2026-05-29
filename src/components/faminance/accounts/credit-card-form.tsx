
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { CreditCard } from "@/lib/types";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const creditCardFormSchema = z.object({
    name: z.string().min(1, "El nombre es requerido."),
    bank: z.string().min(1, "El banco es requerido."),
    last4: z.string().length(4, "Debe contener 4 dígitos.").regex(/^\d{4}$/, "Debe contener solo números."),
    limitDOP: z.preprocess(
        (val) => (val === '' ? 0 : typeof val === 'string' ? parseFloat(val) : val),
        z.number().min(0, "El límite no puede ser negativo.").optional()
    ),
    limitUSD: z.preprocess(
        (val) => (val === '' ? 0 : typeof val === 'string' ? parseFloat(val) : val),
        z.number().min(0, "El límite no puede ser negativo.").optional()
    ),
    cutoffDate: z.preprocess(
        (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
        z.number({required_error: "El día de corte es requerido."}).min(1, "Día inválido.").max(31, "Día inválido.")
    ),
    paymentDays: z.preprocess(
        (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
        z.number({required_error: "Los días de pago son requeridos."}).min(1, "Debe ser al menos 1 día.")
    ),
});

export type CreditCardFormValues = z.infer<typeof creditCardFormSchema>;

export function CreditCardForm({ 
    card,
    onSave,
    onClose,
    isSubmitting
}: { 
    card?: CreditCard;
    onSave: (card: CreditCardFormValues) => void,
    onClose: () => void,
    isSubmitting: boolean
}) {
    const form = useForm<CreditCardFormValues>({
        resolver: zodResolver(creditCardFormSchema),
        defaultValues: {
            name: card?.name || '',
            bank: card?.bank || '',
            last4: card?.last4 || '',
            limitDOP: card?.limitDOP || 0,
            limitUSD: card?.limitUSD || 0,
            cutoffDate: card?.cutoffDate || 1,
            paymentDays: card?.paymentDays || 20,
        },
    });

    function onSubmit(data: CreditCardFormValues) {
        onSave(data);
    }
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Visa Gold" {...field} />
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
                                <Input placeholder="Ej: Scotiabank" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="last4"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Últimos 4 dígitos <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <Input placeholder="1234" maxLength={4} {...field} />
                            </FormControl>
                           <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="limitDOP"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Límite (DOP)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="RD$0.00" {...field} />
                            </FormControl>
                           <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="limitUSD"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Límite (USD)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="US$0.00" {...field} />
                            </FormControl>
                           <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="cutoffDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Día de Corte <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <Input type="number" min="1" max="31" placeholder="Ej: 25" {...field} />
                            </FormControl>
                           <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="paymentDays"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Días para Pagar <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <Input type="number" min="1" placeholder="Ej: 20" {...field} />
                            </FormControl>
                           <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter className="pt-4">
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Tarjeta
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
