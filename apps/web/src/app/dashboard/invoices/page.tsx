"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoiceForm } from "@/components/invoice-form";
import { ChevronUp, ChevronDown } from "lucide-react"; // For sorting icons

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
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; }>,
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

interface InvoiceFormData {
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
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; }>, // Simplified for now
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // You can make this configurable
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [sortBy, setSortBy] = useState<keyof Invoice>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [isPopulatingForm, setIsPopulatingForm] = useState(false); // New state for form population
  const [isLoading, setIsLoading] = useState(true); // New loading state
  const router = useRouter();

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true); // Set loading to true
    try {
      const params = new URLSearchParams({
        tenantId: "some-tenant-id", // Replace with actual tenant ID
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder,
      });
      console.log("Fetching invoices with params:", params.toString());
      const response = await fetch(`/api/invoices?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { invoices: fetchedInvoices, total } = await response.json();
      console.log("Fetched invoices:", fetchedInvoices);
      console.log("Total invoices:", total);
      setInvoices(fetchedInvoices.map((invoice: Invoice) => ({
        ...invoice,
        lineItems: typeof invoice.lineItems === 'string' ? JSON.parse(invoice.lineItems) : invoice.lineItems,
        subtotal: typeof invoice.subtotal === 'string' ? parseFloat(invoice.subtotal) : invoice.subtotal,
        taxAmount: typeof invoice.taxAmount === 'string' ? parseFloat(invoice.taxAmount) : invoice.taxAmount,
        totalAmount: typeof invoice.totalAmount === 'string' ? parseFloat(invoice.totalAmount) : invoice.totalAmount,
      })));
      setTotalInvoices(total);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      // Optionally, display an error message to the user
    } finally {
      setIsLoading(false); // Set loading to false
    }
  }, [currentPage, itemsPerPage, sortBy, sortOrder]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleAddInvoice = () => {
    setSelectedInvoice(null);
    setIsFormOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsFormOpen(true);
  };

  const handleDeleteInvoice = async (id: string) => {
    await fetch(`/api/invoices/${id}?tenantId=some-tenant-id`, { // Replace with actual tenant ID
      method: "DELETE",
    });
    fetchInvoices();
  };

  const handleFormSubmit = async (data: InvoiceFormData) => {
    console.log("Submitting form data:", data);
    const urlParams = new URLSearchParams({ tenantId: "some-tenant-id" }); // Replace with actual tenant ID
    try {
      let response;
      if (selectedInvoice && selectedInvoice.id) { // Check if selectedInvoice exists AND has a valid ID
        response = await fetch(`/api/invoices/${selectedInvoice.id}?${urlParams.toString()}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        response = await fetch(`/api/invoices?${urlParams.toString()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        alert(`Failed to save invoice: ${errorData.error || response.statusText}`);
        return; // Stop execution if API call failed
      }

      console.log("Invoice saved successfully.");
      fetchInvoices();
      setIsFormOpen(false);
    } catch (error) {
      console.error("Network or unexpected error during form submission:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingPdf(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/ocr-invoice', {
        method: 'POST',
        body: formData,
      });
      const rawData = await response.json();
      console.log("handlePdfUpload: Raw data from OCR API:", rawData); // Add this log
      console.log("handlePdfUpload: Raw data from OCR API:", rawData); // Add this log

      // Ensure lineItems are correctly parsed and numbers are floats
      const processedLineItems = Array.isArray(rawData.lineItems)
        ? rawData.lineItems.map((item: { description?: string; quantity?: string | number; unitPrice?: string | number }) => ({
            description: item.description || '',
            quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : (typeof item.quantity === 'number' ? item.quantity : 0),
            unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : (typeof item.unitPrice === 'number' ? item.unitPrice : 0),
          }))
        : [{ description: '', quantity: 1, unitPrice: 0 }];

      setIsPopulatingForm(true); // Start populating form
      setSelectedInvoice({
        id: '', // Temporary ID for new invoice
        number: rawData.invoiceNumber || '',
        invoiceDate: rawData.invoiceDate || new Date().toISOString().split('T')[0],
        dueDate: rawData.dueDate || '',
        status: rawData.status || 'DRAFT',
        senderName: rawData.sender?.name ?? '',
        senderAddress: rawData.sender?.address ?? '',
        senderEmail: rawData.sender?.email ?? '',
        senderPhone: rawData.sender?.phone ?? '',
        clientName: rawData.client?.name ?? '',
        clientAddress: rawData.client?.address ?? '',
        clientEmail: rawData.client?.email ?? '',
        clientPhone: rawData.client?.phone ?? '',
        lineItems: processedLineItems,
        subtotal: typeof rawData.subtotal === 'string' ? parseFloat(rawData.subtotal) : rawData.subtotal,
        taxAmount: typeof rawData.taxAmount === 'string' ? parseFloat(rawData.taxAmount) : rawData.taxAmount,
        totalAmount: typeof rawData.totalAmount === 'string' ? parseFloat(rawData.totalAmount) : rawData.totalAmount,
      });
      setIsFormOpen(true);
    } catch (error) {
      console.error('Error uploading PDF for invoice OCR:', error);
      alert('Failed to process PDF for invoice OCR. Please try again.');
    } finally {
      setIsProcessingPdf(false);
      setIsPopulatingForm(false); // End populating form
    }
  };

  const handleSort = (column: keyof Invoice) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const totalPages = Math.ceil(totalInvoices / itemsPerPage);

  if (isFormOpen) {
    return isPopulatingForm ? (
      <Card>
        <CardHeader><CardTitle>Loading Invoice Data...</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Populating form with extracted data...</p>
          </div>
        </CardContent>
      </Card>
    ) : (
      <InvoiceForm onSubmit={handleFormSubmit} initialData={selectedInvoice} onCancel={() => setIsFormOpen(false)} />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Invoices</CardTitle>
          <div className="flex space-x-2">
            <label htmlFor="pdf-upload" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer">
              {isProcessingPdf ? "Processing..." : "Upload PDF"}
              <input id="pdf-upload" type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" disabled={isProcessingPdf} />
            </label>
            <Button onClick={handleAddInvoice}>Add Invoice</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No invoices found. Click &quot;Add Invoice&quot; to create one.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort('number')} className="cursor-pointer">
                    <div className="flex items-center">
                      Number {sortBy === 'number' && (sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('totalAmount')} className="cursor-pointer">
                    <div className="flex items-center">
                      Amount {sortBy === 'totalAmount' && (sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('dueDate')} className="cursor-pointer">
                    <div className="flex items-center">
                      Due Date {sortBy === 'dueDate' && (sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('status')} className="cursor-pointer">
                    <div className="flex items-center">
                      Status {sortBy === 'status' && (sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.number}</TableCell>
                    <TableCell>${invoice.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>{invoice.status}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/invoices/${invoice.id}/view`)}>View</Button>
                      <Button variant="outline" size="sm" className="ml-2" onClick={() => handleEditInvoice(invoice)}>Edit</Button>
                      <Button variant="destructive" size="sm" className="ml-2" onClick={() => handleDeleteInvoice(invoice.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-4">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span>Page {currentPage} of {totalPages}</span>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
