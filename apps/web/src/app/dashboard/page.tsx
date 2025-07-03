import { headers } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import { dbFor } from "@ai-ebilling/db/tenantGuard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  /* Resolve tenantId */
  const headerTenant = (await headers()).get("x-tenant-id");
  const session = await getServerSession(authConfig);
  const tenantId = headerTenant ?? session?.user?.tenantId;

  if (!tenantId) {
    return <p className="text-destructive">Tenant not resolved</p>;
  }

  const db = dbFor(tenantId);
  const invoices = await db.invoice.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Invoices</h1>

      {invoices.length === 0 ? (
        <p className="text-muted-foreground">No invoices yet.</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Number</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.number}</TableCell>
                    <TableCell>
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
