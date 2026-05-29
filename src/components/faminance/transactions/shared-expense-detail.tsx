'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { iconMap } from '@/lib/data';
import type { Transaction, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Users, Receipt } from 'lucide-react';

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

type SharedExpenseDetailProps = {
  transaction: Transaction;
  members: User[];
  categories: { value: string; label: string; icon: string }[];
};

export function SharedExpenseDetail({ transaction, members, categories }: SharedExpenseDetailProps) {
  const category = categories.find(c => c.value === transaction.category);
  const CategoryIcon = category ? iconMap[category.icon] : null;

  // All participants: the creator + sharedWith members
  const allParticipantIds = useMemo(() => {
    const ids = new Set<string>(transaction.sharedWith ?? []);
    if (transaction.user) {
      const creator = members.find(m => m.name === transaction.user);
      if (creator) ids.add(creator.id);
    }
    return Array.from(ids);
  }, [transaction.sharedWith, transaction.user, members]);

  const participantCount = allParticipantIds.length || 1;
  const sharePerPerson = transaction.amount / participantCount;
  const currencySymbol = transaction.currency === 'USD' ? 'US$' : 'RD$';
  const locale = transaction.currency === 'USD' ? 'en-US' : 'es-DO';
  const currency = transaction.currency === 'USD' ? 'USD' : 'DOP';

  const formatAmount = (amount: number) =>
    amount.toLocaleString(locale, { style: 'currency', currency });

  return (
    <Card className="overflow-hidden border-border/60 hover:border-border transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {CategoryIcon && (
              <div className="flex items-center justify-center h-9 w-9 rounded-full bg-muted shrink-0">
                <CategoryIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <CardTitle className="text-base font-semibold font-headline">
                {category?.label || transaction.category}
              </CardTitle>
              {transaction.description && (
                <CardDescription className="text-xs mt-0.5">{transaction.description}</CardDescription>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold text-destructive">
              -{formatAmount(transaction.amount)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {new Date(transaction.date).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Division summary */}
        <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-muted/50">
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground">
            Dividido entre <span className="font-semibold text-foreground">{participantCount} personas</span>
          </span>
          <span className="ml-auto text-sm font-semibold text-foreground">
            {formatAmount(sharePerPerson)}/persona
          </span>
        </div>

        {/* Participants */}
        <div className="space-y-2">
          {allParticipantIds.map(id => {
            const member = members.find(m => m.id === id);
            const isCreator = member?.name === transaction.user;
            return (
              <div key={id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-muted font-medium">
                      {getInitials(member?.name ?? '??')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {member?.name ?? 'Desconocido'}
                  </span>
                  {isCreator && (
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">Pagó</Badge>
                  )}
                </div>
                <span className={cn('text-sm font-medium', isCreator ? 'text-foreground' : 'text-muted-foreground')}>
                  {formatAmount(sharePerPerson)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Receipt link */}
        {transaction.receiptUrl && (
          <a
            href={transaction.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Receipt className="h-3.5 w-3.5" />
            Ver recibo adjunto
          </a>
        )}
      </CardContent>
    </Card>
  );
}
