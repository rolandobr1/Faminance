'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Upload, ArrowDownUp, Receipt, Loader2, TrendingUp, TrendingDown, CalendarIcon, AlignLeft, RefreshCw, Users, Sparkles } from "lucide-react";
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
    const [hasInitialized, setHasInitialized] = useState(false);
    const [lastInitializedId, setLastInitializedId] = useState<string | undefined>(undefined);

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
        const open = forceOpen || isOpen;
        if (!open) {
            setHasInitialized(false);
            setLastInitializedId(undefined);
            return;
        }

        const editId = transactionToEdit?.id;
        if (hasInitialized && editId === lastInitializedId) {
            return;
        }

        // Reset and populate form
        setKey(Date.now()); 
        
        const typeToSet = transactionToEdit?.type || defaultType || 'expense';
        setTransactionType(typeToSet);

        const categoryValue = transactionToEdit?.category || defaultCategoryValue || (typeToSet === 'expense' ? 'other-expense' : 'other-income');
        const category = categoryValue ? categories.find(c => c.value === categoryValue) : undefined;
        if (category) {
            setSelectedCategory({ value: category.value, label: category.label, icon: category.icon });
        } else {
            setSelectedCategory(undefined);
        }
        
        const paymentMethodValue = transactionToEdit?.paymentMethod || defaultPaymentMethod || 'Efectivo';
        const paymentMethod = paymentMethodOptions.find(p => p.value === paymentMethodValue);
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

        setHasInitialized(true);
        setLastInitializedId(editId);

    }, [
        isOpen,
        forceOpen,
        hasInitialized,
        lastInitializedId,
        transactionToEdit,
        defaultType,
        defaultCategoryValue,
        defaultPaymentMethod,
        defaultCreditCardId,
        defaultLoanId,
        defaultAmount,
        defaultCurrency,
        categories,
        creditCards,
        accounts,
        paymentMethodOptions
    ]);


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
        parentId: cat.parentId,
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
        <SheetContent side={isMobile ? 'bottom' : 'right'} className="grid grid-rows-[auto_minmax(0,1fr)_auto] max-h-[90vh] bg-background/90 backdrop-blur-3xl border-l-border p-0 sm:max-w-md">
            <SheetHeader className="p-6 pb-4 border-b border-border/50 glass-header relative z-10">
                <SheetTitle className="font-headline text-2xl tracking-tight text-foreground">
                    {isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
                </SheetTitle>
                <SheetDescription className="text-muted-foreground">
                    {isEditing ? 'Modifica los detalles.' : 'Registra un ingreso o gasto.'}
                </SheetDescription>
            </SheetHeader>
            <form key={key} id="transaction-form" onSubmit={handleSubmit} className="overflow-y-auto overflow-x-hidden relative flex-1 min-h-0 overscroll-contain">
                {/* Background glow */}
                <div className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] rounded-full blur-[100px] pointer-events-none opacity-20 transition-colors duration-500",
                    transactionType === 'income' ? 'bg-green-500' : 'bg-red-500'
                )} />

                <div className="p-6 space-y-6 relative z-10">
                    {/* TYPE SELECTOR */}
                    {!isSimplified && (
                        <div className="flex items-center p-1 bg-muted/20 rounded-full border border-border/50 backdrop-blur-sm relative shadow-inner">
                            <Button 
                                type="button" 
                                onClick={() => {
                                    setTransactionType('expense');
                                    const currentCat = selectedCategory?.value ? categories.find(c => c.value === selectedCategory.value) : null;
                                    if (!currentCat || currentCat.type !== 'expense') {
                                        const otherExpense = categories.find(c => c.value === 'other-expense');
                                        if (otherExpense) {
                                            setSelectedCategory({ value: otherExpense.value, label: otherExpense.label, icon: otherExpense.icon });
                                        } else {
                                            setSelectedCategory(undefined);
                                        }
                                    }
                                }}
                                className={cn(
                                    "flex-1 rounded-full h-10 transition-all duration-300 gap-2 relative overflow-hidden", 
                                    transactionType === 'expense' 
                                        ? 'bg-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-500/30' 
                                        : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                )}
                                variant="ghost"
                            >
                                <TrendingDown className="h-4 w-4" /> Gasto
                            </Button>
                            <Button 
                                type="button" 
                                onClick={() => {
                                    setTransactionType('income');
                                    const currentCat = selectedCategory?.value ? categories.find(c => c.value === selectedCategory.value) : null;
                                    if (!currentCat || currentCat.type !== 'income') {
                                        const otherIncome = categories.find(c => c.value === 'other-income');
                                        if (otherIncome) {
                                            setSelectedCategory({ value: otherIncome.value, label: otherIncome.label, icon: otherIncome.icon });
                                        } else {
                                            setSelectedCategory(undefined);
                                        }
                                    }
                                    if (selectedPaymentMethod?.value === 'Tarjeta de Crédito') {
                                        setSelectedPaymentMethod(undefined);
                                    }
                                }}
                                className={cn(
                                    "flex-1 rounded-full h-10 transition-all duration-300 gap-2 relative overflow-hidden", 
                                    transactionType === 'income' 
                                        ? 'bg-green-500/20 text-green-500 dark:text-green-400 hover:bg-green-500/30' 
                                        : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                )}
                                variant="ghost"
                            >
                                <TrendingUp className="h-4 w-4" /> Ingreso
                            </Button>
                        </div>
                    )}

                    {/* AMOUNT DISPLAY */}
                    <div className={cn(
                        "flex flex-col items-center justify-center p-6 rounded-3xl backdrop-blur-md shadow-2xl transition-all duration-500 relative overflow-hidden group border",
                        transactionType === 'income' 
                            ? 'bg-gradient-to-b from-emerald-500/15 to-emerald-500/5 border-emerald-500/25 shadow-emerald-500/10' 
                            : 'bg-gradient-to-b from-rose-500/15 to-rose-500/5 border-rose-500/25 shadow-rose-500/10'
                    )}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                        <Label htmlFor="amount" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Monto</Label>
                        <div className="flex items-center justify-center gap-2">
                            <Select value={currency} onValueChange={(value) => setCurrency(value as 'DOP' | 'USD')}>
                                <SelectTrigger className="border-none bg-muted/20 hover:bg-muted/50 rounded-xl h-10 px-3 text-foreground font-medium focus:ring-0 w-auto shadow-inner transition-colors">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border/50 text-foreground">
                                    <SelectItem value="DOP">DOP</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                            </Select>
                            
                            <span className={cn(
                                "text-4xl md:text-5xl font-semibold opacity-90 transition-colors drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]",
                                transactionType === 'income' ? 'text-emerald-400' : 'text-rose-400'
                            )}>$</span>
                            <Input
                                id="amount"
                                name="amount"
                                type="text"
                                placeholder="0"
                                required
                                value={displayAmount}
                                onChange={handleAmountChange}
                                className={cn(
                                    "text-5xl md:text-6xl font-bold font-headline border-none bg-transparent h-auto p-0 focus-visible:ring-0 shadow-none w-full max-w-[200px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]",
                                    transactionType === 'income' ? 'text-emerald-500 dark:text-white placeholder:text-emerald-500/30' : 'text-rose-500 dark:text-white placeholder:text-rose-500/30'
                                )}
                                inputMode="decimal"
                            />
                        </div>
                    </div>

                    {/* SELECTORS GRID */}
                    <div className={cn("grid gap-3", !isSimplified && "grid-cols-2")}>
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
                    
                    {/* CONDITIONAL SELECTIONS */}
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
                    
                    {/* DETAILS SECTION */}
                    <div className="space-y-4 p-5 rounded-2xl bg-muted/10 border border-border/50">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Detalles</h3>
                        
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                                <CalendarIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <Input 
                                    id="date" 
                                    name="date" 
                                    type="date" 
                                    value={date} 
                                    onChange={(e) => setDate(e.target.value)} 
                                    required
                                    className="bg-transparent border-none text-foreground focus-visible:ring-1 focus-visible:ring-primary/20 h-10 px-2"
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20 mt-1">
                                <AlignLeft className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <Textarea 
                                    id="description" 
                                    name="description" 
                                    placeholder="Agrega una nota..." 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value)}
                                    className="bg-transparent border-none text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/20 min-h-[60px] resize-none px-2 py-2"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                <Receipt className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1 relative overflow-hidden">
                                <label htmlFor="receipt-input" className="flex items-center justify-between w-full h-10 px-2 rounded-md bg-transparent text-sm cursor-pointer hover:bg-muted/50 transition-colors text-foreground/80">
                                    <span className="truncate">{receiptFile ? receiptFile.name : (receiptPreview ? 'Recibo adjunto' : 'Adjuntar comprobante')}</span>
                                    <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                                </label>
                                <input id="receipt-input" type="file" accept="image/*" className="sr-only" onChange={handleReceiptChange} />
                            </div>
                        </div>
                        
                        {receiptPreview && (
                            <div className="pl-14 pr-2">
                                <img src={receiptPreview} alt="Vista previa del recibo" className="rounded-xl border border-border/50 max-h-32 object-cover w-full opacity-80 hover:opacity-100 transition-opacity" />
                            </div>
                        )}
                        {uploadProgress !== null && (
                            <div className="pl-14 pr-2 space-y-1.5 mt-2">
                                <div className="flex justify-between text-xs text-emerald-400">
                                    <span>Subiendo...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-black/50 overflow-hidden border border-white/5">
                                    <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300 shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${uploadProgress}%` }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ADVANCED SECTION */}
                    <div className="space-y-4 p-5 rounded-2xl bg-muted/5 border border-border/50">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Opciones Avanzadas
                        </h3>

                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform">
                                    <RefreshCw className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                                </div>
                                <Label htmlFor="recurring-expense" className="text-foreground/80 cursor-pointer">Gasto Recurrente</Label>
                            </div>
                            <Switch id="recurring-expense" checked={isRecurring} onCheckedChange={setIsRecurring} className="data-[state=checked]:bg-orange-500" />
                        </div>

                        {isRecurring && (
                            <div className="pl-11 pr-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                <Select name="frequency" defaultValue={transactionToEdit?.frequency || "monthly"}>
                                    <SelectTrigger className="bg-muted/30 border-border/50 text-foreground/80 h-9 w-full">
                                        <SelectValue placeholder="Seleccionar frecuencia" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border/50 text-foreground">
                                        <SelectItem value="daily">Diaria</SelectItem>
                                        <SelectItem value="weekly">Semanal</SelectItem>
                                        <SelectItem value="bi-weekly">Quincenal</SelectItem>
                                        <SelectItem value="monthly">Mensual</SelectItem>
                                        <SelectItem value="yearly">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="flex items-center justify-between group pt-2 border-t border-border/50 mt-2">
                            <div className="flex items-center gap-3 pt-2">
                                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
                                    <Users className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
                                </div>
                                <Label htmlFor="shared-expense" className="text-foreground/80 cursor-pointer">Gasto Compartido</Label>
                            </div>
                            <Switch id="shared-expense" name="isShared" checked={isShared} onCheckedChange={setIsShared} className="data-[state=checked]:bg-cyan-500" />
                        </div>

                        {isShared && (
                            <div className="pl-11 pr-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                <div className="space-y-3 rounded-xl bg-muted/30 border border-border/50 p-3">
                                    <p className="text-xs text-muted-foreground mb-1">Dividir con:</p>
                                    {members.map(member => (
                                        <div key={member.id} className="flex items-center space-x-3 bg-background/50 p-2 rounded-lg border border-border/50 hover:border-cyan-500/30 transition-colors">
                                            <Checkbox id={`user-${member.id}`} name={`user-${member.id}`} defaultChecked={transactionToEdit?.sharedWith?.includes(member.id)} className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 border-border" />
                                            <Label htmlFor={`user-${member.id}`} className="font-medium text-foreground cursor-pointer flex-1">{member.name}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Padding for bottom to avoid being hidden by footer on mobile */}
                    <div className="h-8"></div>
                </div>
            </form>
            <SheetFooter className="p-4 border-t border-border/50 glass-header sm:justify-between items-center z-20 sticky bottom-0">
                <SheetClose asChild>
                    <Button variant="ghost" type="button" className="text-muted-foreground hover:text-foreground hover:bg-muted/50 px-6">Cancelar</Button>
                </SheetClose>
                <Button 
                    type="submit" 
                    form="transaction-form" 
                    disabled={isSubmitting || uploadProgress !== null}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    {(isSubmitting || uploadProgress !== null) ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {uploadProgress !== null ? `Subiendo (${uploadProgress}%)` : 'Guardando...'}
                        </>
                    ) : (
                        isEditing ? 'Guardar Cambios' : 'Añadir Transacción'
                    )}
                </Button>
            </SheetFooter>
        </SheetContent>
    </Sheet>
  );
}
