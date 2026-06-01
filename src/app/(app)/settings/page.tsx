
'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { users as initialUsers, iconMap, availableIcons } from "@/lib/data";
import { MoreHorizontal, UserPlus, PlusCircle } from "lucide-react";
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
import { useState, useMemo, useEffect } from "react";
import type { User, Category, Transaction } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/auth-context";
import { Separator } from "@/components/ui/separator";
import { useFamilyData } from "@/context/family-data-context";
import { Header } from "@/components/faminance/header";


const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0] ? names[0][0] : '';
}

function CategoryList({ 
    title, 
    categories, 
    onEdit, 
    onDelete, 
    onToggle 
}: { 
    title: string; 
    categories: Category[];
    onEdit: (category: Category) => void;
    onDelete: (categoryId: string) => void;
    onToggle: (category: Category, isActive: boolean) => void;
}) {
    // Group categories
    const rootCategories = categories.filter(c => !c.parentId);

    return (
        <div>
            <h3 className="text-lg font-medium font-headline mb-4">{title}</h3>
            <div className="space-y-6">
                {rootCategories.map(rootCategory => {
                    const subCategories = categories.filter(c => c.parentId === rootCategory.value);
                    const RootIcon = iconMap[rootCategory.icon];
                    
                    return (
                        <div key={rootCategory.id} className="space-y-3">
                            {/* Root Category */}
                            <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/50">
                                <div className="flex items-center gap-4">
                                    <div className="bg-background rounded-lg p-2 shadow-sm border border-border/50">
                                        {RootIcon && <RootIcon className="h-5 w-5 text-primary" />}
                                    </div>
                                    <p className="font-semibold text-foreground">{rootCategory.label}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={rootCategory.isActive}
                                        onCheckedChange={(checked) => onToggle(rootCategory, checked)}
                                        aria-label={`Toggle category ${rootCategory.label}`}
                                    />
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onSelect={() => onEdit(rootCategory)}>Editar</DropdownMenuItem>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Eliminar</DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción no se puede deshacer. Esto eliminará permanentemente la categoría "{rootCategory.label}".
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(rootCategory.id)}>Eliminar</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* Subcategories */}
                            {subCategories.length > 0 && (
                                <div className="pl-6 md:pl-10 space-y-2 relative before:absolute before:left-4 md:before:left-8 before:top-0 before:bottom-4 before:w-px before:bg-border">
                                    {subCategories.map(sub => {
                                        const SubIcon = iconMap[sub.icon];
                                        return (
                                            <div key={sub.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors relative group">
                                                <div className="absolute left-[-20px] md:left-[-32px] top-1/2 w-4 md:w-6 h-px bg-border" />
                                                <div className="flex items-center gap-3">
                                                    {SubIcon && <SubIcon className="h-4 w-4 text-muted-foreground" />}
                                                    <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{sub.label}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={sub.isActive}
                                                        onCheckedChange={(checked) => onToggle(sub, checked)}
                                                        className="scale-90"
                                                    />
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem onSelect={() => onEdit(sub)}>Editar</DropdownMenuItem>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Eliminar</DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Eliminará la subcategoría "{sub.label}".
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(sub.id)}>Eliminar</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const { currentUser } = useAuth();
    const { categories, addDoc, updateDoc, deleteDoc, members, addMember, updateMember, deleteMember } = useFamilyData();
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const [isInviteMemberOpen, setInviteMemberOpen] = useState(false);
    const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [addRecurringIncome, setAddRecurringIncome] = useState(false);
    const [defaultIncomeDate, setDefaultIncomeDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setDefaultIncomeDate(new Date().toISOString().split('T')[0]);
    }, []);
    
    const addCategory = async (category: Omit<Category, 'id' | 'familyId' | 'value'>) => {
        const value = category.label.toLowerCase().replace(/\s+/g, '-');
        await addDoc('categories', { ...category, value });
    };

    const updateCategory = async (id: string, category: Partial<Omit<Category, 'id'| 'familyId' | 'value'>>) => {
        await updateDoc('categories', id, category);
    };

    const deleteCategory = async (id: string) => {
        await deleteDoc('categories', id);
    };


    const { incomeCategories, expenseCategories } = useMemo(() => {
        const income = categories.filter(c => c.type === 'income');
        const expense = categories.filter(c => c.type === 'expense');
        return { incomeCategories: income, expenseCategories: expense };
    }, [categories]);
    
    const handleDeleteUser = async (userId: string) => {
        setIsSubmitting(true);
        await deleteMember(userId);
        setIsSubmitting(false);
    };

    const handleInviteMember = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setIsSubmitting(true);
        await addMember({
            name: formData.get('new-member-name') as string,
            role: formData.get('new-member-role') as 'Admin' | 'Usuario',
            allowance: formData.get('new-member-allowance') ? Number(formData.get('new-member-allowance')) : undefined,
        });
        setIsSubmitting(false);
        setInviteMemberOpen(false);
    };

    const handleAddTransaction = (newTransaction: Omit<Transaction, 'id' | 'familyId'>) => {
        const transactionToAdd: Transaction = {
            id: `t${Date.now()}`,
            familyId: 'main-family',
            ...newTransaction,
        };
        setTransactions(prevTransactions => [transactionToAdd, ...prevTransactions]);
        // In a real app, you would likely lift this state up to a shared context or make an API call
        console.log("New recurring transaction added:", transactionToAdd);
    };

    const handleEditRoleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingUser) return;
        const formData = new FormData(event.currentTarget);
        setIsSubmitting(true);
        await updateMember(editingUser.id, {
            role: formData.get('role') as 'Admin' | 'Usuario',
            allowance: formData.get('allowance') ? Number(formData.get('allowance')) : undefined,
        });
        setIsSubmitting(false);
        setEditingUser(null);
        setAddRecurringIncome(false);
    };


    const handleCategorySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const parentId = formData.get('parentId') as string;
        
        const categoryData: any = {
            label: formData.get('label') as string,
            icon: formData.get('icon') as string,
            type: formData.get('type') as 'income' | 'expense',
            isActive: editingCategory ? editingCategory.isActive : true, // Preserve status on edit, default to active on create
        };

        if (parentId && parentId !== 'none') {
            categoryData.parentId = parentId;
        }

        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, categoryData);
            } else {
                await addCategory(categoryData);
            }
            setEditingCategory(null);
            setCategoryDialogOpen(false);
        } catch (error: any) {
            console.error("Error saving category:", error);
            alert("Error al guardar categoría: " + (error?.message || "Permisos insuficientes."));
        }
    };

    const handleToggleCategory = (category: Category, isActive: boolean) => {
        updateCategory(category.id, { isActive });
    };

    const openNewCategoryDialog = () => {
        setEditingCategory(null);
        setCategoryDialogOpen(true);
    };

    const openEditCategoryDialog = (category: Category) => {
        setEditingCategory(category);
        setCategoryDialogOpen(true);
    };

    return (
    <>
      <Header title="Ajustes" />
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 pb-20 sm:pb-0">
        <div className="grid gap-8 lg:grid-cols-2">
            {/* Family Management */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="font-headline">Miembros de la Familia</CardTitle>
                        <Dialog open={isInviteMemberOpen} onOpenChange={setInviteMemberOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="gap-2 h-9">
                                    <UserPlus className="h-4 w-4" />
                                    Añadir Miembro
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                <DialogTitle>Añadir Nuevo Miembro</DialogTitle>
                                <DialogDescription>
                                    Añada un nuevo miembro a la familia.
                                </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleInviteMember} className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-member-name" className="text-right">Nombre</Label>
                                    <Input id="new-member-name" name="new-member-name" placeholder="Ej: Carlos" className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-member-role" className="text-right">Rol</Label>
                                    <Select name="new-member-role" defaultValue="Usuario">
                                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Admin">Admin</SelectItem>
                                            <SelectItem value="Usuario">Usuario</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-member-allowance" className="text-right">Mesada (RD$)</Label>
                                    <Input id="new-member-allowance" name="new-member-allowance" type="number" placeholder="Opcional" className="col-span-3" />
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose>
                                    <Button type="submit" disabled={isSubmitting}>Añadir</Button>
                                </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <CardDescription>Gestiona los roles y permisos de tu familia.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {members.map(user => (
                            <div key={user.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Avatar className="bg-muted">
                                        <AvatarFallback className="bg-transparent font-semibold">{getInitials(user.name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{user.name}</p>
                                        <p className="text-sm text-muted-foreground">{user.role}{user.allowance ? ` · Mesada: RD$${user.allowance.toLocaleString('es-DO')}` : ''}</p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" disabled={user.id === currentUser?.id}>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                         <DropdownMenuItem onSelect={() => {
                                            setEditingUser(user);
                                            setAddRecurringIncome(false);
                                         }}>Editar Rol</DropdownMenuItem>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                 <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Eliminar</DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente a {user.name} de la familia.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteUser(user.id)}>Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Category Management */}
            <Card>
                 <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="font-headline">Categorías</CardTitle>
                         <Button size="sm" className="gap-2 h-9" onClick={openNewCategoryDialog}>
                            <PlusCircle className="h-4 w-4" />
                            Crear Categoría
                        </Button>
                    </div>
                    <CardDescription>Gestione sus categorías de ingresos y gastos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <CategoryList 
                            title="Egresos"
                            categories={expenseCategories}
                            onEdit={openEditCategoryDialog}
                            onDelete={deleteCategory}
                            onToggle={handleToggleCategory}
                        />
                        <Separator />
                        <CategoryList 
                            title="Ingresos"
                            categories={incomeCategories}
                            onEdit={openEditCategoryDialog}
                            onDelete={deleteCategory}
                            onToggle={handleToggleCategory}
                        />
                    </div>
                </CardContent>
            </Card>

        </div>
      </main>

       <Dialog open={isCategoryDialogOpen} onOpenChange={(isOpen) => {
            if (!isOpen) {
                setCategoryDialogOpen(false);
                setEditingCategory(null);
            } else {
                setCategoryDialogOpen(true);
            }
       }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}</DialogTitle>
                </DialogHeader>
                 <form onSubmit={handleCategorySubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="label" className="text-right">
                        Nombre
                        </Label>
                        <Input id="label" name="label" defaultValue={editingCategory?.label} placeholder="Ej: Pasatiempos" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                        Tipo
                        </Label>
                        <Select name="type" defaultValue={editingCategory?.type || 'expense'} onValueChange={(v) => {
                            // We don't have a state for type, so we can't easily filter parents based on type dynamically in a simple form.
                            // But for simplicity, we will let them select any parent or we could add state.
                        }}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="expense">Egreso</SelectItem>
                                <SelectItem value="income">Ingreso</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="parentId" className="text-right">
                        Categoría Padre
                        </Label>
                        <Select name="parentId" defaultValue={editingCategory?.parentId || 'none'}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Principal (Ninguna)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">-- Principal (Ninguna) --</SelectItem>
                                {categories.filter(c => !c.parentId && c.id !== editingCategory?.id).map(c => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="icon" className="text-right">
                        Icono
                        </Label>
                        <Select name="icon" defaultValue={editingCategory?.icon}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Seleccionar un icono" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableIcons.map(({value, icon: Icon, label}) => (
                                     <SelectItem key={value} value={value}>
                                        <div className="flex items-center gap-2">
                                            <Icon className="h-4 w-4" />
                                            <span>{label}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                        <Button type="submit">Guardar Cambios</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

       <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Miembro de la Familia</DialogTitle>
                    <DialogDescription>Ajuste el rol o mesada de {editingUser?.name}.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEditRoleSubmit} className="grid gap-6 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Rol</Label>
                        <Select name="role" defaultValue={editingUser?.role}>
                            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Admin">Admin</SelectItem>
                                <SelectItem value="Usuario">Usuario</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="allowance" className="text-right">Mesada (RD$)</Label>
                        <Input id="allowance" name="allowance" type="number" placeholder="0" defaultValue={editingUser?.allowance ?? ''} className="col-span-3" />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>Guardar Cambios</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </>
    );
}