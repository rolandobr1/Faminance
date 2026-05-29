'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Loan, Budget } from "@/lib/types";
import { Banknote, CalendarDays, CreditCard as CreditCardIcon, Percent, PiggyBank, ReceiptText, PlusCircle, MoreHorizontal, Loader2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useFamilyData } from "@/context/family-data-context";
import { cn } from "@/lib/utils";
import { Header } from "@/components/faminance/header";
import { addDays, subMonths } from "date-fns";

const CHART_COLORS = {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    accent: 'hsl(var(--accent))',
    destructive: 'hsl(var(--destructive))',
};

function getUsageColor(percentage: number): string {
    if (percentage > 85) return CHART_COLORS.destructive;
    if (percentage > 60) return CHART_COLORS.accent;
    return CHART_COLORS.primary;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const currency = data.currency || 'DOP';
    const locale = currency === 'USD' ? 'en-US' : 'es-DO';
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="flex flex-col space-y-1">
          <span className="text-sm font-bold text-muted-foreground">
            {data.name}
          </span>
          <span className="text-xs">
            {data.value.toLocaleString(locale, { style: 'currency', currency })} ({data.percentage.toFixed(0)}%)
          </span>
        </div>
      </div>
    );
  }
  return null;
};

function LoanForm({ 
    loan,
    onSave, 
    onClose,
    isSubmitting
}: { 
    loan?: Loan,
    onSave: (loan: Omit<Loan, 'id' | 'familyId' | 'paidAmount' >, paidAmount?: number) => void, 
    onClose: () => void,
    isSubmitting: boolean
}) {
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const paidAmount = formData.get('paidAmount') ? Number(formData.get('paidAmount')) : undefined;

        const newLoan: Omit<Loan, 'id' | 'familyId' | 'paidAmount'> = {
            name: formData.get('name') as string,
            totalAmount: Number(formData.get('totalAmount')),
            monthlyPayment: Number(formData.get('monthlyPayment')),
            paymentDate: Number(formData.get('paymentDate')),
        };
        onSave(newLoan, paidAmount);
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nombre</Label>
                <Input id="name" name="name" defaultValue={loan?.name} placeholder="Ej: Préstamo de vehículo" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="totalAmount" className="text-right">Monto Total</Label>
                <Input id="totalAmount" name="totalAmount" type="number" defaultValue={loan?.totalAmount} placeholder="RD$0.00" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paidAmount" className="text-right">Monto Pagado</Label>
                <Input id="paidAmount" name="paidAmount" type="number" defaultValue={loan?.paidAmount || 0} placeholder="RD$0.00" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="monthlyPayment" className="text-right">Pago Mensual</Label>
                <Input id="monthlyPayment" name="monthlyPayment" type="number" defaultValue={loan?.monthlyPayment} placeholder="RD$0.00" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentDate" className="text-right">Día de Pago</Label>
                <Input id="paymentDate" name="paymentDate" type="number" min="1" max="31" defaultValue={loan?.paymentDate} placeholder="Ej: 15" className="col-span-3" required />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Préstamo
                </Button>
            </DialogFooter>
        </form>
    );
}

const getPaymentDate = (cardCutoffDate: number, cardPaymentDays: number) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const cutoffDateThisMonth = new Date(currentYear, currentMonth, cardCutoffDate);
    
    if (today.getDate() <= cardCutoffDate) {
        const lastMonthCutoff = subMonths(cutoffDateThisMonth, 1);
        return addDays(lastMonthCutoff, cardPaymentDays);
    } else {
        return addDays(cutoffDateThisMonth, cardPaymentDays);
    }
};

