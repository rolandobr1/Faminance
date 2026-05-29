'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowRightLeft,
  LayoutDashboard,
  PiggyBank,
  Settings,
  Target,
  CreditCard,
  Loader2,
  Banknote,
  MoreHorizontal,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { useAuth } from '@/context/auth-context';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserNav } from '@/components/faminance/user-nav';

// NavLink for Sidebar with expansion label display
function NavLink({ href, icon: Icon, label, isActive }: { href: string, icon: React.ComponentType<{className?: string}>, label: string, isActive: boolean }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Link
                    href={href}
                    className={cn(
                        'flex h-9 w-9 items-center justify-start rounded-lg text-muted-foreground transition-all hover:text-foreground md:h-10 md:w-full px-2 gap-3',
                        isActive && 'bg-primary/10 text-primary'
                    )}
                >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-headline font-semibold opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap hidden group-hover/sidebar:block">{label}</span>
                </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="group-hover/sidebar:hidden">{label}</TooltipContent>
        </Tooltip>
    );
}

// MobileNavLink with active top bar indicator and animation
function MobileNavLink({ href, icon: Icon, label, isActive }: { href: string, icon: React.ComponentType<{className?: string}>, label: string, isActive: boolean }) {
    return (
        <Link
            href={href}
            className={cn(
                'flex flex-col items-center justify-center gap-1 p-1 text-center font-medium text-muted-foreground relative',
                'text-[10px] w-full break-words transition-colors duration-200',
                isActive && 'text-primary'
            )}
        >
            {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-primary rounded-full" />
            )}
            <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
            <span className={cn(isActive && "font-bold text-slate-200")}>{label}</span>
        </Link>
    );
}

// Mobile "More" menu
function MoreNav({ items, isActive }: { items: { href: string, icon: React.ComponentType<{className?: string}>, label: string }[], isActive: boolean }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className={cn(
                    'flex flex-col items-center justify-center gap-1 p-1 text-center font-medium text-muted-foreground relative',
                    'text-[10px] w-full break-words',
                    isActive && 'text-primary'
                )}>
                    {isActive && (
                        <span className="absolute top-0 w-8 h-1 bg-primary rounded-full" />
                    )}
                    <MoreHorizontal className="h-5 w-5" />
                    <span>Más</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="end">
                {items.map(item => (
                    <DropdownMenuItem key={item.label} asChild>
                        <Link href={item.href}>
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.label}</span>
                        </Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  const mainNavItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
    { href: '/transactions', icon: ArrowRightLeft, label: 'Transacciones' },
    { href: '/accounts', icon: CreditCard, label: 'Cuentas' },
    { href: '/budgets', icon: PiggyBank, label: 'Presupuestos' },
  ];

  const moreNavItems = [
      { href: '/goals', icon: Target, label: 'Metas' },
      { href: '/debts', icon: Banknote, label: 'Deudas' },
      { href: '/settings', icon: Settings, label: 'Ajustes' },
  ];

  const allNavItems = [...mainNavItems, ...moreNavItems];

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !authLoading && !currentUser) {
        router.replace('/');
    }
  }, [currentUser, authLoading, router, isClient]);
  

  if (!isClient || authLoading || !currentUser) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#07090e]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="flex min-h-screen w-full flex-col bg-background">
        {/* Expandable Hover Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-16 hover:w-48 transition-all duration-300 ease-in-out flex-col border-r bg-card sm:flex group/sidebar hover:shadow-2xl hover:shadow-primary/5">
        <nav className="flex flex-col items-center group-hover/sidebar:items-start gap-4 px-2 sm:py-5 w-full">
            <Link
            href="/dashboard"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base mb-2 group-hover/sidebar:ml-1 group-hover/sidebar:scale-105 transition-transform"
            >
            <PiggyBank className="h-5 w-5" />
            <span className="sr-only">Faminance</span>
            </Link>
            {allNavItems.map((item) => (
                <NavLink 
                    key={item.href} 
                    href={item.href} 
                    icon={item.icon} 
                    label={item.label}
                    isActive={pathname.startsWith(item.href)}
                />
            ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center group-hover/sidebar:items-start gap-4 px-2 sm:py-5 w-full">
          <div className="group-hover/sidebar:ml-1">
            <UserNav />
          </div>
        </nav>
        </aside>

        <div className="flex flex-col sm:gap-4 sm:pl-16">
            <main className="flex-1">
                {children}
            </main>
        </div>
        
        {/* Mobile Navigation */}
        <footer className="fixed inset-x-0 bottom-0 z-10 border-t bg-card sm:hidden">
            <div className="grid grid-cols-5 h-20 pb-4">
                {mainNavItems.map((item) => (
                    <MobileNavLink 
                        key={item.href} 
                        href={item.href} 
                        icon={item.icon} 
                        label={item.label}
                        isActive={pathname.startsWith(item.href)}
                    />
                ))}
                <MoreNav 
                    items={moreNavItems} 
                    isActive={moreNavItems.some(item => pathname.startsWith(item.href))}
                />
            </div>
        </footer>
    </div>
    </TooltipProvider>
  );
}
