'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Upload, ArrowDownUp, Receipt, Loader2 } from "lucide-react";
import { iconMap } from "@/lib/data";
import { Switch } from "@/components/ui/switch";
import { useState, useMemo, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Transaction, Category, CreditCard, Account } from '@/lib/types';
import { SelectionModal, type SelectionOption } from "./selection-modal";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFamilyData } from "@/context/family-data-context";
import { getNextDueDate } from "@/lib/services/recurring-service";
import { uploadReceipt } from "@/lib/firebase/storage";


type AddTransactionSheetProps = {
    onSave: (transaction: Omit<Transaction, 'id' | 'user' | 'familyId'>, id?: string) => void;
    transactionToEdit?: Transaction;
    onClose?: () => void;
    forceOpen?: boolean;
    defaultType?: 'income' | 'expense' | null;
    defaultCategoryValue?: string;
    defaultPaymentMethod?: Transaction['paymentMethod'];
    defaultCreditCardId?: string;
    defaultLoanId?: string;
    defaultAmount?: number;
    defaultCurrency?: 'DOP' | 'USD';
    isSubmitting?: boolean;
};

const getLocalDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function AddTransactionSheet({
    onSave,
    transactionToEdit,
    onClose,
    forceOpen = false,
    defaultType = null,
    defaultCategoryValue,
    defaultPaymentMethod,
    defaultCreditCardId,
    defaultLoanId,
    defaultAmount,
    defaultCurrency,
    isSubmitting = false,
}: AddTransactionSheetProps) {
    const { creditCards, accounts, categories, members } = useFamilyData();
    const { toast } = useToast();
    const isMobile = useIsMobile();
    
    // Form state
    const [isOpen, setIsOpen] = useState(false);
    const [isShared, setIsShared] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [transactionType, setTransactionType] = useState<Transaction['type'] | undefined>(transactionToEdit?.type || (defaultType ?? undefined));
    const [selectedCategory, setSelectedCategory] = useState<SelectionOption | undefined>();
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<SelectionOption | undefined>();
    const [selectedCard, setSelectedCard] = useState<CreditCard | undefined>();
    const [selectedAccount, setSelectedAccount] = useState<Account | undefined>();
    
    const [numericAmount, setNumericAmount] = useState<number | null>(null);
    const [displayAmount, setDisplayAmount] = useState('');

    const [currency, setCurrency] = useState<Transaction['currency']>('DOP');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [loanId, setLoanId] = useState<string | undefined>();

    const [key, setKey] = useState(Date.now()); // Key to reset form

    const isEditing = !!(transactionToEdit && transactionToEdit.id);
    const isSimplified = !!defaultCategoryValue && !isEditing;

    const formatNumber = (num: number) => {
        return num.toLocaleString('en-US');
    };
    
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Remove non-numeric characters
        const numericValue = value.replace(/[^0-9.]/g, '');
        const number = parseFloat(numericValue);

        if (!isNaN(number)) {
            setNumericAmount(number);
            setDisplayAmount(number.toLocaleString('en-US'));
        } else if (numericValue === '') {
            setNumericAmount(null);
            setDisplayAmount('');
        }
    };

     const paymentMethodOptions: SelectionOption[] = useMemo(() => [
        { value: 'Pago de Tarjeta', label: 'Pago de Tarjeta', icon: 'CreditCard', disabled: creditCards.length === 0 },
        { value: 'Tarjeta de Crédito', label: 'Tarjeta de Crédito', icon: 'CreditCard', disabled: creditCards.length === 0 || transactionType === 'income' },
        { value: 'Tarjeta de Débito', label: 'Tarjeta de Débito', icon: 'Landmark', disabled: accounts.length === 0 },
        { value: 'Transferencia Bancaria', label: 'Transferencia', icon: 'ArrowDownUp', disabled: accounts.length === 0 },
        { value: 'Efectivo', label: 'Efectivo', icon: 'HandCoins' },
    ], [creditCards.length, accounts.length, transactionType]);


    useEffect(() => {
        if (!forceOpen && !isOpen) return;

        // Reset and populate form
        setKey(Date.now()); 
        
        const typeToSet = transactionToEdit?.type || defaultType;
        setTransactionType(typeToSet || undefined);

        const categoryValue = transactionToEdit?.category || defaultCategoryValue;
        const category = categoryValue ? categories.find(c => c.value === categoryValue) : undefined;
        if (category) {
            setSelectedCategory({ value: category.value, label: category.label, icon: category.icon });
        } else {
            setSelectedCategory(undefined);
        }
        
        const paymentMethodValue = transactionToEdit?.paymentMethod || defaultPaymentMethod;
        const paymentMethod = paymentMethodValue ? paymentMethodOptions.find(p => p.value === paymentMethodValue) : undefined;
        setSelectedPaymentMethod(paymentMethod);
        
        const cardId = transactionToEdit?.creditCardId || defaultCreditCardId;
        const card = cardId ? creditCards.find(c => c.id === cardId) : undefined;
        setSelectedCard(card);

        const account = transactionToEdit?.accountId ? accounts.find(a => a.id === transactionToEdit.accountId) : undefined;
        setSelectedAccount(account);
        
        const amountToSet = transactionToEdit?.amount || defaultAmount;
        if (amountToSet) {
            setNumericAmount(amountToSet);
            setDisplayAmount(formatNumber(amountToSet));
        } else {
            setNumericAmount(null);
            setDisplayAmount('');
        }

        setCurrency(transactionToEdit?.currency || defaultCurrency || 'DOP');
        setDate(transactionToEdit?.date ? transactionToEdit.date.split('T')[0] : getLocalDateString());
        setDescription(transactionToEdit?.description || '');
        setLoanId(transactionToEdit?.loanId || defaultLoanId);

        setIsShared(transactionToEdit?.isShared || false);
        setIsRecurring(transactionToEdit?.isRecurring || false);
        setReceiptFile(null);
        setReceiptPreview(transactionToEdit?.receiptUrl || null);

    }, [transactionToEdit?.id, forceOpen, defaultCategoryValue, defaultPaymentMethod, defaultCreditCardId, defaultLoanId, defaultAmount, defaultCurrency, categories, creditCards, accounts, paymentMethodOptions]);


    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            onClose?.();
        }
    }

    const filteredCategories = useMemo(() => {
        if (!transactionType) return [];
        return categories.filter(c => c.type === transactionType && c.isActive);
    }, [transactionType, categories]);
    
    const cardOptions: SelectionOption[] = creditCards.map(card => ({
        value: card.id,
        label: `${card.name} (${card.last4})`,
        icon: 'CreditCard'
    }));

     const accountOptions: SelectionOption[] = accounts.map(acc => ({
        value: acc.id,
        label: `${acc.name} (${acc.bank})`,
        icon: 'Landmark'
    }));

     const categoryOptions: SelectionOption[] = filteredCategories.map(cat => ({
        value: cat.value,
        label: cat.label,
        icon: cat.icon,
    }));


    const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setReceiptFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setReceiptPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setReceiptPreview(null);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const sharedWith = isShared ? members.filter(member => formData.get(`user-${member.id}`)).map(m => m.id) : [];
        
        if (!transactionType || !selectedCategory || !selectedPaymentMethod || !numericAmount || !date) {
            toast({
                title: "Campos incompletos",
                description: "Por favor, complete todos los campos obligatorios.",
                variant: 'destructive',
            })
            return;
        }
        
         if (transactionType === 'income' && selectedPaymentMethod.value === 'Tarjeta de Crédito') {
            toast({ title: 'Método de pago inválido', description: 'No se puede recibir un ingreso en una tarjeta de crédito.', variant: 'destructive' });
            return;
        }

        const frequency = formData.get('frequency') as Transaction['frequency'];
        const nextDueDate = isRecurring && frequency ? getNextDueDate(date, frequency)?.toISOString() : undefined;

        // Upload receipt if a new file was selected
        let receiptUrl: string | undefined = transactionToEdit?.receiptUrl;
        if (receiptFile) {
            try {
                setUploadProgress(0);
                const txId = transactionToEdit?.id || `new-${Date.now()}`;
                receiptUrl = await uploadReceipt(receiptFile, txId, (p) => setUploadProgress(Math.round(p)));
            } catch (err) {
                toast({ title: 'Error al subir recibo', description: 'No se pudo subir la imagen. Intente de nuevo.', variant: 'destructive' });
                setUploadProgress(null);
                return;
            } finally {
                setUploadProgress(null);
            }
        }

        const newTransaction: Omit<Transaction, 'id' | 'user' | 'familyId'> = {
            date: date,
            description: description,
            amount: numericAmount,
            type: transactionType,
            currency: currency,
            category: selectedCategory.value,
            paymentMethod: selectedPaymentMethod.value as Transaction['paymentMethod'],
            isShared,
            sharedWith,
            isRecurring,
            ...(receiptUrl && { receiptUrl }),
            ...(['Tarjeta de Crédito', 'Pago de Tarjeta'].includes(selectedPaymentMethod.value) && selectedCard?.id && { creditCardId: selectedCard.id }),
            ...(['Tarjeta de Débito', 'Transferencia Bancaria', 'Pago de Tarjeta'].includes(selectedPaymentMethod?.value || '') && selectedAccount?.id && { accountId: selectedAccount.id }),
            ...(isRecurring && { frequency: frequency }),
            ...(nextDueDate && { nextDueDate: nextDueDate }),
        };

        if (transactionToEdit?.budgetId) {
            newTransaction.budgetId = transactionToEdit.budgetId;
        }
        
        if (loanId) {
            newTransaction.loanId = loanId;
        }

        onSave(newTransaction, transactionToEdit?.id);
        if (!isSubmitting) {
          handleOpenChange(false);
        }
    };
    
    const handlePaymentMethodSelect = (option: SelectionOption) => {
        if (option.disabled) {
            toast({
                title: option.value === 'Tarjeta de Crédito' && transactionType === 'income' ? 'Método inválido para ingresos' : "No hay cuentas registradas",
                description: option.value === 'Tarjeta de Crédito' && transactionType === 'income' ? 'No puedes recibir un ingreso en una tarjeta de crédito.' : "Por favor, añada una cuenta bancaria o tarjeta para poder usar este método de pago.",
                variant: 'destructive'
            });
            return;
        }
        setSelectedPaymentMethod(option);
    }

    const open = forceOpen || isOpen;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side={isMobile ? 'bottom' : 'right'} className="grid-rows-[auto_minmax(0,1fr)_auto] max-h-[90vh]">
            <SheetHeader>
                <SheetTitle className="font-headline">{isEditing ? 'Editar Transacción' : 'Añadir Transacción'}</SheetTitle>
                <SheetDescription>
                    {isEditing ? 'Modifique los detalles de la transacción.' : 'Registre un nuevo ingreso o gasto para su familia.'}
                </SheetDescription>
            </SheetHeader>
            <form key={key} id="transaction-form" onSubmit={handleSubmit} className="overflow-y-auto p-1">
                <div className="grid gap-4 py-4">
                    <div className={cn(
                        "p-4 rounded-lg bg-muted/50",
                        transactionType === 'income' ? 'text-green-500' : 'text-destructive'
                    )}>
                        <Label htmlFor="amount" className="text-sm text-muted-foreground">Monto de la transacción</Label>
                        <div className="flex items-baseline justify-center gap-1 mt-1">
                            <span className="text-xl md:text-2xl font-semibold opacity-70">{currency === 'DOP' ? 'RD$' : 'US$'}</span>
                            <Input
                                id="amount"
                                name="amount"
                                type="text"
                                placeholder="0"
                                required
                                value={displayAmount}
                                onChange={handleAmountChange}
                                className={cn(
                                    "text-4xl md:text-5xl font-bold font-headline text-center border-none bg-transparent h-auto p-0 focus-visible:ring-0 shadow-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                )}
                                inputMode="decimal"
                            />
                            <Select value={currency} onValueChange={(value) => setCurrency(value as 'DOP' | 'USD')}>
                                <SelectTrigger className="border-none bg-transparent text-xl md:text-2xl font-semibold focus:ring-0 focus:ring-offset-0 min-w-[70px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DOP">DOP</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {!isSimplified && (
                        <div className="flex items-center justify-center gap-2 rounded-full bg-muted p-1">
                            <Button 
                                type="button" 
                                onClick={() => {
                                    setTransactionType('expense');
                                    if (selectedCategory?.value && categories.find(c => c.value === selectedCategory.value)?.type !== 'expense') {
                                        setSelectedCategory(undefined);
                                    }
                                }}
                                className={cn("rounded-full flex-1", transactionType === 'expense' ? 'bg-background shadow' : 'bg-transparent text-muted-foreground hover:bg-background/50')}
                                size="sm"
                            >Gasto</Button>
                            <Button 
                                type="button" 
                                onClick={() => {
                                    setTransactionType('income');
                                        if (selectedCategory?.value && categories.find(c => c.value === selectedCategory.value)?.type !== 'income') {
                                        setSelectedCategory(undefined);
                                    }
                                    if (selectedPaymentMethod?.value === 'Tarjeta de Crédito') {
                                        setSelectedPaymentMethod(undefined);
                                    }
                                }}
                                className={cn("rounded-full flex-1", transactionType === 'income' ? 'bg-background shadow' : 'bg-transparent text-muted-foreground hover:bg-background/50')}
                                size="sm"
                            >Ingreso</Button>
                        </div>
                    )}

                    <div className={cn("grid gap-4", !isSimplified && "grid-cols-1 md:grid-cols-2")}>
                         {!isSimplified && (
                            <SelectionModal 
                                title="Categoría" 
                                options={categoryOptions} 
                                selected={selectedCategory} 
                                onSelect={setSelectedCategory}
                                disabled={!transactionType}
                            />
                        )}
                        <SelectionModal 
                            title="Método de Pago" 
                            options={paymentMethodOptions} 
                            selected={selectedPaymentMethod} 
                            onSelect={handlePaymentMethodSelect}
                        />
                    </div>
                    
                    {selectedPaymentMethod?.value === 'Pago de Tarjeta' && (
                         <SelectionModal 
                            title="Pagar Tarjeta" 
                            options={cardOptions}
                            selected={cardOptions.find(c => c.value === selectedCard?.id)}
                            onSelect={(option) => setSelectedCard(creditCards.find(c => c.id === option.value))}
                        />
                    )}

                    {selectedPaymentMethod?.value === 'Tarjeta de Crédito' && (
                        <SelectionModal 
                            title="Tarjeta Utilizada" 
                            options={cardOptions}
                            selected={cardOptions.find(c => c.value === selectedCard?.id)}
                            onSelect={(option) => setSelectedCard(creditCards.find(c => c.id === option.value))}
                        />
                    )}
                    {['Tarjeta de Débito', 'Transferencia Bancaria', 'Pago de Tarjeta'].includes(selectedPaymentMethod?.value || '') && (
                        <SelectionModal
                            title="Desde Cuenta Bancaria"
                            options={accountOptions}
                            selected={accountOptions.find(a => a.value === selectedAccount?.id)}
                            onSelect={(option) => setSelectedAccount(accounts.find(a => a.id === option.value))}
                        />
                    )}
                    
                    <div className="grid gap-2">
                        <Label htmlFor="date">Fecha</Label>
                        <Input id="date" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required/>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea id="description" name="description" placeholder="Opcional (ej: Compras semanales)" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="receipt">Recibo</Label>
                        <label htmlFor="receipt-input" className="flex items-center gap-2 h-10 px-4 py-2 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors">
                            <Receipt className="h-4 w-4 shrink-0" />
                            <span className="truncate">{receiptFile ? receiptFile.name : (receiptPreview ? 'Recibo adjunto' : 'Subir Imagen')}</span>
                        </label>
                        <input
                            id="receipt-input"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleReceiptChange}
                        />
                        {receiptPreview && (
                            <img
                                src={receiptPreview}
                                alt="Vista previa del recibo"
                                className="mt-1 rounded-md border border-border max-h-32 object-contain w-full"
                            />
                        )}
                        {uploadProgress !== null && (
                            <div className="mt-1 space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Subiendo recibo...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="recurring-expense">Transacción Recurrente</Label>
                            <Switch id="recurring-expense" checked={isRecurring} onCheckedChange={setIsRecurring} />
                        </div>
                        {isRecurring && (
                            <select name="frequency" defaultValue={transactionToEdit?.frequency || "monthly"} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                <option value="daily">Diaria</option>
                                <option value="weekly">Semanal</option>
                                <option value="bi-weekly">Quincenal</option>
                                <option value="monthly">Mensual</option>
                                <option value="yearly">Anual</option>
                            </select>
                        )}
                        <div className="flex items-center justify-between">
                            <Label htmlFor="shared-expense">Gasto Compartido</Label>
                            <Switch id="shared-expense" name="isShared" checked={isShared} onCheckedChange={setIsShared} />
                        </div>
                        {isShared && (
                            <div className="space-y-2 rounded-md border p-4">
                                <p className="text-sm font-medium">Compartir con:</p>
                                {members.map(member => (
                                    <div key={member.id} className="flex items-center space-x-2">
                                        <Checkbox id={`user-${member.id}`} name={`user-${member.id}`} defaultChecked={transactionToEdit?.sharedWith?.includes(member.id)} />
                                        <Label htmlFor={`user-${member.id}`} className="font-normal">{member.name}</Label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </form>
             <SheetFooter>
                <SheetClose asChild>
                    <Button variant="outline" type="button">Cancelar</Button>
                </SheetClose>
                <Button type="submit" form="transaction-form" disabled={isSubmitting || uploadProgress !== null}>
                    {(isSubmitting || uploadProgress !== null) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {uploadProgress !== null ? `Subiendo (${uploadProgress}%)` : 'Guardar'}
                </Button>
            </SheetFooter>
        </SheetContent>
    </Sheet>
  );
}
