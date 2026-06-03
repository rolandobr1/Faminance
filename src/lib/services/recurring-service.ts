
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  parseISO,
} from 'date-fns';
import type { Transaction, SavingsGoal } from '../types';

export function getAlignedRecurringDate(
  baseDateStrOrObj: string | Date,
  recurringDay: number
): Date {
  const baseDate = typeof baseDateStrOrObj === 'string' ? parseISO(baseDateStrOrObj) : baseDateStrOrObj;
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  
  // Set to target day in the current month
  const targetDate = new Date(year, month, 1, 12, 0, 0);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  targetDate.setDate(Math.min(recurringDay, daysInMonth));
  
  // Reset base comparison date to 12:00 to avoid hours mismatch
  const baseCompare = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 12, 0, 0);
  
  if (targetDate < baseCompare) {
    // If it's in the past relative to the base date, start in the next month
    const nextMonth = new Date(year, month + 1, 1, 12, 0, 0);
    const daysInNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    nextMonth.setDate(Math.min(recurringDay, daysInNextMonth));
    return nextMonth;
  }
  
  return targetDate;
}

export function getNextDueDate(
  startDate: string | Date,
  frequency: Transaction['frequency'],
  recurringDay?: number
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
      if (recurringDay && recurringDay >= 1 && recurringDay <= 31) {
        const nextMonth = addMonths(date, 1);
        const daysInMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
        const clampedDay = Math.min(recurringDay, daysInMonth);
        return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), clampedDay, 12, 0, 0);
      }
      return addMonths(date, 1);
    case 'yearly':
      if (recurringDay && recurringDay >= 1 && recurringDay <= 31) {
        const nextYear = addYears(date, 1);
        const daysInMonth = new Date(nextYear.getFullYear(), nextYear.getMonth() + 1, 0).getDate();
        const clampedDay = Math.min(recurringDay, daysInMonth);
        return new Date(nextYear.getFullYear(), nextYear.getMonth(), clampedDay, 12, 0, 0);
      }
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
        const newNextDueDate = getNextDueDate(nextDueDate, t.frequency, t.recurringDay);
        
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

/**
 * Processes recurring savings goals: generates expense transactions for each pending
 * contribution, updates the goal's currentAmount, and advances nextContributionDate.
 * Stops when the goal is completed (currentAmount >= targetAmount).
 */
export async function processRecurringSavings(
  goals: SavingsGoal[],
  addTransaction: (transaction: Omit<Transaction, 'id' | 'user' | 'familyId'>) => Promise<any>,
  updateGoal: (id: string, data: Partial<Omit<SavingsGoal, 'id' | 'familyId'>>) => Promise<void>
): Promise<boolean> {
  const today = new Date();
  const operations: Promise<any>[] = [];
  let madeUpdates = false;

  for (const goal of goals) {
    if (
      !goal.isRecurring ||
      !goal.nextContributionDate ||
      !goal.contributionAmount ||
      !goal.accountId ||
      !goal.frequency
    ) {
      continue;
    }

    // Stop if goal is already completed
    if (goal.currentAmount >= goal.targetAmount) {
      continue;
    }

    let nextDate = parseISO(goal.nextContributionDate);
    let accumulatedAmount = goal.currentAmount;

    while (nextDate <= today && accumulatedAmount < goal.targetAmount) {
      // Clamp last contribution so we don't overshoot the target
      const remaining = goal.targetAmount - accumulatedAmount;
      const contributionThisCycle = Math.min(goal.contributionAmount, remaining);

      const transactionData: Omit<Transaction, 'id' | 'user' | 'familyId'> = {
        type: 'expense',
        category: 'saving-contribution',
        amount: contributionThisCycle,
        currency: 'DOP',
        accountId: goal.accountId,
        paymentMethod: 'Transferencia Bancaria',
        description: `Aporte a meta: ${goal.name}`,
        date: nextDate.toISOString(),
        goalId: goal.id,
        isShared: false,
        sharedWith: [],
        isRecurring: false,
      };

      operations.push(addTransaction(transactionData));
      accumulatedAmount += contributionThisCycle;

      const newNextDate = getNextDueDate(nextDate, goal.frequency, goal.recurringDay);
      if (newNextDate) {
        nextDate = newNextDate;
      } else {
        break;
      }
    }

    // Only update the goal if there were actual changes
    if (accumulatedAmount !== goal.currentAmount) {
      operations.push(
        updateGoal(goal.id, {
          currentAmount: accumulatedAmount,
          nextContributionDate: nextDate.toISOString(),
        })
      );
      madeUpdates = true;
    }
  }

  if (operations.length > 0) {
    await Promise.all(operations);
    console.log(`[Savings] Processed ${operations.length} savings contribution operation(s).`);
  }

  return madeUpdates;
}

