'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, getProgressColor } from "@/lib/utils";
import { Banknote, CreditCard as CreditCardIcon, DollarSign, PlusCircle, MoreHorizontal, ArrowRightLeft, HandCoins, TrendingDown, X, ChevronRight, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { AccountForm } from "@/components/faminance/accounts/account-form";
import { CreditCardForm } from "@/components/faminance/accounts/credit-card-form";
import { TransferForm } from "@/components/faminance/accounts/transfer-form";
import { Header } from "@/components/faminance/header";
import { useAccountsPage } from "./use-accounts-page";
import { useFamilyData } from "@/context/family-data-context";
import { useState, useMemo, useEffect } from "react";
import type { CreditCard } from "@/lib/types";

const getDaysUntilCutoff = (cutoffDate: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let nextCutoff = new Date(currentYear, currentMonth, cutoffDate);
    if (today.getDate() > cutoffDate) {
        nextCutoff = new Date(currentYear, currentMonth + 1, cutoffDate);
    }
    
    const diffTime = nextCutoff.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function AccountsPage() {
    const {
        accounts,
        creditCards,
        cashBalance,
        isCreateOpen,
        setCreateOpen,
        isTransferOpen,
        setTransferOpen,
        editingAccount,
        setEditingAccount,
        editingCard,
        setEditingCard,
        isSubmitting,
        totalSavings,
        handleSaveAccount,
        handleSaveCreditCard,
        handleTransfer,
        openEditAccountDialog,
        openEditCardDialog,
        deleteAccount,
        deleteCreditCard,
        getAccountBalance,
        categories,
        isCashEditOpen,
        setCashEditOpen,
        handleCashAdjustment,
    } = useAccountsPage();

    const { transactions } = useFamilyData();
    const [selectedCardDetail, setSelectedCardDetail] = useState<CreditCard | null>(null);

    const cardTransactions = useMemo(() => {
        if (!selectedCardDetail) return [];
        return transactions
            .filter(t => t.creditCardId === selectedCardDetail.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedCardDetail, transactions]);


    useEffect(() => {
        const handleOpenModal = () => setCreateOpen(true);
        document.addEventListener('open-add-account', handleOpenModal);
        return () => document.removeEventListener('open-add-account', handleOpenModal);
    }, [setCreateOpen]);

    return (
        <>
        <Header title="Cuentas y Tarjetas">
            <Button size="sm" className="h-9 gap-1" onClick={() => setCreateOpen(true)}>
                <PlusCircle className="h-4 w-4" />
                Añadir
            </Button>
        </Header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 pb-20 sm:pb-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-4">
                        <CardDescription className="flex items-center gap-2 text-sm font-medium">
                            <DollarSign className="h-4 w-4" />
                            Total en Ahorros
                        </CardDescription>
                        <CardTitle className="text-3xl font-headline">
                            {totalSavings.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                        </CardTitle>
                    </CardHeader>
                    <CardFooter>
                        <Dialog open={isTransferOpen} onOpenChange={setTransferOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="w-full gap-2">
                                    <ArrowRightLeft className="h-4 w-4" />
                                    Añadir Ahorro
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Transferir Fondos para Ahorro</DialogTitle>
                                    <DialogDescription>Mueva dinero desde una de sus cuentas a una cuenta de ahorro.</DialogDescription>
                                </DialogHeader>
                                <TransferForm accounts={accounts || []} cashBalance={cashBalance} onSave={handleTransfer} onClose={() => setTransferOpen(false)} isSubmitting={isSubmitting} />
                            </DialogContent>
                        </Dialog>
                    </CardFooter>
                </Card>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-2">
                {/* Bank Accounts */}
                <div className="space-y-6">
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2">
                                <Banknote className="text-primary" />
                                Cuentas Bancarias
                            </CardTitle>
                            <CardDescription>
                                Un resumen de sus cuentas de ahorro y corrientes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {(accounts && accounts.length > 0) ? accounts.map(account => (
                                    <div key={account.id} className="rounded-lg border bg-card p-4 flex flex-col gap-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium font-headline">{account.name}</p>
                                                <p className="text-sm text-muted-foreground">{account.bank} - <span className="capitalize">{account.type}</span></p>
                                                {account.isRecurringDeposit && account.depositAmount && (
                                                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-primary/80 font-medium bg-primary/10 w-fit px-2 py-0.5 rounded-full">
                                                        <RefreshCw className="h-3 w-3" />
                                                        <span>
                                                            Aporte {
                                                                account.depositFrequency === 'daily' ? 'diario' :
                                                                account.depositFrequency === 'weekly' ? 'semanal' :
                                                                account.depositFrequency === 'bi-weekly' ? 'quincenal' :
                                                                account.depositFrequency === 'yearly' ? 'anual' : 'mensual'
                                                            }: {account.depositAmount.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onSelect={() => openEditAccountDialog(account)}>
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Eliminar</DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente la cuenta "{account.name}".
                                                                 </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteAccount(account.id)}>Eliminar</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <p className="text-xl font-bold text-right">
                                            {getAccountBalance(account.id).toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                                        </p>
                                    </div>
                                )) : (
                                     <div className="flex flex-col items-center justify-center border-dashed border-2 rounded-lg p-8 text-center min-h-[150px]">
                                         <Banknote className="h-10 w-10 text-muted-foreground mb-2"/>
                                         <h4 className="font-semibold">No hay cuentas bancarias</h4>
                                         <p className="text-sm text-muted-foreground mb-4">Añade tu primera cuenta para empezar.</p>
                                         <Button size="sm" onClick={() => setCreateOpen(true)}>
                                             <PlusCircle className="h-4 w-4 mr-2" />
                                             Añadir Cuenta
                                         </Button>
                                     </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="h-fit">
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="font-headline flex items-center gap-2">
                                    <HandCoins className="text-primary" />
                                    Efectivo en Mano
                                </CardTitle>
                                <CardDescription>
                                    Su balance de efectivo disponible.
                                </CardDescription>
                            </div>
                            <Dialog open={isCashEditOpen} onOpenChange={setCashEditOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Ajustar Efectivo en Mano</DialogTitle>
                                        <DialogDescription>
                                            Establece un monto inicial o corrige el balance actual.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        const amount = Number(formData.get('amount'));
                                        if (!isNaN(amount)) {
                                            handleCashAdjustment(amount);
                                        }
                                    }}>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="amount">Nuevo Balance de Efectivo (DOP)</Label>
                                                <Input id="amount" name="amount" type="number" step="0.01" defaultValue={cashBalance} required />
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Esto ajustará tu balance base silenciosamente para que coincida con este monto, sin afectar tus reportes de ingresos o gastos. Para reiniciar tu cuenta a cero, ingresa 0.
                                                </p>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setCashEditOpen(false)}>Cancelar</Button>
                                            <Button type="submit" disabled={isSubmitting}>Guardar Ajuste</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-center py-4">
                                {cashBalance.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Credit Cards */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <CreditCardIcon className="text-primary" />
                            Tarjetas de Crédito
                        </CardTitle>
                        <CardDescription>
                            Un resumen de los límites y gastos de sus tarjetas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {(creditCards && creditCards.length > 0) ? creditCards.map(card => {
                                const progressDOP = card.limitDOP > 0 ? (card.spentDOP / card.limitDOP) * 100 : 0;
                                const progressUSD = card.limitUSD > 0 ? (card.spentUSD / card.limitUSD) * 100 : 0;
                                const availableDOP = card.limitDOP - card.spentDOP;
                                const availableUSD = card.limitUSD - card.spentUSD;
                                
                                const hasDOP = card.limitDOP > 0 || card.spentDOP > 0;
                                const hasUSD = card.limitUSD > 0 || card.spentUSD > 0;

                                return (
                                    <div 
                                        key={card.id} 
                                        className="rounded-xl border bg-card p-4 flex flex-col gap-3 cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all duration-200 group"
                                        onClick={() => setSelectedCardDetail(card)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-medium font-headline">{card.name} ({card.bank})</span>
                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                    <span className="text-xs text-muted-foreground">**** {card.last4}</span>
                                                    {card.cutoffDate && (
                                                        <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                                            Corte en {getDaysUntilCutoff(card.cutoffDate)} {getDaysUntilCutoff(card.cutoffDate) === 1 ? 'día' : 'días'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1" onClick={e => e.stopPropagation()}>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); openEditCardDialog(card); }}>Editar</DropdownMenuItem>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Eliminar</DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Esta acción no se puede deshacer. Esto eliminará permanentemente la tarjeta "{card.name}".
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteCreditCard(card.id)}>Eliminar</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        {hasDOP && (
                                            <div className="space-y-2">
                                                <p className="font-semibold text-sm">Balance en Pesos (DOP)</p>
                                                <Progress value={progressDOP} className="h-3" indicatorClassName={cn(getProgressColor(progressDOP))} />
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium">Gastado: <span className="font-bold">{card.spentDOP.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</span></span>
                                                    <span className="text-muted-foreground">Límite: {card.limitDOP.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</span>
                                                </div>
                                                <div className="text-right text-xs font-semibold text-green-600">
                                                    Disponible: {availableDOP.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                                                </div>
                                            </div>
                                        )}

                                        {hasDOP && hasUSD && <Separator />}

                                        {hasUSD && (
                                            <div className="space-y-2">
                                                <p className="font-semibold text-sm">Balance en Dólares (USD)</p>
                                                <Progress value={progressUSD} className="h-3" indicatorClassName={cn(getProgressColor(progressUSD))} />
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium">Gastado: <span className="font-bold">{card.spentUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span></span>
                                                    <span className="text-muted-foreground">Límite: {card.limitUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                                                </div>
                                                <div className="text-right text-xs font-semibold text-green-600">
                                                    Disponible: {availableUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            }) : (
                                 <div className="flex flex-col items-center justify-center border-dashed border-2 rounded-lg p-8 text-center min-h-[150px]">
                                    <CreditCardIcon className="h-10 w-10 text-muted-foreground mb-2"/>
                                    <h4 className="font-semibold">No hay tarjetas de crédito</h4>
                                    <p className="text-sm text-muted-foreground mb-4">Añade tu primera tarjeta para empezar.</p>
                                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Añadir Tarjeta
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
        
        <Dialog open={isCreateOpen} onOpenChange={(isOpen) => {
                setCreateOpen(isOpen);
                if (!isOpen) {
                    setEditingAccount(undefined);
                    setEditingCard(undefined);
                }
            }}>
            <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                    <DialogTitle>{editingAccount ? "Editar Cuenta" : editingCard ? "Editar Tarjeta de Crédito" : "Añadir Nueva Cuenta o Tarjeta"}</DialogTitle>
                    <DialogDescription>
                        {editingAccount ? "Ajuste los detalles de su cuenta." : editingCard ? "Ajuste los detalles de su tarjeta." : "Seleccione el tipo que desea añadir y complete la información."}
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue={editingCard ? "card" : "account"} className="w-full">
                    {!editingAccount && !editingCard && (
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="account">Cuenta Bancaria</TabsTrigger>
                            <TabsTrigger value="card">Tarjeta de Crédito</TabsTrigger>
                        </TabsList>
                    )}
                    <TabsContent value="account">
                        <AccountForm account={editingAccount} accounts={accounts} categories={categories} onSave={handleSaveAccount} onClose={() => { setCreateOpen(false); setEditingAccount(undefined); }} isSubmitting={isSubmitting} />
                    </TabsContent>
                    <TabsContent value="card">
                        <CreditCardForm card={editingCard} onSave={handleSaveCreditCard} onClose={() => { setCreateOpen(false); setEditingCard(undefined); }} isSubmitting={isSubmitting} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>

        {/* Card Transactions Sheet */}
        <Sheet open={!!selectedCardDetail} onOpenChange={(open) => !open && setSelectedCardDetail(null)}>
            <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
                <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-r from-slate-900 to-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <CreditCardIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl">{selectedCardDetail?.name}</SheetTitle>
                            <SheetDescription>{selectedCardDetail?.bank} &bull; **** {selectedCardDetail?.last4}</SheetDescription>
                        </div>
                    </div>

                    {/* Quick stats */}
                    {selectedCardDetail && (
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            {(selectedCardDetail.limitDOP > 0 || selectedCardDetail.spentDOP > 0) && (
                                <div className="bg-muted/50 rounded-xl p-3 border border-border">
                                    <p className="text-xs text-muted-foreground mb-1">Gastado DOP</p>
                                    <p className="font-bold text-red-400">{selectedCardDetail.spentDOP.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</p>
                                    <p className="text-xs text-muted-foreground">de {selectedCardDetail.limitDOP.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</p>
                                </div>
                            )}
                            {(selectedCardDetail.limitUSD > 0 || selectedCardDetail.spentUSD > 0) && (
                                <div className="bg-muted/50 rounded-xl p-3 border border-border">
                                    <p className="text-xs text-muted-foreground mb-1">Gastado USD</p>
                                    <p className="font-bold text-red-400">{selectedCardDetail.spentUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                                    <p className="text-xs text-muted-foreground">de {selectedCardDetail.limitUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                                </div>
                            )}
                        </div>
                    )}
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-3">
                        {cardTransactions.length} transacci{cardTransactions.length === 1 ? 'ón' : 'ones'}
                    </p>

                    {cardTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                                <TrendingDown className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="font-semibold">Sin transacciones</p>
                            <p className="text-sm text-muted-foreground mt-1">No hay gastos registrados con esta tarjeta.</p>
                        </div>
                    ) : (
                        cardTransactions.map(tx => (
                            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-card border hover:border-primary/30 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{tx.description || tx.category}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(tx.date).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground">{tx.category}</span>
                                    </div>
                                </div>
                                <p className={cn(
                                    "font-bold text-sm ml-3 shrink-0",
                                    tx.type === 'income' ? 'text-green-500' : 'text-red-400'
                                )}>
                                    {tx.type === 'income' ? '+' : '-'}
                                    {tx.currency === 'USD'
                                        ? tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                                        : tx.amount.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </SheetContent>
        </Sheet>
        </>
    );
}