export default function DebtsPage() {
  const { creditCards, loans, addDoc, updateDoc, deleteDoc, budgets } = useFamilyData();
  const [isLoanDialogOpen, setLoanDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [nextPaymentDates, setNextPaymentDates] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSaveLoan = async (loanData: Omit<Loan, 'id' | 'familyId' | 'paidAmount'>, paidAmount?: number) => {
    setIsSubmitting(true);
    const debtPaymentCategory = 'debt-payment';
    const debtBudget = budgets.find(b => b.category === debtPaymentCategory);

    if (editingLoan) {
      const oldPayment = editingLoan.monthlyPayment || 0;
      const newPayment = loanData.monthlyPayment;
      const paymentDifference = newPayment - oldPayment;

      await updateDoc("loans", editingLoan.id, { ...loanData, paidAmount: paidAmount ?? editingLoan.paidAmount });

      if (debtBudget && paymentDifference !== 0) {
        const newLimit = debtBudget.limit + paymentDifference;
        await updateDoc('budgets', debtBudget.id, { limit: newLimit });
      }
      setEditingLoan(undefined);
      toast({ title: "Préstamo actualizado", description: `El préstamo "${loanData.name}" se ha actualizado.` });
    } else {
      const newLoanRef = await addDoc("loans", { ...loanData, paidAmount: paidAmount || 0 });
      
      if (newLoanRef) {
          if (debtBudget) {
            const newLimit = debtBudget.limit + loanData.monthlyPayment;
            await updateDoc('budgets', debtBudget.id, { limit: newLimit });
          } else {
            const newBudget: Omit<Budget, 'id' | 'familyId' | 'spent'> = {
                category: debtPaymentCategory,
                limit: loanData.monthlyPayment,
                period: 'mensual',
                loanId: newLoanRef.id
            };
            await addDoc('budgets', newBudget);
          }
      }
      setLoanDialogOpen(false);
      toast({ title: "Préstamo añadido", description: `El préstamo "${loanData.name}" se ha creado y el presupuesto ha sido ajustado.` });
    }
    setIsSubmitting(false);
  };

  const handleDeleteLoan = async (loan: Loan) => {
    const debtPaymentCategory = 'debt-payment';
    const debtBudget = budgets.find(b => b.category === debtPaymentCategory);

    await deleteDoc("loans", loan.id);
    
    if (debtBudget) {
        const newLimit = Math.max(0, debtBudget.limit - loan.monthlyPayment);
        await updateDoc('budgets', debtBudget.id, { limit: newLimit });
    }
    toast({ title: "Préstamo eliminado", description: `El presupuesto de "Pago de Deudas" ha sido ajustado.` });
  };


    const creditCardData = useMemo(() => creditCards.map(card => {
        const usagePercentageDOP = card.limitDOP > 0 ? (card.spentDOP / card.limitDOP) * 100 : 0;
        const usagePercentageUSD = card.limitUSD > 0 ? (card.spentUSD / card.limitUSD) * 100 : 0;
        
        const chartDataDOP = [
            { name: 'Gastado', value: card.spentDOP, percentage: usagePercentageDOP, fill: getUsageColor(usagePercentageDOP), currency: 'DOP' },
            { name: 'Disponible', value: card.limitDOP - card.spentDOP, percentage: 100 - usagePercentageDOP, fill: 'hsl(var(--muted))', currency: 'DOP' }
        ];

        const chartDataUSD = [
            { name: 'Gastado', value: card.spentUSD, percentage: usagePercentageUSD, fill: getUsageColor(usagePercentageUSD), currency: 'USD' },
            { name: 'Disponible', value: card.limitUSD - card.spentUSD, percentage: 100 - usagePercentageUSD, fill: 'hsl(var(--muted))', currency: 'USD' }
        ];

        return { ...card, usagePercentageDOP, usagePercentageUSD, chartDataDOP, chartDataUSD };
    }), [creditCards]);

  const loanData = useMemo(() => loans.map(loan => {
    const progressPercentage = loan.totalAmount > 0 ? (loan.paidAmount / loan.totalAmount) * 100 : 0;
    const data = [
      { name: 'Pagado', value: loan.paidAmount, percentage: progressPercentage, fill: CHART_COLORS.primary },
      { name: 'Restante', value: loan.totalAmount - loan.paidAmount, percentage: 100 - progressPercentage, fill: 'hsl(var(--muted))' }
    ];
    return { ...loan, progressPercentage, chartData: data };
  }), [loans]);

    useEffect(() => {
        if (isClient && creditCardData.length > 0) {
            const dates: Record<string, string> = {};
            creditCardData.forEach(card => {
                dates[card.id] = getPaymentDate(card.cutoffDate, card.paymentDays).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            });
            setNextPaymentDates(dates);
        }
    }, [isClient, creditCardData]);

  return (
    <>
      <Header title="Deudas">
        <Button size="sm" className="h-9 gap-1" onClick={() => setLoanDialogOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            Añadir Préstamo
        </Button>
      </Header>
      <main className="grid flex-1 items-start gap-8 p-4 sm:px-6 sm:py-0 md:gap-8 pb-20 sm:pb-0">

        {/* Credit Cards Section */}
        <section>
          <h2 className="text-xl font-headline mb-4 flex items-center gap-2">
            <CreditCardIcon className="h-6 w-6 text-primary" />
            Tarjetas de Crédito
          </h2>
            {creditCardData.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {creditCardData.map(card => (
                    <Card key={card.id}>
                        <CardHeader>
                        <CardTitle className="font-headline">{card.name} - {card.bank}</CardTitle>
                        <CardDescription>**** {card.last4}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {(card.limitDOP > 0 || card.spentDOP > 0) && (
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative h-28 w-28">
                                    <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Pie data={card.chartDataDOP} cx="50%" cy="50%" innerRadius={35} outerRadius={45} paddingAngle={2} dataKey="value" stroke="none">
                                        {card.chartDataDOP.map((entry, index) => <Cell key={`cell-dop-${index}`} fill={entry.fill} />)}
                                        </Pie>
                                    </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-lg font-bold" style={{ color: getUsageColor(card.usagePercentageDOP) }}>{card.usagePercentageDOP.toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div className="grid gap-2 text-sm">
                                    <h4 className="font-semibold">Balance en Pesos (DOP)</h4>
                                    <div className="flex items-center gap-2 text-muted-foreground"><ReceiptText className="h-4 w-4" /><span>Límite: {card.limitDOP.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</span></div>
                                    <div className="flex items-center gap-2 font-medium"><Percent className="h-4 w-4 text-muted-foreground"/><span>Gastado: {card.spentDOP.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</span></div>
                                </div>
                                </div>
                            )}

                             {(card.limitUSD > 0 || card.spentUSD > 0) && (
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative h-28 w-28">
                                    <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Pie data={card.chartDataUSD} cx="50%" cy="50%" innerRadius={35} outerRadius={45} paddingAngle={2} dataKey="value" stroke="none">
                                        {card.chartDataUSD.map((entry, index) => <Cell key={`cell-usd-${index}`} fill={entry.fill} />)}
                                        </Pie>
                                    </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-lg font-bold" style={{ color: getUsageColor(card.usagePercentageUSD) }}>{card.usagePercentageUSD.toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div className="grid gap-2 text-sm">
                                     <h4 className="font-semibold">Balance en Dólares (USD)</h4>
                                    <div className="flex items-center gap-2 text-muted-foreground"><ReceiptText className="h-4 w-4" /><span>Límite: {card.limitUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span></div>
                                    <div className="flex items-center gap-2 font-medium"><Percent className="h-4 w-4 text-muted-foreground"/><span>Gastado: {card.spentUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span></div>
                                </div>
                                </div>
                            )}

                             <div className="flex items-center gap-2 text-muted-foreground text-sm pt-2 border-t mt-2">
                                <CalendarDays className="h-4 w-4" />
                                <span>Corte: Día {card.cutoffDate}</span>
                                {isClient && nextPaymentDates[card.id] && (
                                    <span className="font-semibold text-primary ml-auto">
                                        Próx. Pago: {nextPaymentDates[card.id]}
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    ))}
                </div>
            ) : (
                 <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                        No hay tarjetas de crédito añadidas.
                    </CardContent>
                </Card>
            )
          }
        </section>

        {/* Loans Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-headline flex items-center gap-2">
                <Banknote className="h-6 w-6 text-primary" />
                Préstamos
            </h2>
           </div>
           {loanData.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {loanData.map(loan => (
                    <Card key={loan.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="font-headline">{loan.name}</CardTitle>
                                    <CardDescription>Pago mensual de {loan.monthlyPayment.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onSelect={() => setEditingLoan(loan)}>Editar</DropdownMenuItem>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Eliminar</DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el préstamo "{loan.name}".
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteLoan(loan)}>Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative h-28 w-28">
                            <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip content={<CustomTooltip />} />
                                <Pie
                                data={loan.chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={45}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                                >
                                {loan.chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                                </Pie>
                            </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-lg font-bold text-primary">
                                    {loan.progressPercentage.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                        <div className="grid gap-2 text-sm">
                            <div className="flex items-center gap-2">
                                <PiggyBank className="h-4 w-4 text-muted-foreground" />
                                <span>Total: {loan.totalAmount.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</span>
                            </div>
                            <div className="flex items-center gap-2 font-medium">
                            <Percent className="h-4 w-4 text-muted-foreground"/>
                            <span>Pagado: {loan.paidAmount.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            <span className="font-semibold">Día de pago: {loan.paymentDate} de cada mes</span>
                            </div>
                        </div>
                        </CardContent>
                    </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                        <Banknote className="h-12 w-12 text-muted-foreground" />
                        <h3 className="text-xl font-headline">Aún no tienes préstamos</h3>
                        <p className="text-muted-foreground">Registra tus préstamos para darles seguimiento.</p>
                        <Button onClick={() => setLoanDialogOpen(true)}>Añadir Préstamo</Button>
                    </CardContent>
                </Card>
           )}
        </section>
      </main>

        <Dialog open={isLoanDialogOpen} onOpenChange={setLoanDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Añadir Nuevo Préstamo</DialogTitle>
                  <DialogDescription>
                      Registre los detalles de un nuevo préstamo para darle seguimiento.
                  </DialogDescription>
              </DialogHeader>
              <LoanForm onSave={handleSaveLoan} onClose={() => setLoanDialogOpen(false)} isSubmitting={isSubmitting} />
          </DialogContent>
      </Dialog>

       <Dialog open={!!editingLoan} onOpenChange={(isOpen) => !isOpen && setEditingLoan(undefined)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Préstamo</DialogTitle>
                    <DialogDescription>Ajuste los detalles de su préstamo.</DialogDescription>
                </DialogHeader>
                {editingLoan && <LoanForm loan={editingLoan} onSave={handleSaveLoan} onClose={() => setEditingLoan(undefined)} isSubmitting={isSubmitting} />}
            </DialogContent>
        </Dialog>
    </>
  );
}
