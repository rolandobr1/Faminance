
'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { users } from "@/lib/data";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0] ? names[0][0] : '';
};


export function UserNav() {
    const { toast } = useToast();
    const { currentUser, setCurrentUser, logout, login } = useAuth();
    const router = useRouter();
    const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
    // State for the editing dialog, separate from the user context
    const [newName, setNewName] = useState(currentUser?.name || '');

    // Reset the dialog's name state if the current user changes (e.g., switch user)
    useEffect(() => {
        if (currentUser) {
            setNewName(currentUser.name);
        }
    }, [currentUser?.id, currentUser?.name]);

    if (!currentUser) {
        return null;
    }

    const handleProfileSave = () => {
        if (!currentUser || !newName.trim()) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "El nombre no puede estar vacío.",
          });
          return;
        }
        const updatedUser = { ...currentUser, name: newName };
        setCurrentUser(updatedUser);

        toast({
            title: "Perfil Actualizado",
            description: "Tu nombre ha sido actualizado.",
        });
        setProfileDialogOpen(false);
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };
    
    // Switch user logic
    const handleSwitchUser = (userId: string) => {
        login(userId);
    }


  return (
    <Dialog open={isProfileDialogOpen} onOpenChange={(open) => {
        setProfileDialogOpen(open);
        if (open) {
          // When opening the dialog, ensure it reflects the latest current user name
          setNewName(currentUser.name);
        }
    }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-9 w-9 bg-muted">
              <AvatarFallback className="bg-transparent font-semibold">{getInitials(currentUser.name)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none font-headline">{currentUser.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {currentUser.role}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
           <DropdownMenuGroup>
                <DropdownMenuLabel>Cambiar Usuario</DropdownMenuLabel>
                {users.map(user => (
                    <DropdownMenuItem key={user.id} onSelect={() => handleSwitchUser(user.id)} disabled={user.id === currentUser.id}>
                         <Avatar className="mr-2 h-6 w-6 text-xs">
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        {user.name}
                    </DropdownMenuItem>
                ))}
           </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Perfil</DropdownMenuItem>
            </DialogTrigger>
            <Link href="/settings">
              <DropdownMenuItem>Ajustes</DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout}>
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Personaliza tu nombre.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleProfileSave}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
