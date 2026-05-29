
'use client';

import { useFamilyData } from './family-data-context';
import type { Category } from '@/lib/types';

// The hook now gets data directly from the source of truth: useFamilyData
export function useCategories() {
  const { categories, addDoc, updateDoc, deleteDoc, loading } = useFamilyData();

  const addCategory = async (category: Omit<Category, 'id' | 'familyId' | 'value'>) => {
    const value = category.label
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');
    
    if (categories.some(c => c.value === value)) {
        console.warn(`Category with value "${value}" already exists.`);
        return;
    }
    
    const dataToAdd = { ...category, value };
    await addDoc('categories', dataToAdd);
  };

  const updateCategory = async (id: string, category: Partial<Omit<Category, 'id' | 'familyId' | 'value'>>) => {
    await updateDoc('categories', id, category);
  };

  const deleteCategory = async (id: string) => {
    await deleteDoc('categories', id);
  };

  return { 
    categories, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    loading,
  };
}

    