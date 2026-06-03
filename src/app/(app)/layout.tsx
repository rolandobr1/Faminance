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
} from 'lucide-react';
import React, { useEffect } from 'react';

import { useAuth } from '@/context/auth-context';
import { useFamilyData } from '@/context/family-data-context';
import { useIsClient } from '@/hooks/use-is-client';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserNav } from '@/components/faminance/user-nav';
import { MobileAddButton } from '@/components/faminance/transactions/mobile-add-button';

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
            <span className={cn(isActive && "font-bold text-foreground")}>{label}</span>
        </Link>
    );
}

// Removed MoreNav


const MAIN_NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
  { href: '/transactions', icon: ArrowRightLeft, label: 'Transacciones' },
  { href: '/accounts', icon: CreditCard, label: 'Cuentas' },
  { href: '/budgets', icon: PiggyBank, label: 'Presupuestos' },
];

const MORE_NAV_ITEMS = [
    { href: '/goals', icon: Target, label: 'Metas' },
    { href: '/debts', icon: Banknote, label: 'Deudas' },
    { href: '/settings', icon: Settings, label: 'Ajustes' },
];

const ALL_NAV_ITEMS = [...MAIN_NAV_ITEMS, ...MORE_NAV_ITEMS];
const ALL_AVAILABLE_ITEMS = ALL_NAV_ITEMS;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const isClient = useIsClient();
  const pathname = usePathname();

  const { members } = useFamilyData();

  const userDoc = members.find(m => m.id === currentUser?.id);
  const showBottomNav = userDoc?.showBottomNav ?? true;
  const bottomNavItemsKeys = userDoc?.bottomNavItems || ['/dashboard', '/transactions', '/accounts', '/budgets'];

  const selectedBottomItems = bottomNavItemsKeys.map(key => ALL_AVAILABLE_ITEMS.find(i => i.href === key)).filter(Boolean) as typeof ALL_AVAILABLE_ITEMS;
  const mobileLeftItems = selectedBottomItems.slice(0, 2);
  const mobileRightItems = selectedBottomItems.slice(2, 4);

  useEffect(() => {
    if (isClient && !currentUser) {
        router.replace('/');
    }
  }, [currentUser, router, isClient]);
  

  return (
    <TooltipProvider>
      {(!isClient || !currentUser) ? (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" aria-label="Cargando..." />
        </div>
      ) : (
        <div className="flex min-h-screen w-full flex-col bg-transparent overflow-x-hidden">
            {/* Expandable Hover Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-16 hover:w-48 transition-all duration-300 ease-in-out flex-col border-r glass-card sm:flex group/sidebar">
            <nav className="flex flex-col items-center group-hover/sidebar:items-start gap-4 px-2 sm:py-5 w-full">
                <Link
                href="/dashboard"
                aria-label="Ir al panel de Faminance"
                className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base mb-2 group-hover/sidebar:ml-1 group-hover/sidebar:scale-105 transition-transform"
                >
                <PiggyBank className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Faminance</span>
                </Link>
                {ALL_NAV_ITEMS.map((item) => (
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
            
            {/* Mobile Navigation — center elevated + button */}
            {showBottomNav && (
                <footer className="fixed inset-x-0 bottom-0 z-30 sm:hidden" style={{ overflow: 'visible' }}>
                    <div className="relative">
                        {/* Elevated glass + button */}
                        <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-10">
                            <MobileAddButton />
                        </div>

                        <div className="grid grid-cols-5 h-16 pb-3 glass-header rounded-t-2xl">
                            {mobileLeftItems.map((item) => (
                                <MobileNavLink
                                    key={item.href}
                                    href={item.href}
                                    icon={item.icon}
                                    label={item.label}
                                    isActive={pathname.startsWith(item.href)}
                                />
                            ))}

                            {/* Center placeholder — space for the elevated button */}
                            <div className="flex items-end justify-center pb-1">
                                <span className="text-[9px] font-semibold text-primary/60 tracking-widest uppercase">Añadir</span>
                            </div>

                            {mobileRightItems.map((item) => (
                                <MobileNavLink
                                    key={item.href}
                                    href={item.href}
                                    icon={item.icon}
                                    label={item.label}
                                    isActive={pathname.startsWith(item.href)}
                                />
                            ))}
                        </div>
                    </div>
                </footer>
            )}
        </div>
      )}
    </TooltipProvider>
  );
}