/**
 * Processes recurring deposits to accounts (like a cooperative).
 * Automatically generates a transfer: an expense from the source (cash or another account)
 * and an income to the destination account.
 */
export async function processRecurringDeposits(
  accounts: import('../types').Account[],
  addTransaction: (transaction: Omit<import('../types').Transaction, 'id' | 'user' | 'familyId'>) => Promise<any>,
  updateAccount: (id: string, data: Partial<Omit<import('../types').Account, 'id' | 'familyId'>>) => Promise<void>
): Promise<boolean> {
  const today = new Date();
  const operations: Promise<any>[] = [];
  let madeUpdates = false;

  for (const account of accounts) {
    if (
      !account.isRecurringDeposit ||
      !account.nextDepositDate ||
      !account.depositAmount ||
      !account.depositFrequency
    ) {
      continue;
    }

    let nextDate = parseISO(account.nextDepositDate);
    let originalNextDate = account.nextDepositDate;

    while (nextDate <= today) {
      const amount = account.depositAmount;
      const sourceId = account.depositSourceAccountId;

      // 1. Create expense from the source (if source is 'cash', accountId is undefined)
      const expenseData: Omit<import('../types').Transaction, 'id' | 'user' | 'familyId'> = {
        type: 'expense',
        category: account.depositCategory || 'saving-contribution',
        amount: amount,
        currency: 'DOP',
        accountId: sourceId === 'cash' ? undefined : sourceId,
        paymentMethod: sourceId === 'cash' ? 'Efectivo' : 'Transferencia Bancaria',
        description: `Aporte a cuenta: ${account.name}`,
        date: nextDate.toISOString(),
        isShared: false,
        sharedWith: [],
        isRecurring: false,
      };

      // 2. Create income to the destination
      const incomeData: Omit<import('../types').Transaction, 'id' | 'user' | 'familyId'> = {
        type: 'income',
        category: account.depositCategory || 'saving-contribution',
        amount: amount,
        currency: 'DOP',
        accountId: account.id,
        paymentMethod: sourceId === 'cash' ? 'Efectivo' : 'Transferencia Bancaria',
        description: `Aporte recurrente`,
        date: nextDate.toISOString(),
        isShared: false,
        sharedWith: [],
        isRecurring: false,
      };

      operations.push(addTransaction(expenseData));
      operations.push(addTransaction(incomeData));

      const newNextDate = getNextDueDate(nextDate, account.depositFrequency, account.recurringDay);
      if (newNextDate) {
        nextDate = newNextDate;
      } else {
        break;
      }
    }

    // Update account's next deposit date
    if (nextDate.toISOString() !== originalNextDate) {
      operations.push(
        updateAccount(account.id, {
          nextDepositDate: nextDate.toISOString(),
        })
      );
      madeUpdates = true;
    }
  }

  if (operations.length > 0) {
    await Promise.all(operations);
    console.log(`[Accounts] Processed ${operations.length / 2} account deposit transfer(s).`);
  }

  return madeUpdates;
}
