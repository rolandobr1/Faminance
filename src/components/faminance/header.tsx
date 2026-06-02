'use client';

import { UserNav } from "@/components/faminance/user-nav";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Target, Banknote, Settings, PiggyBank, ArrowRightLeft, CreditCard, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function MobileTopMenu() {
    const mobilMoreItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
        { href: '/transactions', icon: ArrowRightLeft, label: 'Movimientos' },
        { href: '/accounts', icon: CreditCard, label: 'Cuentas' },
        { href: '/budgets', icon: PiggyBank, label: 'Presupuestos' },
        { href: '/goals', icon: Target, label: 'Metas' },
        { href: '/debts', icon: Banknote, label: 'Deudas' },
        { href: '/settings', icon: Settings, label: 'Ajustes' },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="h-5 w-5" />
                    <span className="sr-only">Menú de Navegación</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                {mobilMoreItems.map(item => (
                    <DropdownMenuItem key={item.label} asChild>
                        <Link href={item.href}>
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.label}</span>
                        </Link>
                    </DropdownMenuItem>
                ))}
                <div className="border-t my-1" />
                <div className="px-2 py-1.5">
                    <UserNav />
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function Header({ title, children }: { title: string, children?: React.ReactNode }) {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
            <div className="flex w-full items-center">
              <h1 className="text-xl font-semibold md:text-2xl font-headline">{title}</h1>
              <div className="ml-auto flex items-center gap-4">
                  {children}
                  <div className="hidden sm:block">
                    <UserNav />
                  </div>
                  <div className="block sm:hidden">
                    <MobileTopMenu />
                  </div>
              </div>
            </div>
        </header>
    );
}
