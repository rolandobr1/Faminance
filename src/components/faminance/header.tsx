'use client';

import { UserNav } from "@/components/faminance/user-nav";

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
              </div>
            </div>
        </header>
    );
}
