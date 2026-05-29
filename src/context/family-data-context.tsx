
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc as fbAddDoc, updateDoc as fbUpdateDoc, deleteDoc as fbDeleteDoc, doc, getDocs, query, where, Timestamp, orderBy, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { useAuth } from './auth-context';
import type { FamilyData, Transaction, Category, Budget, SavingsGoal, Account, CreditCard, Loan, User } from '@/lib/types';
import { users as defaultUsers } from '@/lib/data';
import { seedDefaultCategories } from '@/lib/services/seed-service';
import { processRecurringTransactions } from '@/lib/services/recurring-service';
import { useToast } from '@/hooks/use-toast';

const FAMILY_ID = 'main-family';

const getUniqueCategories = (categories: Category[]): Category[] => {
    const seen = new Set<string>();
    return categories.filter(category => {
        if (seen.has(category.value)) {
            return false;
        } else {
            seen.add(category.value);
            return true;
        }
    });
};

interface FamilyDataContextType {
  familyData: FamilyData | null;
  loading: boolean;
  addDoc: (collectionName: keyof Omit<FamilyData, 'familyId'>, data: any) => Promise<any>;
  updateDoc: (collectionName: keyof Omit<FamilyData, 'familyId'>, id: string, data: any) => Promise<void>;
  deleteDoc: (collectionName: keyof Omit<FamilyData, 'familyId'>, id: string) => Promise<void>;
  accounts: Account[];
  creditCards: CreditCard[];
  cashBalance: number;
  budgets: Budget[];
  goals: SavingsGoal[];
  loans: Loan[];
  transactions: Transaction[];
  categories: Category[];
  members: User[];
  addMember: (member: Omit<User, 'id'>) => Promise<any>;
  updateMember: (id: string, data: Partial<User>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  getAccountBalance: (accountId: string) => number;
}

const FamilyDataContext = createContext<FamilyDataContextType | undefined>(undefined);

const COLLECTIONS_TO_SYNC: (keyof Omit<FamilyData, 'familyId'>)[] = [
    'transactions', 'categories', 'budgets', 'savingsGoals', 'accounts', 'creditCards', 'loans'
];

const MEMBERS_COLLECTION = 'members';

export function FamilyDataProvider({ children }: { children: ReactNode }) {
  const { currentUser, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const recurringCheckHasRun = useRef(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [creditCardsState, setCreditCardsState] = useState<CreditCard[]>([]);
  const [loansState, setLoansState] = useState<Loan[]>([]);
  const [members, setMembers] = useState<User[]>([]);

  // This effect will be the single source of truth for data loading.
  useEffect(() => {
    console.log("[FamilyDataContext] Running initialization effect. authLoading:", authLoading, "currentUser:", currentUser);
    if (authLoading) {
        return;
    }
    if (!currentUser) {
      console.log("[FamilyDataContext] No currentUser, skipping sync.");
      setIsLoading(true);
      setTransactions([]);
      setCategories([]);
      setBudgets([]);
      setGoals([]);
      setAccounts([]);
      setCreditCardsState([]);
      setLoansState([]);
      recurringCheckHasRun.current = false;
      return;
    }

    setIsLoading(true);
    recurringCheckHasRun.current = false;

    // Seed categories as a side-effect, don't block loading
    seedDefaultCategories(FAMILY_ID).catch(error => {
      console.error("[FamilyDataContext] Error seeding categories:", error);
    });

    const unsubscribers: Unsubscribe[] = [];

    const loadStatus: Record<string, boolean> = Object.fromEntries(
        COLLECTIONS_TO_SYNC.map(name => [name, false])
    );
    
    const checkAllLoaded = () => {
        console.log("[FamilyDataContext] Checking load status:", loadStatus);
        if (Object.values(loadStatus).every(Boolean)) {
            console.log("[FamilyDataContext] All collections synced successfully! Setting isLoading to false.");
            setIsLoading(false);
        }
    };

    const createUnsubscriber = <T extends { id: string }>(
        collectionName: keyof Omit<FamilyData, 'familyId'>, 
        setter: React.Dispatch<React.SetStateAction<T[]>>,
        processor?: (docs: any[]) => T[]
    ) => {
        console.log(`[FamilyDataContext] Registering onSnapshot for: ${collectionName}`);
        let q = query(collection(db, collectionName), where("familyId", "==", FAMILY_ID));
        if (collectionName === 'transactions') {
            q = query(q, orderBy("date", "desc"));
        }
        
        return onSnapshot(q, (snapshot) => {
            console.log(`[FamilyDataContext] onSnapshot received data for: ${collectionName}, doc count:`, snapshot.size);
            let docs = snapshot.docs.map(d => {
                const data = d.data();
                Object.keys(data).forEach(key => {
                    if (data[key] instanceof Timestamp) {
                        data[key] = data[key].toDate().toISOString();
                    }
                });
                return { id: d.id, ...data };
            }) as T[];
            
            if (processor) {
                docs = processor(docs);
            }
            
            setter(docs);
            
            if (!loadStatus[collectionName]) {
                loadStatus[collectionName] = true;
                checkAllLoaded();
            }
        }, (error) => {
            console.error(`[FamilyDataContext] Error fetching ${collectionName}:`, error);
            if (!loadStatus[collectionName]) {
                loadStatus[collectionName] = true;
                checkAllLoaded();
            }
        });
    };

    unsubscribers.push(createUnsubscriber('transactions', setTransactions));
    unsubscribers.push(createUnsubscriber('categories', setCategories, getUniqueCategories as (docs: any[]) => Category[]));
    unsubscribers.push(createUnsubscriber('budgets', setBudgets));
    unsubscribers.push(createUnsubscriber('savingsGoals', setGoals));
    unsubscribers.push(createUnsubscriber('accounts', setAccounts));
    unsubscribers.push(createUnsubscriber('creditCards', setCreditCardsState));
    unsubscribers.push(createUnsubscriber('loans', setLoansState));

    // Members collection — seed from data.ts if empty
    console.log(`[FamilyDataContext] Registering onSnapshot for members`);
    const membersQuery = query(collection(db, MEMBERS_COLLECTION), where('familyId', '==', FAMILY_ID));
    const membersUnsub = onSnapshot(membersQuery, async (snapshot) => {
      console.log(`[FamilyDataContext] onSnapshot received members data, empty:`, snapshot.empty);
      if (snapshot.empty) {
        // Seed default users on first run
        console.log(`[FamilyDataContext] Seeding default members...`);
        for (const u of defaultUsers) {
          await fbAddDoc(collection(db, MEMBERS_COLLECTION), { ...u, familyId: FAMILY_ID });
        }
      } else {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
        setMembers(docs);
      }
    }, (error) => {
      console.error('[FamilyDataContext] Error fetching members:', error);
    });
    unsubscribers.push(membersUnsub);

    return () => {
      console.log("[FamilyDataContext] Cleaning up initialization effect unsubscribers.");
      unsubscribers.forEach(unsub => unsub());
    };
  }, [currentUser, authLoading]);

  const addDocWithFamilyId = useCallback(async (collectionName: keyof FamilyData, data: any) => {
    if (!currentUser) throw new Error("User not authenticated");
    
    const dataToAdd: any = { ...data, familyId: FAMILY_ID };

    if (collectionName === 'transactions') {
        dataToAdd.user = currentUser.name;
    }

    const docRef = await fbAddDoc(collection(db, collectionName), dataToAdd);
    return docRef;
  }, [currentUser]);

  const updateDocById = useCallback(async (collectionName: keyof Omit<FamilyData, 'familyId'>, id: string, data: any) => {
    const docRef = doc(db, collectionName, id);
    await fbUpdateDoc(docRef, data);
  }, []);
  
  const deleteDocById = useCallback(async (collectionName: keyof Omit<FamilyData, 'familyId'>, id: string) => {
    const docRef = doc(db, collectionName, id);
    await fbDeleteDoc(docRef);
  }, []);

  const addRecurringTransaction = useCallback((transactionData: Omit<Transaction, 'id' | 'user' | 'familyId'>) => {
      return addDocWithFamilyId('transactions', transactionData);
  }, [addDocWithFamilyId]);

  const updateRecurringTransaction = useCallback((id: string, data: Partial<Omit<Transaction, 'id'| 'user' | 'familyId'>>) => {
      return updateDocById('transactions', id, data);
  }, [updateDocById]);
  
  useEffect(() => {
    if (isLoading || authLoading || !currentUser || recurringCheckHasRun.current) {
        return;
    }
    
    const runRecurringCheck = async () => {
        recurringCheckHasRun.current = true;
        const updatesMade = await processRecurringTransactions(
            transactions,
            addRecurringTransaction,
            updateRecurringTransaction
        );

        if (updatesMade) {
            toast({
                title: 'Transacciones Recurrentes Generadas',
                description: 'Se han creado nuevas transacciones basadas en sus plantillas recurrentes.',
            });
        }
    };
    
    runRecurringCheck();

  }, [isLoading, authLoading, currentUser, transactions, addRecurringTransaction, updateRecurringTransaction, toast]);


  const transactionsByAccountId = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (!t.accountId) continue;
      const current = map.get(t.accountId) || 0;
      let change = 0;
      if (t.type === 'income') {
        change = t.amount;
      } else if (t.type === 'expense') {
        change = -t.amount;
      }
      map.set(t.accountId, current + change);
    }
    return map;
  }, [transactions]);

