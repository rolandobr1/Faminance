
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
import { Loader2 } from "lucide-react";

const accountFormSchema = z.object({
    name: z.string().min(1, "El nombre es requerido."),
    bank: z.string().min(1, "El banco es requerido."),
    type: z.enum(['ahorro', 'corriente'], {
        required_error: "Debe seleccionar un tipo de cuenta.",
    }),
    balance: z.preprocess(
        (val) => (val === '' || val === undefined ? 0 : typeof val === 'string' ? parseFloat(val) : val),
        z.number({ invalid_type_error: "El balance debe ser un número." }).min(0, "El balance no puede ser negativo.")
    )
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

export function AccountForm({ 
    account,
    onSave,
    onClose,
    isSubmitting
}: { 
    account?: Account,
    onSave: (data: AccountFormValues) => void,
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
        },
    });

    function onSubmit(data: AccountFormValues) {
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

                <DialogFooter className="pt-4">
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
