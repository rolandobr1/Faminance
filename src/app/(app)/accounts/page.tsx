'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Banknote, CreditCard as CreditCardIcon, DollarSign, PlusCircle, MoreHorizontal, ArrowRightLeft, HandCoins } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
    } = useAccountsPage();

    const getProgressColor = (progress: number) => {
        if (progress > 85) return "bg-destructive";
        if (progress > 60) return "bg-accent";
        return "bg-primary";
    }

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
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2">
                                <HandCoins className="text-primary" />
                                Efectivo en Mano
                            </CardTitle>
                            <CardDescription>
                                Su balance de efectivo disponible.
                            </CardDescription>
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
                                    <div key={card.id} className="rounded-lg border bg-card p-4 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-medium font-headline">{card.name} ({card.bank})</span>
                                                <p className="text-sm text-muted-foreground">**** {card.last4}</p>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onSelect={() => openEditCardDialog(card)}>Editar</DropdownMenuItem>
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
                        <AccountForm account={editingAccount} onSave={handleSaveAccount} onClose={() => { setCreateOpen(false); setEditingAccount(undefined); }} isSubmitting={isSubmitting} />
                    </TabsContent>
                    <TabsContent value="card">
                        <CreditCardForm card={editingCard} onSave={handleSaveCreditCard} onClose={() => { setCreateOpen(false); setEditingCard(undefined); }} isSubmitting={isSubmitting} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
        </>
    );
}
