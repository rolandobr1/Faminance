'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { iconMap } from "@/lib/data";
import { cn } from "@/lib/utils";
import { PlusCircle, MoreHorizontal, PiggyBank, Receipt, ReceiptText, AlertTriangle, ArrowUpDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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

    const getProgressColor = (progress: number) => {
        if (progress > 100) return "bg-destructive";
        if (progress > 80) return "bg-accent";
        return "bg-primary";
    }

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
                <Card className="bg-gradient-to-tr from-primary/10 to-background">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <ReceiptText />
                            Resumen General de Presupuestos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Progress value={totalProgress} className="h-3" indicatorClassName={cn(getProgressColor(totalProgress))} />
                            <div className="flex justify-between items-baseline text-sm">
                                <p className="font-medium">
                                    Gastado: <span className="font-bold">{totalSpent.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</span>
                                </p>
                                <p className="text-muted-foreground">
                                    Límite Total: {totalBudgeted.toLocaleString('es-do', { style: 'currency', currency: 'DOP' })}
                                </p>
                            </div>
                            <div className="text-right text-xs font-bold mt-1" style={{color: getProgressColor(totalProgress)}}>
                                {totalProgress.toFixed(0)}% del presupuesto total utilizado
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        
            {budgetsWithSpent.length > 0 ? (
                <>
                    <div className="flex justify-end">
                        <Select value={sortOption} onValueChange={setSortOption}>
                            <SelectTrigger className="w-full sm:w-[220px]">
                                <ArrowUpDown className="h-4 w-4 mr-2"/>
                                <SelectValue placeholder="Ordenar por..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="progress-desc">Mayor % de Gasto</SelectItem>
                                <SelectItem value="spent-desc">Gasto (Mayor a menor)</SelectItem>
                                <SelectItem value="limit-desc">Límite (Mayor a menor)</SelectItem>
                                <SelectItem value="remaining-asc">Restante (Menor a mayor)</SelectItem>
                                <SelectItem value="alpha-asc">Alfabético (A-Z)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {budgetsWithSpent.map(budget => {
                            const Icon = budget.categoryInfo ? iconMap[budget.categoryInfo.icon] : null;
                            const isOverBudget = budget.progress > 100;

                            return (
                                <Dialog key={budget.id} onOpenChange={(isOpen) => !isOpen && setViewingTransactionsFor(undefined)}>
                                    <Card className="flex flex-col">
                                        <CardHeader className="p-4 flex-row items-start justify-between gap-2 space-y-0">
                                            <div className="flex items-center gap-3">
                                                {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                                                <div className="flex flex-col">
                                                    <p className="font-semibold font-headline">{budget.categoryInfo?.label}</p>
                                                    <span className="text-xs text-muted-foreground capitalize">{budget.period}</span>
                                                </div>
                                            </div>
                                            <div onClick={(e) => e.stopPropagation()} className="relative z-10 -mt-2 -mr-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onSelect={() => setEditingBudget(budget)}>Editar</DropdownMenuItem>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Eliminar</DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el presupuesto para "{budget.categoryInfo?.label}".
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteBudget(budget.id)}>Eliminar</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="p-4 pt-0 space-y-2 flex-grow">
                                            <div className="text-sm font-medium flex justify-between items-baseline">
                                                <span>{budget.spent.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</span>
                                                <span className="text-xs text-muted-foreground">/ {budget.limit.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</span>
                                            </div>
                                            <Progress value={budget.progress > 100 ? 100 : budget.progress} className="h-1.5" indicatorClassName={cn(getProgressColor(budget.progress))} />
                                        </CardContent>
                                        
                                        <CardFooter className="p-2 pt-0 flex items-center justify-between bg-muted/30">
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setViewingTransactionsFor(budget)}>
                                                    Ver Gastos
                                                </Button>
                                            </DialogTrigger>
                                            <div className="flex items-center gap-2">
                                                <div className={cn("text-sm font-semibold flex items-center gap-1", isOverBudget ? "text-destructive" : "text-green-500")}>
                                                {isOverBudget && <AlertTriangle className="h-3 w-3" />}
                                                    <span>
                                                        {isOverBudget 
                                                            ? (budget.remaining * -1).toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })
                                                            : budget.remaining.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })
                                                        }
                                                    </span>
                                                </div>
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    className="h-7 w-7"
                                                    onClick={() => setTransactionSheetState({ open: true, categoryValue: budget.category })}
                                                >
                                                    <Receipt className="h-3 w-3"/>
                                                </Button>
                                            </div>
                                        </CardFooter>
                                    </Card>

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
                        })}
                    </div>
                </>
            ) : (
                <Card className="md:col-span-2 lg:col-span-3 xl:col-span-4">
                    <CardContent className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                        <PiggyBank className="h-12 w-12 text-muted-foreground" />
                        <h3 className="text-xl font-headline">Aún no tienes presupuestos</h3>
                        <p className="text-muted-foreground">Empieza a tomar control de tus gastos creando tu primer presupuesto.</p>
                        <Button onClick={() => setIsCreateOpen(true)}>
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
