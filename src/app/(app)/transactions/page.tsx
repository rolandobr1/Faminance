'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { FileDown, Calendar as CalendarIcon, X, Search, Loader2, ArrowUp, ArrowDown, Scale, PiggyBank, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { FloatingTransactionButtons } from "@/components/faminance/transactions/floating-action-buttons";
import { AddTransactionSheet } from "@/components/faminance/transactions/add-transaction-sheet";
import { Input } from "@/components/ui/input";
import { TransactionTable, TransactionCategoryTabs } from "@/components/faminance/transactions/transaction-table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Header } from "@/components/faminance/header";
import { CategoryBreakdown } from "@/components/faminance/dashboard/category-breakdown";
import { useTransactionsPage } from "./use-transactions-page";
import { SharedExpenseDetail } from "@/components/faminance/transactions/shared-expense-detail";

export default function TransactionsPage() {
  const {
    loading,
    editingTransaction,
    setEditingTransaction,
    isSubmitting,
    date,
    setDate,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    isExporting,
    activePreset,
    isSummaryExpanded,
    setIsSummaryExpanded,
    categories,
    clearFilters,
    handleSaveTransaction,
    handleEdit,
    handleDelete,
    filteredTransactions,
    sharedTransactions,
    totalIncome,
    totalExpenses,
    balance,
    budgetedExpenses,
    unbudgetedExpenses,
    totalSavings,
    handleExportPDF,
    setDatePreset,
    members,
    totalSharedDOP,
    totalSharedUSD,
  } = useTransactionsPage();

  if (loading || !date) {
    return (
        <>
            <Header title="Transacciones" />
            <div className="flex flex-1 items-center justify-center p-4 sm:px-6 sm:py-0 pb-20 sm:pb-0 h-[calc(100vh-8rem)]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        </>
    );
  }

  return (
    <>
      <Header title="Transacciones" />
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 pb-20 sm:pb-0">
        
         <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-2">
                <Button variant={activePreset === 'thisMonth' ? 'default' : 'outline'} onClick={() => setDatePreset('thisMonth')} className="flex-grow sm:flex-grow-0">Este Mes</Button>
                <Button variant={activePreset === 'lastMonth' ? 'default' : 'outline'} onClick={() => setDatePreset('lastMonth')} className="flex-grow sm:flex-grow-0">Mes Pasado</Button>
                <Button variant={activePreset === 'thisYear' ? 'default' : 'outline'} onClick={() => setDatePreset('thisYear')} className="flex-grow sm:flex-grow-0">Este Año</Button>
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por descripción, categoría, monto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10"
                />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                            "w-full sm:w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                            )}
                            onClick={() => setDatePreset('thisMonth')} // fallback to trigger selection or just keep it simple
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                            date.to ? (
                                <>
                                {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                                {format(date.to, "LLL dd, y", { locale: es })}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y", { locale: es })
                            )
                            ) : (
                            <span>Seleccionar fecha</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                            locale={es}
                        />
                        </PopoverContent>
                    </Popover>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las Categorías</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                             ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleExportPDF} disabled={isExporting} className="w-full sm:w-auto">
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                    Exportar
                </Button>
                {(date || selectedCategory !== 'all' || searchQuery) && (
                    <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto">
                        <X className="mr-2 h-4 w-4" />
                        Limpiar Filtros
                    </Button>
                )}
            </div>
        </div>

        <div className="max-w-7xl mx-auto w-full">
            <Collapsible open={isSummaryExpanded} onOpenChange={setIsSummaryExpanded}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">Resumen del Período</CardTitle>
                        <CardDescription>Métricas clave para el rango de fechas seleccionado.</CardDescription>
                    </div>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon">
                        {isSummaryExpanded ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        <span className="sr-only">Expandir/Contraer Resumen</span>
                        </Button>
                    </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                                <ArrowUp className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg md:text-2xl font-bold text-green-500">{totalIncome.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                                <ArrowDown className="h-4 w-4 text-destructive" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg md:text-2xl font-bold text-destructive">{totalExpenses.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Balance Neto</CardTitle>
                                <Scale className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={cn("text-lg md:text-2xl font-bold", balance >= 0 ? "text-primary" : "text-destructive")}>{balance.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Gastos Presupuestados</CardTitle>
                                <PiggyBank className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg md:text-2xl font-bold">{budgetedExpenses.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Fuera de Presup.</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg md:text-2xl font-bold">{unbudgetedExpenses.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ahorro del Mes</CardTitle>
                                <PiggyBank className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className={cn("text-lg md:text-2xl font-bold", totalSavings >= 0 ? "text-green-500" : "text-destructive")}>
                                    {totalSavings.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
        </div>

        <CategoryBreakdown transactions={filteredTransactions} />

        <Tabs defaultValue="all">
          <div className="flex items-center">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todo</TabsTrigger>
              <TabsTrigger value="income">Ingresos</TabsTrigger>
              <TabsTrigger value="expenses">Gastos</TabsTrigger>
              <TabsTrigger value="shared">Compartido</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="all">
            <Card>
                <CardContent>
                    <TransactionTable transactions={filteredTransactions} onEdit={handleEdit} onDelete={handleDelete} isLoading={loading} />
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="income">
             <TransactionCategoryTabs transactions={filteredTransactions} type="income" onEdit={handleEdit} onDelete={handleDelete} isLoading={loading} />
          </TabsContent>
           <TabsContent value="expenses">
            <TransactionCategoryTabs transactions={filteredTransactions} type="expense" onEdit={handleEdit} onDelete={handleDelete} isLoading={loading} />
          </TabsContent>
          <TabsContent value="shared">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="bg-muted/30 border-border/50">
                  <CardContent className="pt-6">
                    <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                      Total Gastos Compartidos (DOP)
                    </div>
                    <div className="text-2xl font-bold mt-1 text-foreground">
                      RD$ {totalSharedDOP.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 border-border/50">
                  <CardContent className="pt-6">
                    <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                      Total Gastos Compartidos (USD)
                    </div>
                    <div className="text-2xl font-bold mt-1 text-foreground">
                      US$ {totalSharedUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {sharedTransactions.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-3 mb-3">
                      <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <CardTitle className="text-base font-semibold font-headline">No hay gastos compartidos</CardTitle>
                    <CardDescription className="max-w-xs mt-1">
                      Las transacciones marcadas como "Gasto Compartido" se mostrarán aquí con la división de montos por persona.
                    </CardDescription>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sharedTransactions.map((transaction) => (
                    <SharedExpenseDetail
                      key={transaction.id}
                      transaction={transaction}
                      members={members}
                      categories={categories}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <FloatingTransactionButtons />
      <AddTransactionSheet
        onSave={handleSaveTransaction}
        transactionToEdit={editingTransaction}
        onClose={() => setEditingTransaction(undefined)}
        forceOpen={!!editingTransaction}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
