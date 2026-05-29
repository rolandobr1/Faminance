'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Target, MoreHorizontal, Landmark, Loader2 } from "lucide-react";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect } from "react";
import type { SavingsGoal, Account } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useFamilyData } from "@/context/family-data-context";
import { Header } from "@/components/faminance/header";
import { availableIcons, iconMap } from "@/lib/data";

function GoalForm({
  goal,
  onSave,
  onClose,
  accounts,
  isSubmitting,
}: {
  goal?: SavingsGoal;
  onSave: (goalData: Omit<SavingsGoal, 'id' | 'currentAmount' | 'familyId'>, currentAmount?: number) => void;
  onClose: () => void;
  accounts: Account[];
  isSubmitting: boolean;
}) {
  const savingsAccounts = accounts.filter(acc => acc.type === 'ahorro');
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const currentAmount = formData.get('currentAmount') ? Number(formData.get('currentAmount')) : undefined;

    const newGoal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'familyId'> = {
      name: formData.get('name') as string,
      targetAmount: Number(formData.get('targetAmount')),
      targetDate: new Date(formData.get('targetDate') as string).toISOString(),
      priority: formData.get('priority') as 'Alta' | 'Media' | 'Baja',
      accountId: formData.get('accountId') as string,
      icon: formData.get('icon') as string || 'Target',
    };
    onSave(newGoal, currentAmount);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">Nombre</Label>
        <Input id="name" name="name" defaultValue={goal?.name} className="col-span-3" required />
      </div>
       <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="accountId" className="text-right">Cuenta</Label>
        <Select name="accountId" required defaultValue={goal?.accountId}>
            <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleccionar cuenta de ahorro" />
            </SelectTrigger>
            <SelectContent>
                {savingsAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="icon" className="text-right">Icono</Label>
        <Select name="icon" defaultValue={goal?.icon || 'Target'}>
            <SelectTrigger className="col-span-3">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Target">
                    <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span>Objetivo General</span>
                    </div>
                </SelectItem>
                {availableIcons.map(iconOpt => {
                    const IconComponent = iconOpt.icon;
                    return (
                        <SelectItem key={iconOpt.value} value={iconOpt.value}>
                            <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4 text-primary" />
                                <span>{iconOpt.label}</span>
                            </div>
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="targetAmount" className="text-right">Monto Objetivo</Label>
        <Input id="targetAmount" name="targetAmount" type="number" defaultValue={goal?.targetAmount} className="col-span-3" required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currentAmount" className="text-right">Monto Actual</Label>
            <Input id="currentAmount" name="currentAmount" type="number" placeholder="Opcional" defaultValue={goal?.currentAmount || 0} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="targetDate" className="text-right">Fecha Límite</Label>
        <Input id="targetDate" name="targetDate" type="date" defaultValue={goal?.targetDate.split('T')[0]} className="col-span-3" required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="priority" className="text-right">Prioridad</Label>
        <Select name="priority" required defaultValue={goal?.priority || 'Media'}>
            <SelectTrigger className="col-span-3">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Media">Media</SelectItem>
                <SelectItem value="Baja">Baja</SelectItem>
            </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancelar</Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Meta
        </Button>
      </DialogFooter>
    </form>
  );
}

function GoalCard({ goal, account, onEdit }: { goal: SavingsGoal, account?: Account, onEdit: (goal: SavingsGoal) => void }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient) {
            setTimeLeft(formatDistanceToNow(parseISO(goal.targetDate), { addSuffix: true, locale: es }));
        }
    }, [isClient, goal.targetDate]);

    const { deleteDoc } = useFamilyData();

    const deleteGoal = async (id: string) => {
        await deleteDoc("savingsGoals", id);
    };

    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    
    const getPriorityColor = (priority: string) => {
        if (priority === 'Alta') return 'text-red-400';
        if (priority === 'Media') return 'text-yellow-400';
        return 'text-green-400';
    }

    const GoalIcon = iconMap[goal.icon || 'Target'] || Target;

    return (
         <Card>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg font-headline flex items-center gap-2">
                            <GoalIcon className="h-5 w-5 text-primary"/>
                            {goal.name}
                        </CardTitle>
                        {account && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                <Landmark className="h-3 w-3" />
                                <span>{account.name}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary">{progress.toFixed(0)}%</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => onEdit(goal)}>Editar</DropdownMenuItem>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Eliminar</DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción no se puede deshacer. Esto eliminará permanentemente la meta "{goal.name}".
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteGoal(goal.id)}>Eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                <div className="flex justify-between items-baseline pt-2">
                    <CardDescription>
                        Meta: {goal.targetAmount.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                    </CardDescription>
                    <div className="flex items-center gap-1.5">
                        <div className={cn("h-2 w-2 rounded-full", getPriorityColor(goal.priority).replace('text-', 'bg-'))}></div>
                        <p className={cn("text-xs font-semibold", getPriorityColor(goal.priority))}>{goal.priority}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-muted-foreground">Ahorrado</span>
                        <span className="font-bold">{goal.currentAmount.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">
                    Fecha objetivo: {new Date(goal.targetDate).toLocaleDateString('es-ES')} {isClient && timeLeft ? `(${timeLeft})` : ''}
                </p>
            </CardFooter>
         </Card>
    )
}

export default function GoalsPage() {
    const { goals, accounts, addDoc, updateDoc } = useFamilyData();
    const { toast } = useToast();
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<SavingsGoal | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addGoal = async (goal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'familyId'>, currentAmount?: number) => {
        const dataToAdd = { 
            ...goal, 
            currentAmount: currentAmount || 0,
            targetDate: new Date(goal.targetDate),
        };
        await addDoc("savingsGoals", dataToAdd);
    };

    const updateGoal = async (id: string, goal: Partial<Omit<SavingsGoal, 'id' | 'familyId'>>) => {
        const dataToUpdate: any = { ...goal };
        if (goal.targetDate) {
            dataToUpdate.targetDate = new Date(goal.targetDate);
        }
        if (goal.currentAmount !== undefined) {
            dataToUpdate.currentAmount = goal.currentAmount;
        }
        if (goal.accountId) {
            dataToUpdate.accountId = goal.accountId;
        }
        await updateDoc("savingsGoals", id, dataToUpdate);
    };

    const handleSaveGoal = async (goalData: Omit<SavingsGoal, 'id' | 'currentAmount' | 'familyId'>, currentAmount?: number) => {
        setIsSubmitting(true);
        if (editingGoal) {
            await updateGoal(editingGoal.id, { ...goalData, currentAmount: currentAmount ?? editingGoal.currentAmount });
            setEditingGoal(undefined);
            toast({ title: "Meta actualizada", description: `La meta "${goalData.name}" ha sido actualizada.` });
        } else {
            await addGoal(goalData, currentAmount);
            setCreateOpen(false);
            toast({ title: "Meta creada", description: `La meta "${goalData.name}" ha sido creada.` });
        }
        setIsSubmitting(false);
        setEditingGoal(undefined);
        setCreateOpen(false);
    };
    
  return (
    <>
      <Header title="Metas de Ahorro">
          <Button size="sm" className="h-9 gap-1" onClick={() => setCreateOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              Nueva Meta
          </Button>
      </Header>
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 pb-20 sm:pb-0">
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map(goal => {
                const account = accounts.find(acc => acc.id === goal.accountId);
                return <GoalCard key={goal.id} goal={goal} account={account} onEdit={setEditingGoal} />
            })}
             {goals.length === 0 && (
                <Card className="flex flex-col items-center justify-center border-dashed min-h-[250px] cursor-pointer hover:border-primary hover:text-primary transition-colors" onClick={() => setCreateOpen(true)}>
                    <div className="flex flex-col h-full w-full items-center justify-center gap-2 text-muted-foreground">
                        <PlusCircle className="h-8 w-8" />
                        <span className="text-sm font-medium">Crear Nueva Meta</span>
                    </div>
                </Card>
             )}
         </div>
      </main>

        <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crear Nueva Meta de Ahorro</DialogTitle>
                    <DialogDescription>
                        Defina su objetivo y siga su progreso.
                    </DialogDescription>
                </DialogHeader>
                <GoalForm onSave={handleSaveGoal} onClose={() => setCreateOpen(false)} accounts={accounts} isSubmitting={isSubmitting} />
            </DialogContent>
        </Dialog>

        <Dialog open={!!editingGoal} onOpenChange={(isOpen) => !isOpen && setEditingGoal(undefined)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Meta de Ahorro</DialogTitle>
                    <DialogDescription>Ajuste los detalles de su meta.</DialogDescription>
                </DialogHeader>
                {editingGoal && <GoalForm goal={editingGoal} onSave={handleSaveGoal} onClose={() => setEditingGoal(undefined)} accounts={accounts} isSubmitting={isSubmitting} />}
            </DialogContent>
        </Dialog>
    </>
  );
}
