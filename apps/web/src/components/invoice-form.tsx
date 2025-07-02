
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm, useFieldArray } from "react-hook-form";
import { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Define Zod schema for LineItem
const LineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
});

// Define Zod schema for InvoiceFormData
const invoiceFormSchema = z.object({
  number: z.string().min(1, "Invoice Number is required"),
  invoiceDate: z.string().min(1, "Invoice Date is required"),
  dueDate: z.string().min(1, "Due Date is required"),
  status: z.enum(["DRAFT", "SENT", "PAID", "VOID"]), // Ensure status is one of the enum values

  senderName: z.string().min(1, "Sender Name is required"),
  senderAddress: z.string().min(1, "Sender Address is required"),
  senderEmail: z.string().email("Invalid sender email address").optional().or(z.literal("")), // Optional email
  senderPhone: z.string().optional().or(z.literal("")), // Optional phone

  clientName: z.string().min(1, "Client Name is required"),
  clientAddress: z.string().min(1, "Client Address is required"),
  clientEmail: z.string().email("Invalid client email address").optional().or(z.literal("")), // Optional email
  clientPhone: z.string().optional().or(z.literal("")), // Optional phone

  lineItems: z.array(LineItemSchema).min(1, "At least one line item is required"),

  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
  totalAmount: z.number().min(0),
});

// Infer the TypeScript type from the Zod schema
type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => void;
  initialData?: InvoiceFormData;
  onCancel: () => void;
}

export function InvoiceForm({ onSubmit, initialData, onCancel }: InvoiceFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors }, // Get errors from formState
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema), // Integrate Zod resolver
    defaultValues: {
      ...initialData,
      lineItems: initialData?.lineItems || [{ description: '', quantity: 1, unitPrice: 0 }],
      invoiceDate: initialData?.invoiceDate ? new Date(initialData.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const lineItems = watch("lineItems");

  // Effect to reset form when initialData changes (e.g., after OCR upload)
  useEffect(() => {
    if (initialData) {
      console.log("InvoiceForm: initialData changed", initialData); // Add this log
      reset({
        ...initialData,
        invoiceDate: initialData.invoiceDate ? new Date(initialData.invoiceDate).toISOString().split('T')[0] : '',
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
      });
      console.log("InvoiceForm: Form state after reset", watch()); // Add this log
    }
  }, [initialData, reset, watch]);

  useEffect(() => {
    let newSubtotal = 0;
    lineItems.forEach(item => {
      newSubtotal += (item.quantity || 0) * (item.unitPrice || 0);
    });
    setValue("subtotal", newSubtotal);

    // Simple tax calculation (e.g., 10%)
    const newTaxAmount = newSubtotal * 0.10;
    setValue("taxAmount", newTaxAmount);

    const newTotalAmount = newSubtotal + newTaxAmount;
    setValue("totalAmount", newTotalAmount);
  }, [lineItems, setValue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit Invoice" : "Add Invoice"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="number">Invoice Number</Label>
              <Input id="number" {...register("number")} />
              {errors.number && <p className="text-red-500 text-sm">{errors.number.message}</p>}
            </div>
            <div>
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input id="invoiceDate" type="date" {...register("invoiceDate")} />
              {errors.invoiceDate && <p className="text-red-500 text-sm">{errors.invoiceDate.message}</p>}
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
              {errors.dueDate && <p className="text-red-500 text-sm">{errors.dueDate.message}</p>}
            </div>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <select id="status" {...register("status")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
              <option value="VOID">Void</option>
            </select>
            {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
          </div>

          {/* Sender Details */}
          <h3 className="text-lg font-semibold mt-6">Sender Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="senderName">Name</Label>
              <Input id="senderName" {...register("senderName")} />
              {errors.senderName && <p className="text-red-500 text-sm">{errors.senderName.message}</p>}
            </div>
            <div>
              <Label htmlFor="senderEmail">Email</Label>
              <Input id="senderEmail" type="email" {...register("senderEmail")} />
              {errors.senderEmail && <p className="text-red-500 text-sm">{errors.senderEmail.message}</p>}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="senderAddress">Address</Label>
              <Input id="senderAddress" {...register("senderAddress")} />
              {errors.senderAddress && <p className="text-red-500 text-sm">{errors.senderAddress.message}</p>}
            </div>
            <div>
              <Label htmlFor="senderPhone">Phone</Label>
              <Input id="senderPhone" {...register("senderPhone")} />
              {errors.senderPhone && <p className="text-red-500 text-sm">{errors.senderPhone.message}</p>}
            </div>
          </div>

          {/* Client Details */}
          <h3 className="text-lg font-semibold mt-6">Client Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">Name</Label>
              <Input id="clientName" {...register("clientName")} />
              {errors.clientName && <p className="text-red-500 text-sm">{errors.clientName.message}</p>}
            </div>
            <div>
              <Label htmlFor="clientEmail">Email</Label>
              <Input id="clientEmail" type="email" {...register("clientEmail")} />
              {errors.clientEmail && <p className="text-red-500 text-sm">{errors.clientEmail.message}</p>}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="clientAddress">Address</Label>
              <Input id="clientAddress" {...register("clientAddress")} />
              {errors.clientAddress && <p className="text-red-500 text-sm">{errors.clientAddress.message}</p>}
            </div>
            <div>
              <Label htmlFor="clientPhone">Phone</Label>
              <Input id="clientPhone" {...register("clientPhone")} />
              {errors.clientPhone && <p className="text-red-500 text-sm">{errors.clientPhone.message}</p>}
            </div>
          </div>

          {/* Line Items */}
          <h3 className="text-lg font-semibold mt-6">Line Items</h3>
          {errors.lineItems && <p className="text-red-500 text-sm">{errors.lineItems.message}</p>}
          <div className="space-y-4">
            {fields.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end border p-4 rounded-md">
                <div className="md:col-span-2">
                  <Label htmlFor={`lineItems.${index}.description`}>Description</Label>
                  <Input id={`lineItems.${index}.description`} {...register(`lineItems.${index}.description`)} />
                  {errors.lineItems?.[index]?.description && <p className="text-red-500 text-sm">{errors.lineItems[index]?.description?.message}</p>}
                </div>
                <div>
                  <Label htmlFor={`lineItems.${index}.quantity`}>Quantity</Label>
                  <Input id={`lineItems.${index}.quantity`} type="number" {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })} />
                  {errors.lineItems?.[index]?.quantity && <p className="text-red-500 text-sm">{errors.lineItems[index]?.quantity?.message}</p>}
                </div>
                <div>
                  <Label htmlFor={`lineItems.${index}.unitPrice`}>Unit Price</Label>
                  <Input id={`lineItems.${index}.unitPrice`} type="number" {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })} />
                  {errors.lineItems?.[index]?.unitPrice && <p className="text-red-500 text-sm">{errors.lineItems[index]?.unitPrice?.message}</p>}
                </div>
                <div className="flex items-center justify-end">
                  <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>Remove</Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}>Add Line Item</Button>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="col-span-1"></div> {/* Spacer */}
            <div className="col-span-1 space-y-2">
              <div className="flex justify-between">
                <Label>Subtotal:</Label>
                <span>${watch("subtotal")?.toFixed(2) ?? '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <Label>Tax (10%):</Label>
                <span>${watch("taxAmount")?.toFixed(2) ?? '0.00'}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <Label>Total:</Label>
                <span>${watch("totalAmount")?.toFixed(2) ?? '0.00'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit">{initialData ? "Save Changes" : "Create Invoice"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
