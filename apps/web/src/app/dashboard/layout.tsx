import { getServerSession } from "next-auth/next";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authConfig);
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b p-4 flex justify-between">
        <span className="font-semibold">
          Tenant&nbsp;ID:&nbsp;{session.user.tenantId}
        </span>
        <SignOutButton />
      </header>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
