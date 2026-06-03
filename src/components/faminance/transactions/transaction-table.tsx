
'use client';

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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFamilyData } from "@/context/family-data-context";
import { iconMap } from "@/lib/data";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { MoreHorizontal, Receipt } from "lucide-react";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";


type GroupedTransactions = {
    [key: string]: Transaction[];
};

// This function safely handles timezone differences for display purposes.
const getLocalDisplayDate = (isoString: string) => {
    // The date from Firestore is a string. We can parse it and format it.
    // By splitting on 'T', we only get the date part, which avoids timezone issues
    // during parsing in most modern browsers.
    const datePart = isoString.split('T')[0];
    const date = new Date(datePart + 'T12:00:00Z'); // Assume midday UTC to avoid timezone boundary issues
    return date;
};


export function TransactionTable({ 
    transactions,
    onEdit,
    onDelete,
    isLoading
}: { 
    transactions: Transaction[],
    onEdit: (transaction: Transaction) => void,
    onDelete: (transactionId: string) => void,
    isLoading: boolean
}) {
    const { categories } = useFamilyData();
    if (isLoading) {
        return (
             <div className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                    <TableHead className="hidden md:table-cell"><Skeleton className="h-5 w-16" /></TableHead>
                                    <TableHead className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableHead>
                                    <TableHead><span className="sr-only">Acciones</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="hidden sm:block h-8 w-8 rounded-full" />
                                                <div className="space-y-1">
                                                    <Skeleton className="h-5 w-32" />
                                                    <Skeleton className="h-4 w-48" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        )
    }

    if (transactions.length === 0) {
        return (
             <Table>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            No se encontraron transacciones.
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        );
    }
    
    const groupedTransactions = transactions.reduce((acc: GroupedTransactions, transaction) => {
        const dateKey = transaction.date.split('T')[0];
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(transaction);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
        <div>
            {sortedDates.map(date => (
                <div key={date} className="mb-6">
                    <div className="sticky top-14 z-20 py-2 flex w-full pointer-events-none mb-1">
                        <h3 className="text-sm font-medium font-headline backdrop-blur-xl bg-background/70 border border-border/50 shadow-sm px-4 py-1.5 rounded-full pointer-events-auto inline-flex">
                            {format(getLocalDisplayDate(date), "EEEE, d 'de' MMMM", { locale: es })}
                        </h3>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Transacción</TableHead>
                                <TableHead className="hidden md:table-cell">Usuario</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead><span className="sr-only">Acciones</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groupedTransactions[date].map(transaction => {
                                const category = categories.find(c => c.value === transaction.category);
                                const CategoryIcon = category ? iconMap[category.icon] : null;
                                return (
                                    <TableRow key={transaction.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {CategoryIcon && <div className="hidden sm:flex items-center justify-center h-8 w-8 rounded-full bg-muted"><CategoryIcon className="h-5 w-5 text-muted-foreground" /></div>}
                                                <div>
                                                    <div className="font-medium font-headline">{category?.label || transaction.category}</div>
                                                    {transaction.description && <div className="text-sm text-muted-foreground">{transaction.description}</div>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{transaction.user}</TableCell>
                                        <TableCell className={cn("text-right", transaction.type === 'income' ? 'text-green-600' : (transaction.type === 'payment' ? 'text-blue-500 dark:text-blue-400' : 'text-destructive'))}>
                                            <div className="flex items-center justify-end gap-2">
                                                {transaction.receiptUrl && (
                                                    <a
                                                        href={transaction.receiptUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Ver recibo"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        <Receipt className="h-4 w-4" />
                                                    </a>
                                                )}
                                                <span>
                                                    {transaction.type === 'income' ? '+' : '-'}
                                                    {transaction.amount.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onSelect={() => onEdit(transaction)}>Editar</DropdownMenuItem>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Eliminar</DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente esta transacción.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(transaction.id)}>Eliminar</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            ))}
        </div>
    );
}

export function TransactionCategoryTabs({
  transactions,
  type,
  onEdit,
  onDelete,
  isLoading,
}: {
  transactions: Transaction[];
  type: "income" | "expense";
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  isLoading: boolean;
}) {
  const { budgets } = useFamilyData();
  const budgetedCategoryValues = useMemo(() => new Set(budgets.map(b => b.category)), [budgets]);
  
  const filteredTransactions = useMemo(() => transactions.filter(t => t.type === type), [transactions, type]);
  
  const budgetedTransactions = useMemo(() => 
    type === 'expense' 
      ? filteredTransactions.filter(t => budgetedCategoryValues.has(t.category)) 
      : [], 
    [filteredTransactions, budgetedCategoryValues, type]
  );
  
  const unbudgetedTransactions = useMemo(() => 
    type === 'expense' 
      ? filteredTransactions.filter(t => !budgetedCategoryValues.has(t.category)) 
      : [], 
    [filteredTransactions, budgetedCategoryValues, type]
  );
  
  const recurringTransactions = useMemo(() => filteredTransactions.filter(t => t.isRecurring), [filteredTransactions]);

  if (type === 'expense') {
    return (
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="budgeted">Presupuestados</TabsTrigger>
          <TabsTrigger value="unbudgeted">No Presupuestados</TabsTrigger>
          <TabsTrigger value="recurring">Recurrentes</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline capitalize">Todos los Gastos</CardTitle>
              <CardDescription>Un registro de todos los gastos de su familia.</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionTable transactions={filteredTransactions} onEdit={onEdit} onDelete={onDelete} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="budgeted">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline capitalize">Gastos Presupuestados</CardTitle>
              <CardDescription>Gastos que forman parte de una categoría con presupuesto.</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionTable transactions={budgetedTransactions} onEdit={onEdit} onDelete={onDelete} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="unbudgeted">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline capitalize">Gastos No Presupuestados</CardTitle>
              <CardDescription>Gastos en categorías que no tienen un presupuesto definido.</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionTable transactions={unbudgetedTransactions} onEdit={onEdit} onDelete={onDelete} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recurring">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline capitalize">Gastos Recurrentes</CardTitle>
              <CardDescription>Un registro de gastos que se repiten.</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionTable transactions={recurringTransactions} onEdit={onEdit} onDelete={onDelete} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  }

  // Fallback for income
  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList>
        <TabsTrigger value="all">Todos</TabsTrigger>
        <TabsTrigger value="recurring">Recurrentes</TabsTrigger>
      </TabsList>
      <TabsContent value="all">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline capitalize">Ingresos</CardTitle>
            <CardDescription>Un registro de todos los ingresos de su familia.</CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionTable transactions={filteredTransactions} onEdit={onEdit} onDelete={onDelete} isLoading={isLoading} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="recurring">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline capitalize">Ingresos Recurrentes</CardTitle>
            <CardDescription>Un registro de ingresos recurrentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionTable transactions={recurringTransactions} onEdit={onEdit} onDelete={onDelete} isLoading={isLoading} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

    