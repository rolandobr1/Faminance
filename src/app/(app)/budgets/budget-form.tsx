'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Budget, Category } from "@/lib/types";
import { SelectionModal, type SelectionOption } from "@/components/faminance/transactions/selection-modal";

export function BudgetForm({
  budget,
  onSave,
  onClose,
  categories,
  isSubmitting,
}: {
  budget?: Budget;
  onSave: (budget: Omit<Budget, 'id' | 'spent' | 'familyId'>) => void;
  onClose: () => void;
  categories: Category[];
  isSubmitting: boolean;
}) {
    const [selectedCategory, setSelectedCategory] = useState<SelectionOption | undefined>();

    useEffect(() => {
        if (budget) {
            const category = categories.find(c => c.value === budget.category);
            if (category) {
                setSelectedCategory({
                    value: category.value,
                    label: category.label,
                    icon: category.icon
                });
            }
        }
    }, [budget, categories]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCategory) {
        return;
    }
    const formData = new FormData(event.currentTarget);
    const newBudget: Omit<Budget, 'id' | 'spent' | 'familyId'> = {
      category: selectedCategory.value,
      limit: Number(formData.get('limit')),
      period: formData.get('period') as 'mensual' | 'semanal' | 'anual',
    };
    onSave(newBudget);
  };

  const categoryOptions: SelectionOption[] = categories
    .filter(c => c.type === 'expense')
    .map(cat => ({
        value: cat.value,
        label: cat.label,
        icon: cat.icon,
    }));

  return (
     <form onSubmit={handleSubmit} className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
            Categoría
            </Label>
            <div className="col-span-3">
                 <SelectionModal 
                    title="Categoría" 
                    options={categoryOptions} 
                    selected={selectedCategory} 
                    onSelect={setSelectedCategory}
                    disabled={!!budget}
                />
            </div>
        </div>
            <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="limit" className="text-right">
            Límite
            </Label>
            <Input id="limit" name="limit" type="number" defaultValue={budget?.limit} placeholder="RD$0.00" className="col-span-3" required/>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="period" className="text-right">
            Período
            </Label>
            <Select name="period" defaultValue={budget?.period || "mensual"}>
                <SelectTrigger className="col-span-3">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
            </Button>
        </DialogFooter>
    </form>
  )
}
