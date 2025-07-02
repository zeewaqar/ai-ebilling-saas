"use client";

import { useSearchParams } from "next/navigation";
import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import SignOutButton from "@/components/SignOutButton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const isPdfView = searchParams.get('pdf') === 'true';
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col">
      {!isPdfView && (
        <header className="border-b p-4 flex justify-between items-center">
          <span className="font-semibold">
            {/* Tenant ID is not directly available in client components without fetching or passing as prop */}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ""} alt="@shadcn" />
                  <AvatarFallback>{session?.user?.email ? session.user.email[0].toUpperCase() : "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session?.user?.firstName} {session?.user?.lastName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <SignOutButton />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
      )}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
