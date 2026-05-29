
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  parseISO,
} from 'date-fns';
import type { Transaction } from '../types';

export function getNextDueDate(
  startDate: string | Date,
  frequency: Transaction['frequency']
): Date | null {
  const date = typeof startDate === 'string' ? parseISO(startDate) : startDate;

  switch (frequency) {
    case 'daily':
      return addDays(date, 1);
    case 'weekly':
      return addWeeks(date, 1);
    case 'bi-weekly':
      return addWeeks(date, 2);
    case 'monthly':
      return addMonths(date, 1);
    case 'yearly':
      return addYears(date, 1);
    default:
      return null;
  }
}

export async function processRecurringTransactions(
  transactions: Transaction[],
  addTransaction: (transaction: Omit<Transaction, 'id' | 'user' | 'familyId'>) => Promise<any>,
  updateTransaction: (id: string, transaction: Partial<Omit<Transaction, 'id' | 'user' | 'familyId'>>) => Promise<any>
) {
  const today = new Date();
  const newTransactions: Promise<any>[] = [];

  for (const t of transactions) {
    if (t.isRecurring && t.nextDueDate && t.frequency) {
      let nextDueDate = parseISO(t.nextDueDate);

      // Keep generating transactions until the next due date is in the future
      while (nextDueDate <= today) {
        const { id: _id, user: _user, familyId: _familyId, ...restOfTransaction } = t;
        const newTransactionData: Omit<Transaction, 'id'| 'user' | 'familyId'> = {
          ...restOfTransaction,
          date: nextDueDate.toISOString(),
          isRecurring: false, // The generated transaction is a single instance
          nextDueDate: undefined,
          frequency: undefined,
        };
        
        newTransactions.push(addTransaction(newTransactionData));

        // 2. Calculate the *next* next due date for the recurring template
        const newNextDueDate = getNextDueDate(nextDueDate, t.frequency);
        
        if (newNextDueDate) {
          nextDueDate = newNextDueDate;
        } else {
          // If for some reason we can't calculate a new date, stop the loop
          break;
        }
      }

      // 3. If the nextDueDate has changed, update the original recurring transaction
      if (parseISO(t.nextDueDate).getTime() !== nextDueDate.getTime()) {
        newTransactions.push(
            updateTransaction(t.id, { nextDueDate: nextDueDate.toISOString() })
        );
      }
    }
  }
    
  if (newTransactions.length > 0) {
      console.log(`Generated ${newTransactions.length} new transaction(s) from recurring templates.`);
      await Promise.all(newTransactions);
      return true; // Indicates that updates were made
  }

  return false; // No updates
}