  const getAccountBalance = useCallback((accountId: string): number => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return 0;
    
    const netTransactions = transactionsByAccountId.get(accountId) || 0;
    return account.balance + netTransactions;
  }, [accounts, transactionsByAccountId]);

  const cashBalance = useMemo(() => {
    let balance = 0;
    for (const t of transactions) {
      if (t.paymentMethod === 'Efectivo') {
        if (t.type === 'income') {
          balance += t.amount;
        } else if (t.type === 'expense' && t.category !== 'credit-card-payment' && t.category !== 'debt-payment') {
          balance -= t.amount;
        }
      }
    }
    return balance;
  }, [transactions]);

  const creditCards = useMemo(() => {
    return creditCardsState.map(card => {
        const spentDOP = transactions
          .filter(t => t.creditCardId === card.id && t.type === 'expense' && t.currency === 'DOP')
          .reduce((acc, t) => acc + t.amount, 0);
        const spentUSD = transactions
          .filter(t => t.creditCardId === card.id && t.type === 'expense' && t.currency === 'USD')
          .reduce((acc, t) => acc + t.amount, 0);
        return { ...card, spentDOP, spentUSD };
      });
  }, [transactions, creditCardsState]);
  
  const loans = useMemo(() => {
    return loansState.map(loan => {
        const initialPaidAmount = loan.paidAmount || 0;
        const transactionPayments = transactions
          .filter(t => t.loanId === loan.id && t.type === 'expense')
          .reduce((acc, t) => acc + t.amount, 0);
        return { ...loan, paidAmount: initialPaidAmount + transactionPayments };
      });
  }, [transactions, loansState]);

  // The familyData object is now derived from individual states
  const familyData = useMemo(() => ({
    familyId: FAMILY_ID,
    transactions,
    categories,
    budgets,
    savingsGoals: goals,
    accounts,
    creditCards: creditCardsState,
    loans: loansState,
  }), [transactions, categories, budgets, goals, accounts, creditCardsState, loansState]);

  const addMember = useCallback(async (member: Omit<User, 'id'>) => {
    return fbAddDoc(collection(db, MEMBERS_COLLECTION), { ...member, familyId: FAMILY_ID });
  }, []);

  const updateMember = useCallback(async (id: string, data: Partial<User>) => {
    await fbUpdateDoc(doc(db, MEMBERS_COLLECTION, id), data);
  }, []);

  const deleteMember = useCallback(async (id: string) => {
    await fbDeleteDoc(doc(db, MEMBERS_COLLECTION, id));
  }, []);

  const value: FamilyDataContextType = {
    familyData,
    loading: authLoading || isLoading,
    addDoc: addDocWithFamilyId,
    updateDoc: updateDocById,
    deleteDoc: deleteDocById,
    accounts,
    creditCards,
    cashBalance,
    budgets,
    goals,
    loans,
    transactions,
    categories,
    members,
    addMember,
    updateMember,
    deleteMember,
    getAccountBalance,
  };

  return (
    <FamilyDataContext.Provider value={value}>
      {children}
    </FamilyDataContext.Provider>
  );
}

export function useFamilyData() {
  const context = useContext(FamilyDataContext);
  if (context === undefined) {
    throw new Error('useFamilyData must be used within a FamilyDataProvider');
  }
  return context;
}
