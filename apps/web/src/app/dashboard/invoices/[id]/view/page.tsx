
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  number: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  senderName: string;
  senderAddress: string;
  senderEmail: string;
  senderPhone: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
  lineItems: LineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

export default function InvoiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for 'pdf' query parameter
  const isPdfView = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('pdf') === 'true';

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}?tenantId=some-tenant-id`); // Replace with actual tenant ID
        if (!response.ok) {
          throw new Error(`Error fetching invoice: ${response.statusText}`);
        }
        const data = await response.json();
        setInvoice({
          ...data,
          lineItems: typeof data.lineItems === 'string' ? JSON.parse(data.lineItems) : data.lineItems,
          subtotal: parseFloat(data.subtotal),
          taxAmount: parseFloat(data.taxAmount),
          totalAmount: parseFloat(data.totalAmount),
        });
      } catch (err: Error) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  if (isLoading) {
    return <div className="text-center py-8">Loading invoice details...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  if (!invoice) {
    return <div className="text-center py-8">Invoice not found.</div>;
  }

  return (
    <Card className="max-w-4xl mx-auto p-6" id="invoice-content">
      {!isPdfView && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Invoice #{invoice.number}</CardTitle>
          <div className="flex space-x-2">
            <Button onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}>Edit</Button>
            <Button onClick={async () => {
              if (invoice?.id) {
                try {
                  const response = await fetch(`/api/generate-pdf?invoiceId=${invoice.id}`);
                  if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `invoice-${invoice.number || invoice.id}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  } else {
                    alert('Failed to generate PDF.');
                  }
                } catch (error) {
                  console.error('Error generating PDF:', error);
                  alert('An error occurred while generating the PDF.');
                }
              }
            }}>Generate PDF</Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/invoices')}>Back to List</Button>
          </div>
        </CardHeader>
      )}
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">From:</h3>
            <p>{invoice.senderName}</p>
            <p>{invoice.senderAddress}</p>
            <p>{invoice.senderEmail}</p>
            <p>{invoice.senderPhone}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Bill To:</h3>
            <p>{invoice.clientName}</p>
            <p>{invoice.clientAddress}</p>
            <p>{invoice.clientEmail}</p>
            <p>{invoice.clientPhone}</p>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Invoice Date</p>
            <p className="font-medium">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium">{invoice.status}</p>
          </div>
        </div>

        <Separator className="my-6" />

        <h3 className="text-lg font-semibold mb-4">Line Items</h3>
        <div className="space-y-2 mb-6">
          <div className="grid grid-cols-4 font-semibold border-b pb-2">
            <div>Description</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Unit Price</div>
            <div className="text-right">Total</div>
          </div>
          {invoice.lineItems.map((item, index) => (
            <div key={index} className="grid grid-cols-4">
              <div>{item.description}</div>
              <div className="text-right">{item.quantity}</div>
              <div className="text-right">${item.unitPrice.toFixed(2)}</div>
              <div className="text-right">${(item.quantity * item.unitPrice).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-1"></div> {/* Spacer */}
          <div className="col-span-1 space-y-2 text-right">
            <div className="flex justify-between">
              <p className="font-medium">Subtotal:</p>
              <p>${invoice.subtotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="font-medium">Tax:</p>
              <p>${invoice.taxAmount.toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-xl font-bold">
              <p>Total:</p>
              <p>${invoice.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
