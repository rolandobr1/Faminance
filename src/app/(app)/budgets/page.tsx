'use client';
import { useState, useEffect } from 'react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { iconMap } from "@/lib/data";
import { cn, getProgressColor } from "@/lib/utils";
import { PlusCircle, MoreHorizontal, PiggyBank, Receipt, ReceiptText, AlertTriangle, ArrowUpDown, ChevronLeft, ChevronRight, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddTransactionSheet } from "@/components/faminance/transactions/add-transaction-sheet";
import { TransactionTable } from "@/components/faminance/transactions/transaction-table";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { Header } from "@/components/faminance/header";
import { BudgetForm } from "./budget-form";
import { useBudgetsPage } from "./use-budgets-page";

function BudgetCard({
    budget,
    setEditingBudget,
    deleteBudget,
    setViewingTransactionsFor,
    setTransactionSheetState,
    selectedBudgetTransactions,
    handleEditTransaction,
    deleteTransactionFromContext,
    loading,
    getProgressColor
}: any) {
    const [isExpanded, setIsExpanded] = useState(false);
    const Icon = budget.categoryInfo ? iconMap[budget.categoryInfo.icon] : null;
    const isOverBudget = budget.progress > 100;
    const hasSubcategories = budget.subcategories && budget.subcategories.length > 0;

    return (
        <Dialog onOpenChange={(isOpen) => {
            if (!isOpen) {
                setViewingTransactionsFor(undefined);
            } else {
                setViewingTransactionsFor(budget);
            }
        }}>
            <DialogTrigger asChild>
                <Card className="flex flex-col overflow-hidden border-border/50 bg-card/60 backdrop-blur-md shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 group p-2.5 relative cursor-pointer">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none transition-opacity group-hover:bg-primary/10"></div>
                
                <div className="flex items-center gap-3 relative z-10 w-full">
                    {Icon && (
                        <div className="bg-primary/10 p-2 rounded-xl text-primary shrink-0 shadow-sm border border-primary/5">
                            <Icon className="h-4 w-4" />
                        </div>
                    )}
                    
                    <div className="flex flex-col flex-1 min-w-0 justify-center gap-1">
                        <div className="flex justify-between items-end gap-2">
                            <div className="flex items-center gap-1.5 truncate">
                                <span className="font-semibold text-sm truncate">{budget.categoryInfo?.label}</span>
                                {isOverBudget && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
                            </div>
                            <div className="flex items-baseline gap-1 shrink-0">
                                <span className="text-sm font-bold tracking-tight">{budget.spent.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</span>
                                <span className="text-[10px] font-medium text-muted-foreground">/ {budget.limit.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</span>
                            </div>
                        </div>
                        
                        <div className="relative">
                            <Progress 
                                value={budget.progress > 100 ? 100 : budget.progress} 
                                className="h-1.5 rounded-full bg-muted/50" 
                                indicatorClassName={cn("transition-all duration-500 ease-out", getProgressColor(budget.progress))} 
                            />
                        </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()} className="flex items-center shrink-0 ml-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                            onClick={() => setTransactionSheetState({ open: true, categoryValue: budget.category })}
                            title="Añadir gasto"
                        >
                            <PlusCircle className="h-4 w-4"/>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 shadow-lg border-border/50 backdrop-blur-xl bg-background/95">
                                <DialogTrigger asChild>
                                    <DropdownMenuItem className="cursor-pointer" onSelect={() => setViewingTransactionsFor(budget)}>
                                        Ver Transacciones
                                    </DropdownMenuItem>
                                </DialogTrigger>
                                <DropdownMenuItem onSelect={() => setEditingBudget(budget)} className="cursor-pointer">
                                    {budget.isVirtualParent ? 'Configurar Presupuesto Padre' : 'Editar Presupuesto'}
                                </DropdownMenuItem>
                                {budget.isVirtualParent ? (
                                    <DropdownMenuItem disabled className="text-muted-foreground opacity-50 cursor-not-allowed">
                                        Eliminar
                                    </DropdownMenuItem>
                                ) : (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer" onSelect={(e) => e.preventDefault()}>Eliminar Presupuesto</DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="border-border/50 shadow-2xl backdrop-blur-xl bg-background/95">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente el presupuesto para "{budget.categoryInfo?.label}".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="rounded-full h-9">Cancelar</AlertDialogCancel>
                                                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full shadow-md h-9" onClick={() => deleteBudget(budget.id)}>Eliminar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {hasSubcategories && (
                    <div className="w-full relative z-10 mt-1">
                        {isExpanded && (
                            <div className="mt-2 space-y-1.5 pt-2 border-t border-border/40 mb-1">
                                {budget.subcategories.map((sub: any) => {
                                    const SubIcon = sub.categoryInfo ? iconMap[sub.categoryInfo.icon] : null;
                                    return (
                                        <div key={sub.id} className="space-y-1 p-1 rounded-md hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    {SubIcon && <SubIcon className="h-3 w-3 text-primary/70 shrink-0" />}
                                                    <span className="font-medium text-foreground/90 truncate">{sub.categoryInfo?.label}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground shrink-0 pl-2">
                                                    <span className="font-medium">
                                                        {sub.spent.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                                                        {sub.limit > 0 && <span className="opacity-60"> / {sub.limit.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</span>}
                                                    </span>
                                                </div>
                                            </div>
                                            {sub.limit > 0 && (
                                                <Progress value={sub.progress > 100 ? 100 : sub.progress} className="h-1 rounded-full bg-muted/40" indicatorClassName={cn(getProgressColor(sub.progress))} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div className="flex justify-center -mx-2 -mb-2 mt-1" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-4 text-[9px] font-medium text-muted-foreground/70 w-full rounded-b-lg rounded-t-none hover:bg-muted/50 transition-all hover:text-foreground" onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
                                {isExpanded ? <ChevronUp className="h-2.5 w-2.5 mr-1" /> : <ChevronDown className="h-2.5 w-2.5 mr-1" />}
                                {isExpanded ? 'Ocultar' : 'Ver subcategorías'}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Transacciones en "{budget.categoryInfo?.label}"</DialogTitle>
                    <DialogDescription>
                        Aquí están todas las transacciones para la categoría del presupuesto seleccionado.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <TransactionTable 
                        transactions={selectedBudgetTransactions}
                        onEdit={handleEditTransaction}
                        onDelete={deleteTransactionFromContext}
                        isLoading={loading}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function BudgetsPage() {
    const {
        categories,
        loading,
        isCreateOpen,
        setIsCreateOpen,
        editingBudget,
        setEditingBudget,
        isSubmitting,
        editingTransaction,
        setEditingTransaction,
        transactionSheetState,
        setTransactionSheetState,
        viewingTransactionsFor,
        setViewingTransactionsFor,
        sortOption,
        setSortOption,
        currentDate,
        budgetsWithSpent,
        selectedBudgetTransactions,
        totalSpent,
        totalBudgeted,
        totalProgress,
        handleSaveBudget,
        handleSaveTransaction,
        handleEditTransaction,
        deleteTransactionFromContext,
        deleteBudget,
        changeMonth,
    } = useBudgetsPage();

    useEffect(() => {
        const handleOpen = () => setIsCreateOpen(true);
        document.addEventListener('open-add-budget', handleOpen);
        return () => document.removeEventListener('open-add-budget', handleOpen);
    }, [setIsCreateOpen]);


    if (!currentDate) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

  return (
    <>
      <Header title="Presupuestos">
        <Button size="sm" className="h-9 gap-1" onClick={() => setIsCreateOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            Nuevo Presupuesto
        </Button>
      </Header>
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 pb-20 sm:pb-0">
        <div className="grid gap-4">
             <div className="flex items-center justify-center gap-4">
                <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold text-center w-48 capitalize">
                    {format(currentDate, "MMMM yyyy", { locale: es })}
                </span>
                <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {budgetsWithSpent.length > 0 && (
                <Card className="relative overflow-hidden border-border/40 shadow-md bg-card/60 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/50 to-secondary/10 pointer-events-none" />
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
                    <CardHeader className="relative z-10 pb-2">
                        <CardTitle className="font-headline flex items-center gap-2.5 text-xl tracking-tight">
                            <div className="bg-primary/20 p-2 rounded-xl text-primary border border-primary/20">
                                <ReceiptText className="h-5 w-5" />
                            </div>
                            Resumen General de Presupuestos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="space-y-4 mt-2">
                            <div className="flex justify-between items-end mb-1">
                                <div className="flex flex-col">
                                    <p className="text-sm font-medium text-muted-foreground">Gastado Total</p>
                                    <p className="text-3xl font-bold tracking-tight">{totalSpent.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <p className="text-sm font-medium text-muted-foreground">Presupuestado</p>
                                    <p className="text-lg font-semibold text-foreground/80">{totalBudgeted.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</p>
                                </div>
                            </div>
                            
                            <div className="relative pt-1">
                                <Progress 
                                    value={totalProgress > 100 ? 100 : totalProgress} 
                                    className="h-3.5 rounded-full bg-muted/40 backdrop-blur-sm" 
                                    indicatorClassName={cn("transition-all duration-700 ease-out", getProgressColor(totalProgress))} 
                                />
                            </div>
                            <div className="flex justify-end text-xs font-bold" style={{color: getProgressColor(totalProgress)}}>
                                {totalProgress > 100 ? '¡Has excedido tu presupuesto general!' : `${totalProgress.toFixed(1)}% del presupuesto utilizado`}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        
            {budgetsWithSpent.length > 0 ? (
                <>
                    <div className="flex justify-end mt-2">
                        <Select value={sortOption} onValueChange={setSortOption}>
                            <SelectTrigger className="w-full sm:w-[220px] bg-card/60 backdrop-blur-sm border-border/50 rounded-full h-10 shadow-sm hover:bg-card/80 transition-colors">
                                <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground"/>
                                <SelectValue placeholder="Ordenar por..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/50 shadow-xl backdrop-blur-xl bg-background/95">
                                <SelectItem value="progress-desc" className="rounded-lg cursor-pointer">Mayor % de Gasto</SelectItem>
                                <SelectItem value="spent-desc" className="rounded-lg cursor-pointer">Gasto (Mayor a menor)</SelectItem>
                                <SelectItem value="limit-desc" className="rounded-lg cursor-pointer">Límite (Mayor a menor)</SelectItem>
                                <SelectItem value="remaining-asc" className="rounded-lg cursor-pointer">Restante (Menor a mayor)</SelectItem>
                                <SelectItem value="alpha-asc" className="rounded-lg cursor-pointer">Alfabético (A-Z)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                        {budgetsWithSpent.map(budget => (
                            <BudgetCard 
                                key={budget.id} 
                                budget={budget} 
                                setEditingBudget={setEditingBudget}
                                deleteBudget={deleteBudget}
                                setViewingTransactionsFor={setViewingTransactionsFor}
                                setTransactionSheetState={setTransactionSheetState}
                                selectedBudgetTransactions={selectedBudgetTransactions}
                                handleEditTransaction={handleEditTransaction}
                                deleteTransactionFromContext={deleteTransactionFromContext}
                                loading={loading}
                                getProgressColor={getProgressColor}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <Card className="md:col-span-2 lg:col-span-3 xl:col-span-4 border-dashed border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors duration-500 rounded-3xl">
                    <CardContent className="flex flex-col items-center justify-center gap-5 p-12 text-center">
                        <div className="bg-primary/20 p-5 rounded-full animate-bounce mt-4">
                            <PiggyBank className="h-14 w-14 text-primary drop-shadow-md" />
                        </div>
                        <div className="space-y-2 max-w-sm">
                            <h3 className="text-2xl font-headline tracking-tight text-foreground">Aún no tienes presupuestos</h3>
                            <p className="text-muted-foreground text-sm">Empieza a tomar control de tus gastos hoy creando tu primer presupuesto. Podrás asignar límites a tus diferentes categorías de gasto.</p>
                        </div>
                        <Button onClick={() => setIsCreateOpen(true)} size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 mt-2">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Crear mi primer presupuesto
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
      </main>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Presupuesto</DialogTitle>
                    <DialogDescription>
                        Establezca un límite de gasto para una categoría específica.
                    </DialogDescription>
                </DialogHeader>
                <BudgetForm onSave={handleSaveBudget} onClose={() => setIsCreateOpen(false)} categories={categories} isSubmitting={isSubmitting} />
            </DialogContent>
        </Dialog>

      <Dialog open={!!editingBudget} onOpenChange={(isOpen) => !isOpen && setEditingBudget(undefined)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Presupuesto</DialogTitle>
                    <DialogDescription>
                        Ajuste el límite o período para esta categoría.
                    </DialogDescription>
                </DialogHeader>
                {editingBudget && <BudgetForm budget={editingBudget} onSave={handleSaveBudget} onClose={() => setEditingBudget(undefined)} categories={categories} isSubmitting={isSubmitting} />}
            </DialogContent>
        </Dialog>
        
        <AddTransactionSheet 
            onSave={handleSaveTransaction}
            onClose={() => {
                setTransactionSheetState({ open: false });
                setEditingTransaction(undefined);
            }}
            forceOpen={transactionSheetState.open || !!editingTransaction}
            defaultType="expense"
            defaultCategoryValue={transactionSheetState.categoryValue}
            transactionToEdit={editingTransaction}
            isSubmitting={isSubmitting}
        />
    </>
  );
}
